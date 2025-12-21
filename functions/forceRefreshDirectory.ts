import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check authentication and admin privileges
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('Starting force directory refresh...');

        // Fetch all users and their profile data
        const [allUsers, allProfileData, existingDirectory] = await Promise.all([
            base44.asServiceRole.entities.User.filter({}),
            base44.asServiceRole.entities.UserProfileData.filter({}),
            base44.asServiceRole.entities.PublicUserDirectory.filter({})
        ]);

        console.log(`Found ${allUsers.length} users, ${allProfileData.length} profile records, ${existingDirectory.length} directory entries`);

        // Create maps for efficient lookup
        const profileDataMap = allProfileData.reduce((acc, profile) => {
            acc[profile.user_email] = profile;
            return acc;
        }, {});

        const directoryMap = existingDirectory.reduce((acc, entry) => {
            acc[entry.user_email] = entry;
            return acc;
        }, {});

        let updatedCount = 0;
        let createdCount = 0;

        // Process each user
        for (const user of allUsers) {
            const profileData = profileDataMap[user.email];
            const existingEntry = directoryMap[user.email];

            // Calculate total followers
            let totalFollowerCount = 0;
            const crossPlatformIdentity = profileData?.cross_platform_identity || user.cross_platform_identity;
            if (crossPlatformIdentity) {
                const web2 = crossPlatformIdentity.web2_verifications || [];
                const web3 = crossPlatformIdentity.web3_connections || [];
                totalFollowerCount = web2.reduce((sum, conn) => sum + (conn.follower_count || 0), 0) +
                                   web3.reduce((sum, conn) => sum + (conn.follower_count || 0), 0);
            }

            // Prepare directory entry with current data (prioritize UserProfileData over User entity)
            const directoryEntry = {
                user_email: user.email,
                full_name: profileData?.full_name || user.full_name || 'Anonymous User',
                username: profileData?.username || user.username || null,
                avatar_url: profileData?.avatar_url || user.avatar_url || null,
                banner_url: profileData?.banner_url || user.banner_url || null,
                bio: profileData?.bio || user.bio || null,
                skills: profileData?.skills || user.skills || [],
                interests: profileData?.interests || user.interests || [],
                reputation_score: user.reputation_score || 100,
                is_public: (profileData?.privacy_settings?.profile_visibility || user.privacy_settings?.profile_visibility) !== 'private',
                total_follower_count: totalFollowerCount,
                join_date: user.created_date,
                cross_platform_identity: crossPlatformIdentity || { 
                    web2_verifications: [], 
                    web3_connections: [] 
                },
                professional_credentials: profileData?.professional_credentials || user.professional_credentials || { 
                    is_verified: false, 
                    credentials: [] 
                },
                custom_badges: user.custom_badges || []
            };

            try {
                if (existingEntry) {
                    // Update existing entry
                    await base44.asServiceRole.entities.PublicUserDirectory.update(
                        existingEntry.id,
                        directoryEntry
                    );
                    updatedCount++;
                    console.log(`Updated directory entry for ${user.email}: ${directoryEntry.full_name}`);
                } else {
                    // Create new entry
                    await base44.asServiceRole.entities.PublicUserDirectory.create(directoryEntry);
                    createdCount++;
                    console.log(`Created directory entry for ${user.email}: ${directoryEntry.full_name}`);
                }
            } catch (error) {
                console.error(`Error processing user ${user.email}:`, error);
            }
        }

        const response = {
            success: true,
            message: `Directory refresh completed successfully`,
            stats: {
                totalUsers: allUsers.length,
                updated: updatedCount,
                created: createdCount
            }
        };

        console.log('Force refresh completed:', response);

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in forceRefreshDirectory:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to refresh directory',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});