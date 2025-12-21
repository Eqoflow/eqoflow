import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, communityId } = await req.json();
    
    if (!text || text.length > 280) {
      return Response.json({ 
        error: 'Invalid tweet text (must be 1-280 characters)' 
      }, { status: 400 });
    }
    
    // Get user's X access token
    const userRecord = await base44.asServiceRole.entities.User.get(user.id);
    
    if (!userRecord.x_access_token) {
      return Response.json({ 
        error: 'X account not connected. Please connect your X account first.' 
      }, { status: 400 });
    }
    
    // Post to X using Twitter API v2
    const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userRecord.x_access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
    
    if (!tweetResponse.ok) {
      const errorData = await tweetResponse.json();
      console.error('Failed to post to X:', errorData);
      
      // If token expired, clear the connection
      if (tweetResponse.status === 401) {
        await base44.asServiceRole.entities.User.update(user.id, {
          x_access_token: null,
          x_access_token_secret: null,
          x_username: null,
          x_connected_at: null
        });
        
        return Response.json({ 
          error: 'X token expired. Please reconnect your X account.',
          token_expired: true
        }, { status: 401 });
      }
      
      return Response.json({ 
        error: errorData.detail || 'Failed to post to X' 
      }, { status: tweetResponse.status });
    }
    
    const tweetData = await tweetResponse.json();
    
    return Response.json({ 
      success: true,
      tweetId: tweetData.data?.id,
      tweetUrl: `https://twitter.com/${userRecord.x_username}/status/${tweetData.data?.id}`
    });
    
  } catch (error) {
    console.error('Error posting to X:', error);
    return Response.json({ 
      error: error.message || 'Failed to post to X' 
    }, { status: 500 });
  }
});