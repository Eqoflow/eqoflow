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

        // Check if user has an active paid subscription
        const subscriptionTier = user.subscription_tier || 'Standard';
        const isPaidSubscriber = subscriptionTier === 'Creator' || subscriptionTier === 'Pro';

        // Calculate EP multiplier based on subscription
        let epMultiplier = 1; // Standard
        if (subscriptionTier === 'Creator') epMultiplier = 1.5;
        if (subscriptionTier === 'Pro') epMultiplier = 2;

        // Check feature access
        const featureAccess = {
            advancedAnalytics: isPaidSubscriber,
            flowAI: subscriptionTier === 'Pro',
            governanceBoost: subscriptionTier === 'Pro',
            reducedMarketplaceFees: isPaidSubscriber,
            prioritySupport: subscriptionTier === 'Pro',
            freeCommunityCreation: subscriptionTier === 'Pro'
        };

        return new Response(JSON.stringify({
            subscriptionTier,
            isPaidSubscriber,
            epMultiplier,
            featureAccess,
            badges: {
                quantumCreator: subscriptionTier === 'Creator' || subscriptionTier === 'Pro',
                quantumPro: subscriptionTier === 'Pro'
            }
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Subscription check error:', error);
        
        return new Response(JSON.stringify({
            subscriptionTier: 'Standard',
            isPaidSubscriber: false,
            epMultiplier: 1,
            featureAccess: {},
            badges: {},
            error: error.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});