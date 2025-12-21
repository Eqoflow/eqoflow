import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { User } from '@/entities/User';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { code } = body;

        const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
        const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

        if (!clientId || !clientSecret) {
            return Response.json({ error: 'Spotify credentials not configured' }, { status: 500 });
        }

        // If no code, return the client ID
        if (!code) {
            return Response.json({ clientId });
        }

        // Exchange code for token
        const redirectUri = 'https://eqoflow.app/SpotifyCallback';
        
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri
            })
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
            throw new Error(tokenData.error_description || 'Token exchange failed');
        }

        // Get user profile
        const profileResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });

        if (!profileResponse.ok) {
            throw new Error('Failed to fetch Spotify profile');
        }

        const profileData = await profileResponse.json();

        // Update user data
        const userData = await User.me();
        const crossPlatformIdentity = userData.cross_platform_identity || { web2_verifications: [], web3_connections: [] };
        
        const newConnection = {
            platform: 'spotify',
            display_name: profileData.display_name,
            username: profileData.id,
            profile_url: profileData.external_urls.spotify,
            follower_count: profileData.followers?.total || 0,
            verified_at: new Date().toISOString(),
        };

        const existingConnections = crossPlatformIdentity.web2_verifications || [];
        const filteredConnections = existingConnections.filter(c => c.platform !== 'spotify');
        crossPlatformIdentity.web2_verifications = [...filteredConnections, newConnection];

        await User.updateMyUserData({ cross_platform_identity: crossPlatformIdentity });

        return Response.json({ success: true, profile: newConnection });

    } catch (error) {
        console.error('Spotify Auth Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});