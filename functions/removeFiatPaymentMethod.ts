import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { paymentMethodId } = await req.json();

        if (!paymentMethodId) {
            return new Response(JSON.stringify({ error: 'Payment method ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get existing payment methods
        const existingMethods = user.fiat_payment_methods || [];
        
        // Find the payment method to remove
        const methodToRemove = existingMethods.find(method => method.id === paymentMethodId);
        if (!methodToRemove) {
            return new Response(JSON.stringify({ error: 'Payment method not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Remove the payment method
        const updatedMethods = existingMethods.filter(method => method.id !== paymentMethodId);

        // If the removed method was the default and there are other methods, make the first one default
        if (methodToRemove.isDefault && updatedMethods.length > 0) {
            updatedMethods[0].isDefault = true;
        }

        // Update user profile
        await base44.entities.User.update(user.id, {
            fiat_payment_methods: updatedMethods
        });

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Payment method removed successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Remove Payment Method Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to remove payment method', 
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});