import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        // 1. Authenticate the user making the request
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }
        
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), { 
                status: 401, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // 2. Get the new profile data from the request
        const updateData = await req.json();

        // 3. Save the new data to the database using the user's ID
        await base44.entities.User.update(user.id, updateData);

        // 4. Fetch the fresh, updated user data from the database to confirm it saved
        const updatedUser = await base44.auth.me();

        // 5. Return the confirmed, updated user data to the profile page
        return new Response(JSON.stringify({ 
            success: true, 
            user: updatedUser 
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("[updateUserProfile] Error:", error);
        return new Response(JSON.stringify({ 
            error: error.message,
            success: false 
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});