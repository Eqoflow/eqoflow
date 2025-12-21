
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { Client, Environment, ApiError } from 'npm:square@35.0.0';
import { randomUUID } from 'node:crypto';

// Initialize Square client
const squareClient = new Client({
  accessToken: Deno.env.get('SQUARE_ACCESS_TOKEN'),
  environment: Environment.Sandbox, // Use 'production' for live
});

const LOCATION_ID = Deno.env.get('SQUARE_LOCATION_ID');

const featureOptions = {
    '3_day': { days: 3, price: 10000 }, // Price in cents
    '7_day': { days: 7, price: 25000 },
    '14_day': { days: 14, price: 50000 },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { communityId, featureId } = await req.json();
    if (!communityId || !featureId) {
      return Response.json({ error: 'Community ID and Feature ID are required.' }, { status: 400 });
    }

    const option = featureOptions[featureId];
    if (!option) {
        return Response.json({ error: 'Invalid feature option selected.' }, { status: 400 });
    }

    const community = await base44.asServiceRole.entities.Community.get(communityId);
    if (!community) {
      return Response.json({ error: 'Community not found.' }, { status: 404 });
    }

    if (community.created_by !== user.email) {
      return Response.json({ error: 'You are not the creator of this community.' }, { status: 403 });
    }

    const idempotencyKey = randomUUID();
    
    // Construct metadata
    const metadata = {
        payment_type: 'COMMUNITY_FEATURE', // A new type for the webhook to identify
        user_email: user.email,
        community_id: communityId,
        feature_id: featureId,
        feature_days: String(option.days),
    };

    const response = await squareClient.checkoutApi.createPaymentLink({
      idempotencyKey,
      locationId: LOCATION_ID,
      paymentLink: {
        description: `Feature the community "${community.name}" for ${option.days} days.`,
        order: {
          locationId: LOCATION_ID,
          lineItems: [{
            name: `Feature Community: ${community.name} (${option.days} days)`,
            quantity: '1',
            basePriceMoney: {
              amount: BigInt(option.price),
              currency: 'USD'
            }
          }],
        },
        checkoutOptions: {
            redirectUrl: `${req.headers.get('origin')}/CommunityProfile?id=${communityId}&payment_success=true`,
            askForShippingAddress: false,
        },
        metadata: metadata, // Pass the metadata here
      },
    });

    const paymentLink = response.result.paymentLink;

    return Response.json({ url: paymentLink.url, orderId: paymentLink.orderId });
  } catch (error) {
    console.error('Error creating payment link:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof ApiError) {
      errorMessage = JSON.stringify(error.errors, null, 2);
    }
    return Response.json({ error: 'Failed to create payment link.', details: errorMessage }, { status: 500 });
  }
});
