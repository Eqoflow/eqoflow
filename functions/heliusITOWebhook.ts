
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get the webhook secret from environment
    const webhookSecret = Deno.env.get('HELIUS_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      console.error('HELIUS_WEBHOOK_SECRET not configured');
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Get the signature from headers
    const heliusSignature = req.headers.get('helius-signature');
    
    // Read the request body
    const body = await req.text();
    
    console.log('=== HELIUS WEBHOOK DEBUG ===');
    console.log('Received helius-signature header:', heliusSignature);
    console.log('Body length:', body.length);

    // Verify the signature
    if (heliusSignature) {
      const hmac = createHmac('sha256', webhookSecret);
      hmac.update(body);
      const calculatedSignature = hmac.digest('hex');
      
      console.log('Calculated signature:', calculatedSignature);
      console.log('Signatures match:', calculatedSignature === heliusSignature);
      
      if (calculatedSignature !== heliusSignature) {
        console.error('Invalid webhook signature');
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('No helius-signature header found - proceeding without verification');
    }

    console.log('===========================');

    // Parse the webhook payload
    const webhookData = JSON.parse(body);
    
    console.log('Webhook event received:', webhookData.type || 'unknown type');
    console.log('Transaction data:', JSON.stringify(webhookData, null, 2));

    // Extract transaction details
    const transaction = webhookData[0]; // Helius sends array of transactions
    
    if (!transaction) {
      console.error('No transaction data in webhook');
      return Response.json({ error: 'No transaction data' }, { status: 400 });
    }

    const signature = transaction.signature;
    const accountData = transaction.accountData || [];
    const nativeTransfers = transaction.nativeTransfers || [];
    const tokenTransfers = transaction.tokenTransfers || [];

    console.log('Processing transaction:', signature);
    console.log('Native transfers:', nativeTransfers.length);
    console.log('Token transfers:', tokenTransfers.length);

    // ITO wallet address (the one receiving USDC)
    const ITO_WALLET = Deno.env.get('ITO_WALLET_ADDRESS');
    
    if (!ITO_WALLET) {
      console.error('ITO_WALLET_ADDRESS not configured');
      return Response.json({ error: 'ITO wallet not configured' }, { status: 500 });
    }

    console.log('ITO Wallet configured:', ITO_WALLET);

    // USDC mint address on Solana
    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

    // Process token transfers - Helius provides this in a different format
    const relevantTransfers = [];
    
    for (const account of accountData) {
      if (account.tokenBalanceChanges && account.tokenBalanceChanges.length > 0) {
        for (const tokenChange of account.tokenBalanceChanges) {
          if (tokenChange.mint === USDC_MINT && 
              tokenChange.userAccount === ITO_WALLET &&
              parseInt(tokenChange.rawTokenAmount.tokenAmount) > 0) {
            
            // This is a USDC deposit to our ITO wallet
            const amountRaw = parseInt(tokenChange.rawTokenAmount.tokenAmount);
            const decimals = tokenChange.rawTokenAmount.decimals;
            const amountUSDC = amountRaw / Math.pow(10, decimals);
            
            // Find the sender (look for the negative balance change)
            let fromAddress = null;
            for (const acc of accountData) {
              if (acc.tokenBalanceChanges) {
                for (const change of acc.tokenBalanceChanges) {
                  if (change.mint === USDC_MINT && 
                      parseInt(change.rawTokenAmount.tokenAmount) < 0) {
                    fromAddress = change.userAccount;
                    break;
                  }
                }
              }
              if (fromAddress) break;
            }
            
            if (fromAddress) {
              relevantTransfers.push({
                fromUserAccount: fromAddress,
                toUserAccount: ITO_WALLET,
                tokenAmount: amountUSDC,
                mint: USDC_MINT
              });
            }
          }
        }
      }
    }

    console.log('Relevant USDC transfers found:', relevantTransfers.length);

    if (relevantTransfers.length === 0) {
      console.log('No USDC deposits to ITO wallet in this transaction');
      return Response.json({ message: 'No relevant deposits' }, { status: 200 });
    }

    // HARDCODED Phase 1 pricing - CHANGE THIS WHEN MOVING TO PHASE 2!
    const tokenPriceUSD = 0.008; // Phase 1: $0.008 per token
    const phaseName = 'Phase 1'; // MUST MATCH frontend filter!

    console.log(`Current ITO Phase: ${phaseName}, Price: $${tokenPriceUSD} per token`);

    // Process each USDC deposit
    for (const deposit of relevantTransfers) {
      const fromAddress = deposit.fromUserAccount;
      const amountUSDC = deposit.tokenAmount;
      const tokensAllocated = amountUSDC / tokenPriceUSD;

      console.log('=== PROCESSING DEPOSIT ===');
      console.log('From:', fromAddress);
      console.log('Amount USDC:', amountUSDC);
      console.log('Tokens Allocated:', tokensAllocated);
      console.log('========================');

      // Check if transaction already exists
      const existingTransactions = await base44.asServiceRole.entities.ITOTransaction.filter({
        transaction_hash: signature
      });

      if (existingTransactions.length > 0) {
        console.log('Transaction already recorded, skipping');
        continue;
      }

      // Create ITO transaction record
      await base44.asServiceRole.entities.ITOTransaction.create({
        transaction_hash: signature,
        from_address: fromAddress,
        amount_usdc: amountUSDC,
        token_price_at_deposit: tokenPriceUSD,
        tokens_allocated: tokensAllocated,
        phase_name: phaseName,
        status: 'confirmed'
      });

      console.log(`✅ Successfully recorded ITO transaction: ${signature}`);
      console.log(`📊 ${fromAddress} deposited ${amountUSDC} USDC → ${tokensAllocated} $QFLOW tokens`);
    }

    return Response.json({ 
      success: true,
      message: 'ITO deposits processed successfully',
      deposits_processed: relevantTransfers.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing Helius webhook:', error);
    return Response.json({ 
      error: 'Webhook processing failed',
      message: error.message 
    }, { status: 500 });
  }
});
