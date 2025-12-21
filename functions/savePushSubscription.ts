import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return Response.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    // Check if subscription already exists for this user
    const existing = await base44.entities.PushSubscription.filter({ 
      user_email: user.email,
      endpoint: subscription.endpoint 
    });

    if (existing.length > 0) {
      // Update existing subscription
      await base44.entities.PushSubscription.update(existing[0].id, {
        keys: subscription.keys,
        is_active: true
      });
      return Response.json({ success: true, message: 'Subscription updated' });
    }

    // Create new subscription
    await base44.entities.PushSubscription.create({
      user_email: user.email,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      is_active: true
    });

    return Response.json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});