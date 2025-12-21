import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Check authentication
  if (!(await base44.auth.isAuthenticated())) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { stakeId } = await req.json();

    if (!stakeId) {
      return new Response(JSON.stringify({ error: 'Stake ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await base44.auth.me();

    // Get the stake
    const stakes = await base44.entities.QFLOWStake.filter(
      { id: stakeId, created_by: user.email, status: 'active' }
    );

    if (stakes.length === 0) {
      return new Response(JSON.stringify({ error: 'Stake not found or not active' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const stake = stakes[0];
    const now = new Date();
    const endDate = new Date(stake.end_date);

    // Check if stake has matured
    if (now < endDate) {
      return new Response(JSON.stringify({ error: 'Stake has not matured yet' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate final rewards
    const totalRewards = (stake.amount * stake.apy / 100 / 365) * stake.period_days;
    const totalReturn = stake.amount + totalRewards;

    // Update user's token balance
    const currentBalance = user.token_balance || 0;
    const newBalance = currentBalance + totalReturn;

    await base44.asServiceRole.entities.User.update(user.id, {
      token_balance: newBalance
    });

    // Update stake status
    await base44.entities.QFLOWStake.update(stake.id, {
      status: 'withdrawn',
      current_rewards: totalRewards,
      total_rewards_paid: totalRewards
    });

    return new Response(JSON.stringify({ 
      success: true,
      totalReturn: totalReturn,
      rewards: totalRewards,
      newBalance: newBalance
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Withdraw stake error:', error);
    return new Response(JSON.stringify({ error: 'Failed to withdraw stake' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});