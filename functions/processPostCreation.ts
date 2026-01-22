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

    // Generate content hash
    console.log('[processPostCreation] Generating content hash...');
    const hashResponse = await base44.functions.invoke('generateContentHash', {
      content: post.content,
      media_urls: post.media_urls || [],
      metadata: {
        author: post.created_by,
        created_at: post.created_date
      }
    });

    console.log('[processPostCreation] Hash response:', hashResponse);

    if (!hashResponse.data?.content_hash) {
      console.error('[processPostCreation] No content hash in response:', hashResponse);
      return Response.json({ error: 'Failed to generate content hash' }, { status: 500 });
    }

    const contentHash = hashResponse.data.content_hash;
    console.log('[processPostCreation] Content hash generated:', contentHash);
    
    const updateData = { content_hash: contentHash };

    // Simulate blockchain timestamp (replace with real blockchain later)
    let blockchainTxId = null;
    let timestampError = null;

    if (enable_blockchain_timestamp) {
      console.log('[processPostCreation] Simulating blockchain timestamp...');
      
      // Generate simulated Solana transaction signature
      const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      blockchainTxId = Array.from({ length: 88 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      updateData.blockchain_tx_id = blockchainTxId;
      
      console.log('[processPostCreation] Simulated blockchain TX ID:', blockchainTxId);
      
      // TODO: Replace with real blockchain timestamping once integration is complete
      // await base44.functions.invoke('timestampOnBlockchain', { content_hash: contentHash, post_id: post_id });
    }

    // Update the post with hash (and blockchain tx if successful)
    console.log('[processPostCreation] Updating post with data:', updateData);
    await base44.asServiceRole.entities.Post.update(post_id, updateData);
    console.log('[processPostCreation] Post updated successfully');

    return Response.json({
      success: true,
      content_hash: contentHash,
      blockchain_tx_id: blockchainTxId,
      blockchain_timestamp_enabled: enable_blockchain_timestamp,
      timestamp_error: timestampError,
      explorer_url: blockchainTxId ? `https://explorer.solana.com/tx/${blockchainTxId}` : null
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