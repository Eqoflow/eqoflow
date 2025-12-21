import { createClient } from 'npm:@base44/sdk@0.1.0';
import { Client, Environment } from 'npm:square@35.0.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

const squareClient = new Client({
    accessToken: Deno.env.get('SQUARE_ACCESS_TOKEN'),
    environment: Environment.Sandbox, // Change to Production when ready
});

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);

        const user = await base44.auth.me();
        if (!user) {
            return new Response('User not authenticated', { status: 401 });
        }

        const { communityId, nonce } = await req.json();

        if (!communityId || !nonce) {
            return new Response(JSON.stringify({ error: 'Community ID and payment nonce are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get community details
        const community = await base44.entities.Community.get(communityId);
        if (!community) {
            return new Response(JSON.stringify({ error: 'Community not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if user is already a member
        if (community.member_emails && community.member_emails.includes(user.email)) {
            return new Response(JSON.stringify({ error: 'You are already a member of this community' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Calculate platform fee with subscription discount
        let platformFeeRate = 0.15; // Base 15% fee
        let discountPercent = 0;

        if (user.subscription_tier === 'Creator') {
            discountPercent = 10;
            platformFeeRate = 0.135; // 10% discount: 15% - 1.5% = 13.5%
        } else if (user.subscription_tier === 'Pro') {
            discountPercent = 25;
            platformFeeRate = 0.1125; // 25% discount: 15% - 3.75% = 11.25%
        }

        const platformFeeUsd = Math.round(community.membership_fee * platformFeeRate * 100) / 100;
        const creatorPayoutUsd = Math.round((community.membership_fee - platformFeeUsd) * 100) / 100;

        // Create Square payment
        const amountInCents = Math.round(community.membership_fee * 100);
        
        const { result } = await squareClient.paymentsApi.createPayment({
            sourceId: nonce,
            idempotencyKey: `community-${communityId}-${user.id}-${Date.now()}`,
            amountMoney: {
                amount: BigInt(amountInCents),
                currency: community.currency || 'USD'
            },
            note: `Membership fee for community: ${community.name}`
        });

        // Create marketplace transaction record
        const notes = discountPercent > 0 
            ? `${user.subscription_tier} discount applied: ${discountPercent}% off platform fee` 
            : '';

        const transaction = await base44.entities.MarketplaceTransaction.create({
            item_id: communityId,
            item_type: 'community_access',
            item_title: community.name,
            buyer_email: user.email,
            seller_email: community.created_by,
            amount_total: community.membership_fee,
            amount_platform_fee: platformFeeUsd,
            amount_seller_payout: creatorPayoutUsd,
            currency: community.currency || 'USD',
            payment_processor: 'square',
            processor_transaction_id: result.payment.id,
            status: 'completed',
            notes: notes
        });

        const response = {
            success: true,
            paymentId: result.payment.id,
            transactionId: transaction.id,
            platformFee: platformFeeUsd,
            creatorPayout: creatorPayoutUsd,
            message: 'Payment successful. Processing membership...'
        };

        if (discountPercent > 0) {
            response.discountApplied = `${discountPercent}% ${user.subscription_tier} discount`;
        }

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error creating community payment:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});