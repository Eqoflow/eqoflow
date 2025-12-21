import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { epToSwap } = await req.json();

    if (!epToSwap || epToSwap < 100 || epToSwap % 100 !== 0) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid swap amount. Must be a multiple of 100.' }), { status: 400 });
    }

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
        }

        // --- CRITICAL FIX: SERVER-SIDE VALIDATION FROM SOURCE OF TRUTH ---
        // 1. Fetch all EngagementPoint records for the user.
        const allEPRecords = await base44.asServiceRole.entities.EngagementPoint.filter({ created_by: user.email });

        // 2. Calculate the current swappable balance from 'earned' source records ONLY.
        // This includes positive earnings and negative swaps (as they are recorded with source: 'earned'),
        // giving the true current spendable balance of organically earned points.
        const earnedRecords = allEPRecords.filter(ep => ep.source === 'earned');
        const currentEarnedBalance = earnedRecords.reduce((sum, ep) => sum + (ep.final_points || 0), 0);
        
        // 3. Validate the swap request against this true swappable balance.
        if (currentEarnedBalance < epToSwap) {
            console.error(`Swap validation FAILED for ${user.email}. Requested: ${epToSwap}, True Earned Balance from records: ${currentEarnedBalance}`);
            return new Response(JSON.stringify({ success: false, error: "Insufficient earned EP balance for swap" }), { status: 400 });
        }
        // --- END OF FIX ---

        const tokensAwarded = epToSwap / 100;
        const currentSpendableTotal = user.total_ep_earned || 0;

        // Update user's balances.
        await base44.asServiceRole.entities.User.update(user.id, {
            total_ep_earned: currentSpendableTotal - epToSwap,
            swapped_ep_total: (user.swapped_ep_total || 0) + epToSwap,
            token_balance: (user.token_balance || 0) + tokensAwarded,
            last_ep_swap_at: new Date().toISOString()
        });

        // Create a record of the swap transaction.
        await base44.asServiceRole.entities.EngagementPoint.create({
            created_by: user.email,
            action_type: 'repost', // Using 'repost' as a placeholder for 'swap' action
            points_earned: -epToSwap,
            final_points: -epToSwap,
            points_awarded: -epToSwap,
            description: `Swapped ${epToSwap} EP for ${tokensAwarded} $EQOFLO tokens.`,
            source: 'earned', // This indicates that 'earned' points were consumed.
            is_swapped: true
        });

        return new Response(JSON.stringify({
            success: true,
            message: `Successfully swapped ${epToSwap} EP for ${tokensAwarded} $EQOFLO.`,
            tokensAwarded: tokensAwarded,
            newEpBalance: currentSpendableTotal - epToSwap
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error in swapEPToTokens function:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});