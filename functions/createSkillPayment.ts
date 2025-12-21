import { createClient } from 'npm:@base44/sdk@0.1.0';
import { Client, Environment, ApiError } from 'npm:square@35.0.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

const squareClient = new Client({
    accessToken: Deno.env.get('SQUARE_ACCESS_TOKEN'),
    environment: Environment.Sandbox, // Change to Production when ready
});

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);

        const user = await base44.auth.me();
        if (!user) {
            return new Response('User not authenticated', { status: 401 });
        }

        const { skillId, nonce, amount, currency = 'GBP' } = await req.json();

        if (!skillId || !nonce || !amount) {
            return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get skill details
        const skill = await base44.entities.Skill.get(skillId);
        if (!skill) {
            return new Response(JSON.stringify({ error: 'Skill not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Calculate platform fee with subscription discount
        let platformFeeRate = 0.10; // Base 10% fee
        let discountPercent = 0;

        if (user.subscription_tier === 'Creator') {
            discountPercent = 10;
            platformFeeRate = 0.09; // 10% discount: 10% - 1% = 9%
        } else if (user.subscription_tier === 'Pro') {
            discountPercent = 25;
            platformFeeRate = 0.075; // 25% discount: 10% - 2.5% = 7.5%
        }

        const platformFee = Math.round(amount * platformFeeRate * 100) / 100;
        const sellerPayout = Math.round((amount - platformFee) * 100) / 100;

        // Create Square payment
        const amountInMinorUnits = Math.round(amount * 100);
        
        const { result } = await squareClient.paymentsApi.createPayment({
            sourceId: nonce,
            idempotencyKey: `skill-${skillId}-${user.id}-${Date.now()}`,
            amountMoney: {
                amount: BigInt(amountInMinorUnits),
                currency: currency
            },
            note: `Payment for skill: ${skill.title}`
        });

        // Create marketplace transaction record
        const notes = discountPercent > 0 
            ? `${user.subscription_tier} discount applied: ${discountPercent}% off platform fee` 
            : '';

        const transaction = await base44.entities.MarketplaceTransaction.create({
            item_id: skillId,
            item_type: 'skill',
            item_title: skill.title,
            buyer_email: user.email,
            seller_email: skill.created_by,
            amount_total: amount,
            amount_platform_fee: platformFee,
            amount_seller_payout: sellerPayout,
            currency: currency,
            payment_processor: 'square',
            processor_transaction_id: result.payment.id,
            status: 'held_in_escrow',
            notes: notes
        });

        // Add revenue to DAO Treasury
        const treasuryNotes = `Transaction ID: ${transaction.id}` + 
            (discountPercent > 0 ? ` | ${user.subscription_tier} member discount applied` : '');

        await base44.entities.DAOTreasury.create({
            transaction_type: 'deposit',
            source: `Skills Marketplace Fee - ${skill.title}`,
            amount_qflow: platformFee * 10,
            value_usd: platformFee * 1.25,
            notes: treasuryNotes
        });

        const response = {
            success: true,
            transactionId: transaction.id,
            paymentId: result.payment.id,
            platformFee: platformFee,
            sellerPayout: sellerPayout
        };

        if (discountPercent > 0) {
            response.discountApplied = `${discountPercent}% ${user.subscription_tier} discount`;
        }

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error creating skill payment:', error);
        
        if (error instanceof ApiError) {
            return new Response(JSON.stringify({ 
                error: 'Payment processing failed', 
                details: error.errors 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});