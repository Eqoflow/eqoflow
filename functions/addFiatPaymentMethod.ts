import { createClient } from 'npm:@base44/sdk@0.1.0';
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

// Simple encryption for sensitive data (in production, use proper encryption libraries)
const encryptSensitiveData = async (data) => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const keyBuffer = encoder.encode(Deno.env.get('PAYMENT_ENCRYPTION_KEY') || 'default-key-change-in-prod');
    const key = await crypto.subtle.importKey('raw', keyBuffer.slice(0, 32), { name: 'AES-GCM' }, false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, dataBuffer);
    return { encrypted: Array.from(new Uint8Array(encrypted)), iv: Array.from(iv) };
};

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

        const { paymentMethodData } = await req.json();

        // Validate required fields
        if (!paymentMethodData.type || !paymentMethodData.country || !paymentMethodData.currency) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Additional validation for bank accounts
        if (paymentMethodData.type === 'bank') {
            if (!paymentMethodData.accountHolderName) {
                return new Response(JSON.stringify({ error: 'Account holder name is required for bank accounts' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Create the payment method object
        const paymentMethod = {
            id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
            type: paymentMethodData.type,
            country: paymentMethodData.country,
            currency: paymentMethodData.currency,
            addedAt: new Date().toISOString(),
            isDefault: false // Will be set to true if this is the first payment method
        };

        // Handle type-specific data
        if (paymentMethodData.type === 'card') {
            paymentMethod.brand = paymentMethodData.brand;
            paymentMethod.last4 = paymentMethodData.last4;
        } else if (paymentMethodData.type === 'bank') {
            paymentMethod.accountHolderName = paymentMethodData.accountHolderName;
            paymentMethod.bankName = paymentMethodData.bankName || '';

            // Encrypt sensitive banking details
            const sensitiveFields = ['accountNumber', 'routingNumber', 'sortCode', 'iban', 'bic'];
            for (const field of sensitiveFields) {
                if (paymentMethodData[field]) {
                    const encrypted = await encryptSensitiveData(paymentMethodData[field]);
                    paymentMethod[`${field}_encrypted`] = encrypted;
                    // Store last 4 digits for display purposes
                    paymentMethod.last4 = paymentMethodData[field].slice(-4);
                }
            }
        }

        // Get existing payment methods
        const existingMethods = user.fiat_payment_methods || [];
        
        // Set as default if this is the first payment method
        if (existingMethods.length === 0) {
            paymentMethod.isDefault = true;
        }

        // Add to user's payment methods
        const updatedMethods = [...existingMethods, paymentMethod];

        // Update user profile
        await base44.entities.User.update(user.id, {
            fiat_payment_methods: updatedMethods
        });

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Payment method added successfully',
            paymentMethod: {
                id: paymentMethod.id,
                type: paymentMethod.type,
                brand: paymentMethod.brand || paymentMethod.bankName || 'Bank Account',
                last4: paymentMethod.last4,
                country: paymentMethod.country,
                currency: paymentMethod.currency,
                isDefault: paymentMethod.isDefault,
                addedAt: paymentMethod.addedAt
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Add Payment Method Error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to add payment method', 
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});