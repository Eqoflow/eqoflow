import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function can be called by admins or run as a scheduled job
    const user = await base44.auth.me();
    
    // Find all posts that need to be posted to X
    const postsToProcess = await base44.asServiceRole.entities.Post.filter({
      post_to_x: true,
      x_tweet_id: null // Only posts that haven't been posted yet
    });
    
    if (postsToProcess.length === 0) {
      return Response.json({ 
        success: true,
        message: 'No posts to process',
        processed: 0
      });
    }
    
    const results = [];
    
    for (const post of postsToProcess) {
      try {
        // Get the author's X access token
        const authorEmail = post.created_by;
        const users = await base44.asServiceRole.entities.User.filter({ email: authorEmail });
        
        if (users.length === 0 || !users[0].x_access_token) {
          // User doesn't have X connected, mark post as processed without posting
          await base44.asServiceRole.entities.Post.update(post.id, {
            post_to_x: false // Reset flag since we can't post
          });
          
          results.push({
            postId: post.id,
            success: false,
            error: 'User X account not connected'
          });
          continue;
        }
        
        const author = users[0];
        
        // Prepare tweet text (max 280 characters for X)
        let tweetText = post.content;
        if (tweetText.length > 280) {
          tweetText = tweetText.substring(0, 277) + '...';
        }
        
        // Post to X using Twitter API v2
        const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${author.x_access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: tweetText })
        });
        
        if (!tweetResponse.ok) {
          const errorData = await tweetResponse.json();
          console.error('Failed to post to X:', errorData);
          
          // If token expired, clear the user's connection
          if (tweetResponse.status === 401) {
            await base44.asServiceRole.entities.User.update(author.id, {
              x_access_token: null,
              x_refresh_token: null,
              x_username: null,
              x_connected_at: null
            });
          }
          
          // Reset the flag so it doesn't keep trying
          await base44.asServiceRole.entities.Post.update(post.id, {
            post_to_x: false
          });
          
          results.push({
            postId: post.id,
            success: false,
            error: errorData.detail || 'Failed to post to X'
          });
          continue;
        }
        
        const tweetData = await tweetResponse.json();
        
        // Update post with X tweet info
        await base44.asServiceRole.entities.Post.update(post.id, {
          x_tweet_id: tweetData.data?.id,
          x_posted_at: new Date().toISOString(),
          post_to_x: false // Reset flag after successful posting
        });
        
        results.push({
          postId: post.id,
          success: true,
          tweetId: tweetData.data?.id,
          tweetUrl: `https://twitter.com/${author.x_username}/status/${tweetData.data?.id}`
        });
        
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
        results.push({
          postId: post.id,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return Response.json({ 
      success: true,
      message: `Processed ${results.length} posts, ${successCount} successful`,
      processed: results.length,
      successful: successCount,
      results
    });
    
  } catch (error) {
    console.error('Error in processXCrossPosts:', error);
    return Response.json({ 
      error: error.message || 'Failed to process X cross-posts' 
    }, { status: 500 });
  }
});