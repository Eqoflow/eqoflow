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
    const user = await base44.auth.me();

    // Get all active stakes for the user
    const stakes = await base44.entities.QFLOWStake.filter(
      { created_by: user.email, status: 'active' },
      '-created_date',
      50
    );

    // Calculate current rewards for each stake
    const now = new Date();
    const updatedStakes = stakes.map(stake => {
      const startTime = new Date(stake.start_date).getTime();
      const endTime = new Date(stake.end_date).getTime();
      const currentTime = now.getTime();
      
      // Calculate time elapsed as percentage of total staking period
      const timeElapsed = Math.min(currentTime - startTime, endTime - startTime);
      const totalDuration = endTime - startTime;
      const timePercentage = timeElapsed / totalDuration;
      
      // Calculate current rewards based on time elapsed
      const totalPossibleRewards = (stake.amount * stake.apy / 100 / 365) * stake.period_days;
      const currentRewards = totalPossibleRewards * timePercentage;
      
      return {
        ...stake,
        current_rewards: currentRewards,
        progress_percentage: (timeElapsed / totalDuration) * 100,
        days_remaining: Math.max(0, Math.ceil((endTime - currentTime) / (1000 * 60 * 60 * 24))),
        is_mature: currentTime >= endTime
      };
    });

    return new Response(JSON.stringify({ 
      success: true, 
      stakes: updatedStakes 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get active stakes error:', error);
    return new Response(JSON.stringify({ error: 'Failed to retrieve stakes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});