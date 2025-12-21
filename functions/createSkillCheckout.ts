import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skillId } = await req.json();

    if (!skillId) {
      return Response.json({ error: 'Missing skillId' }, { status: 400 });
    }

    console.log('[createSkillCheckout] Starting checkout for skill:', skillId);

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    // Get the skill details
    const skill = await base44.entities.Skill.get(skillId);
    if (!skill) {
      return Response.json({ error: 'Skill not found' }, { status: 404 });
    }

    console.log('[createSkillCheckout] Skill found:', skill.title);

    // Can't buy your own skill
    if (skill.created_by === user.email) {
      return Response.json({ error: 'You cannot purchase your own skill' }, { status: 400 });
    }

    // Free skills don't need checkout
    if (skill.price_type === 'free') {
      console.log('[createSkillCheckout] Free skill - creating transaction directly');
      
      const transaction = await base44.asServiceRole.entities.MarketplaceTransaction.create({
        item_id: skillId,
        item_type: 'skill',
        item_title: skill.title,
        buyer_email: user.email,
        seller_email: skill.created_by,
        amount_total: 0,
        amount_platform_fee: 0,
        amount_seller_payout: 0,
        currency: 'USD',
        payment_processor: 'none',
        processor_transaction_id: 'free',
        status: 'completed',
        notes: 'Free skill - no payment required'
      });

      return Response.json({
        success: true,
        isFree: true,
        transactionId: transaction.id
      });
    }

    // Get seller info
    const sellerUsers = await base44.asServiceRole.entities.User.filter({ email: skill.created_by });
    const sellerName = sellerUsers.length > 0 ? sellerUsers[0].full_name : skill.created_by;
    const sellerConnectId = sellerUsers.length > 0 ? sellerUsers[0].stripe_connect_account_id : null;

    // Calculate fees (10% platform fee)
    let platformFeeRate = 0.10;
    
    // Apply subscription discounts
    if (user.subscription_tier === 'creator') {
      platformFeeRate = 0.09;
    } else if (user.subscription_tier === 'pro') {
      platformFeeRate = 0.075;
    }

    const amountTotal = skill.price_amount;
    const platformFee = Math.round(amountTotal * platformFeeRate * 100) / 100;
    const sellerPayout = Math.round((amountTotal - platformFee) * 100) / 100;

    console.log('[createSkillCheckout] Creating transaction:', {
      amountTotal,
      platformFee,
      sellerPayout
    });

    // Create pending transaction
    const transaction = await base44.asServiceRole.entities.MarketplaceTransaction.create({
      item_id: skillId,
      item_type: 'skill',
      item_title: skill.title,
      buyer_email: user.email,
      seller_email: skill.created_by,
      amount_total: amountTotal,
      amount_platform_fee: platformFee,
      amount_seller_payout: sellerPayout,
      currency: 'USD',
      payment_processor: 'stripe',
      status: 'pending_payment',
      notes: user.subscription_tier && user.subscription_tier !== 'free' 
        ? `${user.subscription_tier} member discount applied`
        : ''
    });

    console.log('[createSkillCheckout] Transaction created:', transaction.id);

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // Get app URL for redirects
    const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://www.eqoflow.app';

    // Convert to cents for Stripe
    const amountInCents = Math.round(amountTotal * 100);

    console.log('[createSkillCheckout] Creating Stripe session...');

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: skill.title,
              description: skill.description.substring(0, 200),
              images: skill.media_urls && skill.media_urls.length > 0 ? [skill.media_urls[0]] : [],
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        transaction_id: transaction.id,
        skill_id: skillId,
        buyer_email: user.email,
        buyer_name: user.full_name,
        seller_email: skill.created_by,
        seller_name: sellerName,
        seller_connect_account_id: sellerConnectId || 'not_connected_yet',
        amount_total: amountTotal.toString(),
        amount_platform_fee: platformFee.toString(),
        amount_seller_payout: sellerPayout.toString(),
        subscription_tier: user.subscription_tier || 'free',
      },
      success_url: `${appUrl}/SkillWorkroom?transactionId=${transaction.id}&payment_success=true`,
      cancel_url: `${appUrl}/SkillsMarket?payment_cancelled=true`,
      customer_email: user.email,
    });

    console.log('[createSkillCheckout] Stripe session created:', session.id);

    // Update transaction with Stripe session info
    await base44.asServiceRole.entities.MarketplaceTransaction.update(transaction.id, {
      processor_transaction_id: session.id,
      notes: `${transaction.notes || ''}\nStripe Session: ${session.id}${sellerConnectId ? `\nSeller Connect ID: ${sellerConnectId}` : '\nSeller Connect: Not connected yet (will be required for payout)'}`.trim()
    });

    console.log('[createSkillCheckout] Success! Returning checkout URL');

    return Response.json({
      success: true,
      checkoutUrl: session.url,
      transactionId: transaction.id
    });

  } catch (error) {
    console.error('[createSkillCheckout] Error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session',
      details: error.toString()
    }, { status: 500 });
  }
});