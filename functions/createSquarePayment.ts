
import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        if (!(await base44.auth.isAuthenticated())) {
            return new Response('Unauthorized', { status: 401 });
        }
        
        const currentUser = await base44.auth.me();
        if (!currentUser) {
            return new Response('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        
        // Handle both subscription and EP package payments
        let itemName, itemDescription, price, currency, transactionId;
        
        if (body.plan) {
            // Legacy subscription payment format
            const { plan, price: planPrice } = body;
            
            const validPlans = {
                'Quantum Creator': 7.99,
                'Quantum Pro': 19.99
            };

            if (!validPlans[plan]) {
                return new Response(JSON.stringify({ error: 'Invalid plan selection.' }), { status: 400 });
            }
            
            itemName = `Quantum+ ${plan}`;
            itemDescription = `Monthly subscription for ${plan}`;
            price = planPrice;
            currency = 'GBP';
            transactionId = `${currentUser.email}_${plan.toLowerCase().replace(' ', '_')}_monthly`;
        } else {
            // EP package payment format - ALWAYS use GBP for Square
            ({ itemName, itemDescription, price, currency, transactionId } = body);
            
            if (!itemName || !price || !transactionId) {
                return new Response(JSON.stringify({ error: 'Missing required fields for EP package purchase.' }), { status: 400 });
            }

            // Convert USD price to GBP if needed (approximate conversion rate)
            if (currency === 'USD') {
                price = price * 0.8; // Rough USD to GBP conversion
                currency = 'GBP';
            }
            
            // Force GBP for Square payments
            currency = 'GBP';
        }

        const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
        const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID');

        // Check required credentials
        if (!squareAccessToken) {
            return new Response(JSON.stringify({ error: 'Square access token not configured.' }), { status: 500 });
        }
        if (!squareLocationId) {
            return new Response(JSON.stringify({ error: 'Square location ID not configured. Please check your SQUARE_LOCATION_ID secret.' }), { status: 500 });
        }

        // Always use GBP for Square payments
        const finalCurrency = 'GBP';
        let finalPrice = price;
        
        // Convert to pence for GBP
        const amountInMinorUnits = Math.round(finalPrice * 100);

        // Use the Payment Links API
        const paymentLinkResponse = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${squareAccessToken}`,
                'Content-Type': 'application/json',
                'Square-Version': '2024-05-15'
            },
            body: JSON.stringify({
                idempotency_key: `${currentUser.id}-${transactionId}-${Date.now()}`,
                description: itemDescription,
                quick_pay: {
                    name: itemName,
                    price_money: {
                        amount: amountInMinorUnits,
                        currency: finalCurrency
                    },
                    location_id: squareLocationId
                },
                checkout_options: {
                    allow_tipping: false,
                    ask_for_shipping_address: false,
                    merchant_support_email: 'support@quantumflow.com',
                    redirect_url: `${req.headers.get('origin')}/ReadyPlayerOne?payment=success`,
                },
                order_options: {
                    order: {
                        order_source: {
                            name: "QuantumFlow"
                        },
                        reference_id: transactionId
                    }
                },
                pre_populated_data: {
                    buyer_email: currentUser.email,
                    buyer_address: {
                        first_name: currentUser.full_name?.split(' ')[0] || '',
                        last_name: currentUser.full_name?.split(' ').slice(1).join(' ') || ''
                    }
                }
            })
        });

        if (!paymentLinkResponse.ok) {
            const errorData = await paymentLinkResponse.json();
            console.error('Square Payment Link API error:', errorData);
            
            // If the location ID is still causing issues, let's try to get more info
            if (errorData.errors?.some(e => e.field?.includes('location_id'))) {
                console.error('Location ID issue. Current location ID:', squareLocationId);
                
                // Try to fetch locations to help debug
                try {
                    const locationsResponse = await fetch('https://connect.squareup.com/v2/locations', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${squareAccessToken}`,
                            'Square-Version': '2024-05-15'
                        }
                    });
                    
                    if (locationsResponse.ok) {
                        const locationsData = await locationsResponse.json();
                        console.log('Available locations:', locationsData.locations?.map(l => ({ id: l.id, name: l.name })));
                        
                        return new Response(JSON.stringify({ 
                            error: 'Location ID mismatch. Please check your SQUARE_LOCATION_ID secret.',
                            available_locations: locationsData.locations?.map(l => ({ id: l.id, name: l.name })),
                            current_location_id: squareLocationId
                        }), { status: 500 });
                    }
                } catch (locError) {
                    console.error('Error fetching locations:', locError);
                }
            }
            
            return new Response(JSON.stringify({ 
                error: 'Failed to create payment link with Square.', 
                details: errorData 
            }), { status: 500 });
        }
        
        const paymentLinkData = await paymentLinkResponse.json();

        return new Response(JSON.stringify({
            success: true,
            checkout_url: paymentLinkData.payment_link.url
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create Square payment error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to create payment session',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
