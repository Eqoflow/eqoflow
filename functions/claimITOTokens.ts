import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import nacl from 'npm:tweetnacl@1.0.3';
import bs58 from 'npm:bs58@5.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { walletAddress, message, signature } = await req.json();

    if (!walletAddress || !message || !signature) {
      return Response.json({ 
        error: 'Missing required parameters: walletAddress, message, and signature' 
      }, { status: 400 });
    }

    // Normalize wallet address for comparison
    const normalizedWalletAddress = walletAddress.trim().toLowerCase();

    // Verify the signature
    try {
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
      const walletPublicKey = bs58.decode(walletAddress);

      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        walletPublicKey
      );

      if (!isValid) {
        return Response.json({ 
          error: 'Invalid signature - wallet verification failed' 
        }, { status: 400 });
      }
    } catch (signatureError) {
      console.error('Signature verification error:', signatureError);
      return Response.json({ 
        error: 'Invalid signature format or verification failed' 
      }, { status: 400 });
    }

    // Use service role for database operations from here on
    const adminBase44 = base44.asServiceRole;

    // Check if this user has already claimed tokens
    const existingClaims = await adminBase44.entities.ITOClaim.filter({
      claimed_by_user_email: user.email
    });

    if (existingClaims.length > 0) {
      return Response.json({
        error: 'This account has already been claimed - please email support if you think there has been a mistake: support@eqoflow.app'
      }, { status: 400 });
    }

    // Check if this wallet address has already been used to claim (with normalization)
    const allClaims = await adminBase44.entities.ITOClaim.list();
    const existingWalletClaim = allClaims.find(claim => 
      claim.sending_wallet_address.trim().toLowerCase() === normalizedWalletAddress
    );

    if (existingWalletClaim) {
      return Response.json({
        error: 'This wallet address has already been claimed - please email support if you think there has been a mistake: support@eqoflow.app'
      }, { status: 400 });
    }

    // Find unclaimed transactions for this wallet address (with normalization)
    const allTransactions = await adminBase44.entities.ITOTransaction.list();
    const unclaimedTransactions = allTransactions.filter(tx => 
      tx.from_address.trim().toLowerCase() === normalizedWalletAddress && 
      !tx.claimed
    );

    if (unclaimedTransactions.length === 0) {
      return Response.json({
        error: 'No unclaimed transactions found for this wallet address'
      }, { status: 404 });
    }

    // Calculate total tokens to claim
    let totalTokensToClaim = 0;
    const transactionHashes = [];

    for (const transaction of unclaimedTransactions) {
      totalTokensToClaim += transaction.tokens_allocated;
      transactionHashes.push(transaction.transaction_hash);
    }

    // Mark all transactions as claimed
    for (const transaction of unclaimedTransactions) {
      await adminBase44.entities.ITOTransaction.update(transaction.id, {
        claimed: true,
        claimed_by_user_email: user.email,
        claimed_at: new Date().toISOString()
      });
    }

    // Create claim record (store original wallet address format)
    await adminBase44.entities.ITOClaim.create({
      sending_wallet_address: walletAddress.trim(),
      claimed_by_user_email: user.email,
      claimed_amount_qflow: totalTokensToClaim,
      claimed_at: new Date().toISOString(),
      associated_transaction_hashes: transactionHashes
    });

    // Fetch the latest user record to prevent race conditions with token balance
    const latestUser = await adminBase44.entities.User.get(user.id);
    const currentBalance = latestUser.token_balance || 0;

    // Add tokens to user's balance
    await adminBase44.entities.User.update(user.id, {
      token_balance: currentBalance + totalTokensToClaim
    });

    return Response.json({
      success: true,
      claimedAmount: totalTokensToClaim,
      transactionCount: unclaimedTransactions.length,
      message: `Successfully claimed ${totalTokensToClaim.toLocaleString()} $EQOFLO tokens from ${unclaimedTransactions.length} transaction(s)`
    });

  } catch (error) {
    console.error('Error in claimITOTokens:', error);
    return Response.json({
      error: 'Internal server error while processing claim'
    }, { status: 500 });
  }
});