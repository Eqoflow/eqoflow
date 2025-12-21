import { createClient } from 'npm:@base44/sdk@0.1.0';
const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }
        
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), { 
                status: 401, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        const { profileData } = await req.json();

        // Find existing creator profile
        const existingProfiles = await base44.entities.CreatorProfile.filter({ 
            user_email: user.email 
        });

        let result;
        if (existingProfiles.length > 0) {
            // Update existing profile
            result = await base44.entities.CreatorProfile.update(
                existingProfiles[0].id, 
                { ...profileData, user_email: user.email }
            );
        } else {
            // Create new profile
            result = await base44.entities.CreatorProfile.create({
                ...profileData,
                user_email: user.email
            });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Creator profile updated successfully',
            profile: result
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("[updateCreatorProfile] Error:", error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});