import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// This is a simple trigger function that calls the main monitoring function
// It can be used for manual testing or scheduled execution
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Only allow admin users to manually trigger this
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    console.log('🚀 Manually triggering AI content monitoring...');

    // Call the main monitoring function
    const monitoringResponse = await base44.functions.invoke('monitorTrendingPosts', {});
    
    return new Response(JSON.stringify({
      success: true,
      message: 'AI monitoring triggered successfully',
      monitoring_result: monitoringResponse.data
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error triggering AI monitoring:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to trigger AI monitoring',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});