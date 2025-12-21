import { createClient } from 'npm:@base44/sdk@0.1.0';

const BATCH_SIZE = 10; // Small batches to avoid rate limiting
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches
const DELAY_BETWEEN_USERS = 2000; // 2 second delay between processing different users

// Helper function to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Background function to fix all name mismatches
async function fixAllNameMismatchesBackground(adminToken) {
    try {
        const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });
        base44.auth.setToken(adminToken);
        
        console.log('Migration: Starting to fix all name mismatches...');
        
        // Get all users
        const allUsers = await base44.entities.User.list();
        console.log(`Migration: Found ${allUsers.length} total users to check`);
        
        let totalUsersProcessed = 0;
        let totalPostsUpdated = 0;
        
        for (const user of allUsers) {
            if (!user.full_name || !user.email) {
                console.log(`Migration: Skipping user ${user.email || 'unknown'} - missing name or email`);
                continue;
            }
            
            try {
                // Get all posts by this user
                const userPosts = await base44.entities.Post.filter({ created_by: user.email });
                
                if (userPosts.length === 0) {
                    console.log(`Migration: User ${user.email} has no posts, skipping`);
                    continue;
                }
                
                // Check if any posts have mismatched names
                const postsToUpdate = userPosts.filter(post => 
                    post.author_full_name !== user.full_name
                );
                
                if (postsToUpdate.length === 0) {
                    console.log(`Migration: User ${user.email} - all ${userPosts.length} posts already have correct name`);
                    continue;
                }
                
                console.log(`Migration: User ${user.email} - updating ${postsToUpdate.length} out of ${userPosts.length} posts`);
                
                // Update posts in small batches
                for (let i = 0; i < postsToUpdate.length; i += BATCH_SIZE) {
                    const batch = postsToUpdate.slice(i, i + BATCH_SIZE);
                    
                    const updatePromises = batch.map(async (post) => {
                        try {
                            await base44.entities.Post.update(post.id, { 
                                author_full_name: user.full_name 
                            });
                            return true;
                        } catch (error) {
                            console.error(`Migration: Failed to update post ${post.id}:`, error);
                            return false;
                        }
                    });
                    
                    const results = await Promise.all(updatePromises);
                    const successCount = results.filter(Boolean).length;
                    totalPostsUpdated += successCount;
                    
                    console.log(`Migration: Updated batch of ${successCount}/${batch.length} posts for ${user.email}`);
                    
                    // Delay between batches for this user
                    if (i + BATCH_SIZE < postsToUpdate.length) {
                        await delay(DELAY_BETWEEN_BATCHES);
                    }
                }
                
                totalUsersProcessed++;
                console.log(`Migration: Completed user ${user.email} - updated ${postsToUpdate.length} posts`);
                
                // Delay between users to be gentle on the system
                await delay(DELAY_BETWEEN_USERS);
                
            } catch (error) {
                console.error(`Migration: Error processing user ${user.email}:`, error);
            }
        }
        
        console.log(`Migration: COMPLETED! Processed ${totalUsersProcessed} users and updated ${totalPostsUpdated} posts`);
        
    } catch (error) {
        console.error('Migration: Fatal error during name mismatch fix:', error);
    }
}

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
        const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });
        base44.auth.setToken(token);

        // Verify admin access
        const admin = await base44.auth.me();
        if (!admin || admin.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), { 
                status: 403, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Trigger the migration in background immediately
        setTimeout(() => {
            fixAllNameMismatchesBackground(token);
        }, 0);

        // Return success immediately
        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Migration started to fix all existing name mismatches. This will run in the background and may take several minutes to complete. Check server logs for progress.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Migration: Error in fixAllNameMismatches handler:", error.message);
        return new Response(JSON.stringify({ 
            error: 'Failed to start migration', 
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});