import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 1000);
    console.log(`Processing ${allUsers.length} users for directory update`);

    let updatedCount = 0;
    let createdCount = 0;

    for (const user of allUsers) {
      if (!user.email) continue;

      // Get user's profile data
      const profileDataRecords = await base44.asServiceRole.entities.UserProfileData.filter({ 
        user_email: user.email 
      });
      const profileData = profileDataRecords.length > 0 ? profileDataRecords[0] : null;

      // Calculate follower count
      const followers = await base44.asServiceRole.entities.Follow.filter({ 
        following_email: user.email 
      });
      const followerCount = followers.length;

      // Determine if user should be discoverable
      // User is discoverable if discovery_visible is explicitly true OR if it's not set (default true)
      const isDiscoverable = profileData?.discovery_visible !== false;

      // Build the directory entry
      const directoryData = {
        user_email: user.email,
        full_name: user.full_name || user.email.split('@')[0],
        username: user.username || profileData?.username || user.email.split('@')[0],
        avatar_url: user.avatar_url || profileData?.avatar_url,
        banner_url: user.banner_url || profileData?.banner_url,
        bio: user.bio || profileData?.bio,
        skills: user.skills || profileData?.skills || [],
        interests: user.interests || profileData?.interests || [],
        reputation_score: user.reputation_score || 100,
        is_public: isDiscoverable,
        total_follower_count: followerCount,
        join_date: user.created_date,
        subscription_tier: user.subscription_tier || 'Standard',
        is_pioneer: user.is_pioneer || false,
        cross_platform_identity: user.cross_platform_identity,
        professional_credentials: user.professional_credentials,
        custom_badges: user.custom_badges || []
      };

      // Check if directory entry exists
      const existingEntries = await base44.asServiceRole.entities.PublicUserDirectory.filter({ 
        user_email: user.email 
      });

      if (existingEntries.length > 0) {
        // Update existing entry
        await base44.asServiceRole.entities.PublicUserDirectory.update(
          existingEntries[0].id,
          directoryData
        );
        updatedCount++;
      } else {
        // Create new entry
        await base44.asServiceRole.entities.PublicUserDirectory.create(directoryData);
        createdCount++;
      }
    }

    console.log(`Directory update complete: ${updatedCount} updated, ${createdCount} created`);

    return Response.json({ 
      success: true,
      message: 'Public directory auto-updated',
      updated: updatedCount,
      created: createdCount,
      total: allUsers.length
    });

  } catch (error) {
    console.error('Error auto-updating public directory:', error);
    return Response.json({ 
      error: error.message || 'Failed to auto-update public directory' 
    }, { status: 500 });
  }
});