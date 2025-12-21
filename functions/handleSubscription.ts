
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
        
        const currentUser = await base44.auth.me();
        if (!currentUser) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { creator_email, action } = await req.json();

        if (action === 'subscribe') {
            // Check if user has enough tokens for subscription
            const subscriptionCost = 100; // $5 = 100 $QFLOW tokens (assuming 1 $QFLOW = $0.05)
            if ((currentUser.token_balance || 0) < subscriptionCost) {
                return new Response(JSON.stringify({ 
                    error: 'Insufficient tokens for subscription' 
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Calculate fees (15% platform fee)
            const platformFee = 15; // 15% of 100 tokens = 15 tokens
            const creatorPayout = 85; // 85% of 100 tokens = 85 tokens

            // Deduct tokens from subscriber
            await base44.entities.User.update(currentUser.id, {
                token_balance: (currentUser.token_balance || 0) - subscriptionCost
            });

            // Add tokens to creator
            const creator = await base44.entities.User.filter({ email: creator_email });
            if (creator.length > 0) {
                const creatorData = creator[0];
                await base44.entities.User.update(creatorData.id, {
                    token_balance: (creatorData.token_balance || 0) + creatorPayout
                });
            }

            // Record platform revenue
            await base44.entities.PlatformRevenue.create({
                revenue_source: "subscription_fee",
                amount_usd: 0.75, // $0.75 platform fee (15% of $5)
                creator_email: creator_email,
                description: `Subscription fee from ${currentUser.email} to ${creator_email}`
            });

            // Create subscription record
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1); // Monthly subscription

            await base44.entities.Subscription.create({
                subscriber_email: currentUser.email,
                creator_email: creator_email,
                amount_usd: 5.00,
                platform_fee_usd: 0.75,
                creator_payout_usd: 4.25,
                start_date: new Date().toISOString(),
                end_date: endDate.toISOString()
            });

            return new Response(JSON.stringify({ 
                success: true, 
                message: 'Successfully subscribed!' 
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } else if (action === 'unsubscribe') {
            // Find and cancel active subscription
            const subscriptions = await base44.entities.Subscription.filter({
                subscriber_email: currentUser.email,
                creator_email: creator_email,
                status: "active"
            });

            if (subscriptions.length > 0) {
                await base44.entities.Subscription.update(subscriptions[0].id, {
                    status: "cancelled",
                    auto_renew: false
                });
            }

            return new Response(JSON.stringify({ 
                success: true, 
                message: 'Successfully unsubscribed!' 
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('Error handling subscription:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
