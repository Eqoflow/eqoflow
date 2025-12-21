import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const X_CLIENT_ID = Deno.env.get('X_CLIENT_ID');
    const X_CLIENT_SECRET = Deno.env.get('X_CLIENT_SECRET');
    
    if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
      return Response.json({ error: 'X credentials not configured' }, { status: 500 });
    }

    // OAuth 2.0 PKCE flow for X API v2
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store code verifier in a temporary cache (you might want to use a proper cache/database)
    // For now, we'll pass it through state parameter (not recommended for production)
    const state = btoa(JSON.stringify({ 
      user_email: user.email,
      code_verifier: codeVerifier 
    }));
    
    const callbackUrl = `https://base44.app/api/apps/687e8a7d9ad971203c39d072/functions/handleXOAuthCallback`;
    
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', X_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read offline.access');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    
    return Response.json({ 
      authUrl: authUrl.toString(),
      success: true 
    });
    
  } catch (error) {
    console.error('Error initiating X OAuth:', error);
    return Response.json({ 
      error: error.message || 'Failed to initiate X OAuth' 
    }, { status: 500 });
  }
});

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}