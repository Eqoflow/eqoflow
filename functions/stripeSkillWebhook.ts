import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SKILLSMARKET');

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      endpointSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        console.log('Checkout session completed');
        console.log('Payment status:', session.payment_status);
        console.log('Metadata:', session.metadata);

        if (session.payment_status !== 'paid') {
          console.log('Payment not completed, status:', session.payment_status);
          break;
        }

        const transactionId = session.metadata?.transaction_id;
        const buyerEmail = session.metadata?.buyer_email;
        const sellerEmail = session.metadata?.seller_email;

        if (!transactionId) {
          console.error('No transaction_id found in metadata');
          break;
        }

        console.log('Updating transaction:', transactionId);

        await base44.asServiceRole.entities.MarketplaceTransaction.update(transactionId, {
          processor_transaction_id: session.payment_intent || session.id,
          status: 'held_in_escrow',
          notes: 'Payment successful - funds held in escrow until work completion'
        });

        console.log('Transaction updated successfully');

        // Create notifications
        console.log('Creating seller notification');
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: sellerEmail,
          type: 'system',
          message: 'New order received! Check your Skills Inbox.',
          actor_email: 'system@eqoflow.com',
          actor_name: 'EqoFlow',
          actor_avatar: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/5c056ed12_eqoflow-removebg-preview.png',
          related_content_id: transactionId,
          related_content_type: 'skill',
          action_url: '/SkillsInbox',
          is_read: false
        });

        console.log('Creating buyer notification');
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: buyerEmail,
          type: 'system',
          message: 'Payment successful! Funds held securely.',
          actor_email: 'system@eqoflow.com',
          actor_name: 'EqoFlow',
          actor_avatar: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/5c056ed12_eqoflow-removebg-preview.png',
          related_content_id: transactionId,
          related_content_type: 'skill',
          action_url: '/SkillsInbox',
          is_read: false
        });

        console.log('Notifications created successfully');
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const transactionId = session.metadata?.transaction_id;

        if (transactionId) {
          await base44.asServiceRole.entities.MarketplaceTransaction.update(transactionId, {
            status: 'cancelled',
            notes: 'Checkout session expired'
          });
          console.log('Transaction cancelled due to expired checkout');
        }
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        const transactionId = session.metadata?.transaction_id;

        if (transactionId) {
          await base44.asServiceRole.entities.MarketplaceTransaction.update(transactionId, {
            status: 'cancelled',
            notes: 'Payment failed'
          });
          console.log('Transaction cancelled due to failed payment');
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});