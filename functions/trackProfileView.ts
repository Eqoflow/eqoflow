import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authenticate viewer
        const viewer = await base44.auth.me();
        if (!viewer) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { profileIdentifier } = await req.json();
        
        if (!profileIdentifier) {
            return Response.json({ error: 'Profile identifier required' }, { status: 400 });
        }

        // SECURITY FIX: Resolve profile owner using username or id (never receive email from client)
        let profileOwner = null;
        
        // Try to find user by username first, then by id
        const usersByUsername = await base44.asServiceRole.entities.PublicUserDirectory.filter({
            username: profileIdentifier
        });
        
        if (usersByUsername.length > 0) {
            profileOwner = usersByUsername[0];
        } else {
            // Try by id
            const usersById = await base44.asServiceRole.entities.PublicUserDirectory.filter({
                id: profileIdentifier
            });
            
            if (usersById.length > 0) {
                profileOwner = usersById[0];
            }
        }
        
        if (!profileOwner || !profileOwner.user_email) {
            return Response.json({ error: 'Profile not found' }, { status: 404 });
        }

        const today = new Date().toISOString().split('T')[0];
        
        // Don't track self-views
        if (viewer.email === profileOwner.user_email) {
            return Response.json({ success: true, selfView: true });
        }

        // Check if this viewer already viewed this profile today
        const existingViews = await base44.asServiceRole.entities.ProfileAnalytics.filter({
            profile_owner_email: profileOwner.user_email,
            viewer_email: viewer.email,
            view_date: today
        });

        if (existingViews.length === 0) {
            // Record new profile view
            await base44.asServiceRole.entities.ProfileAnalytics.create({
                profile_owner_email: profileOwner.user_email,
                viewer_email: viewer.email,
                viewer_name: viewer.full_name || 'Anonymous User',
                view_date: today,
                view_timestamp: new Date().toISOString()
            });
        }

        return Response.json({ success: true });

    } catch (error) {
        console.error('Error tracking profile view:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});