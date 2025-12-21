import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { recipientEmail, title, body, data, actionUrl } = await req.json();

    if (!recipientEmail || !title) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Configure VAPID
    webpush.setVapidDetails(
      'mailto:support@eqoflow.app',
      Deno.env.get('VAPID_PUBLIC_KEY'),
      Deno.env.get('VAPID_PRIVATE_KEY')
    );

    // Get user's push subscriptions
    const subscriptions = await base44.asServiceRole.entities.PushSubscription.filter({
      user_email: recipientEmail,
      is_active: true
    });

    if (subscriptions.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'No active subscriptions found for user' 
      });
    }

    const payload = JSON.stringify({
      title,
      body: body || '',
      data: data || {},
      url: actionUrl || '/'
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: sub.keys
        }, payload)
      )
    );

    // Deactivate failed subscriptions (e.g., expired)
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        await base44.asServiceRole.entities.PushSubscription.update(subscriptions[i].id, {
          is_active: false
        });
      }
    }

    const successCount = results.filter(r => r.status === 'fulfilled').length;

    return Response.json({ 
      success: true, 
      sent: successCount,
      total: subscriptions.length 
    });

  } catch (error) {
    console.error('Error sending push notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});