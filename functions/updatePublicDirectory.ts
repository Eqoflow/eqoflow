import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate the user
    const user = await base44.auth.me();
    if (!user || !user.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's full data
    const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const fullUser = users[0];

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
      full_name: fullUser.full_name || user.email.split('@')[0],
      username: fullUser.username || profileData?.username || user.email.split('@')[0],
      avatar_url: fullUser.avatar_url || profileData?.avatar_url,
      banner_url: fullUser.banner_url || profileData?.banner_url,
      bio: fullUser.bio || profileData?.bio,
      skills: fullUser.skills || profileData?.skills || [],
      interests: fullUser.interests || profileData?.interests || [],
      reputation_score: fullUser.reputation_score || 100,
      is_public: isDiscoverable,
      total_follower_count: followerCount,
      join_date: fullUser.created_date,
      subscription_tier: fullUser.subscription_tier || 'Standard',
      is_pioneer: fullUser.is_pioneer || false,
      cross_platform_identity: fullUser.cross_platform_identity,
      professional_credentials: fullUser.professional_credentials,
      custom_badges: fullUser.custom_badges || [],
      kyc_status: fullUser.kyc_status || 'not_initiated'
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
      console.log(`Updated directory entry for ${user.email}, is_public: ${isDiscoverable}`);
    } else {
      // Create new entry
      await base44.asServiceRole.entities.PublicUserDirectory.create(directoryData);
      console.log(`Created directory entry for ${user.email}, is_public: ${isDiscoverable}`);
    }

    return Response.json({ 
      success: true, 
      message: 'Public directory updated',
      is_public: isDiscoverable
    });

  } catch (error) {
    console.error('Error updating public directory:', error);
    return Response.json({ 
      error: error.message || 'Failed to update public directory' 
    }, { status: 500 });
  }
});