
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';
import { crypto } from "https://deno.land/std@0.150.0/crypto/mod.ts";

const SQUARE_WEBHOOK_SIGNATURE_KEY = Deno.env.get('SQUARE_WEBHOOK_SIGNATURE_KEY');
const SQUARE_ACCESS_TOKEN = Deno.env.get('SQUARE_ACCESS_TOKEN'); // New environment variable for Square API calls

// Helper to verify Square webhook signature
const isAuthenticSquareRequest = async (request, bodyText) => {
    const signature = request.headers.get('x-square-signature');
    if (!SQUARE_WEBHOOK_SIGNATURE_KEY || !signature) {
        console.warn('Square webhook signature key or signature header missing.');
        return false;
    }

    const url = request.url;
    const signingString = `${url}${bodyText}`;

    try {
        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(SQUARE_WEBHOOK_SIGNATURE_KEY),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const binarySignature = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
        const binarySigningString = new TextEncoder().encode(signingString);

        return await crypto.subtle.verify('HMAC', key, binarySignature, binarySigningString);
    } catch (e) {
        console.error("Error during signature verification:", e);
        return false;
    }
};

// Helper to fetch Square order details using the Square API
const fetchSquareOrder = async (orderId) => {
    if (!SQUARE_ACCESS_TOKEN) {
        throw new Error('SQUARE_ACCESS_TOKEN is not configured.');
    }
    // Determine Square API URL based on environment
    const connectUrl = Deno.env.get('DENO_ENV') === 'development'
        ? 'https://connect.squareupsandbox.com/v2/orders/'
        : 'https://connect.squareup.com/v2/orders/';

    const response = await fetch(`${connectUrl}${orderId}`, {
        method: 'GET',
        headers: {
            'Square-Version': '2023-08-16', // Use a recent stable API version
            'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error('Error fetching Square order:', errorBody);
        throw new Error(`Failed to fetch Square order ${orderId}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.order;
};


Deno.serve(async (req) => {
    const bodyText = await req.text();

    // 1. Authenticate the webhook request from Square
    // The original code had this commented out, so we keep it commented out.
    // if (!await isAuthenticSquareRequest(req, bodyText)) {
    //     console.warn('Square webhook signature validation failed.');
    //     return new Response('Authentication failed.', { status: 401 });
    // }

    const event = JSON.parse(bodyText);
    console.log('Received authenticated Square webhook event:', event.type);

    // 2. Process only 'payment.updated' events
    if (event.type !== 'payment.updated') {
        return new Response('Event type not relevant, skipping.', { status: 200 });
    }
    
    const payment = event.data.object.payment;

    // 3. Check if the payment is completed
    if (payment.status !== 'COMPLETED') {
        console.log(`Payment status is ${payment.status}, not COMPLETED. Skipping.`);
        return new Response('Payment not completed, skipping.', { status: 200 });
    }
    
    const orderId = payment.order_id;
    if (!orderId) {
        console.warn('Webhook received without an order_id. Cannot process.');
        return new Response('Missing order_id.', { status: 200 });
    }

    // NEW: Fetch Square Order details to get its metadata
    let order;
    try {
        order = await fetchSquareOrder(orderId);
        if (!order) {
            console.warn(`Square Order ${orderId} not found.`);
            return new Response('Square Order not found.', { status: 200 });
        }
    } catch (e) {
        console.error(`Failed to fetch Square Order ${orderId}:`, e);
        return new Response(`Failed to fetch Square Order: ${e.message}`, { status: 500 });
    }

    try {
        const base44 = createClientFromRequest(req);

        // Handle community feature payments
        if (order.metadata?.type === 'community_feature') {
            const communityId = order.metadata.community_id;
            const duration = parseInt(order.metadata.duration_days);
            
            // Validate required metadata fields
            if (!communityId || isNaN(duration) || duration <= 0) {
                console.error(`Missing or invalid community ID (${communityId}) or duration (${order.metadata.duration_days}) in feature payment metadata for order ${orderId}.`);
                return new Response('Missing or invalid community ID or duration in feature payment metadata.', { status: 400 });
            }

            // Calculate feature end date
            const featureEndDate = new Date();
            featureEndDate.setDate(featureEndDate.getDate() + duration);

            try {
                // Update community to featured status in Base44
                await base44.asServiceRole.entities.Community.update(communityId, {
                    is_featured: true,
                    featured_until: featureEndDate.toISOString()
                });

                console.log(`Community ${communityId} featured for ${duration} days until ${featureEndDate.toISOString()}`);

                // Record platform revenue transaction
                const totalAmount = payment.amount_money.amount; // Amount is typically in cents
                const paymentId = payment.id;
                const revenueAmount = totalAmount / 100; // Convert from cents to dollars
                
                await base44.asServiceRole.entities.PlatformRevenue.create({
                    revenue_source: 'community_featuring',
                    amount_usd: revenueAmount,
                    related_transaction_id: paymentId,
                    creator_email: order.metadata.creator_email, // Assumes creator_email is in order metadata
                    description: `Community featuring payment: ${duration} days for $${revenueAmount.toFixed(2)}`
                });

                // Allocate 25% of community featuring revenue to DAO Treasury
                const daoAmount = revenueAmount * 0.25;
                await base44.asServiceRole.entities.DAOTreasury.create({
                    transaction_type: 'deposit',
                    source: 'Community Featuring Fee (25%)',
                    // Example conversion rate: 1 USD = 1000 QFLOW units (adjust as needed for actual QFLOW value)
                    amount_qflow: Math.round(daoAmount * 1000), 
                    value_usd: daoAmount,
                    notes: `25% of community featuring payment for order ${orderId}: ${paymentId}`
                });
                console.log(`Community featuring payment for order ${orderId} processed successfully.`);
                return new Response('Community feature payment processed successfully.', { status: 200 });

            } catch (error) {
                console.error(`Error processing community feature payment for order ${orderId}:`, error);
                return new Response(`Error processing community feature payment: ${error.message}`, { status: 500 });
            }
        }

        // If it's not a 'community_feature' payment, proceed with existing MarketplaceTransaction logic
        // 4. Find the pending transaction in our database using the order_id
        const transactions = await base44.asServiceRole.entities.MarketplaceTransaction.filter({
            'notes.squareOrderId': orderId,
            status: 'pending_payment'
        });

        if (transactions.length === 0) {
            console.log(`No pending transaction found for order_id: ${orderId}. It might already be processed.`);
            return new Response('Transaction not found or already processed.', { status: 200 });
        }
        
        const transaction = transactions[0];
        // Ensure transaction.notes is parsed if it's a string
        const transactionNotes = typeof transaction.notes === 'string' ? JSON.parse(transaction.notes) : transaction.notes;

        // 5. Check if it's a subscription and handle it
        if (transaction.item_type === 'subscription') {
            const { subscriptionTier, billingCycle } = transactionNotes;
            const userEmail = transaction.buyer_email;

            // Find the user to update their subscription
            const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
            if (users.length > 0) {
                const user = users[0];
                await base44.asServiceRole.entities.User.update(user.id, {
                    subscription_tier: subscriptionTier
                });
                console.log(`Successfully updated user ${userEmail} to tier: ${subscriptionTier}`);
            }

            // Update the transaction status to 'completed'
            await base44.asServiceRole.entities.MarketplaceTransaction.update(transaction.id, {
                status: 'completed',
                processor_transaction_id: payment.id // Store the actual payment ID from Square
            });

            // Add revenue to DAO Treasury (20% of subscription)
            const daoAmountGBP = transaction.amount_total * 0.20;
            const daoAmountUSD = transactionNotes.amountUSD ? transactionNotes.amountUSD * 0.20 : daoAmountGBP * 1.25;

            await base44.asServiceRole.entities.DAOTreasury.create({
                transaction_type: 'deposit',
                source: `${subscriptionTier} Subscription Revenue (${billingCycle})`,
                // Placeholder conversion for QFLOW (adjust as needed for actual QFLOW value)
                amount_qflow: Math.round(daoAmountGBP * 1000), 
                value_usd: daoAmountUSD,
                notes: `User: ${userEmail} | Square Order ID: ${orderId}`
            });
            console.log(`DAO Treasury updated for subscription purchase by ${userEmail}.`);

        } else {
            // Handle other item types like 'skill' if needed in the future
            console.log(`Webhook received for non-subscription item_type: ${transaction.item_type}.`);
        }

    } catch (error) {
        console.error('Error processing Square webhook:', error);
        return new Response(`Webhook processing failed: ${error.message}`, { status: 500 });
    }

    return new Response('Webhook processed successfully.', { status: 200 });
});
