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
        
        // Only allow admins to run this function
        if (currentUser.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), { 
                status: 403, 
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get all users (admin privilege)
        const allUsers = await base44.entities.User.list();
        
        // Get existing public directory entries
        const existingEntries = await base44.entities.PublicUserDirectory.list();
        const existingEmails = new Set(existingEntries.map(entry => entry.user_email));

        let addedCount = 0;
        let updatedCount = 0;

        for (const user of allUsers) {
            if (!user.email) continue;

            const directoryEntry = {
                user_email: user.email,
                full_name: user.full_name || user.email.split('@')[0],
                username: user.username || user.email.split('@')[0],
                avatar_url: user.avatar_url || '',
                bio: user.bio || '',
                skills: user.skills || [],
                interests: user.interests || [],
                reputation_score: user.reputation_score || 100,
                is_public: user.privacy_settings?.profile_visibility !== 'private'
            };

            if (existingEmails.has(user.email)) {
                // Update existing entry
                const existingEntry = existingEntries.find(e => e.user_email === user.email);
                await base44.entities.PublicUserDirectory.update(existingEntry.id, directoryEntry);
                updatedCount++;
            } else {
                // Create new entry
                await base44.entities.PublicUserDirectory.create(directoryEntry);
                addedCount++;
            }
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Successfully processed ${allUsers.length} users`,
            stats: {
                total_users: allUsers.length,
                added: addedCount,
                updated: updatedCount
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error populating public directory:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to populate directory',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});