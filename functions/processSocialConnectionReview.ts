import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { reviewId, decision, adminNotes } = await req.json();

  if (!reviewId || !decision) {
    return Response.json({ error: 'Missing reviewId or decision' }, { status: 400 });
  }

  // Fetch the review record
  const review = await base44.asServiceRole.entities.SocialConnectionReview.get(reviewId);
  if (!review) {
    return Response.json({ error: 'Review not found' }, { status: 404 });
  }

  // Update the review status
  await base44.asServiceRole.entities.SocialConnectionReview.update(reviewId, {
    status: decision,
    admin_notes: adminNotes || '',
    reviewed_by: user.email,
    reviewed_at: new Date().toISOString(),
  });

  // If approved, add the verified connection to both PublicUserDirectory and UserProfileData
  if (decision === 'approved') {
    const web2Platforms = ['twitter', 'facebook', 'instagram', 'linkedin', 'github', 'youtube', 'spotify'];
    const web3Protocols = ['lens', 'farcaster', 'nostr', 'bluesky', 'mastodon'];

    const platform = review.platform?.toLowerCase();
    const submittedData = review.submitted_data || {};

    const buildUpdatedIdentity = (currentIdentity) => {
      const web2Verifications = currentIdentity.web2_verifications || [];
      const web3Connections = currentIdentity.web3_connections || [];

      if (web2Platforms.includes(platform)) {
        const filtered = web2Verifications.filter(v => v.platform !== platform);
        filtered.push({
          platform,
          username: submittedData.username || '',
          display_name: submittedData.display_name || '',
          follower_count: submittedData.follower_count || 0,
          profile_url: submittedData.profile_url || '',
          verified: true,
          verified_at: new Date().toISOString(),
        });
        return { ...currentIdentity, web2_verifications: filtered };
      } else if (web3Protocols.includes(platform)) {
        const filtered = web3Connections.filter(c => c.protocol !== platform);
        filtered.push({
          protocol: platform,
          handle: submittedData.username || '',
          follower_count: submittedData.follower_count || 0,
          profile_id: submittedData.profile_url || '',
          connected_at: new Date().toISOString(),
        });
        return { ...currentIdentity, web3_connections: filtered };
      }
      return currentIdentity;
    };

    // Update PublicUserDirectory
    const dirEntries = await base44.asServiceRole.entities.PublicUserDirectory.filter({ user_email: review.user_email });
    if (dirEntries[0]) {
      const updatedIdentity = buildUpdatedIdentity(dirEntries[0].cross_platform_identity || {});
      await base44.asServiceRole.entities.PublicUserDirectory.update(dirEntries[0].id, {
        cross_platform_identity: updatedIdentity,
      });
    }

    // Update UserProfileData (this is what the logged-in user's profile reads from)
    const profileEntries = await base44.asServiceRole.entities.UserProfileData.filter({ user_email: review.user_email });
    if (profileEntries[0]) {
      const updatedIdentity = buildUpdatedIdentity(profileEntries[0].cross_platform_identity || {});
      await base44.asServiceRole.entities.UserProfileData.update(profileEntries[0].id, {
        cross_platform_identity: updatedIdentity,
      });
    }
  }

  return Response.json({ success: true, decision });
});