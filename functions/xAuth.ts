
import { createClient } from 'npm:@base44/sdk@0.1.0';

const CLIENT_ID = Deno.env.get("X_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("X_CLIENT_SECRET");

// Build the callback URL dynamically
const getCallbackUrl = () => {
  // Use the correct AuthCallback page
  return `https://quantumflowdao.com/AuthCallback?provider=x`;
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a random string for state/verifier
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate SHA256 hash for PKCE challenge
const generateCodeChallenge = async (verifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const base64String = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return base64String;
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { step, code, codeVerifier, state, storedState } = await req.json();

        // Step 1: Generate authorization URL
        if (step === 'getAuthUrl') {
            const codeVerifier = generateRandomString(128);
            const state = generateRandomString(32);
            const codeChallenge = await generateCodeChallenge(codeVerifier);
            
            const callbackUrl = getCallbackUrl();
            
            const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('client_id', CLIENT_ID);
            authUrl.searchParams.set('redirect_uri', callbackUrl);
            authUrl.searchParams.set('scope', 'tweet.read users.read offline.access');
            authUrl.searchParams.set('state', state);
            authUrl.searchParams.set('code_challenge', codeChallenge);
            authUrl.searchParams.set('code_challenge_method', 'S256');

            console.log('Generated auth URL:', authUrl.toString());
            console.log('Callback URL:', callbackUrl);

            return new Response(JSON.stringify({ 
                url: authUrl.toString(), 
                codeVerifier, 
                state 
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // Step 2: Handle callback and exchange code for token
        if (step === 'handleCallback') {
            if (!code || !codeVerifier || !state || !storedState) {
                throw new Error('Missing required callback parameters');
            }
            
            if (state !== storedState) {
                throw new Error('State mismatch - potential CSRF attack');
            }

            // Exchange code for access token
            const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: getCallbackUrl(),
                    code_verifier: codeVerifier
                })
            });

            if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                console.error('Token exchange failed:', errorText);
                throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`);
            }

            const tokenData = await tokenResponse.json();
            
            // Get user info
            const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics,description,location,url,verified', {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`
                }
            });

            if (!userResponse.ok) {
                throw new Error('Failed to fetch user info from Twitter');
            }

            const userData = await userResponse.json();
            const userObject = userData.data; // This is the userProfile.data from the outline
            
            // Update user in Base44
            const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });
            const authHeader = req.headers.get('Authorization');
            if (!authHeader) throw new Error('User not authenticated');
            
            const token = authHeader.split(' ')[1];
            base44.auth.setToken(token);
            const user = await base44.auth.me(); // This is the currentUser from the outline
            if (!user) throw new Error('User not found');

            // --- Start: Outline's logic for cross-platform identity update ---
            const currentIdentity = user.cross_platform_identity || { web2_verifications: [], web3_connections: [] };
            
            // Create a mutable copy of web2_verifications
            const web2Verifications = [...(currentIdentity.web2_verifications || [])];
            
            const twitterVerification = {
              platform: 'twitter',
              username: userObject.username,
              display_name: userObject.name,
              follower_count: userObject.public_metrics?.followers_count || 0,
              verified: userObject.verified || false,
              profile_url: `https://twitter.com/${userObject.username}`,
              verified_at: new Date().toISOString()
            };

            const existingTwitterIndex = web2Verifications.findIndex(v => v.platform === 'twitter');

            if (existingTwitterIndex !== -1) {
              web2Verifications[existingTwitterIndex] = twitterVerification;
            } else {
              web2Verifications.push(twitterVerification);
            }

            const updatedIdentity = {
              ...user.cross_platform_identity, // Changed from ...currentIdentity
              web2_verifications: web2Verifications
            };

            // Update the user's cross-platform identity
            await base44.entities.User.update(user.id, {
              cross_platform_identity: updatedIdentity
            });
            // --- End: Outline's logic for cross-platform identity update ---

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
                join_date: user.created_at, 
                cross_platform_identity: updatedIdentity,
                professional_credentials: user.professional_credentials || { is_verified: false, credentials: [] }
              };

              const existingPublicDirectoryEntries = await base44.entities.PublicUserDirectory.filter({ 
                user_email: user.email 
              });

              if (existingPublicDirectoryEntries?.length > 0) {
                await base44.entities.PublicUserDirectory.update(existingPublicDirectoryEntries[0].id, directoryEntry);
              } else {
                await base44.entities.PublicUserDirectory.create(directoryEntry);
              }
              console.log('Auto-updated PublicUserDirectory after X/Twitter connection.');
            } catch (publicDirError) {
              console.warn('Could not auto-update PublicUserDirectory:', publicDirError.message || publicDirError);
              // Don't fail the entire flow if this fails
            }

            return new Response(JSON.stringify({ 
                success: true, 
                verification: twitterVerification // Return the newly added/updated verification
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid step provided' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });

    } catch (error) {
        console.error('X Auth Error:', error.message);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
