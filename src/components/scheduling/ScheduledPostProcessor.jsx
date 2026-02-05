import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function ScheduledPostProcessor() {
  useEffect(() => {
    const processScheduledPosts = async () => {
      try {
        const scheduledPosts = await base44.entities.ScheduledPost.filter({ status: 'scheduled' });
        const now = new Date();

        for (const scheduledPost of scheduledPosts) {
          const scheduledDate = new Date(scheduledPost.scheduled_date);
          
          if (scheduledDate.getTime() <= now.getTime()) {
            try {
              // Immediately mark as processing to prevent duplicate posts
              await base44.entities.ScheduledPost.update(scheduledPost.id, { status: "processing" });
              
              const publicUserRecords = await base44.entities.PublicUserDirectory.filter({ user_email: scheduledPost.created_by });
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
              }

              const createdPost = await base44.entities.Post.create(postData);
              await base44.entities.ScheduledPost.update(scheduledPost.id, {
                status: "published",
                published_post_id: createdPost.id
              });
            } catch {
              await base44.entities.ScheduledPost.update(scheduledPost.id, { status: "failed" }).catch(() => {});
            }
          }
        }
      } catch {}
    };

    processScheduledPosts();
    const interval = setInterval(processScheduledPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  return null;
}