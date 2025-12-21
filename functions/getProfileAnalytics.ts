import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

// In-memory cache for profile analytics
const cache = new Map();
const CACHE_TTL = 180000; // 3 minutes cache

function getCacheKey(profileOwnerEmail) {
  return `profile_analytics_${profileOwnerEmail}`;
}

function isCacheValid(entry) {
  return entry && Date.now() - entry.timestamp < CACHE_TTL;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get profile owner email from request
    const url = new URL(req.url);
    const profileOwnerEmail = url.searchParams.get('profile_owner_email');
    
    if (!profileOwnerEmail) {
      return new Response(JSON.stringify({ error: 'profile_owner_email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cacheKey = getCacheKey(profileOwnerEmail);
    const cachedEntry = cache.get(cacheKey);
    
    // Return cached data if valid
    if (isCacheValid(cachedEntry)) {
      return new Response(JSON.stringify(cachedEntry.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch fresh analytics data using the Base44 SDK
    const analyticsData = await base44.asServiceRole.entities.ProfileAnalytics.filter({ 
      profile_owner_email: profileOwnerEmail 
    });

    // Calculate analytics summary
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const todayViews = analyticsData.filter(view => view.view_date === today);
    const last7DaysViews = analyticsData.filter(view => view.view_date >= sevenDaysAgoStr);
    const last30DaysViews = analyticsData.filter(view => view.view_date >= thirtyDaysAgoStr);

    // Get unique viewers
    const uniqueViewersToday = new Set(todayViews.map(v => v.viewer_email)).size;
    const uniqueViewersLast7Days = new Set(last7DaysViews.map(v => v.viewer_email)).size;
    const uniqueViewersLast30Days = new Set(last30DaysViews.map(v => v.viewer_email)).size;

    // Recent viewers (last 10)
    const recentViewers = analyticsData
      .sort((a, b) => new Date(b.view_timestamp) - new Date(a.view_timestamp))
      .slice(0, 10)
      .map(view => ({
        viewer_name: view.viewer_name,
        viewer_email: view.viewer_email,
        view_timestamp: view.view_timestamp
      }));

    const analytics = {
      profile_owner_email: profileOwnerEmail,
      total_views: analyticsData.length,
      views_today: todayViews.length,
      views_last_7_days: last7DaysViews.length,
      views_last_30_days: last30DaysViews.length,
      unique_viewers_today: uniqueViewersToday,
      unique_viewers_last_7_days: uniqueViewersLast7Days,
      unique_viewers_last_30_days: uniqueViewersLast30Days,
      recent_viewers: recentViewers,
      generated_at: new Date().toISOString()
    };

    // Cache the fresh data
    cache.set(cacheKey, {
      data: analytics,
      timestamp: Date.now()
    });

    // Set timeout to clear cache entry after TTL
    setTimeout(() => {
      cache.delete(cacheKey);
    }, CACHE_TTL);

    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error getting profile analytics:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});