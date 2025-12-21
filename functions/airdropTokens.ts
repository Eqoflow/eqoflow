import { createClient } from 'npm:@base44/sdk@0.1.0';
import { Connection, PublicKey, Keypair, Transaction } from 'npm:@solana/web3.js@1.95.2';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from 'npm:@solana/spl-token@0.4.8';
import bs58 from 'npm:bs58@6.0.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);

        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response('Admin access required', { status: 403 });
        }

        const { recipient_address, amount, allocation_pool = 'community_rewards', notes = '' } = await req.json();

        if (!recipient_address || !amount || amount <= 0) {
            return new Response(JSON.stringify({ error: 'Invalid recipient address or amount' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate allocation pool
        const validPools = ['community_rewards', 'dao_treasury', 'team_and_advisors', 'ecosystem_fund', 'public_private_sale'];
        if (!validPools.includes(allocation_pool)) {
            return new Response(JSON.stringify({ error: 'Invalid allocation pool' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get the mint address from platform config
        const configs = await base44.entities.PlatformConfig.filter({ key: 'qflow_mint_address' });
        if (!configs || configs.length === 0) {
            return new Response(JSON.stringify({ error: 'QFLOW token not yet deployed' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const mintAddress = new PublicKey(configs[0].value);
        const recipientPubkey = new PublicKey(recipient_address);

        // Get the authority keypair
        const privateKeyBase58 = Deno.env.get('SOLANA_PRIVATE_KEY');
        if (!privateKeyBase58) {
            return new Response(JSON.stringify({ error: 'Missing SOLANA_PRIVATE_KEY' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const authorityKeypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));

        // Get associated token accounts
        const authorityTokenAccount = await getAssociatedTokenAddress(mintAddress, authorityKeypair.publicKey);
        const recipientTokenAccount = await getAssociatedTokenAddress(mintAddress, recipientPubkey);

        // Create transfer instruction
        const transferInstruction = createTransferInstruction(
            authorityTokenAccount,
            recipientTokenAccount,
            authorityKeypair.publicKey,
            amount * Math.pow(10, 9), // Convert to smallest unit (9 decimals)
            [],
            TOKEN_PROGRAM_ID
        );

        // Create and send transaction
        const transaction = new Transaction().add(transferInstruction);
        const signature = await connection.sendTransaction(transaction, [authorityKeypair]);
        await connection.confirmTransaction(signature);

        // **NEW: Update TokenAllocation records**
        try {
            // Find the allocation pool record
            const allocations = await base44.entities.TokenAllocation.filter({ pool_name: allocation_pool });
            if (allocations && allocations.length > 0) {
                const allocation = allocations[0];
                const newDistributedAmount = (allocation.amount_distributed || 0) + amount;
                
                // Update the allocation record
                await base44.entities.TokenAllocation.update(allocation.id, {
                    amount_distributed: newDistributedAmount
                });
                
                console.log(`Updated ${allocation_pool} allocation: distributed ${amount} tokens, new total: ${newDistributedAmount}`);
            } else {
                console.warn(`No allocation record found for pool: ${allocation_pool}`);
            }
        } catch (allocationError) {
            console.error('Error updating token allocation:', allocationError);
            // Don't fail the airdrop if allocation update fails, just log it
        }

        // Log the airdrop
        await base44.entities.AirdropLog.create({
            recipient_address,
            amount,
            status: 'success',
            transaction_signature: signature,
            notes: notes || `Airdrop from ${allocation_pool} allocation pool`
        });

        return new Response(JSON.stringify({
            success: true,
            transaction_signature: signature,
            amount_sent: amount,
            allocation_pool_updated: allocation_pool,
            message: `Successfully airdropped ${amount} $QFLOW tokens and updated allocation records`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in airdrop function:', error);
        
        // Log failed airdrop attempt
        try {
            await base44.entities.AirdropLog.create({
                recipient_address: recipient_address || 'unknown',
                amount: amount || 0,
                status: 'failed',
                notes: error.message
            });
        } catch (logError) {
            console.error('Error logging failed airdrop:', logError);
        }

        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});