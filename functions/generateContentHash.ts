import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, media_urls = [], content_url, metadata = {} } = await req.json();

    if (!content && (!media_urls || media_urls.length === 0) && !content_url) {
      return Response.json({ error: 'Content, media URLs, or content URL required for hashing' }, { status: 400 });
    }

    // Create a consistent string representation of the content
    const contentString = JSON.stringify({
      content: content || '',
      media_urls: media_urls.sort(), // Sort for consistency
      content_url: content_url || '',
      timestamp: new Date().toISOString(),
      author: user.email,
      ...metadata
    });

    // Generate SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(contentString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return Response.json({
      hash: contentHash,
      content_hash: contentHash,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating content hash:', error);
    return Response.json({ 
      error: error.message || 'Failed to generate content hash' 
    }, { status: 500 });
  }
});