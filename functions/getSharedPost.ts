import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return Response.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Use service role to fetch post publicly
    const post = await base44.asServiceRole.entities.Post.get(postId);

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    // Fetch author information from public directory
    const authorData = await base44.asServiceRole.entities.PublicUserDirectory.filter({ 
      user_email: post.created_by 
    });
    
    const followData = await base44.asServiceRole.entities.Follow.filter({ 
      following_email: post.created_by 
    });

    const authorInfo = authorData.length > 0 ? {
      email: authorData[0].user_email,
      user_email: authorData[0].user_email,
      full_name: authorData[0].full_name,
      username: authorData[0].username,
      avatar_url: authorData[0].avatar_url,
      professional_credentials: authorData[0].professional_credentials,
      cross_platform_identity: authorData[0].cross_platform_identity,
      subscription_tier: authorData[0].subscription_tier || 'free',
      follower_count: followData.length,
      kyc_status: authorData[0].kyc_status
    } : {};

    const postWithAuthor = {
      ...post,
      author: authorInfo,
      author_full_name: authorInfo.full_name || post.author_full_name,
      author_username: authorInfo.username || post.author_username,
      author_avatar_url: authorInfo.avatar_url || post.author_avatar_url,
      author_follower_count: authorInfo.follower_count || 0
    };

    return Response.json({ post: postWithAuthor });

  } catch (error) {
    console.error('Error fetching shared post:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});