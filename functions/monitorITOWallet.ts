import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { Connection, PublicKey } from 'npm:@solana/web3.js@1.95.8';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const walletAddress = 'FQnEUeAozEnUCVRMGDhNsZSu4EzxepvJqLUkDWJT86Hh';
    const tokenPrice = 0.008;
    const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    const walletPubkey = new PublicKey(walletAddress);

    const signatures = await connection.getSignaturesForAddress(walletPubkey, { limit: 50 });

    console.log(`Found ${signatures.length} transactions`);

    let newDepositsCount = 0;

    for (const sigInfo of signatures) {
      const signature = sigInfo.signature;

      const existing = await base44.asServiceRole.entities.ITOTransaction.filter({
        transaction_hash: signature,
      });

      if (existing.length > 0) {
        continue;
      }

      const txDetails = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!txDetails || !txDetails.meta || !txDetails.transaction) {
        console.log(`Skipping signature ${signature} - no details`);
        continue;
      }

      const preBalances = txDetails.meta.preTokenBalances || [];
      const postBalances = txDetails.meta.postTokenBalances || [];

      let usdcReceived = 0;
      let fromAddress = null;

      for (const postBal of postBalances) {
        if (
          postBal.mint === usdcMint &&
          postBal.owner === walletAddress
        ) {
          const preBal = preBalances.find(
            (pb) =>
              pb.accountIndex === postBal.accountIndex &&
              pb.mint === usdcMint &&
              pb.owner === walletAddress
          );

          const preAmount = preBal
            ? parseFloat(preBal.uiTokenAmount.uiAmountString || '0')
            : 0;
          const postAmount = parseFloat(postBal.uiTokenAmount.uiAmountString || '0');

          const diff = postAmount - preAmount;
          if (diff > 0) {
            usdcReceived = diff;
            break;
          }
        }
      }

      if (usdcReceived > 0) {
        const instructions = txDetails.transaction.message.instructions;
        for (const ix of instructions) {
          if (ix.parsed && ix.parsed.type === 'transfer') {
            fromAddress = ix.parsed.info.source;
            break;
          } else if (ix.parsed && ix.parsed.type === 'transferChecked') {
            fromAddress = ix.parsed.info.source;
            break;
          }
        }

        if (!fromAddress) {
          const accountKeys = txDetails.transaction.message.accountKeys;
          if (accountKeys && accountKeys.length > 0) {
            fromAddress = accountKeys[0].pubkey.toString();
          }
        }

        const tokensAllocated = usdcReceived / tokenPrice;

        await base44.asServiceRole.entities.ITOTransaction.create({
          transaction_hash: signature,
          from_address: fromAddress || 'unknown',
          amount_usdc: usdcReceived,
          token_price_at_deposit: tokenPrice,
          tokens_allocated: tokensAllocated,
          phase_name: 'Phase 1',
          status: 'confirmed',
          claimed: false,
        });

        newDepositsCount++;
        console.log(
          `Recorded deposit: ${usdcReceived} USDC from ${fromAddress || 'unknown'} -> ${tokensAllocated} $EQOFLO`
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Wallet monitoring complete. Found ${newDepositsCount} new deposit(s).`,
        newDeposits: newDepositsCount,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error monitoring ITO wallet:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});