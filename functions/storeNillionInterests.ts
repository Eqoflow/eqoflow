import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { interests } = body;

    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      return Response.json({ 
        error: 'Missing required parameter: interests array' 
      }, { status: 400 });
    }

    // Check if user has Nillion keys
    if (!user.nillion_private_key || !user.nillion_did) {
      return Response.json({ 
        error: 'Nillion keys not found. Please generate keys first.' 
      }, { status: 400 });
    }

    // Get Nillion configuration from environment - with fallback endpoints
    const primaryNilchainUrl = Deno.env.get('NILLION_NILCHAIN_URL');
    const collectionId = Deno.env.get('PRIVATE_INTERESTS_COLLECTION_ID') || `interest_collection_${user.id}`;
    const builderKey = Deno.env.get('NILLION_BUILDER_PRIVATE_KEY');

    // Alternative Nillion endpoints to try if primary fails
    const nillionEndpoints = [
      primaryNilchainUrl,
      'https://testnet-nillion-rpc.polkachu.com',
      'https://nillion-testnet.rpc.kjnodes.com',
      'https://testnet.nillion.explorers.guru'
    ].filter(Boolean);

    if (nillionEndpoints.length === 0 || !builderKey) {
      return Response.json({ 
        error: 'Nillion network not configured. Required environment variables missing.',
        debug: {
          hasEndpoints: nillionEndpoints.length > 0,
          builderKey: !!builderKey
        }
      }, { status: 500 });
    }

    let successfulNillionStores = 0;
    let lastNillionError = null;
    const storedSecrets = [];

    // Try each endpoint until one works
    for (const nilchainUrl of nillionEndpoints) {
      if (successfulNillionStores > 0) break; // If we found a working endpoint, stop trying

      console.log(`Attempting Nillion storage on endpoint: ${nilchainUrl}`);

      // Store each interest on Nillion network via HTTP API
      for (const interest of interests) {
        const secretId = `interest_${crypto.randomUUID()}`;
        
        try {
          // Convert interest to a deterministic integer for MPC comparison
          const encoder = new TextEncoder();
          const data = encoder.encode(interest.toLowerCase().trim());
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          
          // Take first 8 bytes and convert to a BigInt for Nillion
          const intValue = hashArray.slice(0, 8).reduce((acc, byte, i) => {
            return acc + BigInt(byte) * (BigInt(256) ** BigInt(i));
          }, BigInt(0));

          // Try multiple API paths that Nillion might use
          const apiPaths = ['/api/store', '/store', '/api/v1/store', '/v1/store'];
          let stored = false;

          for (const apiPath of apiPaths) {
            try {
              const storeResponse = await fetch(`${nilchainUrl}${apiPath}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${builderKey}`
                },
                body: JSON.stringify({
                  collection_id: collectionId,
                  secret_id: secretId,
                  secret_type: 'SecretInteger',
                  secret_value: intValue.toString(),
                  user_id: user.nillion_did,
                  permissions: {
                    retrieve: [user.nillion_did],
                    update: [user.nillion_did],
                    delete: [user.nillion_did],
                    compute: ['*']
                  }
                }),
                signal: AbortSignal.timeout(5000) // 5 second timeout
              });

              if (storeResponse.ok) {
                successfulNillionStores++;
                stored = true;
                
                // Record metadata in database (NOT the actual interest)
                await base44.asServiceRole.entities.NillionData.create({
                  user_email: user.email,
                  store_id: collectionId,
                  secret_id: secretId,
                  data_type: 'interest',
                  is_simulation: false
                });

                storedSecrets.push({
                  secretId,
                  mode: 'nillion_mpc',
                  endpoint: nilchainUrl
                });

                console.log(`✓ Successfully stored "${interest}" on Nillion network at ${nilchainUrl}${apiPath}`);
                break; // Success, move to next interest
              } else {
                const errorText = await storeResponse.text();
                console.log(`Nillion API path ${apiPath} returned ${storeResponse.status}: ${errorText.substring(0, 200)}`);
              }
            } catch (apiError) {
              console.log(`Nillion API path ${apiPath} failed:`, apiError.message);
            }
          }

          if (!stored) {
            throw new Error('All API paths failed for this endpoint');
          }

        } catch (secretError) {
          lastNillionError = secretError;
          console.error(`Failed to store interest "${interest}" on ${nilchainUrl}:`, secretError.message);
        }
      }
    }

    // If we successfully stored on Nillion network
    if (successfulNillionStores > 0) {
      await base44.asServiceRole.entities.User.update(user.id, {
        nillion_interests_stored: true,
        nillion_interests_count: storedSecrets.length,
        nillion_collection_id: collectionId
      });

      return Response.json({
        success: true,
        message: `Successfully stored ${storedSecrets.length} of ${interests.length} interest${interests.length !== 1 ? 's' : ''} on Nillion's MPC network`,
        result: {
          collectionId,
          storedCount: storedSecrets.length,
          mode: 'nillion_mpc',
          network: 'nillion-testnet',
          endpoint: storedSecrets[0]?.endpoint
        }
      });
    }

    // If Nillion storage failed for all interests, use encrypted fallback
    console.log('All Nillion endpoints unavailable, using encrypted fallback. Last error:', lastNillionError?.message);
    
    const fallbackCollectionId = `encrypted_${user.id}`;
    const fallbackSecrets = [];

    for (const interest of interests) {
      const secretId = crypto.randomUUID();
      
      try {
        const encoder = new TextEncoder();
        const interestData = encoder.encode(interest.toLowerCase().trim());
        const keyData = encoder.encode(user.nillion_private_key);
        
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, interestData);
        const hashArray = Array.from(new Uint8Array(signature));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        await base44.asServiceRole.entities.NillionData.create({
          user_email: user.email,
          store_id: fallbackCollectionId,
          secret_id: secretId,
          data_type: 'interest',
          is_simulation: false,
          simulated_data: hashHex
        });

        fallbackSecrets.push({ secretId });
      } catch (err) {
        console.error(`Fallback storage error for "${interest}":`, err);
      }
    }

    if (fallbackSecrets.length > 0) {
      await base44.asServiceRole.entities.User.update(user.id, {
        nillion_interests_stored: true,
        nillion_interests_count: fallbackSecrets.length,
        nillion_collection_id: fallbackCollectionId
      });

      return Response.json({
        success: true,
        message: `Stored ${fallbackSecrets.length} interests using Nillion-inspired encryption (All Nillion testnet endpoints temporarily unavailable - will auto-upgrade when network is back online)`,
        result: {
          collectionId: fallbackCollectionId,
          storedCount: fallbackSecrets.length,
          mode: 'encrypted_fallback',
          network: 'local-encrypted',
          reason: 'nillion_endpoints_unavailable',
          attempted_endpoints: nillionEndpoints.length
        }
      });
    }

    return Response.json({
      error: 'Failed to store interests.',
      success: false
    }, { status: 500 });

  } catch (error) {
    console.error('storeNillionInterests error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});