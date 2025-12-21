import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    const url = new URL(req.url);
    const method = req.method;

    try {
        // Handle OAuth initiation
        if (method === 'POST') {
            const { action } = await req.json();
            
            if (action === 'initiate') {
                const clientId = Deno.env.get('FACEBOOK_CLIENT_ID');
                const redirectUri = `${url.origin}/api/functions/facebookAuth`;
                const state = crypto.randomUUID();

                const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
                authUrl.searchParams.set('client_id', clientId);
                authUrl.searchParams.set('redirect_uri', redirectUri);
                authUrl.searchParams.set('state', state);
                authUrl.searchParams.set('scope', 'public_profile,email');
                
                return new Response(JSON.stringify({ auth_url: authUrl.toString() }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Handle OAuth callback
        if (method === 'GET') {
            const code = url.searchParams.get('code');
            if (!code) {
                return new Response('Missing authorization code', { status: 400 });
            }

            // Exchange code for access token
            const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
            tokenUrl.searchParams.set('client_id', Deno.env.get('FACEBOOK_CLIENT_ID'));
            tokenUrl.searchParams.set('redirect_uri', `${url.origin}/api/functions/facebookAuth`);
            tokenUrl.searchParams.set('client_secret', Deno.env.get('FACEBOOK_CLIENT_SECRET'));
            tokenUrl.searchParams.set('code', code);

            const tokenResponse = await fetch(tokenUrl);
            const tokenData = await tokenResponse.json();
            if (!tokenData.access_token) {
                throw new Error(tokenData.error?.message || 'Failed to get access token from Facebook.');
            }

            // Get user profile data
            const userUrl = new URL('https://graph.facebook.com/me');
            userUrl.searchParams.set('fields', 'id,name,email,picture.type(large)');
            userUrl.searchParams.set('access_token', tokenData.access_token);

            const userResponse = await fetch(userUrl);
            const userData = await userResponse.json();

            // NOTE: Follower count is not available for personal profiles via Graph API.
            const verificationData = {
                platform: 'facebook',
                username: userData.id, // Use Facebook's scoped user ID
                display_name: userData.name,
                follower_count: 0, // Not available for personal profiles
                verified: true,
                profile_url: `https://www.facebook.com/${userData.id}`,
                verified_at: new Date().toISOString(),
                avatar_url: userData.picture?.data?.url,
            };

            // Return success page with script to communicate back to the app
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head><title>Facebook Connected</title></head>
                <body>
                    <h1>Success! You may now close this window.</h1>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ type: 'oauth_verification_complete', data: ${JSON.stringify(verificationData)} }, '*');
                        }
                        window.close();
                    </script>
                </body>
                </html>
            `, { status: 200, headers: { 'Content-Type': 'text/html' } });
        }

        return new Response('Method Not Allowed', { status: 405 });
    } catch (error) {
        console.error('Facebook Auth Error:', error);
        return new Response(`<h1>Error: ${error.message}</h1><p>Please close this window and try again.</p>`, { status: 500, headers: { 'Content-Type': 'text/html' } });
    }
});