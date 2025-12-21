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
      return Response.json({ error: 'No Stripe Connect account found' }, { status: 400 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // Create a new account link for continuing onboarding
    const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://www.eqoflow.app';
    const accountLink = await stripe.accountLinks.create({
      account: user.stripe_connect_account_id,
      refresh_url: `${appUrl}/Profile?tab=wallet&stripe_refresh=true`,
      return_url: `${appUrl}/Profile?tab=wallet&stripe_success=true`,
      type: 'account_onboarding',
    });

    return Response.json({
      success: true,
      onboardingUrl: accountLink.url,
    });

  } catch (error) {
    console.error('Error refreshing Stripe connect link:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});