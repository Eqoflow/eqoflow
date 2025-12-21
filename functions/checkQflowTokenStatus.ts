
import { Connection, PublicKey } from 'npm:@solana/web3.js@1.78.0';
import { TOKEN_PROGRAM_ID } from 'npm:@solana/spl-token@0.3.8';
import { Metadata, PROGRAM_ID as METADATA_PROGRAM_ID } from 'npm:@metaplex-foundation/mpl-token-metadata@2.13.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';
import { Buffer } from 'node:buffer';

// In-memory cache for token status
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes cache (blockchain data changes slowly)

function getCacheKey(mintAddress) {
  return `token_status_${mintAddress}`;
}

function isCacheValid(entry) {
  return entry && Date.now() - entry.timestamp < CACHE_TTL;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check authentication - only admins can check token status
    if (!(await base44.auth.isAuthenticated())) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get mint address from platform config or request body
    let mint_address = null;
    
    try {
      const requestBody = await req.json();
      mint_address = requestBody.mint_address;
    } catch {
      // No JSON body or empty body is fine
    }

    // If no mint address in request, try to get it from platform config
    if (!mint_address) {
      try {
        const configRecords = await base44.asServiceRole.entities.PlatformConfig.filter({ key: 'qflow_mint_address' });
        if (configRecords && configRecords.length > 0) {
          mint_address = configRecords[0].value;
        }
      } catch (configError) {
        console.error('Error fetching platform config:', configError);
      }
    }
    
    if (!mint_address) {
      return new Response(JSON.stringify({ 
        tokenExists: false,
        error: 'QFLOW token not yet deployed. No mint address configured.',
        mintAddress: null
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cacheKey = getCacheKey(mint_address);
    const cachedEntry = cache.get(cacheKey);
    
    // Return cached data if valid
    if (isCacheValid(cachedEntry)) {
      return new Response(JSON.stringify(cachedEntry.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch fresh data from blockchain
    const connection = new Connection(
      Deno.env.get('SOLANA_RPC_URL') || 'https://api.mainnet-beta.solana.com'
    );

    let mintPublicKey;
    try {
      mintPublicKey = new PublicKey(mint_address);
    } catch (keyError) {
      const errorResult = { 
        tokenExists: false, 
        error: 'Invalid mint address format',
        mintAddress: mint_address
      };
      
      return new Response(JSON.stringify(errorResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if mint exists
    const mintInfo = await connection.getAccountInfo(mintPublicKey);
    
    if (!mintInfo) {
      const errorResult = { 
        tokenExists: false, 
        error: 'Token mint not found on Solana mainnet',
        mintAddress: mint_address
      };
      
      // Cache the error result briefly (30 seconds)
      cache.set(cacheKey, {
        data: errorResult,
        timestamp: Date.now()
      });
      
      setTimeout(() => {
        cache.delete(cacheKey);
      }, 30000);
      
      return new Response(JSON.stringify(errorResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get metadata
    const [metadataPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mintPublicKey.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );
    const metadataInfo = await connection.getAccountInfo(metadataPDA);
    
    let metadata = null;
    let metadataExists = false;
    
    if (metadataInfo) {
      metadataExists = true;
      try {
        const metadataData = Metadata.deserialize(metadataInfo.data)[0];
        metadata = {
          name: metadataData.data.name,
          symbol: metadataData.data.symbol,
          uri: metadataData.data.uri
        };
      } catch (metadataError) {
        console.error('Error parsing metadata:', metadataError);
      }
    }

    // Get supply information
    const supply = await connection.getTokenSupply(mintPublicKey);
    
    // Try to find platform wallet (treasury)
    let platformWallet = null;
    let tokenAccount = null;

    try {
      const platformWalletKey = Deno.env.get('SOLANA_PUBLIC_KEY');
      if(platformWalletKey) {
        platformWallet = platformWalletKey;
        const walletPubkey = new PublicKey(platformWalletKey);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, { mint: mintPublicKey });
        if (tokenAccounts.value.length > 0) {
          const info = tokenAccounts.value[0].account.data.parsed.info;
          tokenAccount = {
            address: tokenAccounts.value[0].pubkey.toString(),
            amount: info.tokenAmount.amount,
            uiAmount: info.tokenAmount.uiAmount,
          }
        }
      }
    } catch(e) {
      console.error("Could not check platform wallet balance:", e.message);
    }
    
    const tokenStatus = {
      success: true,
      tokenExists: true,
      mintAddress: mint_address,
      mintInfo: {
        decimals: supply.value.decimals,
        supply: supply.value.amount,
      },
      metadataExists: metadataExists,
      metadata: metadata,
      platformWallet: platformWallet,
      tokenAccount: tokenAccount,
      timestamp: Date.now()
    };

    // Cache the fresh data
    cache.set(cacheKey, {
      data: tokenStatus,
      timestamp: Date.now()
    });

    // Set timeout to clear cache entry after TTL
    setTimeout(() => {
      cache.delete(cacheKey);
    }, CACHE_TTL);

    return new Response(JSON.stringify(tokenStatus), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking token status:', error);
    return new Response(JSON.stringify({ 
      exists: false, 
      error: 'Failed to check token status',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
