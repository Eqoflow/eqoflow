import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const scheduledPosts = await base44.asServiceRole.entities.ScheduledPost.filter({ 
      status: 'scheduled'
    });
    
    const now = new Date();
    let processed = 0;
    let failed = 0;

    for (const scheduledPost of scheduledPosts) {
      const scheduledDate = new Date(scheduledPost.scheduled_date);
      
      if (scheduledDate.getTime() <= now.getTime()) {
        try {
          // Mark as processing first
          await base44.asServiceRole.entities.ScheduledPost.update(scheduledPost.id, { 
            status: "processing" 
          });
          
          const publicUserRecords = await base44.asServiceRole.entities.PublicUserDirectory.filter({ 
            user_email: scheduledPost.created_by 
          });
          const publicUser = publicUserRecords.length > 0 ? publicUserRecords[0] : null;

          const postData = {
            content: scheduledPost.content,
            media_urls: scheduledPost.media_urls || [],
            tags: scheduledPost.tags || [],
            category: scheduledPost.category || "general",
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
            author_full_name: publicUser?.full_name || scheduledPost.created_by.split('@')[0],
            author_username: publicUser?.username || scheduledPost.created_by.split('@')[0],
            author_avatar_url: publicUser?.avatar_url || null,
            author_banner_url: publicUser?.banner_url || null,
            author_follower_count: publicUser?.follower_count || 0,
            author_professional_credentials: publicUser?.professional_credentials || null,
            author_cross_platform_identity: publicUser?.cross_platform_identity || null
          };

          const createdPost = await base44.asServiceRole.entities.Post.create(postData);
          
          await base44.asServiceRole.entities.ScheduledPost.update(scheduledPost.id, {
            status: "published",
            published_post_id: createdPost.id
          });
          
          processed++;
        } catch (error) {
          await base44.asServiceRole.entities.ScheduledPost.update(scheduledPost.id, { 
            status: "failed" 
          }).catch(() => {});
          failed++;
        }
      }
    }

    return Response.json({ 
      success: true, 
      processed, 
      failed 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});