import { createClient } from 'npm:@base44/sdk@0.1.0';

const BATCH_SIZE = 10;
const USER_BATCH_SIZE = 20;
const DELAY = 500;

const delay = (ms) => new Promise(res => setTimeout(res, ms));

Deno.serve(async (req) => {
    try {
        const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);

        const adminUser = await base44.auth.me();
        if (!adminUser || adminUser.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
        }

        console.log("Starting avatar mismatch fix process...");
        let totalMismatchesFixed = 0;
        let usersProcessed = 0;

        const allUsers = await base44.entities.User.list('', 10000); // Get all users

        for (let i = 0; i < allUsers.length; i += USER_BATCH_SIZE) {
            const userBatch = allUsers.slice(i, i + USER_BATCH_SIZE);
            
            const userPromises = userBatch.map(async (user) => {
                if (!user.avatar_url || !user.email) return;

                const userPosts = await base44.entities.Post.filter({ created_by: user.email });
                const mismatchedPosts = userPosts.filter(post => post.author_avatar_url !== user.avatar_url);

                if (mismatchedPosts.length > 0) {
                    console.log(`Found ${mismatchedPosts.length} mismatched avatars for user ${user.email}. Fixing...`);
                    
                    for (let j = 0; j < mismatchedPosts.length; j += BATCH_SIZE) {
                        const postBatch = mismatchedPosts.slice(j, j + BATCH_SIZE);
                        const updatePromises = postBatch.map(post => 
                            base44.entities.Post.update(post.id, { author_avatar_url: user.avatar_url })
                        );
                        await Promise.all(updatePromises);
                        await delay(DELAY);
                    }
                    totalMismatchesFixed += mismatchedPosts.length;
                }
                usersProcessed++;
            });

            await Promise.all(userPromises);
            console.log(`Processed user batch ${i / USER_BATCH_SIZE + 1}. Total users processed: ${usersProcessed}`);
        }

        const message = `Avatar synchronization complete. Processed ${usersProcessed} users and fixed ${totalMismatchesFixed} mismatched avatars.`;
        console.log(message);
        return new Response(JSON.stringify({ success: true, message }), { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error) {
        console.error("Error in fixAllAvatarMismatches:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
});