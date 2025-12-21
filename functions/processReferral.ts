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
        
        const currentUser = await base44.auth.me();
        if (!currentUser) {
            return new Response(JSON.stringify({ error: 'User not found' }), { 
                status: 401, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        const { referralCode } = await req.json();
        
        if (!referralCode) {
            return new Response(JSON.stringify({ error: 'No referral code provided' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        console.log('Processing referral for user:', currentUser.email, 'with code:', referralCode);

        // Check if this user has already been processed for a referral
        const existingReferral = await base44.entities.ReferralLog.filter({ 
            referred_email: currentUser.email 
        });

        if (existingReferral.length > 0) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'User has already been processed for a referral' 
            }), { 
                status: 200, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Find the referrer by custom_referral_code or user ID
        let referrer = null;
        
        // First, try to find by custom_referral_code
        const usersByCustomCode = await base44.entities.User.filter({ 
            custom_referral_code: referralCode 
        });
        
        if (usersByCustomCode.length > 0) {
            referrer = usersByCustomCode[0];
        } else {
            // If not found, try to find by user ID
            try {
                referrer = await base44.entities.User.get(referralCode);
            } catch (error) {
                console.log('Referrer not found by ID:', error);
            }
        }

        if (!referrer) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Invalid referral code' 
            }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Don't allow self-referral
        if (referrer.email === currentUser.email) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Cannot refer yourself' 
            }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Award tokens to both users
        const referrerReward = 50;
        const referredReward = 25;

        // Update referrer's token balance
        const newReferrerBalance = (referrer.token_balance || 0) + referrerReward;
        await base44.entities.User.update(referrer.id, { 
            token_balance: newReferrerBalance 
        });

        // Update referred user's token balance
        const newReferredBalance = (currentUser.token_balance || 0) + referredReward;
        await base44.entities.User.update(currentUser.id, { 
            token_balance: newReferredBalance 
        });

        // Log the referral
        await base44.entities.ReferralLog.create({
            referrer_email: referrer.email,
            referred_email: currentUser.email,
            referred_user_display_name: currentUser.full_name || currentUser.email.split('@')[0],
            referrer_reward: referrerReward,
            referred_reward: referredReward,
            status: 'completed'
        });

        console.log('Referral processed successfully:', {
            referrer: referrer.email,
            referred: currentUser.email,
            referrerReward,
            referredReward
        });

        return new Response(JSON.stringify({
            success: true,
            message: `Referral processed successfully! You received ${referredReward} $QFLOW tokens, and ${referrer.full_name || referrer.email.split('@')[0]} received ${referrerReward} $QFLOW tokens.`,
            referrerReward,
            referredReward
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error processing referral:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error', 
            details: error.message 
        }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
});