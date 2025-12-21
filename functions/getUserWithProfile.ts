import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated
        const currentUser = await base44.auth.me();
        if (!currentUser) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email, username } = await req.json();

        if (!email && !username) {
            return Response.json({ error: 'Email or username required' }, { status: 400 });
        }

        // Use service role to fetch user and creator profile
        // Support both email and username lookup
        let users;
        if (username) {
            users = await base44.asServiceRole.entities.User.filter({ username: username });
        } else {
            users = await base44.asServiceRole.entities.User.filter({ email: email });
        }

        const user = users.length > 0 ? users[0] : null;

        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch creator profile using the found user's email
        const profiles = await base44.asServiceRole.entities.CreatorProfile.filter({ 
            user_email: user.email 
        });

        const profile = profiles.length > 0 ? profiles[0] : null;

        return Response.json({ 
            success: true, 
            user,
            profile
        });

    } catch (error) {
        console.error("[getUserWithProfile] Error:", error);
        return Response.json({ 
            success: false, 
            error: error.message
        }, {
            status: 500
        });
    }
});