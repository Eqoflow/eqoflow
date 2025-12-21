
import { createClient } from 'npm:@base44/sdk@0.1.0';

// Final, clean version of the GitHub authentication function.

Deno.serve(async (req) => {
    try {
        const GITHUB_CLIENT_ID = Deno.env.get('GITHUB_CLIENT_ID');
        const GITHUB_CLIENT_SECRET = Deno.env.get('GITHUB_CLIENT_SECRET');
        const BASE44_SERVICE_ROLE_KEY = Deno.env.get('BASE44_SERVICE_ROLE_KEY');

        if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !BASE44_SERVICE_ROLE_KEY) {
            throw new Error("Server configuration error: Required secrets for GitHub connection are missing.");
        }
        
        const base44 = createClient({
            appId: Deno.env.get('BASE44_APP_ID'),
            serviceRoleKey: BASE44_SERVICE_ROLE_KEY
        });

        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        // This URI must exactly match the one in your GitHub OAuth App settings.
        const redirectUri = `https://quantumflowdao.com/functions/githubAuth`;

        // --- Flow 1: Callback from GitHub (is a GET request) ---
        if (code && state) {
            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code, redirect_uri: redirectUri }),
            });
            const tokenData = await tokenResponse.json();

            if (tokenData.error) {
                throw new Error(`GitHub token exchange failed: ${tokenData.error_description || tokenData.error}`);
            }

            const userResponse = await fetch('https://api.github.com/user', {
                headers: { 'Authorization': `token ${tokenData.access_token}`, 'User-Agent': 'QuantumFlow-App' },
            });
            const githubUser = await userResponse.json();

            const userEmail = decodeURIComponent(state);
            const userRecords = await base44.entities.User.filter({ email: userEmail });
            
            if (!userRecords || userRecords.length === 0) {
                throw new Error(`Your QuantumFlow account (${userEmail}) could not be found.`);
            }
            const user = userRecords[0];

            // Update user's cross-platform identity
            const web2Verifications = user.cross_platform_identity?.web2_verifications || [];
            const existingGithubIndex = web2Verifications.findIndex(v => v.platform === 'github');
            
            const githubVerification = {
                platform: 'github',
                username: githubUser.login,
                display_name: githubUser.name || githubUser.login,
                follower_count: githubUser.followers || 0,
                verified: true, // Keep as true for successful connection
                profile_url: githubUser.html_url,
                verified_at: new Date().toISOString(),
            };

            if (existingGithubIndex !== -1) {
              web2Verifications[existingGithubIndex] = githubVerification;
            } else {
              web2Verifications.push(githubVerification);
            }

            const updatedIdentity = {
              ...user.cross_platform_identity,
              web2_verifications: web2Verifications
            };

            // Update the user's cross-platform identity
            await base44.entities.User.update(user.id, {
              cross_platform_identity: updatedIdentity
            });

            // Optimized: Automatically update PublicUserDirectory
            try {
              const totalFollowers = (updatedIdentity.web2_verifications?.reduce((sum, conn) => sum + (conn.follower_count || 0), 0) || 0) +
                                     (updatedIdentity.web3_connections?.reduce((sum, conn) => sum + (conn.follower_count || 0), 0) || 0);
              
              const directoryEntry = {
                user_email: user.email,
                full_name: user.full_name || 'Anonymous User',
                username: user.username || null,
                avatar_url: user.avatar_url || null,
                banner_url: user.banner_url || null,
                bio: user.bio || null,
                skills: user.skills || [],
                interests: user.interests || [],
                reputation_score: user.reputation_score || 100,
                is_public: user.privacy_settings?.profile_visibility !== 'private',
                total_follower_count: totalFollowers,
                join_date: user.created_date,
                cross_platform_identity: updatedIdentity,
                professional_credentials: user.professional_credentials || { is_verified: false, credentials: [] }
              };

              const existingEntries = await base44.entities.PublicUserDirectory.filter({ 
                user_email: user.email 
              });

              if (existingEntries?.length > 0) {
                await base44.entities.PublicUserDirectory.update(existingEntries[0].id, directoryEntry);
              } else {
                await base44.entities.PublicUserDirectory.create(directoryEntry);
              }
              console.log('Auto-updated PublicUserDirectory after GitHub connection.');
            } catch (publicDirError) {
              console.warn('Could not auto-update PublicUserDirectory:', publicDirError.message);
            }

            const successHtml = `
                <!DOCTYPE html><html><head><title>GitHub Connected!</title><style>body{font-family:sans-serif;background-color:#0a0a0a;color:white;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}div{text-align:center;padding:2rem;border:1px solid #4a00e0;border-radius:8px;background:rgba(0,0,0,0.5)}h1{color:#8e2de2}p{color:#ccc}</style></head>
                <body><div><h1>Success! GitHub is connected.</h1><p>You can now close this window.</p></div>
                <script>
                    if (window.opener) { window.opener.postMessage('oauth_success', '*'); }
                    setTimeout(() => window.close(), 1500);
                </script>
                </body></html>`;
            return new Response(successHtml, { headers: { 'Content-Type': 'text/html' }, status: 200 });
        }

        // --- Flow 2: Initial request from our app (is a POST request) ---
        if (req.method !== 'POST') {
             throw new Error("This function endpoint only accepts POST for initiation or GET for GitHub callbacks.");
        }

        const { userEmail } = await req.json();
        if (!userEmail) {
            throw new Error("userEmail not provided for the authentication flow.");
        }

        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user user:email&state=${encodeURIComponent(userEmail)}`;
        
        return new Response(JSON.stringify({ authorizationUrl: githubAuthUrl }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error("[githubAuth] CRITICAL ERROR:", error.message);
        const errorHtml = `
            <!DOCTYPE html><html><head><title>Error</title><style>body{font-family:sans-serif;background-color:#0a0a0a;color:white;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}div{text-align:center;padding:2rem;border:1px solid #e00000;border-radius:8px;background:rgba(0,0,0,0.5)}h1{color:#ff4d4d}p{color:#ccc}</style></head>
            <body><div><h1>An Error Occurred</h1><p>${error.message}</p><p>Please close this window and try again.</p></div></body></html>`;
        return new Response(errorHtml, { headers: { 'Content-Type': 'text/html' }, status: 500 });
    }
});
