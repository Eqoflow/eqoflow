import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Connection, Keypair, PublicKey, Transaction } from 'npm:@solana/web3.js@1.95.8';
import bs58 from 'npm:bs58@6.0.0';

const EQOFLO_FEE = 3; // $eqoflo fee for blockchain timestamping

// Use Helius RPC for faster, more reliable blockchain operations
const getHeliusRpc = () => {
  const heliusKey = Deno.env.get('HELIUS_API_KEY');
  return heliusKey 
    ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
    : 'https://api.mainnet-beta.solana.com';
};

Deno.serve(async (req) => {
  console.log('[timestampOnBlockchain] === FUNCTION INVOKED ===');
  
  try {
    const base44 = createClientFromRequest(req);
    console.log('[timestampOnBlockchain] SDK client created');
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      console.error('[timestampOnBlockchain] Authentication failed');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[timestampOnBlockchain] User authenticated:', user.email);

    const { content_hash, post_id } = await req.json();
    console.log('[timestampOnBlockchain] Request data - hash:', content_hash?.substring(0, 20), 'post_id:', post_id);

    if (!content_hash) {
      console.error('[timestampOnBlockchain] Missing content_hash');
      return Response.json({ error: 'Content hash required' }, { status: 400 });
    }

    // Check user's $eqoflo balance
    const currentBalance = user.token_balance || 0;
    console.log('[timestampOnBlockchain] User balance:', currentBalance, '/ Required:', EQOFLO_FEE);

    if (currentBalance < EQOFLO_FEE) {
      console.error('[timestampOnBlockchain] Insufficient balance');
      return Response.json({ 
        error: `Insufficient $eqoflo balance. ${EQOFLO_FEE} $eqoflo required for blockchain timestamping.`,
        required: EQOFLO_FEE,
        current_balance: currentBalance
      }, { status: 402 });
    }

    // Deduct $eqoflo fee
    console.log('[timestampOnBlockchain] Deducting fee...');
    const newBalance = currentBalance - EQOFLO_FEE;
    try {
      await base44.asServiceRole.entities.User.update(user.id, {
        token_balance: newBalance
      });
      console.log('[timestampOnBlockchain] Fee deducted. New balance:', newBalance);
    } catch (balanceError) {
      console.error('[timestampOnBlockchain] Failed to deduct fee:', balanceError.message);
      return Response.json({ error: 'Failed to process payment' }, { status: 500 });
    }

    // Get platform wallet keypair
    console.log('[timestampOnBlockchain] Loading Solana keypair...');
    const privateKeyString = Deno.env.get('SOLANA_PRIVATE_KEY');
    if (!privateKeyString) {
      console.error('[timestampOnBlockchain] SOLANA_PRIVATE_KEY not set');
      // Refund
      await base44.asServiceRole.entities.User.update(user.id, {
        token_balance: currentBalance
      });
      return Response.json({ error: 'Blockchain wallet not configured' }, { status: 500 });
    }

    let keypair;
    try {
      const privateKeyBytes = bs58.decode(privateKeyString);
      keypair = Keypair.fromSecretKey(privateKeyBytes);
      console.log('[timestampOnBlockchain] Keypair loaded. Public key:', keypair.publicKey.toString());
    } catch (keypairError) {
      console.error('[timestampOnBlockchain] Invalid keypair:', keypairError.message);
      // Refund
      await base44.asServiceRole.entities.User.update(user.id, {
        token_balance: currentBalance
      });
      return Response.json({ error: 'Invalid blockchain configuration' }, { status: 500 });
    }
    
    // Connect to Solana
    const rpcUrl = getHeliusRpc();
    console.log('[timestampOnBlockchain] Using RPC:', rpcUrl.includes('helius') ? 'Helius' : 'Public Solana');
    const connection = new Connection(rpcUrl, { commitment: 'confirmed' });

    // Create memo data
    const memoData = `EQOFLOW:${content_hash}:${post_id || 'content'}:${Date.now()}`;
    console.log('[timestampOnBlockchain] Memo data created (length:', memoData.length, ')');
    
    // Get recent blockhash
    console.log('[timestampOnBlockchain] Fetching blockhash...');
    let blockhash;
    try {
      const blockHashResult = await connection.getLatestBlockhash('confirmed');
      blockhash = blockHashResult.blockhash;
      console.log('[timestampOnBlockchain] Blockhash obtained:', blockhash.substring(0, 10) + '...');
    } catch (blockHashError) {
      console.error('[timestampOnBlockchain] Blockhash fetch failed:', blockHashError.message);
      // Refund
      await base44.asServiceRole.entities.User.update(user.id, {
        token_balance: currentBalance
      });
      return Response.json({ error: 'Failed to connect to Solana network' }, { status: 500 });
    }
    
    // Create transaction
    console.log('[timestampOnBlockchain] Building transaction...');
    let transaction;
    try {
      transaction = new Transaction();
      transaction.add({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: Buffer.from(memoData, 'utf8')
      });
      
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = keypair.publicKey;
      transaction.sign(keypair);
      console.log('[timestampOnBlockchain] Transaction built and signed');
    } catch (txError) {
      console.error('[timestampOnBlockchain] Transaction build failed:', txError.message);
      // Refund
      await base44.asServiceRole.entities.User.update(user.id, {
        token_balance: currentBalance
      });
      return Response.json({ error: 'Failed to create blockchain transaction' }, { status: 500 });
    }
    
    // Send transaction
    console.log('[timestampOnBlockchain] Sending transaction...');
    let signature;
    try {
      signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: true,
        maxRetries: 0
      });
      console.log('[timestampOnBlockchain] ✓ Transaction sent! Signature:', signature);
    } catch (sendError) {
      console.error('[timestampOnBlockchain] Send transaction failed:', sendError.message);
      console.error('[timestampOnBlockchain] Error details:', sendError);
      // Refund
      await base44.asServiceRole.entities.User.update(user.id, {
        token_balance: currentBalance
      });
      return Response.json({ error: 'Failed to send blockchain transaction: ' + sendError.message }, { status: 500 });
    }

    // Update the post with blockchain transaction ID
    if (post_id) {
      try {
        await base44.asServiceRole.entities.Post.update(post_id, {
          blockchain_tx_id: signature
        });
        console.log('[timestampOnBlockchain] Post updated with blockchain_tx_id');
      } catch (updateError) {
        console.error('[timestampOnBlockchain] Failed to update post:', updateError.message);
        // Don't fail the whole operation if post update fails
      }
    }

    // Log the transaction for transparency
    try {
      await base44.asServiceRole.entities.PlatformRevenue.create({
        revenue_type: 'blockchain_timestamp_fee',
        amount_usd: 0,
        amount_tokens: EQOFLO_FEE,
        description: `Blockchain timestamping fee for post ${post_id || 'content'}`,
        user_email: user.email,
        transaction_id: signature
      });
      console.log('[timestampOnBlockchain] Revenue logged');
    } catch (revenueError) {
      console.error('[timestampOnBlockchain] Failed to log revenue:', revenueError.message);
      // Don't fail the whole operation
    }

    console.log('[timestampOnBlockchain] === SUCCESS ===');
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
    console.error('[timestampOnBlockchain] === FATAL ERROR ===');
    console.error('[timestampOnBlockchain] Error type:', error.constructor.name);
    console.error('[timestampOnBlockchain] Error message:', error.message);
    console.error('[timestampOnBlockchain] Stack trace:', error.stack);
    
    // Attempt to refund the fee on error
    try {
      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me();
      if (user) {
        await base44.asServiceRole.entities.User.update(user.id, {
          token_balance: (user.token_balance || 0) + EQOFLO_FEE
        });
        console.log('[timestampOnBlockchain] Fee refunded');
      }
    } catch (refundError) {
      console.error('[timestampOnBlockchain] Failed to refund fee:', refundError.message);
    }

    return Response.json({ 
      error: error.message || 'Failed to timestamp on blockchain',
      type: error.constructor.name
    }, { status: 500 });
  }
});