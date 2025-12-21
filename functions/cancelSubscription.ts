import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionType, cancelType = 'end_of_period', itemId } = await req.json();

    // Validate subscription type
    const validTypes = ['eqo_plus', 'community', 'course_upload'];
    if (!validTypes.includes(subscriptionType)) {
      return Response.json({ 
        error: 'Invalid subscription type. Must be one of: eqo_plus, community, course_upload' 
      }, { status: 400 });
    }

    // Handle Eqo+ subscription cancellation
    if (subscriptionType === 'eqo_plus') {
      if (!currentUser.stripe_subscription_id) {
        return Response.json({ 
          error: 'No active Eqo+ subscription found' 
        }, { status: 400 });
      }

      try {
        if (cancelType === 'immediate') {
          // Cancel immediately and issue refund
          await stripe.subscriptions.cancel(currentUser.stripe_subscription_id, {
            prorate: true,
            invoice_now: true,
          });
        } else {
          // Cancel at end of billing period
          await stripe.subscriptions.update(currentUser.stripe_subscription_id, {
            cancel_at_period_end: true,
          });
        }
      } catch (stripeError) {
        // If Stripe says subscription doesn't exist, it's already cancelled
        console.log('Stripe subscription not found, cleaning up database:', stripeError.message);
        
        // Continue to clean up the database record below
      }

      // Update user to free tier or set to canceling
      if (cancelType === 'immediate') {
        await base44.asServiceRole.entities.User.update(currentUser.id, {
          subscription_tier: 'free',
          subscription_status: 'cancelled',
          stripe_subscription_id: null,
          stripe_customer_id: null,
        });

        return Response.json({ 
          success: true, 
          message: 'Eqo+ subscription cancelled successfully. You have been downgraded to the free tier.' 
        });
      } else {
        await base44.asServiceRole.entities.User.update(currentUser.id, {
          subscription_tier: 'free',
          subscription_status: 'cancelled',
          stripe_subscription_id: null,
        });

        return Response.json({ 
          success: true, 
          message: 'Eqo+ subscription cancelled successfully. You have been downgraded to the free tier.' 
        });
      }
    }

    // Handle course upload plan cancellation
    if (subscriptionType === 'course_upload') {
      // Check if user has a Stripe subscription for course uploads
      if (!currentUser.stripe_course_subscription_id) {
        // If no Stripe subscription found, just downgrade to free
        await base44.asServiceRole.entities.User.update(currentUser.id, {
          course_upload_plan: 'free',
          courses_uploaded_this_month: 0
        });
        
        return Response.json({ 
          success: true, 
          message: 'Course upload plan downgraded to free' 
        });
      }

      try {
        if (cancelType === 'immediate') {
          // Cancel immediately and issue refund
          await stripe.subscriptions.cancel(currentUser.stripe_course_subscription_id, {
            prorate: true,
            invoice_now: true,
          });
        } else {
          // Cancel at end of billing period
          await stripe.subscriptions.update(currentUser.stripe_course_subscription_id, {
            cancel_at_period_end: true,
          });
        }
      } catch (stripeError) {
        // If Stripe says subscription doesn't exist, it's already cancelled
        console.log('Stripe course subscription not found, cleaning up database:', stripeError.message);
      }

      // Downgrade to free plan
      await base44.asServiceRole.entities.User.update(currentUser.id, {
        course_upload_plan: 'free',
        courses_uploaded_this_month: 0,
        stripe_course_subscription_id: null
      });

      return Response.json({ 
        success: true, 
        message: 'Course upload plan cancelled successfully and downgraded to free.' 
      });
    }

    // Handle community membership cancellation
    if (subscriptionType === 'community') {
      if (!itemId) {
        return Response.json({ 
          error: 'Community ID required' 
        }, { status: 400 });
      }

      // Get the community
      const community = await base44.asServiceRole.entities.Community.get(itemId);
      if (!community) {
        return Response.json({ 
          error: 'Community not found' 
        }, { status: 404 });
      }

      // Remove user from community members
      const updatedMembers = (community.member_emails || []).filter(email => email !== currentUser.email);
      await base44.asServiceRole.entities.Community.update(itemId, {
        member_emails: updatedMembers,
        active_subscribers: Math.max(0, (community.active_subscribers || 0) - 1)
      });

      // Update the transaction status
      const transactions = await base44.asServiceRole.entities.MarketplaceTransaction.filter({
        buyer_email: currentUser.email,
        item_id: itemId,
        item_type: 'community_access'
      });

      if (transactions.length > 0) {
        await base44.asServiceRole.entities.MarketplaceTransaction.update(transactions[0].id, {
          status: 'cancelled',
          notes: 'Membership cancelled by user'
        });
      }

      return Response.json({ 
        success: true, 
        message: 'Community membership cancelled successfully' 
      });
    }

    return Response.json({ 
      error: 'Invalid subscription type' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return Response.json({ 
      error: error.message || 'Failed to cancel subscription',
      details: error.toString()
    }, { status: 500 });
  }
});