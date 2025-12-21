import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';
import { Connection, PublicKey } from 'npm:@solana/web3.js@1.87.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Check authentication
        if (!(await base44.auth.isAuthenticated())) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { walletAddress, tokenMintAddress } = await req.json();

        if (!walletAddress) {
            return new Response(JSON.stringify({ error: 'Wallet address is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // If no token mint address provided, return 0 balance
        if (!tokenMintAddress) {
            console.log('No token mint address provided, returning 0 balance');
            return new Response(JSON.stringify({ 
                balance: 0,
                message: 'QFLOW token not yet deployed'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Connect to Solana mainnet
        const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
        
        try {
            const walletPubkey = new PublicKey(walletAddress);
            const mintPubkey = new PublicKey(tokenMintAddress);

            // Get token accounts for the wallet
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
                mint: mintPubkey
            });

            let balance = 0;
            if (tokenAccounts.value.length > 0) {
                // Get the balance from the first token account (there should only be one per mint)
                const tokenAmount = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
                balance = parseFloat(tokenAmount.uiAmount) || 0;
            }

            return new Response(JSON.stringify({ balance }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (solanaError) {
            console.error('Solana RPC error:', solanaError);
            
            // If it's a parsing error or the token doesn't exist, return 0
            if (solanaError.message?.includes('Invalid public key') || 
                solanaError.message?.includes('failed to get token accounts')) {
                return new Response(JSON.stringify({ 
                    balance: 0,
                    message: 'Token account not found or invalid'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            throw solanaError;
        }

    } catch (error) {
        console.error('Get token balance error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to fetch token balance',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});