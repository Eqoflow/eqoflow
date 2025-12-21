import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the post ID from request
    const { postId } = await req.json();
    
    if (!postId) {
      return Response.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Get the post
    const post = await base44.entities.Post.get(postId);
    
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    // Verify user owns the post
    if (post.created_by !== user.email) {
      return Response.json({ error: 'You can only supercharge your own posts' }, { status: 403 });
    }

    // Check if post is already supercharged
    if (post.is_super_charged) {
      return Response.json({ error: 'Post is already supercharged' }, { status: 400 });
    }

    // Check if user has tokens
    if (!user.super_boost_token_count || user.super_boost_token_count <= 0) {
      return Response.json({ error: 'You do not have any Super Boost tokens' }, { status: 400 });
    }

    // Update the post to mark it as supercharged
    await base44.entities.Post.update(postId, {
      is_super_charged: true,
      super_charged_at: new Date().toISOString()
    });

    // Decrement user's token count
    const newTokenCount = user.super_boost_token_count - 1;
    await base44.auth.updateMe({
      super_boost_token_count: newTokenCount
    });

    return Response.json({
      success: true,
      message: 'Post supercharged successfully!',
      remaining_tokens: newTokenCount
    });

  } catch (error) {
    console.error('Supercharge error:', error);
    return Response.json({ 
      error: 'Failed to supercharge post', 
      details: error.message 
    }, { status: 500 });
  }
});