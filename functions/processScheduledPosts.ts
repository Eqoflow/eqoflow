import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current time
    const now = new Date();
    
    // Find all scheduled posts that are due (scheduled_date <= now and status is "scheduled")
    const duePostsResponse = await base44.asServiceRole.entities.ScheduledPost.filter({
      status: "scheduled"
    });
    
    const duePosts = duePostsResponse.filter(post => {
      const scheduledDate = new Date(post.scheduled_date);
      return scheduledDate <= now;
    });
    
    console.log(`[processScheduledPosts] Found ${duePosts.length} posts due for publishing`);
    
    const results = {
      processed: 0,
      published: 0,
      failed: 0,
      errors: []
    };
    
    // Process each due post
    for (const scheduledPost of duePosts) {
      try {
        results.processed++;
        
        // Create the actual post
        const postData = {
          content: scheduledPost.content,
          media_urls: scheduledPost.media_urls || [],
          tags: scheduledPost.tags || [],
          privacy_level: scheduledPost.privacy_level || "public",
          nft_gate_settings: scheduledPost.nft_gate_settings || null,
          community_id: scheduledPost.community_id || null,
          share_to_main_feed: scheduledPost.share_to_main_feed || false,
          youtube_video_id: scheduledPost.youtube_video_id || null,
          youtube_thumbnail_url: scheduledPost.youtube_thumbnail_url || null,
          youtube_video_title: scheduledPost.youtube_video_title || null,
          license_id: scheduledPost.license_id || null,
          eqoflo_price: scheduledPost.eqoflo_price || null,
          gated_content_title: scheduledPost.gated_content_title || null,
          brand_content_price: scheduledPost.brand_content_price || null,
          brand_content_title: scheduledPost.brand_content_title || null,
          post_to_x: scheduledPost.post_to_x || false,
          moderation_status: 'approved',
          created_by: scheduledPost.created_by
        };
        
        // Get user data for author fields
        const userEmail = scheduledPost.created_by;
        const userRecords = await base44.asServiceRole.entities.User.filter({ email: userEmail });
        const user = userRecords.length > 0 ? userRecords[0] : null;
        
        let mergedUser = user;
        if (user) {
          const profileRecords = await base44.asServiceRole.entities.UserProfileData.filter({ user_email: user.email });
          if (profileRecords.length > 0) {
            mergedUser = { ...user, ...profileRecords[0] };
          }
        }
        
        const publicUserRecords = await base44.asServiceRole.entities.PublicUserDirectory.filter({ user_email: userEmail });
        const publicUser = publicUserRecords.length > 0 ? publicUserRecords[0] : null;
        
        if (mergedUser) {
          postData.author_full_name = publicUser?.full_name || mergedUser.full_name || mergedUser.email.split('@')[0];
          postData.author_username = publicUser?.username || mergedUser.username || mergedUser.email.split('@')[0];
          postData.author_avatar_url = publicUser?.avatar_url || mergedUser.avatar_url || null;
          postData.author_banner_url = publicUser?.banner_url || mergedUser.banner_url || null;
          postData.author_follower_count = publicUser?.follower_count || mergedUser.followers?.length || 0;
          postData.author_professional_credentials = publicUser?.professional_credentials || mergedUser.professional_credentials || null;
          postData.author_cross_platform_identity = publicUser?.cross_platform_identity || mergedUser.cross_platform_identity || null;
        }
        
        // Create the post
        const createdPost = await base44.asServiceRole.entities.Post.create(postData);
        
        // Update scheduled post status
        await base44.asServiceRole.entities.ScheduledPost.update(scheduledPost.id, {
          status: "published",
          published_post_id: createdPost.id
        });
        
        results.published++;
        console.log(`[processScheduledPosts] Published scheduled post ${scheduledPost.id} -> Post ${createdPost.id}`);
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          scheduled_post_id: scheduledPost.id,
          error: error.message
        });
        console.error(`[processScheduledPosts] Failed to publish scheduled post ${scheduledPost.id}:`, error);
        
        // Update scheduled post status to failed
        try {
          await base44.asServiceRole.entities.ScheduledPost.update(scheduledPost.id, {
            status: "failed"
          });
        } catch (updateError) {
          console.error(`[processScheduledPosts] Failed to update status to failed:`, updateError);
        }
      }
    }
    
    return Response.json({
      success: true,
      timestamp: now.toISOString(),
      results
    });
    
  } catch (error) {
    console.error('[processScheduledPosts] Error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});