
import { createClient } from 'npm:@base44/sdk@0.1.0';
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from 'npm:@solana/web3.js@1.87.6';
import {
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount
} from 'npm:@solana/spl-token@0.3.11';
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as METADATA_PROGRAM_ID
} from 'npm:@metaplex-foundation/mpl-token-metadata@2.12.0';
import bs58 from 'npm:bs58@5.0.0';
import { Buffer } from 'node:buffer';

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

        // Get the private key from environment
        const privateKeyString = Deno.env.get('SOLANA_PRIVATE_KEY');
        if (!privateKeyString) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Solana private key not found in environment variables'
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        console.log('Private key found, length:', privateKeyString.length);

        // Try to parse the private key more safely
        let payer;
        try {
            const privateKeyArray = JSON.parse(privateKeyString);
            if (!Array.isArray(privateKeyArray) || privateKeyArray.length !== 64) {
                throw new Error('Private key must be an array of 64 numbers');
            }
            payer = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
        } catch (parseError) {
            console.error('Private key parsing error:', parseError);
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid private key format. Expected JSON array of 64 numbers.',
                details: parseError.message
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Connect to Solana Devnet
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

        console.log('Creating $QFLOW token on DEVNET...');
        console.log('Payer public key:', payer.publicKey.toString());

        // Check balance first
        const balance = await connection.getBalance(payer.publicKey);
        console.log('Wallet balance:', balance / 1e9, 'SOL');

        if (balance < 0.01 * 1e9) {
            return new Response(JSON.stringify({
                success: false,
                error: `Insufficient SOL balance on Devnet. Current balance: ${balance / 1e9} SOL. Need at least 0.01 SOL. Please airdrop test SOL to ${payer.publicKey.toString()}`
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Create the token mint
        console.log('Creating mint...');
        const mint = await createMint(
            connection,
            payer,
            payer.publicKey, // mint authority
            null, // freeze authority
            9 // decimals
        );

        console.log('Token mint created:', mint.toString());

        // Create associated token account
        console.log('Creating associated token account...');
        const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mint,
            payer.publicKey
        );

        console.log('Associated token account:', associatedTokenAccount.address.toString());

        // Mint 1 billion tokens
        console.log('Minting 1 billion tokens...');
        const mintAmount = 1_000_000_000 * Math.pow(10, 9);

        await mintTo(
            connection,
            payer,
            mint,
            associatedTokenAccount.address,
            payer.publicKey,
            mintAmount
        );

        console.log('Tokens minted successfully');

        // Create metadata
        console.log('Creating metadata...');
        const [metadataPDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('metadata'),
                METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
            ],
            METADATA_PROGRAM_ID
        );

        const tokenMetadata = {
            name: 'QuantumFlow',
            symbol: 'QFLOW',
            uri: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/qflow_metadata.json',
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
        };

        const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
            {
                metadata: metadataPDA,
                mint: mint,
                mintAuthority: payer.publicKey,
                payer: payer.publicKey,
                updateAuthority: payer.publicKey,
            },
            {
                createMetadataAccountArgsV3: {
                    data: tokenMetadata,
                    isMutable: true,
                    collectionDetails: null,
                },
            }
        );

        const transaction = new Transaction().add(createMetadataInstruction);
        const signature = await connection.sendTransaction(transaction, [payer]);
        await connection.confirmTransaction(signature, 'confirmed');

        console.log('Metadata created. Signature:', signature);

        // Store in database
        await base44.entities.PlatformConfig.create({
            key: 'qflow_mint_address',
            value: mint.toString(),
            notes: 'Official $QFLOW token mint address on Solana devnet'
        });

        await base44.entities.PlatformConfig.create({
            key: 'qflow_metadata_added',
            value: 'true',
            notes: `Metadata added for mint ${mint.toString()}`
        });

        console.log('Token creation completed successfully!');

        return new Response(JSON.stringify({
            success: true,
            mintAddress: mint.toString(),
            associatedTokenAccount: associatedTokenAccount.address.toString(),
            totalSupply: '1,000,000,000',
            decimals: 9,
            metadataSignature: signature,
            message: 'Official $QFLOW token created successfully on Solana devnet!'
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error('Error creating token:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Unknown error occurred',
            details: error.toString(),
            stack: error.stack
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
