import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get the authenticated user making this request
    let user;
    try {
      user = await base44.auth.me();
    } catch (authError) {
      console.error('Auth error in sendMarketplaceNotification:', authError);
      return Response.json({ error: 'Unauthorized', details: authError.message }, { status: 401 });
    }

    if (!user) {
      return Response.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { 
      recipientEmail, 
      type, 
      title, 
      message, 
      relatedContentId, 
      relatedContentType,
      actionUrl,
      metadata 
    } = await req.json();

    console.log('sendMarketplaceNotification called:', {
      sender: user.email,
      recipient: recipientEmail,
      type,
      title
    });

    if (!recipientEmail || !type || !message) {
      return Response.json({ 
        error: 'Missing required fields',
        received: { recipientEmail: !!recipientEmail, type: !!type, message: !!message }
      }, { status: 400 });
    }

    // Don't send notification if recipient is the same as sender
    if (recipientEmail === user.email) {
      console.log('Skipping notification - same user');
      return Response.json({ 
        success: true, 
        skipped: true,
        reason: 'Same user' 
      });
    }

    // Use username if available, otherwise full_name, fallback to email
    const displayName = user.username || user.full_name || user.email.split('@')[0];

    // Create the notification
    try {
      const notificationData = {
        recipient_email: recipientEmail,
        type: type,
        title: title || 'Skills Marketplace Notification',
        message: message,
        actor_email: user.email,
        actor_name: displayName,
        actor_avatar: user.avatar_url,
        related_content_id: relatedContentId || null,
        related_content_type: relatedContentType || 'skill',
        is_read: false,
        action_url: actionUrl || null,
        metadata: metadata || {}
      };

      console.log('Creating notification:', notificationData);

      const notification = await base44.entities.Notification.create(notificationData);
      
      console.log('Notification created successfully:', notification.id);

      return Response.json({ 
        success: true,
        message: 'Notification sent successfully',
        notificationId: notification.id
      });
    } catch (createError) {
      console.error('Error creating notification:', createError);
      return Response.json({ 
        error: 'Failed to create notification',
        details: createError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in sendMarketplaceNotification:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});