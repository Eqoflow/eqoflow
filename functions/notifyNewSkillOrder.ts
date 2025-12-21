import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// This function should be called after a successful skill checkout
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { transactionId } = await req.json();

    if (!transactionId) {
      return Response.json({ error: 'Missing transactionId' }, { status: 400 });
    }

    // Get transaction details
    const transaction = await base44.entities.MarketplaceTransaction.get(transactionId);
    
    if (!transaction) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Send notification to seller about new order
    await base44.functions.invoke('sendMarketplaceNotification', {
      recipientEmail: transaction.seller_email,
      type: 'system',
      title: '🎊 New Order Received!',
      message: transaction.amount_total === 0 
        ? `You have a new free collaboration request for "${transaction.item_title}". Check your workroom to get started!`
        : `You've received a new order for "${transaction.item_title}" worth $${transaction.amount_total.toFixed(2)}. The payment is securely held in escrow. Check your workroom to get started!`,
      relatedContentId: transaction.id,
      relatedContentType: 'skill',
      actionUrl: `/SkillWorkroom?transactionId=${transaction.id}`,
      metadata: {
        amount: transaction.amount_total,
        buyer_email: transaction.buyer_email,
        transaction_id: transaction.id
      }
    });

    // Send notification to buyer confirming payment/order
    await base44.functions.invoke('sendMarketplaceNotification', {
      recipientEmail: transaction.buyer_email,
      type: 'system',
      title: '✅ Order Confirmed!',
      message: transaction.amount_total === 0
        ? `Your collaboration request for "${transaction.item_title}" has been sent to the seller. Check your workroom to coordinate.`
        : `Your payment of $${transaction.amount_total.toFixed(2)} for "${transaction.item_title}" has been received and is held securely in escrow. The seller has been notified and will begin work shortly.`,
      relatedContentId: transaction.id,
      relatedContentType: 'skill',
      actionUrl: `/SkillWorkroom?transactionId=${transaction.id}`,
      metadata: {
        amount: transaction.amount_total,
        seller_email: transaction.seller_email,
        transaction_id: transaction.id
      }
    });

    return Response.json({ 
      success: true,
      message: 'Notifications sent successfully' 
    });

  } catch (error) {
    console.error('Error sending new order notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});