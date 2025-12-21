import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// In-memory cache
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes

function getCacheKey(email) {
    return `stats_${email}`;
}

function isCacheValid(entry) {
    return entry && Date.now() - entry.timestamp < CACHE_TTL;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = user.email;
        const cacheKey = getCacheKey(email);
        const cachedEntry = cache.get(cacheKey);

        if (isCacheValid(cachedEntry)) {
            return Response.json(cachedEntry.data);
        }

        // 1. Calculate Total EP from EngagementPoint records
        // Fetch points where user is the actor (created_by)
        const earnedByAction = await base44.entities.EngagementPoint.filter({ created_by: email }, null, 10000);
        
        // Fetch points where user is the recipient (e.g. receiving likes)
        // Note: filtering by recipient_email might depend on backend indexing, but we attempt it.
        const earnedByReceipt = await base44.entities.EngagementPoint.filter({ recipient_email: email }, null, 10000);

        // Merge and sum
        const allPoints = [...earnedByAction];
        const actionIds = new Set(earnedByAction.map(p => p.id));
        
        for (const p of earnedByReceipt) {
            if (!actionIds.has(p.id)) {
                allPoints.push(p);
            }
        }

        const totalEP = allPoints.reduce((sum, p) => {
            // Check points_earned or final_points
            const points = p.final_points !== undefined ? p.final_points : (p.points_earned || 0);
            return sum + Number(points);
        }, 0);

        // 2. Count Posts and Shares
        const postsAll = await base44.entities.Post.filter({ created_by: email }, null, 10000);
        const posts = postsAll.filter(p => !p.is_repost).length;
        const shares = postsAll.filter(p => p.is_repost).length;

        // 3. Count Comments and Replies
        const commentsAll = await base44.entities.Comment.filter({ created_by: email }, null, 10000);
        const comments = commentsAll.filter(c => !c.parent_comment_id).length;
        const replies = commentsAll.filter(c => !!c.parent_comment_id).length;

        const result = {
            totalEP,
            posts,
            shares,
            comments,
            replies
        };

        // Update cache
        cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        // Cleanup cache entry later
        setTimeout(() => {
            cache.delete(cacheKey);
        }, CACHE_TTL);

        return Response.json(result);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});