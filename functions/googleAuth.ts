import { createClient } from 'npm:@base44/sdk@0.1.0';

Deno.serve(async (req) => {
    const url = new URL(req.url);
    const method = req.method;

    try {
        if (method === 'POST') {
            const { action } = await req.json();
            if (action === 'initiate') {
                const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
                authUrl.searchParams.set('client_id', Deno.env.get('GOOGLE_CLIENT_ID'));
                authUrl.searchParams.set('redirect_uri', `${url.origin}/api/functions/googleAuth`);
                authUrl.searchParams.set('response_type', 'code');
                authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile');
                authUrl.searchParams.set('access_type', 'online');
                authUrl.searchParams.set('state', crypto.randomUUID());
                
                return new Response(JSON.stringify({ auth_url: authUrl.toString() }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
        }

        if (method === 'GET') {
            const code = url.searchParams.get('code');
            if (!code) return new Response('Missing authorization code', { status: 400 });

            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: code,
                    client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
                    client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
                    redirect_uri: `${url.origin}/api/functions/googleAuth`,
                    grant_type: 'authorization_code'
                })
            });

            const tokenData = await tokenResponse.json();
            if (!tokenData.access_token) throw new Error('Failed to get access token from Google.');
            
            const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
            });

            const channelData = await channelResponse.json();
            const channel = channelData.items?.[0];
            if (!channel) throw new Error('Could not retrieve YouTube channel data. Make sure the user has a YouTube channel.');
            
            const verificationData = {
                platform: 'youtube',
                username: channel.snippet.customUrl || channel.snippet.title,
                display_name: channel.snippet.title,
                follower_count: parseInt(channel.statistics.subscriberCount, 10) || 0,
                verified: true,
                profile_url: `https://www.youtube.com/channel/${channel.id}`,
                verified_at: new Date().toISOString(),
                avatar_url: channel.snippet.thumbnails.default.url,
                bio: channel.snippet.description
            };

            return new Response(`
                <script>
                    if (window.opener) {
                        window.opener.postMessage({ type: 'oauth_verification_complete', data: ${JSON.stringify(verificationData)} }, '*');
                    }
                    window.close();
                </script>
                <h1>Success!</h1><p>You can close this window.</p>
            `, { status: 200, headers: { 'Content-Type': 'text/html' } });
        }

        return new Response('Method not allowed', { status: 405 });
    } catch (error) {
        console.error('Google/YouTube Auth Error:', error);
        return new Response(`<h1>Error: ${error.message}</h1><p>Please close this window and try again.</p>`, { status: 500, headers: { 'Content-Type': 'text/html' } });
    }
});