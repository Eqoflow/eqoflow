import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const { targetUserEmail } = await req.json();
        
        // Use the email from request or default to current user
        const emailToFix = targetUserEmail || user.email;
        
        console.log(`Fixing profile data sync for: ${emailToFix}`);
        
        // Get the target user's data from User entity
        const users = await base44.asServiceRole.entities.User.filter({ email: emailToFix });
        if (users.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }
        
        const targetUser = users[0];
        
        // Get their profile data
        const profileData = await base44.asServiceRole.entities.UserProfileData.filter({ user_email: emailToFix });
        
        if (profileData.length > 0) {
            const profile = profileData[0];
            
            // Update UserProfileData with the most recent data from User entity
            const syncedData = {
                full_name: profile.full_name || targetUser.full_name,
                username: profile.username || targetUser.username,
                avatar_url: profile.avatar_url || targetUser.avatar_url,
                banner_url: profile.banner_url || targetUser.banner_url,
                bio: profile.bio || targetUser.bio,
                user_email: emailToFix
            };
            
            await base44.asServiceRole.entities.UserProfileData.update(profile.id, syncedData);
            
            console.log(`Successfully synced profile data for ${emailToFix}`);
            
            return new Response(JSON.stringify({ 
                success: true, 
                message: `Profile data synced for ${emailToFix}`,
                syncedData 
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            // Create new profile data record
            const newProfileData = {
                full_name: targetUser.full_name,
                username: targetUser.username,
                avatar_url: targetUser.avatar_url,
                banner_url: targetUser.banner_url,
                bio: targetUser.bio,
                user_email: emailToFix
            };
            
            await base44.asServiceRole.entities.UserProfileData.create(newProfileData);
            
            return new Response(JSON.stringify({ 
                success: true, 
                message: `Created profile data for ${emailToFix}`,
                newProfileData 
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
    } catch (error) {
        console.error("Error in fixProfileDataSync:", error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' } 
        });
    }
});