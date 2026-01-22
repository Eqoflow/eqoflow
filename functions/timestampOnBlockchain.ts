import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from 'npm:@solana/web3.js@1.95.8';
import bs58 from 'npm:bs58@6.0.0';

const EQOFLO_FEE = 3; // $eqoflo fee for blockchain timestamping
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content_hash, post_id } = await req.json();

    if (!content_hash) {
      return Response.json({ error: 'Content hash required' }, { status: 400 });
    }

    // Check user's $eqoflo balance (stored in User entity as token_balance)
    const currentBalance = user.token_balance || 0;

    if (currentBalance < EQOFLO_FEE) {
      return Response.json({ 
        error: `Insufficient $eqoflo balance. ${EQOFLO_FEE} $eqoflo required for blockchain timestamping.`,
        required: EQOFLO_FEE,
        current_balance: currentBalance
      }, { status: 402 });
    }

    // Deduct $eqoflo fee from user's token_balance
    const newBalance = currentBalance - EQOFLO_FEE;
    await base44.asServiceRole.entities.User.update(user.id, {
      token_balance: newBalance
    });

    // Get platform wallet keypair
    const privateKeyString = Deno.env.get('SOLANA_PRIVATE_KEY');
    if (!privateKeyString) {
      // Refund the fee if wallet setup fails
      await base44.asServiceRole.entities.User.update(user.id, {
        token_balance: currentBalance
      });
      return Response.json({ error: 'Blockchain wallet not configured' }, { status: 500 });
    }

    const privateKeyBytes = bs58.decode(privateKeyString);
    const keypair = Keypair.fromSecretKey(privateKeyBytes);
    const connection = new Connection(SOLANA_RPC, 'confirmed');

    // Create memo transaction with content hash
    const memoData = `EQOFLOW:${content_hash}:${post_id || 'content'}:${new Date().toISOString()}`;
    
    // Create a simple transfer transaction with memo
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: keypair.publicKey, // Send to self (minimal cost)
        lamports: 1000 // 0.000001 SOL
      })
    );

    // Add memo instruction
    const memoInstruction = {
      keys: [],
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      data: Buffer.from(memoData, 'utf8')
    };
    transaction.add(memoInstruction);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;

    // Sign and send transaction
    transaction.sign(keypair);
    const signature = await connection.sendRawTransaction(transaction.serialize());
    
    // Confirm transaction in background (don't wait to avoid timeout)
    connection.confirmTransaction(signature, 'confirmed').then(() => {
      console.log('[timestampOnBlockchain] Transaction confirmed on-chain:', signature);
    }).catch((err) => {
      console.error('[timestampOnBlockchain] Confirmation warning (non-blocking):', err.message);
    });

    // Log the transaction for transparency
    await base44.entities.PlatformRevenue.create({
      revenue_type: 'blockchain_timestamp_fee',
      amount_usd: 0, // No USD value
      amount_tokens: EQOFLO_FEE,
      description: `Blockchain timestamping fee for post ${post_id || 'content'}`,
      user_email: user.email,
      transaction_id: signature
    });

    return Response.json({
      success: true,
      blockchain_tx_id: signature,
      content_hash: content_hash,
      fee_charged: EQOFLO_FEE,
      new_balance: newBalance,
      explorer_url: `https://explorer.solana.com/tx/${signature}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error timestamping on blockchain:', error);
    
    // Attempt to refund the fee on error
    try {
      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me();
      if (user) {
        await base44.asServiceRole.entities.User.update(user.id, {
          token_balance: (user.token_balance || 0) + EQOFLO_FEE
        });
      }
    } catch (refundError) {
      console.error('Failed to refund fee:', refundError);
    }

    return Response.json({ 
      error: error.message || 'Failed to timestamp on blockchain' 
    }, { status: 500 });
  }
});