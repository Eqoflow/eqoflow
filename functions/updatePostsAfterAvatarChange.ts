import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });

// Helper function to add delay between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to process posts in batches with rate limiting
async function updatePostsInBatches(posts, newAvatarUrl) {
    const BATCH_SIZE = 5; // Process 5 posts at a time
    const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches
    
    let updatedCount = 0;
    
    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
        const batch = posts.slice(i, i + BATCH_SIZE);
        
        try {
            // Process current batch in parallel
            const updatePromises = batch.map(post => 
                base44.entities.Post.update(post.id, { author_avatar_url: newAvatarUrl })
            );
            
            await Promise.all(updatePromises);
            updatedCount += batch.length;
            
            // Add delay between batches to avoid rate limiting
            if (i + BATCH_SIZE < posts.length) {
                await delay(DELAY_BETWEEN_BATCHES);
            }
            
        } catch (error) {
            console.error(`[updatePostsAfterAvatarChange] Error updating batch starting at index ${i}:`, error);
            // Continue with next batch even if current batch fails
        }
    }
    
    return updatedCount;
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
        base44.auth.setToken(token);

        const currentUser = await base44.auth.me();
        if (!currentUser) {
            return new Response(JSON.stringify({ error: 'User not authenticated' }), { 
                status: 401, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        const { newAvatarUrl } = await req.json();
        if (!newAvatarUrl) {
            return new Response(JSON.stringify({ error: 'New avatar URL not provided' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Fetch user's posts
        const userPosts = await base44.entities.Post.filter(
            { created_by: currentUser.email },
            '-created_date',
            1000
        );

        if (userPosts.length === 0) {
            return new Response(JSON.stringify({ 
                success: true, 
                updatedCount: 0, 
                message: "No posts to update." 
            }), { 
                status: 200, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Update posts in batches with rate limiting
        const updatedCount = await updatePostsInBatches(userPosts, newAvatarUrl);

        return new Response(JSON.stringify({ 
            success: true, 
            updatedCount,
            totalPosts: userPosts.length,
            message: updatedCount === userPosts.length ? 
                "All posts updated successfully" : 
                `Updated ${updatedCount} out of ${userPosts.length} posts`
        }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        console.error("[updatePostsAfterAvatarChange] Function Error:", error);
        return new Response(JSON.stringify({ 
            error: 'Failed to synchronize avatar to posts.', 
            details: error.message 
        }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
});