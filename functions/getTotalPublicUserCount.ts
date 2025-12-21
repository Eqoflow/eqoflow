import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Efficiently retrieves the total count of public users in the PublicUserDirectory.
 * This function is designed to be called infrequently and its result cached client-side
 * to avoid expensive count operations during high traffic.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check authentication
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all public users to get count
    // Note: Base44 SDK doesn't have a dedicated count() method yet,
    // so we fetch with minimal filtering and count the results
    const publicUsers = await base44.entities.PublicUserDirectory.filter({ 
      is_public: true 
    });

    const totalCount = publicUsers.length;

    return Response.json({ 
      totalCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting total public user count:', error);
    return Response.json({ 
      error: error.message || 'Failed to get user count' 
    }, { status: 500 });
  }
});