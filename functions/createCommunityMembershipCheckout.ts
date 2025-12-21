import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { communityId } = await req.json();

    if (!communityId) {
      return Response.json({ error: 'Community ID is required' }, { status: 400 });
    }

    // Fetch community details
    const community = await base44.asServiceRole.entities.Community.get(communityId);

    if (!community) {
      return Response.json({ error: 'Community not found' }, { status: 404 });
    }

    if (community.pricing_model !== 'paid' || !community.membership_fee || community.membership_fee <= 0) {
      return Response.json({ error: 'This community is not a paid community' }, { status: 400 });
    }

    // Check if user is already a member
    if (community.member_emails?.includes(user.email)) {
      return Response.json({ error: 'You are already a member of this community' }, { status: 400 });
    }

    // Check if user is banned
    if (community.banned_emails?.includes(user.email)) {
      return Response.json({ error: 'You are banned from this community' }, { status: 403 });
    }

    // Calculate amounts (platform takes 15% fee)
    const totalAmount = Math.round(community.membership_fee * 100); // Convert to cents
    const platformFee = Math.round(totalAmount * 0.15);
    const creatorPayout = totalAmount - platformFee;

    // Create Stripe checkout session
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: community.currency?.toLowerCase() || 'usd',
            product_data: {
              name: `${community.name} Membership`,
              description: community.description || 'Community membership',
              images: community.logo_url ? [community.logo_url] : [],
            },
            unit_amount: totalAmount,
            ...(community.subscription_type !== 'one_time' && {
              recurring: {
                interval: community.subscription_type === 'monthly' ? 'month' : 'year',
              },
            }),
          },
          quantity: 1,
        },
      ],
      mode: community.subscription_type === 'one_time' ? 'payment' : 'subscription',
      success_url: `${req.headers.get('origin')}/CommunityProfile?id=${communityId}&payment_success=true`,
      cancel_url: `${req.headers.get('origin')}/CommunityProfile?id=${communityId}&payment_cancelled=true`,
      customer_email: user.email,
      metadata: {
        community_id: communityId,
        community_name: community.name,
        creator_email: community.created_by,
        user_email: user.email,
        user_name: user.full_name || user.email,
        platform_fee_cents: platformFee.toString(),
        creator_payout_cents: creatorPayout.toString(),
        subscription_type: community.subscription_type || 'one_time',
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Error creating community membership checkout:', error);
    return Response.json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    }, { status: 500 });
  }
});