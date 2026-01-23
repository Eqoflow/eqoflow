import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await base44.asServiceRole.entities.User.update(user.id, {
            solana_wallet_address: null,
            solana_wallet_linked_at: null
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error unlinking wallet:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});