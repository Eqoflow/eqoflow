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
    const { amount, period_days } = await req.json();

    // Validate input
    if (!amount || amount <= 0 || !period_days) {
      return new Response(JSON.stringify({ error: 'Invalid staking parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get current user
    const user = await base44.auth.me();
    const availableBalance = user.token_balance || 0;

    // Check if user has enough tokens
    if (amount > availableBalance) {
      return new Response(JSON.stringify({ error: 'Insufficient QFLOW balance' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Define APY rates based on staking period
    const apyRates = {
      30: 5.0,
      60: 8.5,
      90: 12.0,
      365: 20.0
    };

    const apy = apyRates[period_days];
    if (!apy) {
      return new Response(JSON.stringify({ error: 'Invalid staking period' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (period_days * 24 * 60 * 60 * 1000));

    // Create the stake record
    const stake = await base44.entities.QFLOWStake.create({
      amount: amount,
      period_days: period_days,
      apy: apy,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      current_rewards: 0,
      status: 'active',
      last_reward_calculation: startDate.toISOString(),
      total_rewards_paid: 0,
      created_by: user.email
    });

    // Update user's token balance (move tokens to staking)
    const newBalance = availableBalance - amount;
    await base44.asServiceRole.entities.User.update(user.id, {
      token_balance: newBalance
    });

    return new Response(JSON.stringify({ 
      success: true, 
      stake: stake,
      newBalance: newBalance 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create stake error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create stake' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});