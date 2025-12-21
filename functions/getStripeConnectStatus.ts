import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.stripe_connect_account_id) {
      return Response.json({
        connected: false,
        charges_enabled: false,
        payouts_enabled: false,
      });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // Retrieve the account to check its status
    const account = await stripe.accounts.retrieve(user.stripe_connect_account_id);

    return Response.json({
      connected: true,
      accountId: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements,
    });

  } catch (error) {
    console.error('Error getting Stripe Connect status:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});