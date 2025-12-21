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
        if (currentUser.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 1. Get all users from the original User entity
        const allUsers = await base44.entities.User.list();

        // 2. Get all profiles that ALREADY exist in our new, reliable table
        const existingProfiles = await base44.entities.UserProfileData.list();
        const existingEmails = new Set(existingProfiles.map(p => p.user_email));

        let createdCount = 0;
        let skippedCount = 0;

        const profilesToCreate = [];

        // 3. Loop through all original users and find who is missing
        for (const user of allUsers) {
            if (!user.email || existingEmails.has(user.email)) {
                skippedCount++;
                continue; // Skip if they have no email or already have a profile
            }

            // 4. Prepare the new profile data for the missing user
            profilesToCreate.push({
                user_email: user.email,
                full_name: user.full_name || user.email.split('@')[0],
                username: user.username || user.email.split('@')[0],
                bio: user.bio || '',
                avatar_url: user.avatar_url || '',
                banner_url: user.banner_url || '',
                website: user.website || '',
                skills: user.skills || [],
                interests: user.interests || [],
                color_scheme: user.color_scheme || 'purple',
                has_completed_onboarding: user.has_completed_onboarding || false,
            });
        }

        // 5. Bulk-create all the missing profiles for efficiency
        if (profilesToCreate.length > 0) {
            await base44.entities.UserProfileData.bulkCreate(profilesToCreate);
            createdCount = profilesToCreate.length;
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Migration complete. Created ${createdCount} new profiles. Skipped ${skippedCount} existing users.`,
            stats: {
                total_users_scanned: allUsers.length,
                new_profiles_created: createdCount,
                already_existing: skippedCount,
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fixing missing profile data:', error);
        return new Response(JSON.stringify({
            error: 'Failed to run migration',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});