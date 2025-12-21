import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

async function upsertConfig(base44, key, value) {
  const existing = await base44.asServiceRole.entities.PlatformConfig.filter({ key });
  if (existing.length > 0) {
    await base44.asServiceRole.entities.PlatformConfig.update(existing[0].id, { value: String(value) });
  } else {
    await base44.asServiceRole.entities.PlatformConfig.create({ key, value: String(value) });
  }
}

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

    const { initialAmount, userLimit, subsequentAmount } = await req.json();

    if (initialAmount === undefined || userLimit === undefined || subsequentAmount === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await Promise.all([
      upsertConfig(base44, 'welcome_bonus_initial_amount', initialAmount),
      upsertConfig(base44, 'welcome_bonus_user_limit', userLimit),
      upsertConfig(base44, 'welcome_bonus_subsequent_amount', subsequentAmount),
    ]);
    
    // Ensure the awarded_count config exists if it doesn't already
    await upsertConfig(base44, 'welcome_bonus_awarded_count', 
        (await base44.asServiceRole.entities.PlatformConfig.filter({key: 'welcome_bonus_awarded_count'}))[0]?.value || '0'
    );


    return new Response(JSON.stringify({ success: true, message: 'Configuration updated successfully.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating welcome bonus config:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});