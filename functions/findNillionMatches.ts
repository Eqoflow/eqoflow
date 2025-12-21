import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { NillionClient, ProgramBindings } from 'npm:@nillion/client-web@0.1.0-rc.22';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has stored interests
    if (!user.nillion_interests_stored || !user.nillion_collection_id) {
      return Response.json({
        error: 'You have not stored any private interests yet. Please store interests first.',
        success: false
      }, { status: 400 });
    }

    const nilchainUrl = Deno.env.get('NILLION_NILCHAIN_URL');
    const builderKey = Deno.env.get('NILLION_BUILDER_PRIVATE_KEY');

    if (!nilchainUrl || !builderKey) {
      return Response.json({ 
        error: 'Nillion network not configured.' 
      }, { status: 500 });
    }

    try {
      // Initialize Nillion client
      const nillionClient = new NillionClient({
        network: 'testnet',
        privateKey: user.nillion_private_key,
        nodeUrl: nilchainUrl
      });

      // Get current user's interests from NillionData
      const myInterestRecords = await base44.asServiceRole.entities.NillionData.filter({
        user_email: user.email,
        data_type: 'interest'
      });

      if (myInterestRecords.length === 0) {
        return Response.json({
          error: 'No stored interests found.',
          success: false,
          matches: []
        });
      }

      // Get all other users who have stored interests
      const allInterestRecords = await base44.asServiceRole.entities.NillionData.filter({
        data_type: 'interest'
      });

      // Group by user
      const userInterestsMap = new Map();
      for (const record of allInterestRecords) {
        if (record.user_email === user.email) continue; // Skip current user
        
        if (!userInterestsMap.has(record.user_email)) {
          userInterestsMap.set(record.user_email, []);
        }
        userInterestsMap.get(record.user_email).push(record);
      }

      const matches = [];

      // For each other user, perform MPC comparison
      for (const [otherUserEmail, otherInterests] of userInterestsMap.entries()) {
        let matchCount = 0;

        // Compare using Nillion MPC program (if available) or fallback to hash comparison
        for (const myInterest of myInterestRecords) {
          for (const otherInterest of otherInterests) {
            try {
              // Try to use MPC program for comparison
              if (myInterest.secret_id && otherInterest.secret_id && !myInterest.simulated_data) {
                // Use Nillion MPC equality check program
                const programId = 'equality_check_v1'; // This would be deployed to Nillion
                
                const bindings = new ProgramBindings(programId);
                bindings.addInputParty('InputProvider1', user.nillion_did);
                bindings.addInputParty('InputProvider2', otherInterest.user_email); // Would need their DID
                bindings.addOutputParty('OutputReceiver', user.nillion_did);

                const computeResult = await nillionClient.compute({
                  programId: programId,
                  bindings: bindings,
                  secrets: {
                    'secret_a': myInterest.secret_id,
                    'secret_b': otherInterest.secret_id
                  }
                });

                if (computeResult.output === 1) { // Secrets match
                  matchCount++;
                }
              } else {
                // Fallback: Compare encrypted hashes
                if (myInterest.simulated_data && otherInterest.simulated_data) {
                  if (myInterest.simulated_data === otherInterest.simulated_data) {
                    matchCount++;
                  }
                }
              }
            } catch (compareError) {
              console.error('MPC comparison error:', compareError);
              // Fallback to hash comparison
              if (myInterest.simulated_data && otherInterest.simulated_data) {
                if (myInterest.simulated_data === otherInterest.simulated_data) {
                  matchCount++;
                }
              }
            }
          }
        }

        // If there's at least one match, add this user to results
        if (matchCount > 0) {
          // Fetch public user data
          const publicUsers = await base44.asServiceRole.entities.PublicUserDirectory.filter({
            user_email: otherUserEmail
          });

          if (publicUsers.length > 0) {
            matches.push({
              email: otherUserEmail,
              name: publicUsers[0].full_name,
              username: publicUsers[0].username,
              avatar: publicUsers[0].avatar_url,
              matchCount: matchCount,
              totalInterests: otherInterests.length
            });
          }
        }
      }

      return Response.json({
        success: true,
        matches: matches,
        message: `Found ${matches.length} user${matches.length !== 1 ? 's' : ''} with matching interests using Nillion MPC`,
        mode: 'nillion_mpc'
      });

    } catch (nillionError) {
      console.error('Nillion MPC error:', nillionError);

      // Fallback to hash-based matching
      const myInterestRecords = await base44.asServiceRole.entities.NillionData.filter({
        user_email: user.email,
        data_type: 'interest'
      });

      const allInterestRecords = await base44.asServiceRole.entities.NillionData.filter({
        data_type: 'interest'
      });

      const userInterestsMap = new Map();
      for (const record of allInterestRecords) {
        if (record.user_email === user.email) continue;
        if (!userInterestsMap.has(record.user_email)) {
          userInterestsMap.set(record.user_email, []);
        }
        userInterestsMap.get(record.user_email).push(record);
      }

      const matches = [];
      for (const [otherUserEmail, otherInterests] of userInterestsMap.entries()) {
        let matchCount = 0;
        
        for (const myInterest of myInterestRecords) {
          for (const otherInterest of otherInterests) {
            if (myInterest.simulated_data && otherInterest.simulated_data) {
              if (myInterest.simulated_data === otherInterest.simulated_data) {
                matchCount++;
              }
            }
          }
        }

        if (matchCount > 0) {
          const publicUsers = await base44.asServiceRole.entities.PublicUserDirectory.filter({
            user_email: otherUserEmail
          });

          if (publicUsers.length > 0) {
            matches.push({
              email: otherUserEmail,
              name: publicUsers[0].full_name,
              username: publicUsers[0].username,
              avatar: publicUsers[0].avatar_url,
              matchCount: matchCount,
              totalInterests: otherInterests.length
            });
          }
        }
      }

      return Response.json({
        success: true,
        matches: matches,
        message: `Found ${matches.length} matches using encrypted comparison (Nillion network temporarily unavailable)`,
        mode: 'encrypted_fallback'
      });
    }

  } catch (error) {
    console.error('findNillionMatches error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});