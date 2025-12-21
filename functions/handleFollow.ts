import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const serviceRole = base44.asServiceRole;

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const { targetUserEmail, action } = await req.json();

        if (!targetUserEmail || !action) {
            return new Response(JSON.stringify({ success: false, error: 'Missing targetUserEmail or action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        
        const followerEmail = user.email;

        if (action === 'follow') {
            // Prevent self-follow
            if (followerEmail === targetUserEmail) {
                return new Response(JSON.stringify({ success: false, error: "You can't follow yourself." }), { status: 400 });
            }

            // Check if already following to prevent duplicates
            const existingFollow = await serviceRole.entities.Follow.filter({
                follower_email: followerEmail,
                following_email: targetUserEmail
            });

            if (existingFollow.length === 0) {
                await serviceRole.entities.Follow.create({
                    follower_email: followerEmail,
                    following_email: targetUserEmail
                });
            }
        } else if (action === 'unfollow') {
            const existingFollow = await serviceRole.entities.Follow.filter({
                follower_email: followerEmail,
                following_email: targetUserEmail
            });

            if (existingFollow.length > 0) {
                await serviceRole.entities.Follow.delete(existingFollow[0].id);
            }
        } else {
            return new Response(JSON.stringify({ success: false, error: 'Invalid action specified' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // After action, get the definitive new follower count
        const followers = await serviceRole.entities.Follow.filter({ following_email: targetUserEmail });
        const newFollowerCount = followers.length;

        // Check if the current user is now following the target
        const isNowFollowing = (await serviceRole.entities.Follow.filter({
            follower_email: followerEmail,
            following_email: targetUserEmail
        })).length > 0;
        
        return new Response(JSON.stringify({
            success: true,
            isFollowing: isNowFollowing,
            followerCount: newFollowerCount
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Error in handleFollow:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});