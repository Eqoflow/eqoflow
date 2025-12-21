import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { userEmail } = await req.json();

    if (!userEmail) {
      return Response.json({ 
        error: 'Missing required parameter: userEmail' 
      }, { status: 400 });
    }

    const adminBase44 = base44.asServiceRole;

    // Check User entity
    const users = await adminBase44.entities.User.filter({ email: userEmail });
    const userData = users.length > 0 ? {
      id: users[0].id,
      email: users[0].email,
      full_name: users[0].full_name,
      username: users[0].username,
      avatar_url: users[0].avatar_url
    } : null;

    // Check UserProfileData
    const profileData = await adminBase44.entities.UserProfileData.filter({ user_email: userEmail });
    const profileInfo = profileData.length > 0 ? {
      id: profileData[0].id,
      user_email: profileData[0].user_email,
      full_name: profileData[0].full_name,
      username: profileData[0].username,
      bio: profileData[0].bio
    } : null;

    // Check PublicUserDirectory
    const directoryEntries = await adminBase44.entities.PublicUserDirectory.filter({ user_email: userEmail });
    const directoryInfo = directoryEntries.length > 0 ? {
      id: directoryEntries[0].id,
      user_email: directoryEntries[0].user_email,
      full_name: directoryEntries[0].full_name,
      username: directoryEntries[0].username
    } : null;

    return Response.json({
      success: true,
      userEmail: userEmail,
      userEntity: userData,
      userProfileData: profileInfo,
      publicDirectory: directoryInfo
    });

  } catch (error) {
    console.error('Error checking user data:', error);
    return Response.json({ 
      error: error.message || 'Failed to check user data' 
    }, { status: 500 });
  }
});