import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_EQOCOURSES');

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

        const courseId = session.metadata?.course_id;
        const studentEmail = session.metadata?.student_email;
        const instructorEmail = session.metadata?.instructor_email;
        const courseTitle = session.metadata?.course_title;
        const platformFeePercentage = parseFloat(session.metadata?.platform_fee_percentage) || 10;

        if (!courseId || !studentEmail || !instructorEmail) {
          console.error('Missing required metadata');
          break;
        }

        console.log('Creating enrollment for course:', courseId);

        const amountPaid = session.amount_total / 100;
        const currency = session.currency.toUpperCase();
        const platformFee = amountPaid * (platformFeePercentage / 100);
        const instructorPayout = amountPaid - platformFee;

        // Create enrollment
        await base44.asServiceRole.entities.CourseEnrollment.create({
          course_id: courseId,
          course_title: courseTitle || 'Unknown Course',
          student_email: studentEmail,
          student_name: session.customer_details?.name || 'Unknown',
          instructor_email: instructorEmail,
          enrollment_type: 'paid',
          amount_paid: amountPaid,
          currency: currency,
          payment_status: 'completed',
          stripe_payment_intent_id: session.payment_intent || session.id,
          stripe_checkout_session_id: session.id,
          progress_percentage: 0,
          completed: false,
          completed_lessons: []
        });

        console.log('Enrollment created successfully');

        // Update course stats
        const courses = await base44.asServiceRole.entities.Course.filter({ id: courseId });
        if (courses && courses.length > 0) {
          const course = courses[0];
          await base44.asServiceRole.entities.Course.update(courseId, {
            enrolled_count: (course.enrolled_count || 0) + 1,
            total_revenue: (course.total_revenue || 0) + amountPaid
          });
          console.log('Course stats updated');
        }

        // Record platform revenue
        await base44.asServiceRole.entities.PlatformRevenue.create({
          revenue_source: 'course_sale',
          amount_usd: platformFee,
          related_transaction_id: session.id,
          creator_email: instructorEmail,
          description: `Platform fee from course: ${courseTitle || 'Unknown'}`
        });

        // Create marketplace transaction
        await base44.asServiceRole.entities.MarketplaceTransaction.create({
          item_id: courseId,
          item_type: 'course_enrollment',
          item_title: courseTitle || 'Unknown Course',
          buyer_email: studentEmail,
          seller_email: instructorEmail,
          amount_total: amountPaid,
          amount_platform_fee: platformFee,
          amount_seller_payout: instructorPayout,
          currency: currency,
          payment_processor: 'stripe',
          processor_transaction_id: session.payment_intent || session.id,
          status: 'completed',
          payout_status: 'due',
          notes: `Course enrollment via Stripe`
        });

        // Create notifications
        console.log('Creating student notification');
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: studentEmail,
          type: 'system',
          message: `Enrollment confirmed! Start learning: ${courseTitle}`,
          actor_email: 'system@eqoflow.com',
          actor_name: 'EqoFlow',
          actor_avatar: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/5c056ed12_eqoflow-removebg-preview.png',
          related_content_id: courseId,
          related_content_type: 'course',
          action_url: `/CourseViewer?id=${courseId}`,
          is_read: false
        });

        console.log('Creating instructor notification');
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: instructorEmail,
          type: 'system',
          message: `New student enrolled in: ${courseTitle}`,
          actor_email: 'system@eqoflow.com',
          actor_name: 'EqoFlow',
          actor_avatar: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/5c056ed12_eqoflow-removebg-preview.png',
          related_content_id: courseId,
          related_content_type: 'course',
          action_url: `/KnowledgeHub`,
          is_read: false
        });

        console.log('Notifications created successfully');
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        console.log('Checkout session expired:', session.id);
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        console.log('Payment failed:', session.id);
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