import { createClient } from 'npm:@base44/sdk@0.1.0';

const BATCH_SIZE = 50;

// This async function will do the heavy lifting in the background.
async function syncPostsInBackground(adminToken, userEmail) {
    try {
        const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });
        base44.auth.setToken(adminToken);

        const targetUsers = await base44.entities.User.filter({ email: userEmail });
        if (!targetUsers || targetUsers.length === 0) {
            console.error(`Sync failed in background: User not found with email ${userEmail}`);
            return;
        }
        const targetUser = targetUsers[0];
        const newFullName = targetUser.full_name;

        if (!newFullName) {
            console.error(`Sync failed in background: User ${userEmail} has no full name set.`);
            return;
        }

        const userPosts = await base44.entities.Post.filter({ created_by: userEmail });
        console.log(`Background sync: Found ${userPosts.length} posts for ${userEmail}. Updating name to "${newFullName}".`);

        for (let i = 0; i < userPosts.length; i += BATCH_SIZE) {
            const batch = userPosts.slice(i, i + BATCH_SIZE);
            const updatePromises = batch.map(post =>
                base44.entities.Post.update(post.id, { author_full_name: newFullName })
            );
            await Promise.all(updatePromises);
            console.log(`Background sync: Updated batch of ${batch.length} posts for ${userEmail}.`);
        }
        console.log(`Background sync completed for ${userEmail}.`);
    } catch (error) {
        console.error(`Error during background sync for ${userEmail}:`, error);
    }
}

Deno.serve(async (req) => {
    try {
        const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);

        const adminUser = await base44.auth.me();
        if (!adminUser || adminUser.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        const { userEmail } = await req.json();
        if (!userEmail) {
            return new Response(JSON.stringify({ error: 'userEmail is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Trigger the background task without waiting for it to finish.
        setTimeout(() => {
            syncPostsInBackground(token, userEmail);
        }, 0);

        // Immediately return a success message.
        return new Response(JSON.stringify({
            success: true,
            message: `Synchronization for user ${userEmail}'s posts has been triggered. It will complete in the background.`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Error in syncUserPosts handler:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});