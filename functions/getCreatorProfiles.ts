import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { emails } = await req.json();

        // Use service role to fetch creator profiles
        let profiles = [];
        if (emails && emails.length > 0) {
            profiles = await base44.asServiceRole.entities.CreatorProfile.filter({
                user_email: { $in: emails }
            });
        } else {
            profiles = await base44.asServiceRole.entities.CreatorProfile.list();
        }

        return Response.json({ 
            success: true, 
            profiles 
        });

    } catch (error) {
        console.error("[getCreatorProfiles] Error:", error);
        return Response.json({ 
            success: false, 
            error: error.message,
            profiles: []
        }, {
            status: 200 // Return 200 so frontend doesn't break
        });
    }
});