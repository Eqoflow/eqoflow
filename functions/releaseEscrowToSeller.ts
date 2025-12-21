import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only buyers or admins can mark as complete
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId } = await req.json();

    if (!transactionId) {
      return Response.json({ error: 'Missing transactionId' }, { status: 400 });
    }

    // Get transaction details
    const transaction = await base44.entities.MarketplaceTransaction.get(transactionId);
    
    if (!transaction) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify user is the buyer or admin
    if (user.role !== 'admin' && user.email !== transaction.buyer_email) {
      return Response.json({ error: 'Only the buyer or admin can mark job as complete' }, { status: 403 });
    }

    // Check transaction is in escrow
    if (transaction.status !== 'held_in_escrow') {
      return Response.json({ 
        error: `Cannot mark as complete. Transaction status is: ${transaction.status}` 
      }, { status: 400 });
    }

    // Fetch seller's user data to get payout details
    const sellerUsers = await base44.asServiceRole.entities.User.filter({ email: transaction.seller_email });
    const seller = sellerUsers.length > 0 ? sellerUsers[0] : null;

    // Build payout information
    let payoutInfo = '';
    
    if (seller) {
      // Add Stripe payment link if available
      if (seller.stripe_payment_link) {
        payoutInfo += `\n\nStripe Payment Link: ${seller.stripe_payment_link}`;
      }
      
      // Add Square connect link if available
      if (seller.square_connect_link) {
        payoutInfo += `\n${seller.stripe_payment_link ? 'Square Connect Link' : 'Payment Link'}: ${seller.square_connect_link}`;
      }
      
      // Add bank details if available
      if (seller.bank_payout_details) {
        const bank = seller.bank_payout_details;
        payoutInfo += `\n\nBank Transfer Details:`;
        
        if (bank.account_holder_name) {
          payoutInfo += `\n  Account Holder: ${bank.account_holder_name}`;
        }
        
        if (bank.bank_name) {
          payoutInfo += `\n  Bank: ${bank.bank_name}`;
        }
        
        if (bank.country) {
          payoutInfo += `\n  Country: ${bank.country}`;
        }
        
        if (bank.iban) {
          payoutInfo += `\n  IBAN: ${bank.iban}`;
        }
        
        if (bank.bic_swift) {
          payoutInfo += `\n  BIC/SWIFT: ${bank.bic_swift}`;
        }
        
        if (bank.account_number) {
          payoutInfo += `\n  Account Number: ${bank.account_number}`;
        }
        
        if (bank.sort_code) {
          payoutInfo += `\n  Sort Code: ${bank.sort_code}`;
        }
        
        if (bank.routingNumber) {
          payoutInfo += `\n  Routing Number: ${bank.routingNumber}`;
        }
      }
      
      // If no payout methods available
      if (!seller.stripe_payment_link && !seller.square_connect_link && !seller.bank_payout_details) {
        payoutInfo += `\n\n⚠️ WARNING: Seller has not set up any payout methods yet. Please contact seller to provide payment details.`;
      }
    } else {
      payoutInfo += `\n\n⚠️ WARNING: Could not fetch seller's payout details.`;
    }

    // Update transaction status to release_to_seller
    const updatedNotes = `${transaction.notes || ''}\n\nBuyer marked job as complete on ${new Date().toISOString()}\nAwaiting admin payout processing${payoutInfo}`.trim();
    
    await base44.asServiceRole.entities.MarketplaceTransaction.update(transactionId, {
      status: 'release_to_seller',
      payout_status: 'due',
      notes: updatedNotes
    });

    // Send notification to seller about payment release
    try {
      await base44.functions.invoke('sendMarketplaceNotification', {
        recipientEmail: transaction.seller_email,
        type: 'system',
        title: '💰 Payment Released!',
        message: `The buyer has marked the job as complete for "${transaction.item_title}". Your payout of $${transaction.amount_seller_payout.toFixed(2)} is being processed by admins.`,
        relatedContentId: transaction.id,
        relatedContentType: 'skill',
        actionUrl: `/SkillWorkroom?transactionId=${transaction.id}`,
        metadata: {
          amount: transaction.amount_seller_payout,
          payout_status: 'processing'
        }
      });
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }

    // Send notification to buyer confirming release
    try {
      await base44.functions.invoke('sendMarketplaceNotification', {
        recipientEmail: transaction.buyer_email,
        type: 'system',
        title: '✅ Job Marked Complete',
        message: `You've successfully marked the job as complete for "${transaction.item_title}". The seller will be paid $${transaction.amount_seller_payout.toFixed(2)} once an admin processes the payout.`,
        relatedContentId: transaction.id,
        relatedContentType: 'skill',
        actionUrl: `/SkillWorkroom?transactionId=${transaction.id}`,
        metadata: {
          amount: transaction.amount_seller_payout
        }
      });
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }

    return Response.json({
      success: true,
      message: 'Job marked as complete. Admin will process payout.',
      amount: transaction.amount_seller_payout
    });

  } catch (error) {
    console.error('Error marking job as complete:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});