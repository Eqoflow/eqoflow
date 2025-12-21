import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_EQOCHAMBERS');
    
    if (!signature || !webhookSecret) {
      return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    const body = await req.text();
    
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    console.log('Received Stripe community membership event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata;

        console.log('Processing community membership payment:', metadata);

        // Get community
        const community = await base44.asServiceRole.entities.Community.get(metadata.community_id);
        
        if (!community) {
          console.error('Community not found:', metadata.community_id);
          return Response.json({ error: 'Community not found' }, { status: 404 });
        }

        // Add user to community members
        const currentMembers = community.member_emails || [];
        if (!currentMembers.includes(metadata.user_email)) {
          const updatedMembers = [...currentMembers, metadata.user_email];
          
          await base44.asServiceRole.entities.Community.update(metadata.community_id, {
            member_emails: updatedMembers,
            active_subscribers: (community.active_subscribers || 0) + 1
          });
        }

        // Create marketplace transaction record
        await base44.asServiceRole.entities.MarketplaceTransaction.create({
          item_id: metadata.community_id,
          item_type: 'community_access',
          item_title: metadata.community_name,
          buyer_email: metadata.user_email,
          seller_email: metadata.creator_email,
          amount_total: parseFloat(session.amount_total) / 100,
          amount_platform_fee: parseFloat(metadata.platform_fee_cents) / 100,
          amount_seller_payout: parseFloat(metadata.creator_payout_cents) / 100,
          currency: session.currency.toUpperCase(),
          payment_processor: 'stripe',
          processor_transaction_id: session.id,
          status: 'completed',
          payout_status: 'due',
          notes: `Community membership - ${metadata.subscription_type}`
        });

        // Update community total revenue
        const revenueToAdd = parseFloat(session.amount_total) / 100;
        await base44.asServiceRole.entities.Community.update(metadata.community_id, {
          total_revenue: (community.total_revenue || 0) + revenueToAdd
        });

        // Send notification to user
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: metadata.user_email,
          type: 'system',
          message: `Welcome to ${metadata.community_name}! Your membership is now active.`,
          actor_email: 'system@eqoflow.com',
          actor_name: 'EqoFlow',
          actor_avatar: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/5c056ed12_eqoflow-removebg-preview.png',
          related_content_id: metadata.community_id,
          related_content_type: 'community',
          action_url: `/CommunityProfile?id=${metadata.community_id}`,
          is_read: false
        });

        // Send notification to creator
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: metadata.creator_email,
          type: 'system',
          message: `${metadata.user_name} joined your community "${metadata.community_name}"!`,
          actor_email: metadata.user_email,
          actor_name: metadata.user_name,
          actor_avatar: '',
          related_content_id: metadata.community_id,
          related_content_type: 'community',
          action_url: `/CommunityProfile?id=${metadata.community_id}`,
          is_read: false
        });

        console.log('Successfully processed community membership payment');
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Get the checkout session to find metadata
        const sessions = await stripe.checkout.sessions.list({
          subscription: subscription.id,
          limit: 1
        });

        if (sessions.data.length > 0) {
          const session = sessions.data[0];
          const metadata = session.metadata;

          if (subscription.status === 'canceled' || event.type === 'customer.subscription.deleted') {
            // Remove user from community members
            const community = await base44.asServiceRole.entities.Community.get(metadata.community_id);
            
            if (community && community.member_emails) {
              const updatedMembers = community.member_emails.filter(email => email !== metadata.user_email);
              
              await base44.asServiceRole.entities.Community.update(metadata.community_id, {
                member_emails: updatedMembers,
                active_subscribers: Math.max(0, (community.active_subscribers || 0) - 1)
              });

              // Notify user
              await base44.asServiceRole.entities.Notification.create({
                recipient_email: metadata.user_email,
                type: 'system',
                message: `Your subscription to ${metadata.community_name} has been cancelled.`,
                actor_email: 'system@eqoflow.com',
                actor_name: 'EqoFlow',
                actor_avatar: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/5c056ed12_eqoflow-removebg-preview.png',
                related_content_id: metadata.community_id,
                related_content_type: 'community',
                is_read: false
              });
            }
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        
        // This handles recurring subscription payments
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          
          // Get the original checkout session
          const sessions = await stripe.checkout.sessions.list({
            subscription: subscription.id,
            limit: 1
          });

          if (sessions.data.length > 0) {
            const session = sessions.data[0];
            const metadata = session.metadata;

            // Create transaction record for recurring payment
            const totalAmount = invoice.amount_paid / 100;
            const platformFee = totalAmount * 0.15;
            const creatorPayout = totalAmount - platformFee;

            await base44.asServiceRole.entities.MarketplaceTransaction.create({
              item_id: metadata.community_id,
              item_type: 'community_access',
              item_title: metadata.community_name,
              buyer_email: metadata.user_email,
              seller_email: metadata.creator_email,
              amount_total: totalAmount,
              amount_platform_fee: platformFee,
              amount_seller_payout: creatorPayout,
              currency: invoice.currency.toUpperCase(),
              payment_processor: 'stripe',
              processor_transaction_id: invoice.id,
              status: 'completed',
              payout_status: 'due',
              notes: `Recurring subscription payment - ${metadata.subscription_type}`
            });

            // Update community revenue
            const community = await base44.asServiceRole.entities.Community.get(metadata.community_id);
            if (community) {
              await base44.asServiceRole.entities.Community.update(metadata.community_id, {
                total_revenue: (community.total_revenue || 0) + totalAmount
              });
            }
          }
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: 'Webhook processing failed',
      details: error.message 
    }, { status: 500 });
  }
});