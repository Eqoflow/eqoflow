import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
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

        const { 
            allocation_pool, 
            amount_to_add, 
            operation_type = 'distribute', // 'distribute' or 'return'
            description = ''
        } = await req.json();

        if (!allocation_pool || !amount_to_add || amount_to_add <= 0) {
            return new Response(JSON.stringify({ error: 'Invalid allocation pool or amount' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate allocation pool
        const validPools = ['community_rewards', 'dao_treasury', 'team_and_advisors', 'ecosystem_fund', 'public_private_sale'];
        if (!validPools.includes(allocation_pool)) {
            return new Response(JSON.stringify({ error: 'Invalid allocation pool' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Find the allocation pool record
        const allocations = await base44.entities.TokenAllocation.filter({ pool_name: allocation_pool });
        if (!allocations || allocations.length === 0) {
            return new Response(JSON.stringify({ error: `No allocation record found for pool: ${allocation_pool}` }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const allocation = allocations[0];
        const currentDistributed = allocation.amount_distributed || 0;
        
        let newDistributedAmount;
        if (operation_type === 'distribute') {
            newDistributedAmount = currentDistributed + amount_to_add;
        } else if (operation_type === 'return') {
            newDistributedAmount = Math.max(0, currentDistributed - amount_to_add);
        } else {
            return new Response(JSON.stringify({ error: 'Invalid operation_type. Use "distribute" or "return"' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate we're not distributing more than allocated
        if (newDistributedAmount > allocation.total_allocated) {
            return new Response(JSON.stringify({ 
                error: `Cannot distribute ${newDistributedAmount} tokens. Only ${allocation.total_allocated} allocated to ${allocation_pool}`,
                current_distributed: currentDistributed,
                total_allocated: allocation.total_allocated,
                remaining: allocation.total_allocated - currentDistributed
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update the allocation record
        await base44.entities.TokenAllocation.update(allocation.id, {
            amount_distributed: newDistributedAmount
        });

        // Log the update in DAO Treasury for transparency
        await base44.entities.DAOTreasury.create({
            transaction_type: operation_type === 'distribute' ? 'withdrawal' : 'deposit',
            source: `${operation_type === 'distribute' ? 'Distribution from' : 'Return to'} ${allocation_pool} allocation`,
            amount_qflow: operation_type === 'distribute' ? -amount_to_add : amount_to_add,
            value_usd: 0, // We don't have USD value for internal accounting
            notes: description || `Manual ${operation_type} operation by admin: ${user.email}`
        });

        const remainingTokens = allocation.total_allocated - newDistributedAmount;

        return new Response(JSON.stringify({
            success: true,
            allocation_pool,
            operation_type,
            amount_affected: amount_to_add,
            previous_distributed: currentDistributed,
            new_distributed: newDistributedAmount,
            remaining_tokens: remainingTokens,
            percentage_distributed: ((newDistributedAmount / allocation.total_allocated) * 100).toFixed(2),
            message: `Successfully updated ${allocation_pool} allocation. ${operation_type === 'distribute' ? 'Distributed' : 'Returned'} ${amount_to_add} tokens.`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error updating token allocation:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});