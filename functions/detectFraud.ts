import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

// Detection thresholds and rules
const FRAUD_DETECTION_RULES = {
    // EP-related thresholds
    SUSPICIOUS_DAILY_EP_MULTIPLIER: 5, // Flag if daily EP is 5x their average
    MINIMUM_EP_FOR_ANALYSIS: 100, // Only analyze users with at least 100 total EP
    
    // Follower growth thresholds
    RAPID_FOLLOWER_GROWTH_THRESHOLD: 1000, // Followers gained in 24h
    SUSPICIOUS_FOLLOWER_RATIO: 10, // New followers vs content created ratio
    
    // Engagement pattern thresholds
    SINGLE_CREATOR_FOCUS_THRESHOLD: 0.8, // 80% of interactions with one creator
    COORDINATED_ENGAGEMENT_THRESHOLD: 0.9, // 90% similar timing patterns
    
    // Account quality thresholds
    MIN_ACCOUNT_AGE_DAYS: 1, // Minimum age to avoid flagging brand new users
    GENERIC_COMMENT_KEYWORDS: ['nice', 'good', 'great', 'amazing', 'awesome', '👍', '❤️', '🔥']
};

// Calculate user's average daily EP over the last 30 days
async function calculateAverageDailyEP(userEmail) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentEP = await base44.entities.EngagementPoint.filter({
            created_by: userEmail,
            created_date: { $gte: thirtyDaysAgo.toISOString() }
        });
        
        if (recentEP.length === 0) return 0;
        
        const totalEP = recentEP.reduce((sum, ep) => sum + (ep.final_points || 0), 0);
        return totalEP / 30; // Average per day
    } catch (error) {
        console.error('Error calculating average daily EP:', error);
        return 0;
    }
}

// Check for suspicious EP gains
async function checkSuspiciousEPGains() {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        // Get all EP earned in the last 24 hours
        const recentEP = await base44.entities.EngagementPoint.filter({
            created_date: { $gte: yesterday.toISOString() }
        });
        
        // Group by user
        const userEPMap = new Map();
        recentEP.forEach(ep => {
            if (!ep.created_by) return;
            
            if (!userEPMap.has(ep.created_by)) {
                userEPMap.set(ep.created_by, 0);
            }
            userEPMap.set(ep.created_by, userEPMap.get(ep.created_by) + (ep.final_points || 0));
        });
        
        const flags = [];
        
        for (const [userEmail, dailyEP] of userEPMap.entries()) {
            if (dailyEP < FRAUD_DETECTION_RULES.MINIMUM_EP_FOR_ANALYSIS) continue;
            
            const averageDailyEP = await calculateAverageDailyEP(userEmail);
            
            // Flag if today's EP is significantly higher than average
            if (averageDailyEP > 0 && dailyEP > averageDailyEP * FRAUD_DETECTION_RULES.SUSPICIOUS_DAILY_EP_MULTIPLIER) {
                const user = await base44.entities.User.filter({ email: userEmail });
                
                flags.push({
                    flagged_user_email: userEmail,
                    flagged_user_name: user[0]?.full_name || 'Unknown User',
                    flag_type: 'suspicious_ep_gain',
                    severity: dailyEP > averageDailyEP * 10 ? 'high' : 'medium',
                    detection_reason: `User earned ${dailyEP} EP in 24h, which is ${(dailyEP / averageDailyEP).toFixed(1)}x their 30-day average of ${averageDailyEP.toFixed(1)} EP/day`,
                    metrics_snapshot: {
                        daily_ep_gained: dailyEP,
                        average_daily_ep: averageDailyEP,
                        multiplier: dailyEP / averageDailyEP
                    },
                    auto_detected: true
                });
            }
        }
        
        return flags;
    } catch (error) {
        console.error('Error checking suspicious EP gains:', error);
        return [];
    }
}

// Check for rapid follower growth patterns
async function checkRapidFollowerGrowth() {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Get recent follow activities
        const recentFollows = await base44.entities.Follow.filter({
            created_date: { $gte: yesterday.toISOString() }
        });
        
        // Group by who was followed
        const followedUsersMap = new Map();
        recentFollows.forEach(follow => {
            if (!followedUsersMap.has(follow.following_email)) {
                followedUsersMap.set(follow.following_email, []);
            }
            followedUsersMap.get(follow.following_email).push(follow);
        });
        
        const flags = [];
        
        for (const [userEmail, follows] of followedUsersMap.entries()) {
            if (follows.length >= FRAUD_DETECTION_RULES.RAPID_FOLLOWER_GROWTH_THRESHOLD) {
                const user = await base44.entities.User.filter({ email: userEmail });
                
                flags.push({
                    flagged_user_email: userEmail,
                    flagged_user_name: user[0]?.full_name || 'Unknown User',
                    flag_type: 'rapid_follower_growth',
                    severity: follows.length > 5000 ? 'critical' : 'high',
                    detection_reason: `User gained ${follows.length} new followers in the last 24 hours`,
                    metrics_snapshot: {
                        followers_gained_24h: follows.length,
                        total_follower_count: user[0]?.follower_count || 0
                    },
                    auto_detected: true
                });
            }
        }
        
        return flags;
    } catch (error) {
        console.error('Error checking rapid follower growth:', error);
        return [];
    }
}

// Check for coordinated engagement patterns
async function checkCoordinatedEngagement() {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Get recent posts and their engagement
        const recentPosts = await base44.entities.Post.filter({
            created_date: { $gte: yesterday.toISOString() }
        });
        
        const flags = [];
        
        for (const post of recentPosts) {
            if (!post.liked_by || post.liked_by.length < 10) continue; // Only check posts with significant engagement
            
            // Check if the same small group of users consistently engages with this creator's content
            const creatorPosts = await base44.entities.Post.filter({
                created_by: post.created_by
            }, "-created_date", 20); // Last 20 posts from this creator
            
            if (creatorPosts.length < 5) continue; // Need enough posts to analyze patterns
            
            const engagementPatterns = new Map();
            creatorPosts.forEach(p => {
                if (p.liked_by) {
                    p.liked_by.forEach(userEmail => {
                        engagementPatterns.set(userEmail, (engagementPatterns.get(userEmail) || 0) + 1);
                    });
                }
            });
            
            // Look for users who engage with almost all posts from this creator
            const suspiciousEngagers = [];
            for (const [userEmail, engagementCount] of engagementPatterns.entries()) {
                const engagementRate = engagementCount / creatorPosts.length;
                if (engagementRate >= FRAUD_DETECTION_RULES.COORDINATED_ENGAGEMENT_THRESHOLD) {
                    suspiciousEngagers.push(userEmail);
                }
            }
            
            if (suspiciousEngagers.length >= 5) { // Multiple suspicious engagers
                const user = await base44.entities.User.filter({ email: post.created_by });
                
                flags.push({
                    flagged_user_email: post.created_by,
                    flagged_user_name: user[0]?.full_name || 'Unknown User',
                    flag_type: 'coordinated_engagement',
                    severity: 'high',
                    detection_reason: `${suspiciousEngagers.length} accounts consistently engage with 90%+ of this creator's content, suggesting coordinated behavior`,
                    metrics_snapshot: {
                        suspicious_engagers: suspiciousEngagers.length,
                        posts_analyzed: creatorPosts.length
                    },
                    auto_detected: true
                });
            }
        }
        
        return flags;
    } catch (error) {
        console.error('Error checking coordinated engagement:', error);
        return [];
    }
}

Deno.serve(async (req) => {
    try {
        // This function should be called periodically (e.g., via cron job or scheduled task)
        console.log('Starting fraud detection scan...');
        
        const allFlags = [];
        
        // Run all detection checks
        const [epFlags, followerFlags, engagementFlags] = await Promise.all([
            checkSuspiciousEPGains(),
            checkRapidFollowerGrowth(),
            checkCoordinatedEngagement()
        ]);
        
        allFlags.push(...epFlags, ...followerFlags, ...engagementFlags);
        
        // Store new flags in the database
        const storedFlags = [];
        for (const flag of allFlags) {
            try {
                // Check if we already have a similar flag for this user recently
                const existingFlags = await base44.entities.FraudFlag.filter({
                    flagged_user_email: flag.flagged_user_email,
                    flag_type: flag.flag_type,
                    status: { $in: ['new', 'under_review'] }
                });
                
                // Only create new flag if no similar active flag exists
                if (existingFlags.length === 0) {
                    const storedFlag = await base44.entities.FraudFlag.create(flag);
                    storedFlags.push(storedFlag);
                    console.log(`Created fraud flag: ${flag.flag_type} for ${flag.flagged_user_email}`);
                }
            } catch (error) {
                console.error('Error storing fraud flag:', error);
            }
        }
        
        return new Response(JSON.stringify({
            success: true,
            message: `Fraud detection completed. Created ${storedFlags.length} new flags.`,
            flags_created: storedFlags.length,
            total_flags_detected: allFlags.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Error in fraud detection:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});