import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
  console.log('=== Veriff Webhook Received ===');
  
  try {
    const headers = Object.fromEntries(req.headers.entries());
    const rawBody = await req.text();
    const signature = req.headers.get('x-hmac-signature');
    const privateKey = Deno.env.get('VERIFF_PRIVATE_KEY');

    if (!signature || !privateKey) {
      return Response.json({ error: 'Missing signature or config' }, { status: 400 });
    }

    // Verify signature
    const hmac = createHmac('sha256', privateKey);
    hmac.update(rawBody);
    const calculatedSignature = hmac.digest('hex');

    if (signature !== calculatedSignature) {
      return Response.json({ error: 'Invalid signature' }, { status: 403 });
    }

    console.log('✓ Signature verified');

    // Parse payload
    const payload = JSON.parse(rawBody);
    
    // Extract verification data
    let verification;
    if (payload.data?.verification) {
      verification = payload.data.verification;
    } else if (payload.verification) {
      verification = payload.verification;
    } else if (payload.id && payload.attemptId) {
      return Response.json({ success: true }, { status: 200 });
    } else {
      return Response.json({ error: 'Missing verification data' }, { status: 400 });
    }

    const { 
      id: sessionId, 
      status, 
      code, 
      person, 
      decision,
      decisionTime,
      reason,
      vendorData
    } = verification;

    console.log('Session ID:', sessionId);
    console.log('Status:', status);
    console.log('VendorData:', vendorData);
    
    const documentName = person?.firstName && person?.lastName 
      ? `${person.firstName} ${person.lastName}`.toUpperCase()
      : 'Unknown';
    console.log('Document name:', documentName);

    const base44 = createClientFromRequest(req);

    let users = [];

    // Strategy 1: Find by session ID (most reliable)
    if (sessionId) {
      console.log('\n=== Strategy 1: Searching by session ID ===');
      try {
        users = await base44.asServiceRole.entities.User.filter({ 
          veriff_session_id: sessionId 
        });
        
        if (users.length > 0) {
          console.log('✅ Found user by session ID:', users[0].email);
        } else {
          console.log('❌ No user found with session ID:', sessionId);
        }
      } catch (error) {
        console.error('Error searching by session ID:', error.message);
      }
    }

    // Strategy 2: Find by email in vendorData (second most reliable)
    if (users.length === 0 && vendorData?.trim()) {
      console.log('\n=== Strategy 2: Searching by vendorData email ===');
      const vendorEmail = vendorData.trim();
      console.log('Trying vendorData email:', vendorEmail);
      
      try {
        users = await base44.asServiceRole.entities.User.filter({ 
          email: vendorEmail
        });
        
        if (users.length > 0) {
          console.log('✅ Found user by vendorData email:', users[0].email);
        } else {
          console.log('❌ No user found with email:', vendorEmail);
        }
      } catch (error) {
        console.error('Error searching by vendorData:', error.message);
      }
    }

    // Strategy 3: Find by matching name (check ALL users)
    if (users.length === 0 && person?.firstName && person?.lastName) {
      console.log('\n=== Strategy 3: Name matching across ALL users ===');
      const firstName = person.firstName.toLowerCase().trim();
      const lastName = person.lastName.toLowerCase().trim();
      
      console.log('Searching for: firstName =', firstName, ', lastName =', lastName);
      
      let candidateUsers = [];
      
      // First try pending users
      try {
        candidateUsers = await base44.asServiceRole.entities.User.filter({
          kyc_status: 'pending'
        });
        console.log(`Found ${candidateUsers.length} pending KYC users`);
      } catch (error) {
        console.error('Error fetching pending users:', error.message);
      }
      
      // If no pending users or very few, check recent users
      if (candidateUsers.length < 5) {
        console.log('Expanding search to all recent users...');
        try {
          const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 100);
          console.log(`Found ${allUsers.length} total users in system`);
          
          // Combine with pending users (remove duplicates)
          const existingEmails = new Set(candidateUsers.map(u => u.email));
          const additionalUsers = allUsers.filter(u => !existingEmails.has(u.email));
          candidateUsers = [...candidateUsers, ...additionalUsers];
          
          console.log(`Combined total: ${candidateUsers.length} users to check`);
        } catch (error) {
          console.error('Error fetching all users:', error.message);
        }
      }
      
      if (candidateUsers.length === 0) {
        console.error('⚠️  No users found in database to match against!');
      } else {
        console.log(`\nChecking ${candidateUsers.length} users for name match:`);
        candidateUsers.slice(0, 20).forEach((u, idx) => {
          console.log(`  [${idx + 1}] ${u.email} | Name: "${u.full_name || 'N/A'}" | KYC: ${u.kyc_status || 'not_initiated'}`);
        });
        if (candidateUsers.length > 20) {
          console.log(`  ... and ${candidateUsers.length - 20} more users`);
        }
        
        // Try to match
        for (const u of candidateUsers) {
          const userFullName = (u.full_name || '').toLowerCase().trim();
          const userEmail = u.email.toLowerCase();
          const emailUsername = userEmail.split('@')[0].toLowerCase();
          
          // Extract all first name parts
          const firstNameParts = firstName.split(' ').filter(part => part.length > 0);
          
          // Check if ANY first name part appears in full name or email
          const hasFirstNameMatch = firstNameParts.some(part => 
            userFullName.includes(part) || emailUsername.includes(part)
          );
          
          // Check if last name appears in full name or email
          const hasLastNameMatch = userFullName.includes(lastName) || emailUsername.includes(lastName);
          
          // Match if we find EITHER first name OR last name
          if (hasFirstNameMatch || hasLastNameMatch) {
            console.log(`\n✅ MATCH FOUND: ${u.email}`);
            console.log(`   Full name: "${u.full_name}"`);
            console.log(`   First name match: ${hasFirstNameMatch}, Last name match: ${hasLastNameMatch}`);
            users = [u];
            break;
          }
        }
        
        if (users.length === 0) {
          console.log('\n❌ No name matches found among all users');
        }
      }
    }

    if (users.length === 0) {
      console.error('\n❌ NO USER FOUND AFTER ALL STRATEGIES');
      console.error('Tried: session ID, vendorData, name matching');
      console.error('Session ID:', sessionId || '(none)');
      console.error('VendorData:', vendorData || '(empty)');
      console.error('Document name:', documentName);
      console.error('\n⚠️  ADMIN ACTION REQUIRED: Manually match this verification to a user in the database.');
      console.error('    Check if user exists with session ID:', sessionId);
      
      return Response.json({ 
        error: 'User not found',
        sessionId,
        documentName,
        vendorData: vendorData || null,
        hint: 'No user could be matched by session ID, email, or name.',
        adminNote: 'Check Veriff dashboard and manually update user KYC status. Verify that vendorData was passed when creating the session.'
      }, { status: 404 });
    }

    const user = users[0];
    console.log(`\n=== Processing verification for: ${user.email} ===`);

    // Update user's KYC status
    let kycStatus = 'not_initiated';
    let kycDeclineReason = null;

    if (status === 'approved' || decision === 'approved') {
      kycStatus = 'verified';
    } else if (status === 'declined' || decision === 'declined') {
      kycStatus = 'declined';
      kycDeclineReason = reason || 'Verification declined by Veriff';
    } else if (status === 'resubmission_requested' || decision === 'resubmission_requested') {
      kycStatus = 'resubmission_requested';
      kycDeclineReason = reason || 'Resubmission requested';
    } else if (status === 'expired') {
      kycStatus = 'expired';
    } else if (status === 'review' || decision === 'review') {
      kycStatus = 'review';
    }

    // Prepare update data
    const updateData = {
      kyc_status: kycStatus,
      kyc_last_attempt_date: new Date().toISOString(),
    };

    if (kycStatus === 'verified') {
      updateData.kyc_verified_date = decisionTime || new Date().toISOString();
      
      // Store selective KYC details
      if (person) {
        updateData.kyc_person_details = {
          firstName: person.firstName,
          lastName: person.lastName,
          dateOfBirth: person.dateOfBirth,
          nationality: person.nationality,
          idNumber: person.idNumber,
        };
      }
    }

    if (kycDeclineReason) {
      updateData.kyc_decline_reason = kycDeclineReason;
    }

    // Update user
    await base44.asServiceRole.entities.User.update(user.id, updateData);

    console.log(`✅ User KYC status updated to: ${kycStatus}`);

    return Response.json({ 
      success: true,
      userEmail: user.email,
      kycStatus,
      message: `KYC status updated to ${kycStatus}`
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return Response.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
});