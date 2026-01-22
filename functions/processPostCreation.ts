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
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { post_id, enable_blockchain_timestamp = false } = await req.json();

    if (!post_id) {
      return Response.json({ error: 'Post ID required' }, { status: 400 });
    }

    // Fetch the post
    const posts = await base44.asServiceRole.entities.Post.filter({ id: post_id });
    if (posts.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = posts[0];

    // Generate content hash
    const hashResponse = await base44.functions.invoke('generateContentHash', {
      content: post.content,
      media_urls: post.media_urls || [],
      metadata: {
        author: post.created_by,
        created_at: post.created_date
      }
    });

    if (!hashResponse.data?.content_hash) {
      return Response.json({ error: 'Failed to generate content hash' }, { status: 500 });
    }

    const contentHash = hashResponse.data.content_hash;
    const updateData = { content_hash: contentHash };

    // Optionally timestamp on blockchain
    let blockchainTxId = null;
    let timestampError = null;

    if (enable_blockchain_timestamp) {
      try {
        const timestampResponse = await base44.functions.invoke('timestampOnBlockchain', {
          content_hash: contentHash,
          post_id: post_id
        });

        if (timestampResponse.data?.blockchain_tx_id) {
          blockchainTxId = timestampResponse.data.blockchain_tx_id;
          updateData.blockchain_tx_id = blockchainTxId;
        } else if (timestampResponse.data?.error) {
          timestampError = timestampResponse.data.error;
        }
      } catch (error) {
        console.error('Blockchain timestamping error:', error);
        timestampError = error.message || 'Failed to timestamp on blockchain';
      }
    }

    // Update the post with hash (and blockchain tx if successful)
    await base44.asServiceRole.entities.Post.update(post_id, updateData);

    return Response.json({
      success: true,
      content_hash: contentHash,
      blockchain_tx_id: blockchainTxId,
      blockchain_timestamp_enabled: enable_blockchain_timestamp,
      timestamp_error: timestampError,
      explorer_url: blockchainTxId ? `https://explorer.solana.com/tx/${blockchainTxId}` : null
    });

  } catch (error) {
    console.error('Error processing post creation:', error);
    return Response.json({ 
      error: error.message || 'Failed to process post creation' 
    }, { status: 500 });
  }
});