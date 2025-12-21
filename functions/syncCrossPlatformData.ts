
import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);

        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const allUsers = await base44.entities.User.list();
        const usersWithCrossPlatform = allUsers.filter(user =>
            user.cross_platform_identity &&
            (user.cross_platform_identity.web2_verifications?.length > 0 ||
             user.cross_platform_identity.web3_connections?.length > 0)
        );

        let updatedCount = 0;

        for (const user of usersWithCrossPlatform) {
            try {
                // Calculate total followers
                const web2 = user.cross_platform_identity.web2_verifications || [];
                const web3 = user.cross_platform_identity.web3_connections || [];
                const totalFollowerCount = web2.reduce((sum, conn) => sum + (conn.follower_count || 0), 0) +
                                         web3.reduce((sum, conn) => sum + (conn.follower_count || 0), 0);

                const directoryEntry = {
                    user_email: user.email,
                    full_name: user.full_name || 'Anonymous User',
                    username: user.username || null,
                    avatar_url: user.avatar_url || null,
                    banner_url: user.banner_url || null,
                    bio: user.bio || null,
                    skills: Array.isArray(user.skills) ? user.skills : [], // Ensure skills is an array
                    interests: Array.isArray(user.interests) ? user.interests : [], // Ensure interests is an array
                    reputation_score: user.reputation_score || 100,
                    is_public: user.privacy_settings?.profile_visibility !== 'private',
                    total_follower_count: totalFollowerCount,
                    join_date: user.created_date,
                    cross_platform_identity: user.cross_platform_identity || { web2_verifications: [], web3_connections: [] }, // Add fallback for cross_platform_identity
                    professional_credentials: user.professional_credentials || {
                        is_verified: false,
                        credentials: []
                    },
                    custom_badges: user.custom_badges || [] // IMPORTANT: Include custom badges in sync
                };

                const existingEntries = await base44.entities.PublicUserDirectory.filter({
                    user_email: user.email
                });

                if (existingEntries.length > 0) {
                    await base44.entities.PublicUserDirectory.update(
                        existingEntries[0].id,
                        directoryEntry
                    );
                } else {
                    await base44.entities.PublicUserDirectory.create(directoryEntry);
                }

                updatedCount++;

            } catch (error) {
                console.error(`Error updating ${user.email}:`, error);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Successfully synced cross-platform data for ${updatedCount} users`,
            updated_count: updatedCount
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error syncing cross-platform data:', error);
        return new Response(JSON.stringify({
            error: 'Failed to sync cross-platform data',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
