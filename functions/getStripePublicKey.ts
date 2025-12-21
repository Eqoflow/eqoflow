import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const publicKey = Deno.env.get('STRIPE_PUBLIC_KEY');
    
    if (!publicKey) {
      return Response.json({ error: 'Stripe public key not configured' }, { status: 500 });
    }

    return Response.json({ publicKey });
  } catch (error) {
    console.error('Error retrieving Stripe public key:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});