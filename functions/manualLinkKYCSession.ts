import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check admin auth
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    // Debbie Bancale's details
    const userEmail = 'mrsflowers10@gmail.com';
    const sessionId = '2d5e7cbe-60eb-4c17-a26f-29f50814e3c0';
    
    console.log('Manually linking session for Debbie Bancale...');
    console.log('Email:', userEmail);
    console.log('Session ID:', sessionId);

    // Get user
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];
    console.log('Found user:', targetUser.full_name, targetUser.id);

    // Update with session ID
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      veriff_session_id: sessionId,
      kyc_status: 'pending'
    });

    console.log('✅ Successfully linked session ID to user');

    return Response.json({
      success: true,
      message: 'Session linked successfully',
      user: {
        email: targetUser.email,
        name: targetUser.full_name,
        sessionId: sessionId
      }
    });

  } catch (error) {
    console.error('Error linking session:', error);
    return Response.json({ 
      error: 'Failed to link session',
      details: error.message 
    }, { status: 500 });
  }
});