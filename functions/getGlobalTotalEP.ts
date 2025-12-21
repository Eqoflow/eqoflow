import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Use service role to ensure access to all records
        // Fetching with a large limit to aggregate total
        // In a production scenario with millions of users, this would strictly need pagination or database-level aggregation
        const progressions = await base44.asServiceRole.entities.LifetimeProgression.list(null, 10000);
        
        const totalEP = progressions.reduce((sum, p) => sum + (p.ep_total || 0), 0);

        return Response.json({ totalEP });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});