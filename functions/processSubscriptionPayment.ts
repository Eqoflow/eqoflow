import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { userEmail, subscriptionTier, billingCycle, amountGBP, amountUSD, returnUrl } = await req.json();

        console.log('Subscription request:', { userEmail, subscriptionTier, billingCycle, amountGBP, amountUSD });

        if (!userEmail || !subscriptionTier || !amountGBP) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields'
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Verify user exists
        const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
        if (users.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'User not found'
            }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const user = users[0];

        // Create Square payment
        const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
        const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID');

        if (!squareAccessToken || !squareLocationId) {
            console.error('Square credentials missing:', { 
                hasAccessToken: !!squareAccessToken, 
                hasLocationId: !!squareLocationId 
            });
            throw new Error('Square payment credentials not configured');
        }

        // Convert GBP to pence for Square API
        const amountInPence = Math.round(amountGBP * 100);
        console.log('Amount in pence:', amountInPence);
        
        const paymentRequest = {
            idempotency_key: `sub_${user.id}_${subscriptionTier}_${Date.now()}`,
            checkout_options: {
                redirect_url: returnUrl || `${new URL(req.url).origin}/Profile?subscription=success`,
                ask_for_shipping_address: false
            },
            order: {
                location_id: squareLocationId,
                line_items: [{
                    name: `${subscriptionTier} Subscription (${billingCycle})`,
                    quantity: "1",
                    base_price_money: {
                        amount: amountInPence,
                        currency: "GBP"
                    }
                }]
            },
            merchant_support_email: "support@eqoflow.app"
        };

        console.log('Square payment request:', JSON.stringify(paymentRequest, null, 2));

        const squareResponse = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
            method: 'POST',
            headers: {
                'Square-Version': '2023-10-18',
                'Authorization': `Bearer ${squareAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentRequest)
        });

        const squareData = await squareResponse.json();
        console.log('Square API response status:', squareResponse.status);
        console.log('Square API response:', JSON.stringify(squareData, null, 2));

        if (!squareResponse.ok) {
            console.error('Square API error details:', {
                status: squareResponse.status,
                statusText: squareResponse.statusText,
                errors: squareData.errors,
                data: squareData
            });
            
            const errorDetail = squareData.errors?.[0]?.detail || squareData.errors?.[0]?.code || 'Unknown Square API error';
            return new Response(JSON.stringify({
                success: false,
                error: `Square API Error: ${errorDetail}`
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Store subscription attempt in database for webhook processing
        const transactionRecord = await base44.asServiceRole.entities.MarketplaceTransaction.create({
            item_id: `subscription_${subscriptionTier.toLowerCase()}`,
            item_type: 'subscription',
            item_title: `${subscriptionTier} Subscription (${billingCycle})`,
            buyer_email: userEmail,
            seller_email: 'platform@eqoflow.app',
            amount_total: amountGBP,
            amount_platform_fee: 0,
            amount_seller_payout: amountGBP,
            currency: 'GBP',
            payment_processor: 'square',
            processor_transaction_id: squareData.payment_link.id,
            status: 'pending_payment',
            notes: JSON.stringify({
                subscriptionTier,
                billingCycle,
                amountUSD,
                squareOrderId: squareData.payment_link.order_id
            })
        });

        console.log('Created transaction record:', transactionRecord.id);

        return new Response(JSON.stringify({
            success: true,
            paymentUrl: squareData.payment_link.url,
            orderId: squareData.payment_link.order_id,
            message: 'Payment link created successfully'
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Subscription processing error:', error);
        console.error('Error stack:', error.stack);
        
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Internal server error'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});