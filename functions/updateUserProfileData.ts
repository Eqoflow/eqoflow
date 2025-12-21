import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Generate a branded EqoFlow user public ID
function generateEqoFlowPublicId() {
    // Generate 12 random digits for uniqueness
    const randomDigits = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    return `eqoflow_${randomDigits}`;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { updateData } = await req.json();
        
        if (!updateData) {
            return Response.json({ error: 'No update data provided' }, { status: 400 });
        }

        // CRITICAL FIX: Update the User entity with core fields that should be on User
        const userEntityUpdates = {};
        
        // Core fields that belong on User entity
        if (updateData.full_name !== undefined) userEntityUpdates.full_name = updateData.full_name;
        if (updateData.username !== undefined) userEntityUpdates.username = updateData.username;
        if (updateData.avatar_url !== undefined) userEntityUpdates.avatar_url = updateData.avatar_url;
        if (updateData.banner_url !== undefined) userEntityUpdates.banner_url = updateData.banner_url;
        if (updateData.bio !== undefined) userEntityUpdates.bio = updateData.bio;
        if (updateData.website !== undefined) userEntityUpdates.website = updateData.website;
        if (updateData.skills !== undefined) userEntityUpdates.skills = updateData.skills;
        if (updateData.interests !== undefined) userEntityUpdates.interests = updateData.interests;
        if (updateData.color_scheme !== undefined) userEntityUpdates.color_scheme = updateData.color_scheme;

        // Update User entity if there are any core field changes
        if (Object.keys(userEntityUpdates).length > 0) {
            await base44.auth.updateMe(userEntityUpdates);
        }

        // Check if user exists in UserProfileData
        const existingProfiles = await base44.entities.UserProfileData.filter({ 
            user_email: user.email 
        });

        let profileId = null;
        
        if (existingProfiles.length > 0) {
            // Update existing profile
            profileId = existingProfiles[0].id;
            await base44.entities.UserProfileData.update(profileId, {
                ...updateData,
                user_email: user.email
            });
        } else {
            // Create new profile
            const newProfile = await base44.entities.UserProfileData.create({
                ...updateData,
                user_email: user.email
            });
            profileId = newProfile.id;
        }

        // Auto-generate branded user_public_id if user doesn't have one
        const currentUser = await base44.auth.me();
        if (!currentUser.user_public_id) {
            // Generate unique branded ID
            let publicId = generateEqoFlowPublicId();
            
            // Ensure uniqueness by checking against existing IDs
            let isUnique = false;
            let attempts = 0;
            while (!isUnique && attempts < 10) {
                const existingUsers = await base44.asServiceRole.entities.User.filter({
                    user_public_id: publicId
                });
                
                if (existingUsers.length === 0) {
                    isUnique = true;
                } else {
                    publicId = generateEqoFlowPublicId();
                    attempts++;
                }
            }
            
            if (isUnique) {
                // Update User entity with public ID
                await base44.auth.updateMe({
                    user_public_id: publicId
                });

                // Update PublicUserDirectory with public ID
                try {
                    const directoryEntries = await base44.asServiceRole.entities.PublicUserDirectory.filter({
                        user_email: user.email
                    });

                    if (directoryEntries.length > 0) {
                        await base44.asServiceRole.entities.PublicUserDirectory.update(directoryEntries[0].id, {
                            user_public_id: publicId
                        });
                    }
                } catch (dirError) {
                    console.warn('Could not update PublicUserDirectory with public ID:', dirError);
                }
            }
        }

        return Response.json({
            success: true,
            profileId,
            message: 'Profile data updated successfully'
        });

    } catch (error) {
        console.error('Error updating user profile data:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});