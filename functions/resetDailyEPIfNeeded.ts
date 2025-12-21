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

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const lastGeneralResetDate = user.last_general_ep_reset_date;
        const lastCreatorResetDate = user.last_creator_ep_reset_date;

        let updateData = {};
        let resetActions = [];

        // Check if we need to reset general daily EP
        if (!lastGeneralResetDate || lastGeneralResetDate !== today) {
            console.log(`Resetting general daily EP for user ${user.email}. Last reset: ${lastGeneralResetDate}, Today: ${today}`);
            updateData.general_daily_ep_earned = 0;
            updateData.last_general_ep_reset_date = today;
            resetActions.push('general');
        }

        // Check if we need to reset creator daily EP
        if (!lastCreatorResetDate || lastCreatorResetDate !== today) {
            console.log(`Resetting creator daily EP for user ${user.email}. Last reset: ${lastCreatorResetDate}, Today: ${today}`);
            updateData.creator_daily_ep_earned = 0;
            updateData.last_creator_ep_reset_date = today;
            resetActions.push('creator');
        }

        // Only update if there are changes
        if (Object.keys(updateData).length > 0) {
            await base44.entities.User.update(user.id, updateData);
        }

        return new Response(JSON.stringify({
            success: true,
            message: resetActions.length > 0 ? `Daily EP reset completed for: ${resetActions.join(', ')}` : 'No reset needed',
            reset_actions: resetActions,
            general_daily_ep_earned: updateData.general_daily_ep_earned !== undefined ? updateData.general_daily_ep_earned : user.general_daily_ep_earned || 0,
            creator_daily_ep_earned: updateData.creator_daily_ep_earned !== undefined ? updateData.creator_daily_ep_earned : user.creator_daily_ep_earned || 0,
            reset_date: today
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Daily EP reset error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});