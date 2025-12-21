import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
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

        const { paymentId } = await req.json();

        if (!paymentId) {
            return new Response(JSON.stringify({ error: 'Payment ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Find the transaction by processor_transaction_id
        const transactions = await base44.entities.MarketplaceTransaction.filter({
            processor_transaction_id: paymentId
        });

        const transaction = transactions[0];
        if (!transaction) {
            return new Response(JSON.stringify({ error: 'Transaction not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get the community
        const community = await base44.entities.Community.get(transaction.item_id);
        if (!community) {
            return new Response(JSON.stringify({ error: 'Community not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Calculate fees with subscription tier discount
        let basePlatformFeePercentage = 0.15; // Default 15% for Community Pages
        let discount = 0;

        if (user.subscription_tier === 'Creator') {
            discount = 0.10; // 10% off the base platform fee
        } else if (user.subscription_tier === 'Pro') {
            discount = 0.25; // 25% off the base platform fee
        }

        const finalPlatformFeePercentage = basePlatformFeePercentage * (1 - discount);
        const platformFeeUsd = Math.round(transaction.amount_total * finalPlatformFeePercentage * 100) / 100;
        const creatorPayoutUsd = Math.round((transaction.amount_total - platformFeeUsd) * 100) / 100;

        // Update transaction with calculated fees
        await base44.entities.MarketplaceTransaction.update(transaction.id, {
            amount_platform_fee: platformFeeUsd,
            amount_seller_payout: creatorPayoutUsd,
            status: 'completed',
            notes: `${transaction.notes || ''}${user.subscription_tier !== 'Standard' ? ` | ${user.subscription_tier} discount applied: ${(discount * 100).toFixed(0)}% off platform fee` : ''}`
        });

        // Add user to community members
        const updatedMemberEmails = [...(community.member_emails || []), user.email];
        await base44.entities.Community.update(community.id, {
            member_emails: updatedMemberEmails,
            active_subscribers: (community.active_subscribers || 0) + 1,
            total_revenue: (community.total_revenue || 0) + creatorPayoutUsd
        });

        // Add revenue to DAO Treasury
        await base44.entities.DAOTreasury.create({
            transaction_type: 'deposit',
            source: `Community Membership Fee - ${community.name}`,
            amount_qflow: platformFeeUsd * 10, // Convert USD to QFLOW tokens (placeholder conversion rate)
            value_usd: platformFeeUsd,
            notes: `Transaction ID: ${transaction.id}${user.subscription_tier !== 'Standard' ? ` | ${user.subscription_tier} member discount applied` : ''}`
        });

        // Send welcome notification
        await base44.entities.Notification.create({
            recipient_email: user.email,
            type: 'system',
            title: `Welcome to ${community.name}!`,
            message: `You've successfully joined the ${community.name} community. Welcome aboard!${discount > 0 ? ` Your ${user.subscription_tier} membership saved you ${(discount * 100).toFixed(0)}% on platform fees.` : ''}`,
            actor_email: 'system@quantumflow.app',
            actor_name: 'QuantumFlow',
            action_url: `/CommunityProfile?id=${community.id}`
        });

        return new Response(JSON.stringify({
            success: true,
            message: 'Successfully joined community',
            communityId: community.id,
            platformFee: platformFeeUsd,
            creatorPayout: creatorPayoutUsd,
            discountApplied: discount > 0 ? `${(discount * 100).toFixed(0)}% ${user.subscription_tier} discount` : null
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error processing community payment:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});