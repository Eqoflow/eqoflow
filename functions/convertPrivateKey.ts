import { createClient } from 'npm:@base44/sdk@0.1.0';
import { Keypair } from 'npm:@solana/web3.js@1.87.6';
import bs58 from 'npm:bs58@5.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClient({
            appId: Deno.env.get('BASE44_APP_ID'),
        });

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Missing authorization header' 
            }), { 
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Admin access required' 
            }), { 
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Get the request body
        const body = await req.json();
        const { privateKey } = body;

        if (!privateKey) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Private key is required' 
            }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        let keypair;
        let secretKeyArray;

        try {
            // Try different formats
            if (privateKey.startsWith('[') && privateKey.endsWith(']')) {
                // Already in array format
                secretKeyArray = JSON.parse(privateKey);
                keypair = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));
            } else if (privateKey.length === 88) {
                // Base58 format (most common from Phantom)
                const decoded = bs58.decode(privateKey);
                secretKeyArray = Array.from(decoded);
                keypair = Keypair.fromSecretKey(decoded);
            } else if (privateKey.length === 128) {
                // Hex format
                const bytes = [];
                for (let i = 0; i < privateKey.length; i += 2) {
                    bytes.push(parseInt(privateKey.substr(i, 2), 16));
                }
                secretKeyArray = bytes;
                keypair = Keypair.fromSecretKey(new Uint8Array(bytes));
            } else {
                throw new Error('Unrecognized private key format');
            }

            // Verify the key works
            const publicKey = keypair.publicKey.toString();

            return new Response(JSON.stringify({
                success: true,
                publicKey,
                secretKeyArray,
                instructions: [
                    "1. Copy the secretKeyArray below",
                    "2. Go to Workspace → Secrets",
                    "3. Edit SOLANA_PRIVATE_KEY",
                    "4. Paste the array (including the square brackets)",
                    "5. Save the secret",
                    "6. Try minting the token again"
                ]
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Failed to convert private key',
                details: error.message,
                supportedFormats: [
                    'Base58 (88 characters, from Phantom wallet)',
                    'Hex (128 characters)',
                    'JSON Array ([123,45,67,...])'
                ]
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

    } catch (error) {
        console.error('Private key conversion error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error',
            details: error.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});