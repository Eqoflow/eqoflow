import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const configKeys = [
      'welcome_bonus_initial_amount',
      'welcome_bonus_user_limit',
      'welcome_bonus_subsequent_amount',
      'welcome_bonus_awarded_count',
    ];

    const configs = await base44.asServiceRole.entities.PlatformConfig.filter({
      key: { $in: configKeys },
    });

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {});
    
    const response = {
      initialAmount: parseInt(configMap.welcome_bonus_initial_amount, 10) || 1000,
      userLimit: parseInt(configMap.welcome_bonus_user_limit, 10) || 100,
      subsequentAmount: parseInt(configMap.welcome_bonus_subsequent_amount, 10) || 500,
      awardedCount: parseInt(configMap.welcome_bonus_awarded_count, 10) || 0,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching welcome bonus config:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});