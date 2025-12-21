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
                const clientId = Deno.env.get('LINKEDIN_CLIENT_ID');
                const redirectUri = `${url.origin}/api/functions/linkedinAuth`;
                const state = crypto.randomUUID();

                const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
                authUrl.searchParams.set('response_type', 'code');
                authUrl.searchParams.set('client_id', clientId);
                authUrl.searchParams.set('redirect_uri', redirectUri);
                authUrl.searchParams.set('state', state);
                // Use the new 'openid', 'profile', and 'email' scopes
                authUrl.searchParams.set('scope', 'openid profile email');
                
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
            const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    client_id: Deno.env.get('LINKEDIN_CLIENT_ID'),
                    client_secret: Deno.env.get('LINKEDIN_CLIENT_SECRET'),
                    redirect_uri: `${url.origin}/api/functions/linkedinAuth`,
                }),
            });

            const tokenData = await tokenResponse.json();
            if (!tokenData.access_token) {
                throw new Error(tokenData.error_description || 'Failed to get access token from LinkedIn.');
            }

            // Get user profile data using the userinfo endpoint
            const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
            });
            const userData = await userResponse.json();
            
            // Note: Follower count is not available through this basic API scope.
            const verificationData = {
                platform: 'linkedin',
                username: userData.email,
                display_name: userData.name,
                follower_count: 0, // Not available
                verified: true,
                profile_url: `https://www.linkedin.com/in/${userData.sub}`, // Construct a link from the sub (person URN)
                verified_at: new Date().toISOString(),
                avatar_url: userData.picture,
            };

            // Return success page with script to communicate back to the app
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head><title>LinkedIn Connected</title></head>
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
        console.error('LinkedIn Auth Error:', error);
        return new Response(`<h1>Error: ${error.message}</h1><p>Please close this window and try again.</p>`, { status: 500, headers: { 'Content-Type': 'text/html' } });
    }
});