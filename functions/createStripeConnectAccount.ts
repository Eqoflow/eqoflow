import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // Check if user already has a Stripe Connect account
    if (user.stripe_connect_account_id) {
      return Response.json({ 
        error: 'User already has a connected Stripe account',
        accountId: user.stripe_connect_account_id 
      }, { status: 400 });
    }

    // Create a Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        user_email: user.email,
        user_id: user.id,
      },
    });

    // Save the account ID to the user
    await base44.entities.User.updateMyUserData({
      stripe_connect_account_id: account.id,
    });

    // Create an account link for onboarding
    const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://www.eqoflow.app';
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/Profile?tab=wallet&stripe_refresh=true`,
      return_url: `${appUrl}/Profile?tab=wallet&stripe_success=true`,
      type: 'account_onboarding',
    });

    return Response.json({
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
    });

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});