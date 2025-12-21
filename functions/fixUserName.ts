import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { userEmail, fullName } = await req.json();

    if (!userEmail || !fullName) {
      return Response.json({ 
        error: 'Missing required parameters: userEmail and fullName' 
      }, { status: 400 });
    }

    // Use service role to update the user
    const adminBase44 = base44.asServiceRole;

    // Find the user by email
    const users = await adminBase44.entities.User.filter({ email: userEmail });

    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];

    // Update the user's full name
    await adminBase44.entities.User.update(targetUser.id, {
      full_name: fullName
    });

    // Also update UserProfileData if it exists
    const profileData = await adminBase44.entities.UserProfileData.filter({
      user_email: userEmail
    });

    if (profileData.length > 0) {
      await adminBase44.entities.UserProfileData.update(profileData[0].id, {
        full_name: fullName
      });
    }

    // Update PublicUserDirectory
    const directoryEntries = await adminBase44.entities.PublicUserDirectory.filter({
      user_email: userEmail
    });

    if (directoryEntries.length > 0) {
      await adminBase44.entities.PublicUserDirectory.update(directoryEntries[0].id, {
        full_name: fullName
      });
    }

    return Response.json({
      success: true,
      message: `Successfully updated name to "${fullName}" for ${userEmail}`
    });

  } catch (error) {
    console.error('Error fixing user name:', error);
    return Response.json({ 
      error: error.message || 'Failed to update user name' 
    }, { status: 500 });
  }
});