import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current user
    const user = await base44.auth.me();
    
    if (!user) {
      console.error('❌ No authenticated user found');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Creating Veriff session for user:', user.email);

    const apiKey = Deno.env.get('VERIFF_API_KEY');
    
    if (!apiKey) {
      console.error('❌ VERIFF_API_KEY not configured');
      return Response.json({ error: 'Veriff API key not configured' }, { status: 500 });
    }

    // Create Veriff session with vendorData (user email)
    const veriffResponse = await fetch('https://stationapi.veriff.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-CLIENT': apiKey,
      },
      body: JSON.stringify({
        verification: {
          callback: `${Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com'}/api/functions/veriffWebhookHandler`,
          person: {
            firstName: user.full_name?.split(' ')[0] || '',
            lastName: user.full_name?.split(' ').slice(1).join(' ') || '',
          },
          vendorData: user.email, // CRITICAL: Pass user email for webhook matching
          timestamp: new Date().toISOString(),
        }
      }),
    });

    if (!veriffResponse.ok) {
      const errorText = await veriffResponse.text();
      console.error('❌ Veriff API error:', errorText);
      return Response.json({ 
        error: 'Failed to create Veriff session',
        details: errorText 
      }, { status: veriffResponse.status });
    }

    const data = await veriffResponse.json();
    
    const sessionId = data.verification?.id;
    const verificationUrl = data.verification?.url;

    if (!sessionId) {
      console.error('❌ No session ID returned from Veriff');
      return Response.json({ error: 'No session ID received from Veriff' }, { status: 500 });
    }

    console.log('Veriff session created:', sessionId);

    // CRITICAL: Store session ID in database with multiple retry attempts
    let storedSuccessfully = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!storedSuccessfully && retryCount < maxRetries) {
      try {
        await base44.asServiceRole.entities.User.update(user.id, {
          veriff_session_id: sessionId,
          kyc_status: 'pending',
          kyc_last_attempt_date: new Date().toISOString()
        });
        
        storedSuccessfully = true;
        console.log(`✅ Stored session ID in database for user: ${user.email} (attempt ${retryCount + 1})`);
        
      } catch (storeError) {
        retryCount++;
        console.error(`❌ Failed to store session ID (attempt ${retryCount}/${maxRetries}):`, storeError.message);
        
        if (retryCount < maxRetries) {
          // Wait briefly before retry
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          // CRITICAL FAILURE - Log extensively
          console.error('🚨 CRITICAL: Failed to store session ID after all retries');
          console.error('User:', user.email);
          console.error('Session ID:', sessionId);
          console.error('Error:', storeError);
          
          // Still return the URL so user can proceed, but log the failure
          return Response.json({
            sessionId: sessionId,
            url: verificationUrl,
            vendorData: data.verification?.vendorData,
            warning: 'Session created but database storage failed - admin may need to manually match'
          });
        }
      }
    }

    // Verify the session ID was actually saved
    try {
      const verifyUser = await base44.asServiceRole.entities.User.filter({ email: user.email });
      if (verifyUser.length > 0 && verifyUser[0].veriff_session_id === sessionId) {
        console.log('✅ Verified: Session ID successfully stored in database');
      } else {
        console.warn('⚠️ Warning: Session ID verification failed - may not have saved correctly');
      }
    } catch (verifyError) {
      console.warn('⚠️ Could not verify session ID storage:', verifyError.message);
    }

    return Response.json({
      sessionId: sessionId,
      url: verificationUrl,
      vendorData: data.verification?.vendorData,
    });

  } catch (error) {
    console.error('❌ Error initiating Veriff session:', error);
    return Response.json({ 
      error: 'Failed to initiate verification',
      details: error.message 
    }, { status: 500 });
  }
});