import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    try {
        console.log('Wallet linking request received.');
        
        const base44 = createClientFromRequest(req);

        // Check if user is authenticated
        if (!(await base44.auth.isAuthenticated())) {
            return new Response(JSON.stringify({ success: false, error: 'User not authenticated' }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        // Get user
        const user = await base44.auth.me();
        if (!user) {
            throw new Error('User not found after authentication check.');
        }

        const { publicKey } = await req.json();
        if (!publicKey) {
            throw new Error('No public key provided');
        }

        console.log(`User ${user.email} is linking wallet ${publicKey}`);

        const updateData = {
            solana_wallet_address: publicKey,
            solana_wallet_linked_at: new Date().toISOString()
        };
        
        console.log('Attempting to update user record with data:', updateData);
        
        // Use service role to ensure permissions to update User entity
        await base44.asServiceRole.entities.User.update(user.id, updateData);
        
        console.log('User record updated successfully.');

        return new Response(JSON.stringify({
            success: true,
            message: 'Wallet successfully linked!',
            walletAddress: publicKey
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Detailed error in linkSolanaWallet:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        return new Response(JSON.stringify({
            success: false,
            error: `Internal server error: ${error.message}`
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});