import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

// In-memory cache for admin action counts
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute cache

function getCacheKey() {
  return 'admin_action_counts';
}

function isCacheValid(entry) {
  return entry && Date.now() - entry.timestamp < CACHE_TTL;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check authentication
    const user = await base44.auth.me();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cacheKey = getCacheKey();
    const cachedEntry = cache.get(cacheKey);
    
    // Return cached data if valid
    if (isCacheValid(cachedEntry)) {
      return new Response(JSON.stringify(cachedEntry.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch fresh data using the Base44 SDK with individual error handling for resilience
    const [
      pendingProposals,
      activeFraudFlags,
      pendingModerationAppeals,
      pendingSocialReviews,
      pendingReferralRequests
    ] = await Promise.all([
      base44.asServiceRole.entities.GovernanceProposal.filter({ status: 'active' })
        .catch(e => { 
          console.error("Error fetching GovernanceProposal:", e.message); 
          return []; 
        }),
      base44.asServiceRole.entities.FraudFlag.filter({ status: 'new' })
        .catch(e => { 
          console.error("Error fetching FraudFlag:", e.message); 
          return []; 
        }),
      base44.asServiceRole.entities.ModerationLog.filter({ status: 'appealed' })
        .catch(e => { 
          console.error("Error fetching ModerationLog:", e.message); 
          return []; 
        }),
      base44.asServiceRole.entities.SocialConnectionReview.filter({ status: 'pending' })
        .catch(e => { 
          console.error("Error fetching SocialConnectionReview:", e.message); 
          return []; 
        }),
      base44.asServiceRole.entities.ReferralCodeRequest.filter({ status: 'pending' })
        .catch(e => { 
          console.error("Error fetching ReferralCodeRequest:", e.message); 
          return []; 
        })
    ]);

    const counts = {
      pendingProposals: pendingProposals.length,
      activeFraudFlags: activeFraudFlags.length,
      pendingModerationAppeals: pendingModerationAppeals.length,
      pendingSocialReviews: pendingSocialReviews.length,
      pendingReferralRequests: pendingReferralRequests.length,
      totalPendingActions: pendingProposals.length + activeFraudFlags.length + 
                          pendingModerationAppeals.length + pendingSocialReviews.length + 
                          pendingReferralRequests.length
    };

    // Cache the fresh data
    cache.set(cacheKey, {
      data: counts,
      timestamp: Date.now()
    });

    // Set timeout to clear cache entry after TTL
    setTimeout(() => {
      cache.delete(cacheKey);
    }, CACHE_TTL);

    return new Response(JSON.stringify(counts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error getting admin action counts:', error);
    
    // Return a graceful fallback response instead of throwing an error
    const fallbackCounts = {
      pendingProposals: 0,
      activeFraudFlags: 0,
      pendingModerationAppeals: 0,
      pendingSocialReviews: 0,
      pendingReferralRequests: 0,
      totalPendingActions: 0
    };

    return new Response(JSON.stringify(fallbackCounts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});