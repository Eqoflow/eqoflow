
import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        // Authenticate user
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        const currentUser = await base44.auth.me();
        if (!currentUser) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { projectId, amount, currency } = await req.json();

        // For QFLOW payments, we'll handle differently (placeholder for now)
        if (currency === 'qflow') {
            return new Response(JSON.stringify({ 
                error: 'QFLOW token payments not yet implemented. Please use GBP for now.' 
            }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        // Validate project existence
        const project = await base44.entities.CrowdProject.get(projectId);
        if (!project) {
            return new Response(JSON.stringify({ error: 'Project not found.' }), { status: 404, headers: { "Content-Type": "application/json" } });
        }

        // Check for Square credentials
        const squareAccessToken = Deno.env.get('SQUARE_ACCESS_TOKEN');
        const squareLocationId = Deno.env.get('SQUARE_LOCATION_ID');
        if (!squareAccessToken || !squareLocationId) {
            return new Response(JSON.stringify({ error: 'Square integration not configured.' }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
        
        // Convert currency to GBP if needed (for now, assume all fiat is GBP)
        const squareCurrency = 'GBP';
        const squareAmount = Math.round(parseFloat(amount) * 100); // Convert to pence

        // Create a Square Payment Link with Order Metadata
        const paymentLinkResponse = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${squareAccessToken}`,
                'Content-Type': 'application/json',
                'Square-Version': '2024-05-15'
            },
            body: JSON.stringify({
                idempotency_key: `${currentUser.id}-project-${projectId}-${Date.now()}`,
                description: `Contribution for QuantumFlow project: ${project.title}`,
                order: {
                    location_id: squareLocationId,
                    line_items: [{
                        name: `Contribution for "${project.title}"`,
                        quantity: "1",
                        base_price_money: {
                            amount: squareAmount,
                            currency: squareCurrency
                        }
                    }],
                    metadata: {
                      type: "project_contribution",
                      projectId: projectId,
                      contributorEmail: currentUser.email,
                      contributorName: currentUser.full_name || currentUser.email.split('@')[0]
                    }
                },
                checkout_options: {
                    allow_tipping: false,
                    ask_for_shipping_address: false,
                    merchant_support_email: 'support@quantumflow.com',
                    redirect_url: `${req.headers.get('origin')}/ProjectDetails?id=${projectId}&payment=success`,
                },
                pre_populated_data: {
                    buyer_email: currentUser.email,
                }
            })
        });

        if (!paymentLinkResponse.ok) {
            const errorData = await paymentLinkResponse.json();
            console.error('Square Payment Link API error:', errorData);
            return new Response(JSON.stringify({ 
                error: 'Failed to create payment link with Square.', 
                details: errorData 
            }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
        
        const paymentLinkData = await paymentLinkResponse.json();

        return new Response(JSON.stringify({
            success: true,
            checkout_page_url: paymentLinkData.payment_link.url
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create project contribution payment error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to create payment session',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
