import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_EQOCOURSES');
    
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

    console.log('Received Stripe EqoCourses webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);

        if (session.mode === 'subscription') {
          const customerEmail = session.customer_details?.email || session.customer_email;
          const subscriptionId = session.subscription;

          if (!customerEmail) {
            console.error('No customer email found in session');
            return Response.json({ error: 'No customer email' }, { status: 400 });
          }

          // Retrieve the subscription to get the price ID and period dates
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;

          // Map price ID to course upload plan
          const planMapping = {
            'price_1SMpNc2KsMoELOOVBkl4qyZz': 'tutor',      // Tutor Plan - 5 courses/month
            'price_1SMpVI2KsMoELOOVJqMRczhm': 'master',    // Master Plan - Unlimited
          };

          const plan = planMapping[priceId] || 'free';

          // Convert Unix timestamps (seconds) to JavaScript Date (milliseconds)
          const startDate = new Date(subscription.current_period_start * 1000).toISOString();
          const endDate = new Date(subscription.current_period_end * 1000).toISOString();

          // Update user course upload plan
          const users = await base44.asServiceRole.entities.User.filter({ email: customerEmail });
          if (users.length > 0) {
            await base44.asServiceRole.entities.User.update(users[0].id, {
              course_upload_plan: plan,
              courses_uploaded_this_month: 0,
              last_course_upload_reset: new Date().toISOString()
            });
            console.log(`Updated user ${customerEmail} to ${plan} course upload plan`);
          }

          // Create subscription record
          await base44.asServiceRole.entities.Subscription.create({
            subscriber_email: customerEmail,
            creator_email: 'eqocourses@platform.com',
            subscription_type: 'monthly',
            amount_usd: subscription.items.data[0]?.price.unit_amount / 100,
            platform_fee_usd: (subscription.items.data[0]?.price.unit_amount / 100) * 0.15,
            creator_payout_usd: (subscription.items.data[0]?.price.unit_amount / 100) * 0.85,
            status: 'active',
            start_date: startDate,
            end_date: endDate,
            auto_renew: !subscription.cancel_at_period_end
          });

          console.log(`Course upload subscription created for ${customerEmail}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerEmail = subscription.customer;

        // Get customer email from Stripe
        const customer = await stripe.customers.retrieve(customerEmail);
        const email = customer.email;

        if (!email) {
          console.error('No email found for customer:', customerEmail);
          return Response.json({ error: 'No customer email' }, { status: 400 });
        }

        const priceId = subscription.items.data[0]?.price.id;

        // Map price ID to course upload plan
        const planMapping = {
          'price_1SMpNc2KsMoELOOVBkl4qyZz': 'tutor',      // Tutor Plan - 5 courses/month
          'price_1SMpVI2KsMoELOOVJqMRczhm': 'master',    // Master Plan - Unlimited
        };

        const plan = planMapping[priceId] || 'free';

        // Update user course upload plan
        const users = await base44.asServiceRole.entities.User.filter({ email });
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            course_upload_plan: plan
          });
          console.log(`Updated user ${email} course upload plan to ${plan}`);
        }

        // Update subscription record status
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
          subscriber_email: email,
          creator_email: 'eqocourses@platform.com',
          status: 'active'
        });

        if (subscriptions.length > 0) {
          // Convert Unix timestamps (seconds) to JavaScript Date (milliseconds)
          const endDate = new Date(subscription.current_period_end * 1000).toISOString();
          
          await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
            end_date: endDate,
            auto_renew: !subscription.cancel_at_period_end,
            status: subscription.status === 'active' ? 'active' : 'cancelled'
          });
        }

        console.log(`Course upload subscription updated for ${email}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerEmail = subscription.customer;

        // Get customer email from Stripe
        const customer = await stripe.customers.retrieve(customerEmail);
        const email = customer.email;

        if (!email) {
          console.error('No email found for customer:', customerEmail);
          return Response.json({ error: 'No customer email' }, { status: 400 });
        }

        // Update user to free plan
        const users = await base44.asServiceRole.entities.User.filter({ email });
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            course_upload_plan: 'free'
          });
          console.log(`Downgraded user ${email} to free course upload plan`);
        }

        // Mark subscription as cancelled
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
          subscriber_email: email,
          creator_email: 'eqocourses@platform.com',
          status: 'active'
        });

        if (subscriptions.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
            status: 'cancelled'
          });
        }

        console.log(`Course upload subscription cancelled for ${email}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('Course subscription invoice payment succeeded:', invoice.id);
        
        // Reset monthly upload counter on successful recurring payment
        const customerEmail = invoice.customer;
        const customer = await stripe.customers.retrieve(customerEmail);
        const email = customer.email;

        if (email) {
          const users = await base44.asServiceRole.entities.User.filter({ email });
          if (users.length > 0) {
            await base44.asServiceRole.entities.User.update(users[0].id, {
              courses_uploaded_this_month: 0,
              last_course_upload_reset: new Date().toISOString()
            });
            console.log(`Reset monthly upload counter for ${email}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Course subscription invoice payment failed:', invoice.id);
        // Handle failed payment - could send notification to user
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Error processing EqoCourses webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});