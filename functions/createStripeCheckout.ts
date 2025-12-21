import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, successUrl, cancelUrl, tier, billingPeriod } = await req.json();

    // Support both direct priceId and tier/billingPeriod for backward compatibility
    let finalPriceId = priceId;

    // If priceId not provided, try to determine from tier and billingPeriod (legacy support)
    if (!finalPriceId && tier && billingPeriod) {
      const priceMap = {
        'lite_monthly': 'price_1SISee2KsMoELOOV5siZvCi0',
        'lite_yearly': 'price_1SNHXI2KsMoELOOVGDqebDYr',
        'creator_monthly': 'price_1SISfy2KsMoELOOVqeJZqvn6',
        'creator_yearly': 'price_1SNHY32KsMoELOOVtWQ8Z6Gp',
        'pro_monthly': 'price_1SISgM2KsMoELOOVD9RuJdQP',
        'pro_yearly': 'price_1SNHYX2KsMoELOOVOOtZOrNM',
      };

      const key = `${tier}_${billingPeriod}`;
      finalPriceId = priceMap[key];
    }

    if (!finalPriceId) {
      return Response.json({ 
        error: 'Invalid tier or billing period',
        received: { tier, billingPeriod }
      }, { status: 400 });
    }

    // Create or retrieve Stripe customer
    let customerId = currentUser.stripe_customer_id;

    // If customer ID exists, verify it's valid in Stripe
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch (error) {
        // Customer doesn't exist in Stripe, create a new one
        console.log('Stored customer ID invalid, creating new customer:', error.message);
        customerId = null;
      }
    }

    // Create new customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: currentUser.email,
        name: currentUser.full_name,
        metadata: {
          user_id: currentUser.id,
          user_email: currentUser.email,
        },
      });
      customerId = customer.id;

      // Save customer ID to user record
      await base44.asServiceRole.entities.User.update(currentUser.id, {
        stripe_customer_id: customerId,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.get('origin')}/Profile?section=subscriptions&payment=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/Profile?section=subscriptions`,
      metadata: {
        user_id: currentUser.id,
        user_email: currentUser.email,
        price_id: finalPriceId,
      },
      subscription_data: {
        metadata: {
          user_id: currentUser.id,
          user_email: currentUser.email,
          price_id: finalPriceId,
        },
      },
    });

    return Response.json({
      url: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session',
      details: error.toString()
    }, { status: 500 });
  }
});