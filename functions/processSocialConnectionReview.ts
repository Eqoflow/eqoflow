
import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'),
  serviceRoleKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY'),
});

Deno.serve(async (req) => {
  try {
    // 1. Get the token from the request to identify the admin making the request.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    // 2. Set the client's context to the user making the request.
    base44.auth.setToken(token);

    // 3. Directly get the authenticated user's profile, which includes their role.
    const adminUser = await base44.auth.me();

    // 4. Perform the simple, direct check for admin role.
    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Access denied. Admin privileges required.' }), { status: 403 });
    }

    const { reviewId, decision, adminNotes } = await req.json();

    if (!reviewId || !decision) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400 });
    }

    const reviews = await base44.entities.SocialConnectionReview.filter({ id: reviewId });
    const review = reviews[0];

    if (!review) {
      return new Response(JSON.stringify({ error: 'Review not found' }), { status: 404 });
    }

    const users = await base44.entities.User.filter({ email: review.user_email });
    const user = users[0];

    if (!user) {
      return new Response(JSON.stringify({ error: 'User to be reviewed not found' }), { status: 404 });
    }

    if (decision === 'approved') {
      const newConnection = {
        platform: review.platform,
        username: review.submitted_data.username,
        display_name: review.submitted_data.display_name,
        follower_count: review.submitted_data.follower_count,
        verified: false,
        profile_url: review.submitted_data.profile_url,
        verified_at: new Date().toISOString()
      };

      const currentIdentity = user.cross_platform_identity || { web2_verifications: [], web3_connections: [] };
      const updatedConnections = [...currentIdentity.web2_verifications.filter(c => c.platform !== review.platform), newConnection];
      const updatedIdentity = { ...currentIdentity, web2_verifications: updatedConnections };

      await base44.entities.User.update(user.id, {
        cross_platform_identity: updatedIdentity
      });

      // Optimized: Automatically update PublicUserDirectory after manual approval
      try {
        // Removed fetching UserProfileData to reduce calls and potential timeouts
        // All necessary profile data for PublicUserDirectory is assumed to be available on the 'user' object.

        // Calculate total followers from updated identity
        const totalFollowers = (updatedIdentity.web2_verifications?.reduce((sum, conn) =>
          sum + (conn.follower_count || 0), 0) || 0) +
          (updatedIdentity.web3_connections?.reduce((sum, conn) =>
            sum + (conn.follower_count || 0), 0) || 0);

        // Prepare directory entry using data directly from the 'user' object
        const directoryEntry = {
          user_email: user.email,
          full_name: user.full_name || 'Anonymous User',
          username: user.username || null,
          avatar_url: user.avatar_url || null,
          banner_url: user.banner_url || null,
          bio: user.bio || null,
          skills: user.skills || [], // Use skills directly from user, default to empty array
          interests: user.interests || [], // Use interests directly from user, default to empty array
          reputation_score: user.reputation_score || 100,
          is_public: user.privacy_settings?.profile_visibility !== 'private',
          total_follower_count: totalFollowers,
          join_date: user.created_date,
          cross_platform_identity: updatedIdentity, // Use the newly updated identity
          professional_credentials: user.professional_credentials || { is_verified: false, credentials: [] }
        };

        // Update or create public directory entry
        const existingEntries = await base44.entities.PublicUserDirectory.filter({
          user_email: user.email
        });

        if (existingEntries?.length > 0) {
          await base44.entities.PublicUserDirectory.update(existingEntries[0].id, directoryEntry);
          console.log('Auto-updated PublicUserDirectory after manual social connection approval.');
        } else {
          await base44.entities.PublicUserDirectory.create(directoryEntry);
          console.log('Auto-created PublicUserDirectory entry after manual social connection approval.');
        }
      } catch (publicDirError) {
        console.warn('Could not auto-update PublicUserDirectory after approval:', publicDirError.message);
        // Don't fail the entire flow if this fails
      }

      // The rest of the updates for review status and notification
      const updatePromises = [
        base44.entities.SocialConnectionReview.update(reviewId, {
          status: 'approved',
          admin_notes: adminNotes || '',
          reviewed_by: adminUser.email,
          reviewed_at: new Date().toISOString()
        }),
        base44.entities.Notification.create({
          recipient_email: review.user_email,
          type: 'system',
          title: `Connection Approved`,
          message: `Your ${review.platform_label} account connection has been approved and is now visible on your profile.`,
          actor_email: 'system@quantumflow.app',
          actor_name: 'QuantumFlow System',
          action_url: '/Profile?section=identity'
        })
      ];

      await Promise.all(updatePromises);

    } else if (decision === 'rejected') {
      await Promise.all([
        base44.entities.SocialConnectionReview.update(reviewId, {
          status: 'rejected',
          admin_notes: adminNotes || '',
          reviewed_by: adminUser.email,
          reviewed_at: new Date().toISOString()
        }),
        base44.entities.Notification.create({
          recipient_email: review.user_email,
          type: 'system',
          title: 'Connection Rejected',
          message: `Your ${review.platform_label} connection request was rejected. Reason: ${adminNotes || 'No reason provided.'}`,
          actor_email: 'system@quantumflow.app',
          actor_name: 'QuantumFlow System',
          action_url: '/Profile?section=identity'
        })
      ]);
    }

    return new Response(JSON.stringify({ success: true, message: `Review processed as ${decision}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing social connection review:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
