import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId } = await req.json();

    if (!transactionId) {
      return Response.json({ error: 'Missing transactionId' }, { status: 400 });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    // Get the transaction
    const transaction = await base44.entities.MarketplaceTransaction.get(transactionId);
    
    if (!transaction) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify user is buyer or seller
    if (transaction.buyer_email !== user.email && transaction.seller_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If already processed, return current status
    if (transaction.status !== 'pending_payment') {
      return Response.json({
        success: true,
        status: transaction.status,
        alreadyProcessed: true
      });
    }

    // Check with Stripe
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    
    try {
      const session = await stripe.checkout.sessions.retrieve(transaction.processor_transaction_id);
      
      console.log('[checkPaymentStatus] Session status:', session.payment_status);
      console.log('[checkPaymentStatus] Session ID:', session.id);

      if (session.payment_status === 'paid') {
        // Manually update transaction to held_in_escrow
        await base44.asServiceRole.entities.MarketplaceTransaction.update(transactionId, {
          status: 'held_in_escrow',
          notes: 'Payment verified manually - funds held in escrow'
        });

        console.log('[checkPaymentStatus] ✅ Manually updated transaction to held_in_escrow');

        // Send notifications
        try {
          await base44.functions.invoke('sendMarketplaceNotification', {
            recipientEmail: transaction.seller_email,
            type: 'skill',
            title: 'New Order Received! 🎉',
            message: `You have a new order! A buyer is ready to work with you. Check your Skills Inbox to get started.`,
            relatedContentId: transactionId,
            relatedContentType: 'skill',
            actionUrl: `/SkillsInbox`,
            metadata: {
              transaction_id: transactionId,
              buyer_email: transaction.buyer_email
            }
          });

          await base44.functions.invoke('sendMarketplaceNotification', {
            recipientEmail: transaction.buyer_email,
            type: 'skill',
            title: 'Payment Successful! ✅',
            message: `Your payment has been received and funds are held securely. The seller has been notified and will begin work soon.`,
            relatedContentId: transactionId,
            relatedContentType: 'skill',
            actionUrl: `/SkillsInbox`,
            metadata: {
              transaction_id: transactionId,
              seller_email: transaction.seller_email
            }
          });
        } catch (notifError) {
          console.error('[checkPaymentStatus] Error sending notifications:', notifError);
        }

        return Response.json({
          success: true,
          status: 'held_in_escrow',
          updated: true
        });
      } else {
        return Response.json({
          success: true,
          status: transaction.status,
          stripeStatus: session.payment_status
        });
      }
    } catch (stripeError) {
      console.error('[checkPaymentStatus] Stripe error:', stripeError);
      return Response.json({
        error: 'Failed to verify payment with Stripe',
        details: stripeError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[checkPaymentStatus] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});