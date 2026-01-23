import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        console.log('Wallet linking request received.');
        
        const base44 = createClientFromRequest(req);

        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
        
        console.log('Attempting to update user profile with data:', updateData);
        
        // Update UserProfileData instead of User
        const profiles = await base44.entities.UserProfileData.filter({ user_email: user.email });
        if (profiles && profiles.length > 0) {
            await base44.entities.UserProfileData.update(profiles[0].id, updateData);
        } else {
            // Create profile if it doesn't exist
            await base44.entities.UserProfileData.create({
                user_email: user.email,
                ...updateData
            });
        }
        
        console.log('User record updated successfully.');

        return Response.json({
            success: true,
            message: 'Wallet successfully linked!',
            walletAddress: publicKey
        });

    } catch (error) {
        console.error('Detailed error in linkSolanaWallet:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        return Response.json({
            success: false,
            error: `Internal server error: ${error.message}`
        }, { status: 500 });
    }
});