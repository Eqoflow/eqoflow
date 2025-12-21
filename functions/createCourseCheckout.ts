import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('❌ User not authenticated');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('📦 Request body:', body);
    
    const { course_id, student_email } = body;

    if (!course_id || !student_email) {
      console.error('❌ Missing course_id or student_email');
      return Response.json({ error: 'Missing course_id or student_email' }, { status: 400 });
    }

    // Fetch course details
    console.log('🔍 Fetching course:', course_id);
    const courses = await base44.asServiceRole.entities.Course.filter({ id: course_id });
    
    if (!courses || courses.length === 0) {
      console.error('❌ Course not found:', course_id);
      return Response.json({ error: 'Course not found' }, { status: 404 });
    }

    const course = courses[0];
    console.log('✅ Course found:', course.title, 'Price:', course.price_amount, course.currency);

    // Validate it's a paid course
    if (course.price_amount === 0) {
      console.error('❌ This is a free course');
      return Response.json({ error: 'This is a free course, no payment required' }, { status: 400 });
    }

    // Only handle fiat currency payments (QFLOW is handled in frontend)
    if (course.currency === 'QFLOW') {
      console.error('❌ QFLOW payments not supported via Stripe');
      return Response.json({ error: 'QFLOW payments are handled directly, not via Stripe' }, { status: 400 });
    }

    // Convert currency to lowercase for Stripe
    const currency = course.currency.toLowerCase();
    console.log('💰 Currency for Stripe:', currency);

    // Calculate amount in cents/smallest unit
    const amountInCents = Math.round(course.price_amount * 100);
    console.log('💵 Amount in cents:', amountInCents);

    // Get origin for success/cancel URLs
    const origin = req.headers.get('origin') || 'https://quantum-flow-3c39d072.base44.app';
    console.log('🌐 Origin:', origin);

    // Create Stripe Checkout Session
    console.log('🔨 Creating Stripe checkout session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: student_email,
      client_reference_id: course_id,
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: course.title,
              description: course.description?.substring(0, 200) || 'EqoCourses - Learn and grow',
              images: course.thumbnail_url ? [course.thumbnail_url] : [],
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        course_id: course_id,
        student_email: student_email,
        instructor_email: course.creator_email,
        course_title: course.title,
        platform_fee_percentage: String(course.platform_fee_percentage || 10),
      },
      success_url: `${origin}/CourseViewer?id=${course_id}&payment=success`,
      cancel_url: `${origin}/KnowledgeHub?payment=cancelled`,
    });

    console.log('✅ Stripe session created:', session.id);
    console.log('🔗 Checkout URL:', session.url);

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('❌ Error creating course checkout:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    return Response.json({ 
      error: error.message,
      details: error.type || 'Unknown error'
    }, { status: 500 });
  }
});