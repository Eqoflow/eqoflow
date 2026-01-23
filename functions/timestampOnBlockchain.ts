import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const EQOFLO_FEE = 3; // $eqoflo fee for blockchain timestamping

Deno.serve(async (req) => {
  console.log('[timestampOnBlockchain] === FUNCTION INVOKED (Wallet-Driven Mode) ===');
  
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

    const { blockchain_tx_id, post_id } = await req.json();
    console.log('[timestampOnBlockchain] Request data - tx_id:', blockchain_tx_id, 'post_id:', post_id);

    if (!blockchain_tx_id) {
      console.error('[timestampOnBlockchain] Missing blockchain_tx_id');
      return Response.json({ error: 'Blockchain transaction ID required' }, { status: 400 });
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

    // Update the post with blockchain transaction ID if post_id provided
    if (post_id) {
      try {
        await base44.asServiceRole.entities.Post.update(post_id, {
          blockchain_tx_id: blockchain_tx_id
        });
        console.log('[timestampOnBlockchain] Post updated with blockchain_tx_id');
      } catch (updateError) {
        console.error('[timestampOnBlockchain] Failed to update post:', updateError.message);
        // Refund on failure
        await base44.asServiceRole.entities.User.update(user.id, {
          token_balance: currentBalance
        });
        return Response.json({ error: 'Failed to update post with transaction ID' }, { status: 500 });
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
        transaction_id: blockchain_tx_id
      });
      console.log('[timestampOnBlockchain] Revenue logged');
    } catch (revenueError) {
      console.error('[timestampOnBlockchain] Failed to log revenue:', revenueError.message);
      // Don't fail the whole operation
    }

    console.log('[timestampOnBlockchain] === SUCCESS ===');
    return Response.json({
      success: true,
      blockchain_tx_id: blockchain_tx_id,
      fee_charged: EQOFLO_FEE,
      new_balance: newBalance,
      explorer_url: `https://explorer.solana.com/tx/${blockchain_tx_id}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[timestampOnBlockchain] === FATAL ERROR ===');
    console.error('[timestampOnBlockchain] Error type:', error.constructor.name);
    console.error('[timestampOnBlockchain] Error message:', error.message);
    console.error('[timestampOnBlockchain] Stack trace:', error.stack);

    return Response.json({ 
      error: error.message || 'Failed to process blockchain timestamp',
      type: error.constructor.name
    }, { status: 500 });
  }
});