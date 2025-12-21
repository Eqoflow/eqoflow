
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const adminUser = await base44.auth.me();

    console.log('Admin sync request from:', adminUser?.email);

    // Admin only
    if (!adminUser || adminUser.role !== 'admin') {
      console.error('Unauthorized access attempt');
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userEmail } = await req.json();

    if (!userEmail) {
      console.error('No user email provided');
      return Response.json({ error: 'User email required' }, { status: 400 });
    }

    console.log(`Admin ${adminUser.email} manually syncing KYC for: ${userEmail}`);

    // Find user
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });

    if (users.length === 0) {
      console.error('User not found:', userEmail);
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    const sessionId = user.veriff_session_id;

    console.log('User found:', { email: user.email, sessionId, currentStatus: user.kyc_status });

    if (!sessionId) {
      console.error('No Veriff session ID for user:', userEmail);
      return Response.json({ 
        error: 'No Veriff session found for this user',
        message: 'User has not started KYC verification yet'
      }, { status: 400 });
    }

    console.log(`Checking Veriff session: ${sessionId}`);

    // Try PRIVATE_KEY first, then fall back to API_KEY
    const privateKey = Deno.env.get('VERIFF_PRIVATE_KEY');
    const apiKey = Deno.env.get('VERIFF_API_KEY');
    
    const authKey = privateKey || apiKey;
    
    if (!authKey) {
      console.error('Neither VERIFF_PRIVATE_KEY nor VERIFF_API_KEY configured');
      return Response.json({ 
        error: 'Veriff credentials not configured',
        message: 'Please set VERIFF_PRIVATE_KEY or VERIFF_API_KEY in environment variables'
      }, { status: 500 });
    }

    console.log('Using auth key:', privateKey ? 'VERIFF_PRIVATE_KEY' : 'VERIFF_API_KEY');
    console.log('Calling Veriff API...');

    // Call Veriff API to get session status
    const veriffResponse = await fetch(
      `https://stationapi.veriff.com/v1/sessions/${sessionId}/decision`,
      {
        headers: {
          'X-AUTH-CLIENT': authKey,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Veriff API response status:', veriffResponse.status);

    if (!veriffResponse.ok) {
      const errorText = await veriffResponse.text();
      console.error('Veriff API error:', veriffResponse.status, errorText);
      
      // If still 401, provide helpful message
      if (veriffResponse.status === 401) {
        return Response.json({ 
          error: 'Veriff authentication failed',
          message: 'Please verify your VERIFF_PRIVATE_KEY is correct in Deno Deploy environment variables',
          status: veriffResponse.status,
          details: errorText
        }, { status: 500 });
      }
      
      return Response.json({ 
        error: 'Could not fetch from Veriff API',
        status: veriffResponse.status,
        details: errorText
      }, { status: 500 });
    }

    const veriffData = await veriffResponse.json();
    console.log('Veriff response:', JSON.stringify(veriffData, null, 2));

    const { verification } = veriffData;

    if (!verification) {
      console.error('No verification object in Veriff response');
      return Response.json({ 
        error: 'No verification data from Veriff',
        sessionId
      }, { status: 404 });
    }

    const { status, code, decision, person } = verification;

    console.log('Verification details:', { status, code, decision });

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

    console.log(`Veriff shows status: ${kycStatus} (decision: ${decision}, status: ${status}, code: ${code})`);

    // Prepare update
    const updateData = {
      kyc_status: kycStatus,
      kyc_last_attempt_date: new Date().toISOString(),
    };

    if (kycStatus === 'verified' && person) {
      updateData.kyc_verified_date = verification.decisionTime || new Date().toISOString();
      updateData.kyc_person_details = {
        firstName: person.firstName?.value || person.firstName,
        lastName: person.lastName?.value || person.lastName,
        dateOfBirth: person.dateOfBirth?.value || person.dateOfBirth,
        nationality: person.nationality?.value || person.nationality,
        idNumber: person.idNumber?.value || person.idNumber,
      };
    }

    if (kycDeclineReason) {
      updateData.kyc_decline_reason = kycDeclineReason;
    }

    console.log('Updating user with:', updateData);

    await base44.asServiceRole.entities.User.update(user.id, updateData);

    console.log(`✓ Successfully synced ${userEmail} to status: ${kycStatus}`);

    return Response.json({
      success: true,
      userEmail,
      oldStatus: user.kyc_status,
      newStatus: kycStatus,
      veriffDecision: decision,
      veriffStatus: status,
      veriffCode: code,
      message: `KYC status updated from ${user.kyc_status} to ${kycStatus}`
    });

  } catch (error) {
    console.error('Error syncing KYC:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ 
      error: 'Failed to sync KYC status',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});
