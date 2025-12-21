import { createClient } from 'npm:@base44/sdk@0.1.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClient({
            appId: Deno.env.get('BASE44_APP_ID'),
        });

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401 });
        }
        
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response('Admin access required', { status: 403 });
        }

        // Get all token allocation records
        const allAllocations = await base44.entities.TokenAllocation.list();
        console.log('Found allocations:', allAllocations.length);

        // Group by pool_name and keep only the most recent one for each
        const uniquePools = new Map();
        
        allAllocations.forEach(allocation => {
            const poolName = allocation.pool_name;
            if (!uniquePools.has(poolName) || 
                new Date(allocation.created_date) > new Date(uniquePools.get(poolName).created_date)) {
                uniquePools.set(poolName, allocation);
            }
        });

        // Delete all records first
        for (const allocation of allAllocations) {
            await base44.entities.TokenAllocation.delete(allocation.id);
        }

        // Re-create the correct records
        const correctAllocations = [
            {
                pool_name: "community_rewards",
                description: "Rewards for user engagement, content creation, and platform participation. Source for EP to Token swaps.",
                total_allocated: 400000000,
                amount_distributed: 0
            },
            {
                pool_name: "dao_treasury", 
                description: "Funds for community-voted distributions, governance-approved proposals, and platform development.",
                total_allocated: 250000000,
                amount_distributed: 0
            },
            {
                pool_name: "team_and_advisors",
                description: "Tokens allocated to the core team and advisors, subject to a vesting schedule.",
                total_allocated: 200000000,
                amount_distributed: 0
            },
            {
                pool_name: "ecosystem_fund",
                description: "Funds to support third-party developers, strategic partnerships, and grants to grow the ecosystem.",
                total_allocated: 100000000,
                amount_distributed: 0
            },
            {
                pool_name: "public_private_sale",
                description: "Tokens allocated for initial fundraising rounds to seed the project's development and liquidity.",
                total_allocated: 50000000,
                amount_distributed: 0
            }
        ];

        for (const allocation of correctAllocations) {
            await base44.entities.TokenAllocation.create(allocation);
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Token allocations cleaned up successfully',
            removed: allAllocations.length,
            created: correctAllocations.length
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Cleanup error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});