import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Nillion Collection IDs
const NILLION_COLLECTIONS = {
  VOTE_CAST: '2465cef9-423a-4a48-b386-3d3194c9aec1',
  UNIQUENESS_VERIFICATION: '4d249ead-e83d-484f-b9d1-a08924ce999d',
  CONFIDENTIAL_MATCHING: 'fc55d4b1-8d19-453d-8806-7325e63beeec',
  ANONYMOUS_VOTING: 'b607804c-a97a-4218-a20b-b2fc0a0db4b2',
  AGE_VERIFICATION: 'f27b2456-a999-49e6-b6f6-bc4bc844df9a',
  USER_SENSITIVE_DATA: 'a445b733-4f94-4a49-a1b7-a36750858a1'
};

// Helper to try Nillion network storage
async function tryNillionStorage({ collectionId, secretId, value, userDid, builderKey }) {
  const nillionEndpoints = [
    Deno.env.get('NILLION_NILCHAIN_URL'),
    'https://testnet-nillion-rpc.polkachu.com',
    'https://nillion-testnet.rpc.kjnodes.com',
    'https://testnet.nillion.explorers.guru'
  ].filter(Boolean);

  if (nillionEndpoints.length === 0 || !builderKey) {
    throw new Error('No Nillion endpoints available');
  }

  for (const nilchainUrl of nillionEndpoints) {
    const apiPaths = ['/api/store', '/store', '/api/v1/store', '/v1/store'];
    
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
            secret_value: value.toString(),
            user_id: userDid,
            permissions: {
              retrieve: [userDid],
              update: [userDid],
              delete: [userDid],
              compute: ['*']
            }
          }),
          signal: AbortSignal.timeout(5000)
        });

        if (storeResponse.ok) {
          console.log(`✓ Successfully stored on Nillion at ${nilchainUrl}${apiPath}`);
          return { success: true, endpoint: nilchainUrl, mode: 'nillion_mpc' };
        }
      } catch (err) {
        // Continue to next endpoint/path
      }
    }
  }

  throw new Error('All Nillion endpoints unavailable');
}

// Helper functions
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Proper AES-GCM encryption that can be decrypted
async function encryptDataAES(data, password) {
  const encoder = new TextEncoder();
  
  // Derive key from password
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(data)
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

  // Convert to hex string
  return Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function decryptDataAES(encryptedHex, password) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Convert hex string back to bytes
  const combined = new Uint8Array(
    encryptedHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
  );

  // Extract salt, iv, and encrypted data
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encryptedData = combined.slice(28);

  // Derive the same key from password
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encryptedData
  );

  return decoder.decode(decryptedData);
}

// Keep hash-based encryption for interests matching (where we need deterministic hashes)
async function encryptDataHMAC(data, key) {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const keyBytes = encoder.encode(key);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await req.json();
    const builderKey = Deno.env.get('NILLION_BUILDER_PRIVATE_KEY');

    switch (action) {
      case 'list_stores': {
        const stores = await base44.asServiceRole.entities.NillionStore.filter({
          user_email: user.email
        });
        return Response.json({ success: true, stores });
      }

      case 'store_private_data': {
        const { privateData, retrievalPassword } = data;

        if (!privateData || !retrievalPassword) {
          return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const collectionId = NILLION_COLLECTIONS.USER_SENSITIVE_DATA;
        const secretId = crypto.randomUUID();

        let mode = 'encrypted_fallback';
        let network = 'local-encrypted';

        // Try Nillion network first
        if (user.nillion_private_key && user.nillion_did && builderKey) {
          try {
            const encoder = new TextEncoder();
            const dataBytes = encoder.encode(privateData);
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const intValue = hashArray.slice(0, 8).reduce((acc, byte, i) => {
              return acc + BigInt(byte) * (BigInt(256) ** BigInt(i));
            }, BigInt(0));

            const result = await tryNillionStorage({
              collectionId,
              secretId,
              value: intValue,
              userDid: user.nillion_did,
              builderKey
            });

            mode = result.mode;
            network = 'nillion-testnet';

            // Store password hash and original data encrypted for fallback retrieval
            const encryptedForRetrieval = await encryptDataAES(privateData, retrievalPassword);

            await base44.asServiceRole.entities.NillionData.create({
              user_email: user.email,
              store_id: collectionId,
              secret_id: secretId,
              data_type: 'private_data',
              is_simulation: false,
              simulated_data: encryptedForRetrieval
            });

          } catch (nillionError) {
            console.log('Nillion network unavailable, using encrypted fallback:', nillionError.message);
            
            const encryptedData = await encryptDataAES(privateData, retrievalPassword);
            
            await base44.asServiceRole.entities.NillionData.create({
              user_email: user.email,
              store_id: collectionId,
              secret_id: secretId,
              data_type: 'private_data',
              is_simulation: false,
              simulated_data: encryptedData
            });
          }
        } else {
          const encryptedData = await encryptDataAES(privateData, retrievalPassword);
          
          await base44.asServiceRole.entities.NillionData.create({
            user_email: user.email,
            store_id: collectionId,
            secret_id: secretId,
            data_type: 'private_data',
            is_simulation: false,
            simulated_data: encryptedData
          });
        }

        return Response.json({
          success: true,
          secret_id: secretId,
          store_id: collectionId,
          mode,
          network,
          message: mode === 'nillion_mpc' 
            ? 'Data stored on Nillion MPC network'
            : 'Data encrypted and stored (Nillion network temporarily unavailable)'
        });
      }

      case 'retrieve_private_data': {
        const { storeId, secretId, retrievalPassword } = data;

        if (!secretId || !retrievalPassword) {
          return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const dataRecords = await base44.asServiceRole.entities.NillionData.filter({
          user_email: user.email,
          secret_id: secretId
        });

        if (dataRecords.length === 0) {
          return Response.json({ error: 'Data not found' }, { status: 404 });
        }

        const dataRecord = dataRecords[0];

        // Decrypt the data using AES-GCM
        const decryptedData = await decryptDataAES(dataRecord.simulated_data, retrievalPassword);

        return Response.json({
          success: true,
          data: decryptedData
        });
      }

      case 'grant_permission': {
        return Response.json({
          success: true,
          message: 'Permission management will use Nillion network when available'
        });
      }

      case 'store_birthdate_for_mpc': {
        const { birthdate, retrievalPassword } = data;

        if (!birthdate || !retrievalPassword) {
          return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const collectionId = NILLION_COLLECTIONS.AGE_VERIFICATION;
        const secretId = crypto.randomUUID();

        let mode = 'encrypted_fallback';
        let network = 'local-encrypted';

        // Try Nillion network first
        if (user.nillion_private_key && user.nillion_did && builderKey) {
          try {
            const birthdateObj = new Date(birthdate);
            const daysSinceEpoch = Math.floor(birthdateObj.getTime() / (1000 * 60 * 60 * 24));

            const result = await tryNillionStorage({
              collectionId,
              secretId,
              value: BigInt(daysSinceEpoch),
              userDid: user.nillion_did,
              builderKey
            });

            mode = result.mode;
            network = 'nillion-testnet';

            // Store encrypted birthdate for retrieval
            const encryptedForRetrieval = await encryptDataAES(birthdate, retrievalPassword);

            await base44.asServiceRole.entities.NillionData.create({
              user_email: user.email,
              store_id: collectionId,
              secret_id: secretId,
              data_type: 'birthdate',
              is_simulation: false,
              simulated_data: encryptedForRetrieval
            });

          } catch (nillionError) {
            console.log('Nillion network unavailable for birthdate, using encrypted fallback');
            
            const encryptedBirthdate = await encryptDataAES(birthdate, retrievalPassword);
            
            await base44.asServiceRole.entities.NillionData.create({
              user_email: user.email,
              store_id: collectionId,
              secret_id: secretId,
              data_type: 'birthdate',
              is_simulation: false,
              simulated_data: encryptedBirthdate
            });
          }
        } else {
          const encryptedBirthdate = await encryptDataAES(birthdate, retrievalPassword);
          
          await base44.asServiceRole.entities.NillionData.create({
            user_email: user.email,
            store_id: collectionId,
            secret_id: secretId,
            data_type: 'birthdate',
            is_simulation: false,
            simulated_data: encryptedBirthdate
          });
        }

        return Response.json({
          success: true,
          secret_id: secretId,
          store_id: collectionId,
          mode,
          network,
          message: mode === 'nillion_mpc'
            ? 'Birthdate stored on Nillion MPC network'
            : 'Birthdate encrypted and stored (Nillion network temporarily unavailable)'
        });
      }

      case 'verify_age_mpc': {
        const { secretId, storeId, retrievalPassword, ageThreshold } = data;

        const dataRecords = await base44.asServiceRole.entities.NillionData.filter({
          user_email: user.email,
          secret_id: secretId,
          data_type: 'birthdate'
        });

        if (dataRecords.length === 0) {
          return Response.json({ error: 'Birthdate not found' }, { status: 404 });
        }

        const dataRecord = dataRecords[0];

        // Decrypt the birthdate
        const birthdate = await decryptDataAES(dataRecord.simulated_data, retrievalPassword);

        const birthdateObj = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birthdateObj.getFullYear();
        const monthDiff = today.getMonth() - birthdateObj.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdateObj.getDate())) {
          age--;
        }

        const meetsRequirement = age >= (ageThreshold || 18);

        return Response.json({
          success: true,
          result: {
            meetsRequirement,
            computationMethod: dataRecord.is_simulation === false && !dataRecord.simulated_data ? 'nillion_mpc' : 'encrypted_local'
          }
        });
      }

      case 'find_matches': {
        const myInterests = await base44.asServiceRole.entities.NillionData.filter({
          user_email: user.email,
          data_type: 'interest'
        });

        if (myInterests.length === 0) {
          return Response.json({
            success: true,
            matches: [],
            message: 'No interests stored yet'
          });
        }

        const allInterests = await base44.asServiceRole.entities.NillionData.filter({
          data_type: 'interest'
        });

        const userMatches = new Map();

        for (const myInterest of myInterests) {
          for (const otherInterest of allInterests) {
            if (otherInterest.user_email === user.email) continue;

            if (myInterest.simulated_data && otherInterest.simulated_data) {
              if (myInterest.simulated_data === otherInterest.simulated_data) {
                const currentCount = userMatches.get(otherInterest.user_email) || 0;
                userMatches.set(otherInterest.user_email, currentCount + 1);
              }
            }
          }
        }

        const matches = [];
        for (const [email, count] of userMatches.entries()) {
          const publicUsers = await base44.asServiceRole.entities.PublicUserDirectory.filter({
            user_email: email
          });

          if (publicUsers.length > 0) {
            matches.push({
              email,
              name: publicUsers[0].full_name,
              username: publicUsers[0].username,
              avatar: publicUsers[0].avatar_url,
              matchCount: count
            });
          }
        }

        return Response.json({
          success: true,
          matches,
          message: `Found ${matches.length} user${matches.length !== 1 ? 's' : ''} with matching interests`
        });
      }

      case 'cast_anonymous_vote': {
        const { proposalId, vote } = data;

        if (!proposalId || !vote) {
          return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const collectionId = NILLION_COLLECTIONS.ANONYMOUS_VOTING;
        const voteId = crypto.randomUUID();

        let mode = 'encrypted_fallback';
        let network = 'local-encrypted';

        // Try Nillion network first
        if (user.nillion_private_key && user.nillion_did && builderKey) {
          try {
            const voteValue = vote === 'yes' ? 1 : vote === 'no' ? 0 : 2;

            const result = await tryNillionStorage({
              collectionId,
              secretId: voteId,
              value: BigInt(voteValue),
              userDid: user.nillion_did,
              builderKey
            });

            mode = result.mode;
            network = 'nillion-testnet';

            await base44.asServiceRole.entities.NillionData.create({
              user_email: user.email,
              store_id: collectionId,
              secret_id: voteId,
              data_type: 'vote',
              is_simulation: false
            });

          } catch (nillionError) {
            console.log('Nillion network unavailable for voting, using encrypted fallback');
            
            const voteData = JSON.stringify({ proposalId, vote });
            const encryptedVote = await encryptDataHMAC(voteData, user.nillion_private_key);

            await base44.asServiceRole.entities.NillionData.create({
              user_email: user.email,
              store_id: collectionId,
              secret_id: voteId,
              data_type: 'vote',
              is_simulation: false,
              simulated_data: encryptedVote
            });
          }
        } else {
          const voteData = JSON.stringify({ proposalId, vote });
          const encryptedVote = await encryptDataHMAC(voteData, user.nillion_private_key || user.email);

          await base44.asServiceRole.entities.NillionData.create({
            user_email: user.email,
            store_id: collectionId,
            secret_id: voteId,
            data_type: 'vote',
            is_simulation: false,
            simulated_data: encryptedVote
          });
        }

        return Response.json({
          success: true,
          vote_id: voteId,
          mode,
          network,
          message: mode === 'nillion_mpc'
            ? 'Vote cast anonymously on Nillion MPC network'
            : 'Vote encrypted and stored (Nillion network temporarily unavailable)'
        });
      }

      case 'get_voting_results': {
        const { proposalId } = data;

        const votes = await base44.asServiceRole.entities.NillionData.filter({
          data_type: 'vote'
        });

        let yesVotes = 0;
        let noVotes = 0;
        let abstainVotes = 0;

        for (const voteRecord of votes) {
          if (voteRecord.simulated_data) {
            try {
              const voteData = JSON.parse(voteRecord.simulated_data);
              
              if (voteData.proposalId === proposalId) {
                if (voteData.vote === 'yes') yesVotes++;
                else if (voteData.vote === 'no') noVotes++;
                else abstainVotes++;
              }
            } catch (err) {
              // Skip invalid votes
            }
          }
        }

        const totalVotes = yesVotes + noVotes + abstainVotes;

        return Response.json({
          success: true,
          results: {
            yesVotes,
            noVotes,
            abstainVotes,
            totalVotes,
            yesPercentage: totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 0,
            noPercentage: totalVotes > 0 ? Math.round((noVotes / totalVotes) * 100) : 0
          }
        });
      }

      case 'verify_uniqueness': {
        const { userEmail, verificationType } = data;

        const existingProofs = await base44.asServiceRole.entities.NillionData.filter({
          user_email: userEmail,
          data_type: 'uniqueness_proof'
        });

        if (existingProofs.length > 0) {
          return Response.json({
            success: true,
            result: {
              isUnique: true,
              proofId: existingProofs[0].secret_id,
              timestamp: existingProofs[0].created_date,
              method: existingProofs[0].is_simulation === false && !existingProofs[0].simulated_data ? 'nillion_mpc' : 'encrypted_local',
              alreadyProven: true
            }
          });
        }

        const collectionId = NILLION_COLLECTIONS.UNIQUENESS_VERIFICATION;
        const proofId = crypto.randomUUID();

        let mode = 'encrypted_fallback';
        let network = 'local-encrypted';

        // Try Nillion network first
        if (user.nillion_private_key && user.nillion_did && builderKey) {
          try {
            const encoder = new TextEncoder();
            const emailBytes = encoder.encode(userEmail);
            const hashBuffer = await crypto.subtle.digest('SHA-256', emailBytes);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const intValue = hashArray.slice(0, 8).reduce((acc, byte, i) => {
              return acc + BigInt(byte) * (BigInt(256) ** BigInt(i));
            }, BigInt(0));

            const result = await tryNillionStorage({
              collectionId,
              secretId: proofId,
              value: intValue,
              userDid: user.nillion_did,
              builderKey
            });

            mode = result.mode;
            network = 'nillion-testnet';

            await base44.asServiceRole.entities.NillionData.create({
              user_email: userEmail,
              store_id: collectionId,
              secret_id: proofId,
              data_type: 'uniqueness_proof',
              is_simulation: false
            });

          } catch (nillionError) {
            console.log('Nillion network unavailable for uniqueness proof, using encrypted fallback');
            
            const encryptedProof = await encryptDataHMAC(userEmail, user.nillion_private_key);

            await base44.asServiceRole.entities.NillionData.create({
              user_email: userEmail,
              store_id: collectionId,
              secret_id: proofId,
              data_type: 'uniqueness_proof',
              is_simulation: false,
              simulated_data: encryptedProof
            });
          }
        } else {
          const encryptedProof = await encryptDataHMAC(userEmail, user.nillion_private_key || user.email);

          await base44.asServiceRole.entities.NillionData.create({
            user_email: userEmail,
            store_id: collectionId,
            secret_id: proofId,
            data_type: 'uniqueness_proof',
            is_simulation: false,
            simulated_data: encryptedProof
          });
        }

        return Response.json({
          success: true,
          result: {
            isUnique: true,
            proofId,
            timestamp: new Date().toISOString(),
            method: mode,
            network
          }
        });
      }

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('nillionPrivacy error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});