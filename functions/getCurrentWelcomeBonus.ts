import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // This function is public, so no auth check is needed.
    // It only exposes the current bonus amount, which is safe for public access.

    const configKeys = [
      'welcome_bonus_initial_amount',
      'welcome_bonus_user_limit', 
      'welcome_bonus_subsequent_amount',
      'welcome_bonus_awarded_count'
    ];

    const configs = await base44.asServiceRole.entities.PlatformConfig.filter({
      key: { $in: configKeys }
    });

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {});

    const initialAmount = parseInt(configMap.welcome_bonus_initial_amount, 10) || 1000;
    const userLimit = parseInt(configMap.welcome_bonus_user_limit, 10) || 100;
    const subsequentAmount = parseInt(configMap.welcome_bonus_subsequent_amount, 10) || 500;
    const awardedCount = parseInt(configMap.welcome_bonus_awarded_count, 10) || 0;

    // Determine the bonus amount for the NEXT user joining
    const bonusAmount = awardedCount < userLimit ? initialAmount : subsequentAmount;

    return new Response(JSON.stringify({ bonusAmount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching current welcome bonus:', error);
    // Return a default amount on error to avoid breaking the UI for the user.
    return new Response(JSON.stringify({ bonusAmount: 1000 }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});