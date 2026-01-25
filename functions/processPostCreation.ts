import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Process post creation with content hashing and optional blockchain timestamping
 * This function is called after a post is created to add provenance features
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      console.error('[processPostCreation] No authenticated user');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[processPostCreation] User authenticated:', user.email);

    const { post_id, enable_blockchain_timestamp = false } = await req.json();

    console.log('[processPostCreation] Processing post:', post_id, 'blockchain timestamp:', enable_blockchain_timestamp);

    if (!post_id) {
      return Response.json({ error: 'Post ID required' }, { status: 400 });
    }

    // Fetch the post
    const posts = await base44.asServiceRole.entities.Post.filter({ id: post_id });
    if (posts.length === 0) {
      console.error('[processPostCreation] Post not found:', post_id);
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = posts[0];
    console.log('[processPostCreation] Post found. Content:', post.content?.substring(0, 50));

    // Generate content hash (simulated for now)
    console.log('[processPostCreation] Generating content hash...');
    
    // Simple hash generation - combine content and metadata
    const hashInput = JSON.stringify({
      content: post.content,
      media_urls: post.media_urls || [],
      author: post.created_by,
      created_at: post.created_date
    });
    
    // Generate SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('[processPostCreation] Content hash generated:', contentHash);
    
    // Update the post with content hash only (blockchain timestamp handled client-side)
    console.log('[processPostCreation] Updating post with content hash...');
    await base44.asServiceRole.entities.Post.update(post_id, { content_hash: contentHash });
    console.log('[processPostCreation] Post updated successfully');

    return Response.json({
      success: true,
      content_hash: contentHash,
      blockchain_timestamp_enabled: false // Always false - client handles blockchain timestamp
    });

  } catch (error) {
    console.error('[processPostCreation] CRITICAL ERROR:', error);
    console.error('[processPostCreation] Error message:', error.message);
    console.error('[processPostCreation] Error stack:', error.stack);
    console.error('[processPostCreation] Error response:', error.response?.data);
    
    return Response.json({ 
      error: error.message || 'Failed to process post creation',
      details: error.response?.data || error.stack
    }, { status: 500 });
  }
});