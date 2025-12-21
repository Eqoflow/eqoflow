import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        if (!(await base44.auth.isAuthenticated())) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const user = await base44.auth.me();
        const { packageId, paymentMethod } = await req.json();

        if (!packageId || !paymentMethod) {
            return new Response(JSON.stringify({ error: 'Package ID and payment method are required.' }), { status: 400 });
        }

        const epPackage = await base44.entities.EPPackage.get(packageId);
        if (!epPackage) {
            return new Response(JSON.stringify({ error: 'Invalid package selected.' }), { status: 400 });
        }

        // --- Payment Processing ---
        if (paymentMethod === 'qflow') {
            const userTokenBalance = user.token_balance || 0;
            if (userTokenBalance < epPackage.qflow_cost) {
                return new Response(JSON.stringify({ success: false, error: 'Insufficient $QFLOW balance.' }), { status: 400 });
            }

            // Deduct QFLOW from user
            await base44.entities.User.update(user.id, {
                token_balance: userTokenBalance - epPackage.qflow_cost
            });

            // Add QFLOW to platform wallet
            await base44.entities.PlatformWallet.create({
                transaction_type: 'ep_purchase_qflow',
                amount_qflow: epPackage.qflow_cost,
                source_description: `EP Package Purchase - ${epPackage.name}`,
                user_email: user.email,
                package_id: packageId,
                notes: `User purchased ${epPackage.name} for ${epPackage.qflow_cost} QFLOW`
            });

        } else if (paymentMethod === 'fiat') {
            // TODO: Integrate with a fiat payment processor like Square
            // For now, this is a placeholder and will return an error.
            return new Response(JSON.stringify({ success: false, error: 'Fiat payments are not yet enabled.' }), { status: 501 });
        } else {
            return new Response(JSON.stringify({ error: 'Invalid payment method.' }), { status: 400 });
        }

        // --- Award Purchased EP ---
        // 1. Add to user's total EP balance
        const newTotalEp = (user.total_ep_earned || 0) + epPackage.ep_amount;
        await base44.entities.User.update(user.id, {
            total_ep_earned: newTotalEp
        });

        // 2. Create an EngagementPoint record for the purchase
        await base44.entities.EngagementPoint.create({
            action_type: 'milestone_achievement', // Using a generic type for purchase
            points_earned: epPackage.ep_amount,
            final_points: epPackage.ep_amount,
            points_awarded: epPackage.ep_amount,
            description: `Purchased ${epPackage.name}`,
            source: 'purchased',
            created_by: user.email,
        });

        return new Response(JSON.stringify({
            success: true,
            message: `Successfully purchased ${epPackage.name}!`,
            ep_added: epPackage.ep_amount,
            new_total_ep: newTotalEp
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("EP Purchase Error:", error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to process EP purchase.',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});