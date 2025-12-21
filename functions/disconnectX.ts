import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear X connection data
    await base44.asServiceRole.entities.User.update(user.id, {
      x_access_token: null,
      x_access_token_secret: null,
      x_username: null,
      x_connected_at: null
    });
    
    return Response.json({ 
      success: true,
      message: 'X account disconnected successfully' 
    });
    
  } catch (error) {
    console.error('Error disconnecting X:', error);
    return Response.json({ 
      error: error.message || 'Failed to disconnect X account' 
    }, { status: 500 });
  }
});