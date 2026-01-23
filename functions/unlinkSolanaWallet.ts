import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        console.log('User attempting to unlink wallet:', user?.email);
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find user profile data
        const profiles = await base44.entities.UserProfileData.filter({ user_email: user.email });
        console.log('Found profiles:', profiles?.length || 0);
        
        if (profiles && profiles.length > 0) {
            console.log('Updating profile:', profiles[0].id);
            await base44.entities.UserProfileData.update(profiles[0].id, {
                solana_wallet_address: null,
                solana_wallet_linked_at: null
            });
            console.log('Profile updated successfully');
        } else {
            console.log('No profile found, nothing to update');
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error unlinking wallet:', error);
        console.error('Error stack:', error.stack);
        return Response.json({ error: error.message, details: error.stack }, { status: 500 });
    }
});