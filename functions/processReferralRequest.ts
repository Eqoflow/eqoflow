import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    const token = authHeader.split(' ')[1];
    base44.auth.setToken(token);
    
    const currentUser = await base44.auth.me();
    if (!currentUser || currentUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const { requestId, decision, rejectionReason } = await req.json();

    if (!requestId || !decision) {
      return new Response(JSON.stringify({ error: 'Request ID and decision are required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Get the request
    const requests = await base44.entities.ReferralCodeRequest.filter({ id: requestId });
    if (!requests || requests.length === 0) {
      return new Response(JSON.stringify({ error: 'Request not found' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const request = requests[0];

    // Get the user who made the request for notifications
    const requestingUsers = await base44.entities.User.filter({ email: request.created_by });
    const requestingUser = requestingUsers && requestingUsers.length > 0 ? requestingUsers[0] : null;

    if (decision === 'approved') {
      // Check if the requested code is already taken by another user
      const existingUsers = await base44.entities.User.filter({ custom_referral_code: request.requested_code });
      if (existingUsers && existingUsers.length > 0) {
        // Update request as rejected due to code being taken
        await base44.entities.ReferralCodeRequest.update(requestId, {
          status: 'rejected',
          rejection_reason: 'This referral code is already taken by another user.'
        });

        // Send rejection notification
        if (requestingUser) {
          try {
            await base44.entities.Notification.create({
              recipient_email: request.created_by,
              type: 'system',
              title: 'Custom Referral Code Request Rejected',
              message: `Your request for the custom referral code "${request.requested_code}" has been rejected because this code is already taken by another user.`,
              actor_email: 'system@quantumflow.app',
              actor_name: 'QuantumFlow System',
              action_url: createPageUrl('Profile?section=referral'),
              metadata: {
                requested_code: request.requested_code,
                rejection_reason: 'This referral code is already taken by another user.'
              }
            });
          } catch (notificationError) {
            console.warn('Could not send rejection notification:', notificationError);
          }
        }
        
        return new Response(JSON.stringify({ error: 'Referral code already taken' }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      // Approve the request - update the user's custom referral code
      if (requestingUser) {
        await base44.entities.User.update(requestingUser.id, {
          custom_referral_code: request.requested_code
        });
      }

      // Update the request status
      await base44.entities.ReferralCodeRequest.update(requestId, {
        status: 'approved'
      });

      // Send approval notification
      if (requestingUser) {
        try {
          await base44.entities.Notification.create({
            recipient_email: request.created_by,
            type: 'system',
            title: 'Custom Referral Code Approved! 🎉',
            message: `Great news! Your custom referral code "${request.requested_code}" has been approved and is now active. You can start sharing your personalized referral link!`,
            actor_email: 'system@quantumflow.app',
            actor_name: 'QuantumFlow System',
            action_url: '/Profile?section=referral',
            metadata: {
              approved_code: request.requested_code,
              new_referral_link: `https://quantum-flow.app/signup?ref=${request.requested_code}`
            }
          });
        } catch (notificationError) {
          console.warn('Could not send approval notification:', notificationError);
        }
      }

    } else if (decision === 'rejected') {
      if (!rejectionReason) {
        return new Response(JSON.stringify({ error: 'Rejection reason is required' }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      // Update the request as rejected
      await base44.entities.ReferralCodeRequest.update(requestId, {
        status: 'rejected',
        rejection_reason: rejectionReason
      });

      // Send rejection notification
      if (requestingUser) {
        try {
          await base44.entities.Notification.create({
            recipient_email: request.created_by,
            type: 'system',
            title: 'Custom Referral Code Request Rejected',
            message: `Your request for the custom referral code "${request.requested_code}" has been rejected. Reason: ${rejectionReason}`,
            actor_email: 'system@quantumflow.app',
            actor_name: 'QuantumFlow System',
            action_url: '/Profile?section=referral',
            metadata: {
              requested_code: request.requested_code,
              rejection_reason: rejectionReason
            }
          });
        } catch (notificationError) {
          console.warn('Could not send rejection notification:', notificationError);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Request ${decision} successfully`,
      decision: decision,
      notificationSent: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Process referral request error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});