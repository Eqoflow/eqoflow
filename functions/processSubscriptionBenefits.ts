import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check authentication
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({
                success: false,
                error: 'User not authenticated'
            }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        const { userEmail, subscriptionTier, paymentConfirmed } = await req.json();

        if (!paymentConfirmed) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Payment not confirmed'
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Find the user to update
        const usersToUpdate = await base44.asServiceRole.entities.User.filter({ email: userEmail });
        if (usersToUpdate.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'User not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const targetUser = usersToUpdate[0];

        // Update user's subscription tier using service role
        await base44.asServiceRole.entities.User.update(targetUser.id, {
            subscription_tier: subscriptionTier
        });

        // Grant tier-specific benefits
        const benefits = await grantSubscriptionBenefits(userEmail, subscriptionTier);

        return new Response(JSON.stringify({
            success: true,
            subscriptionTier,
            benefits
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Subscription processing error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});

async function grantSubscriptionBenefits(userEmail, tier) {
    const benefits = [];

    try {
        if (tier === 'Creator') {
            // Grant Creator NFT (placeholder - would integrate with actual NFT minting)
            benefits.push('Creator NFT granted');
            
            // Record EP multiplier
            benefits.push('1.5x EP multiplier activated');
            
            // Enable advanced analytics access
            benefits.push('Advanced analytics unlocked');
        }

        if (tier === 'Pro') {
            // Grant one-of-a-kind NFT (placeholder)
            benefits.push('One-of-a-kind NFT granted');
            
            // Record EP multiplier
            benefits.push('2x EP multiplier activated');
            
            // Enable governance boost
            benefits.push('Governance power boost activated');
            
            // Enable FlowAI access
            benefits.push('FlowAI access granted');
        }

        return benefits;

    } catch (error) {
        console.error('Error granting benefits:', error);
        return ['Error granting some benefits'];
    }
}