import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Try to get authenticated user first
    let requestingUser;
    try {
      requestingUser = await base44.auth.me();
    } catch (authError) {
      console.warn('Could not authenticate user:', authError.message);
      // Continue anyway - we'll validate via session ID
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return Response.json({ error: 'Session ID required' }, { status: 400 });
    }

    console.log(`Manually checking Veriff status for session: ${sessionId}`);

    // Find user by session ID using service role
    const users = await base44.asServiceRole.entities.User.filter({ 
      veriff_session_id: sessionId 
    });

    if (users.length === 0) {
      console.error('No user found with session ID:', sessionId);
      return Response.json({ 
        error: 'User not found',
        sessionId 
      }, { status: 404 });
    }

    const user = users[0];
    console.log('Found user:', user.email);

    // If we have a requesting user, verify they match
    if (requestingUser && requestingUser.email !== user.email) {
      console.error('Session ID does not belong to requesting user');
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const apiKey = Deno.env.get('VERIFF_API_KEY');
    
    if (!apiKey) {
      console.error('VERIFF_API_KEY not configured');
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Call Veriff API to get session status
    const veriffResponse = await fetch(
      `https://stationapi.veriff.com/v1/sessions/${sessionId}/decision`,
      {
        headers: {
          'X-AUTH-CLIENT': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!veriffResponse.ok) {
      const errorText = await veriffResponse.text();
      console.error('Veriff API error:', errorText);
      return Response.json({ 
        error: 'Could not fetch verification status from Veriff',
        details: errorText
      }, { status: veriffResponse.status });
    }

    const veriffData = await veriffResponse.json();
    console.log('Veriff API response:', JSON.stringify(veriffData, null, 2));

    const { verification } = veriffData;

    if (!verification) {
      return Response.json({ 
        error: 'No verification data available yet',
        message: 'Verification may still be processing'
      }, { status: 404 });
    }

    const { status, code, decision } = verification;

    // Determine KYC status
    let kycStatus;
    let kycDeclineReason = null;

    if (decision === 'approved' || status === 'approved' || code === 9001) {
      kycStatus = 'verified';
    } else if (decision === 'declined' || status === 'declined' || code === 9102) {
      kycStatus = 'declined';
      kycDeclineReason = verification.reason || 'Verification declined';
    } else if (decision === 'resubmission_requested' || status === 'resubmission_requested' || code === 9103) {
      kycStatus = 'resubmission_requested';
      kycDeclineReason = verification.reason || 'Please resubmit documents';
    } else if (status === 'expired') {
      kycStatus = 'expired';
      kycDeclineReason = 'Session expired';
    } else if (status === 'review') {
      kycStatus = 'review';
    } else {
      kycStatus = 'pending';
    }

    console.log(`Veriff status for ${user.email}: ${kycStatus}`);

    // Update user record with the status
    const updateData = {
      kyc_status: kycStatus,
      kyc_last_attempt_date: new Date().toISOString(),
    };

    if (kycStatus === 'verified' && verification.person) {
      updateData.kyc_verified_date = verification.decisionTime || new Date().toISOString();
      updateData.kyc_person_details = {
        firstName: verification.person.firstName?.value || verification.person.firstName,
        lastName: verification.person.lastName?.value || verification.person.lastName,
        dateOfBirth: verification.person.dateOfBirth?.value || verification.person.dateOfBirth,
        nationality: verification.person.nationality?.value || verification.person.nationality,
        idNumber: verification.person.idNumber?.value || verification.person.idNumber,
      };
    }

    if (kycDeclineReason) {
      updateData.kyc_decline_reason = kycDeclineReason;
    }

    console.log('Updating user with:', updateData);

    await base44.asServiceRole.entities.User.update(user.id, updateData);

    console.log(`Successfully updated ${user.email} to status: ${kycStatus}`);

    return Response.json({
      success: true,
      kyc_status: kycStatus,
      message: kycStatus === 'verified' ? 'Verification complete!' : 'Status updated'
    });

  } catch (error) {
    console.error('Error checking Veriff status:', error);
    return Response.json({ 
      error: 'Failed to check verification status',
      message: error.message 
    }, { status: 500 });
  }
});