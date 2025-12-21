
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { isToday } from 'npm:date-fns@3.6.0';

// --- Configuration ---
const EP_CONFIG = {
    actions: {
        post_create: { actor: 20, creator: 0 },
        post_like: { actor: 1, creator: 2 },
        comment_create: { actor: 10, creator: 5 },
        comment_like: { actor: 1, creator: 2 },
        repost: { actor: 5, creator: 3 },
        repost_with_comment: { actor: 14, creator: 7 },
        user_follow: { actor: 1, creator: 10 },
        dao_vote: { actor: 20, creator: 0 },
        proposal_create: { actor: 50, creator: 0 },
        skill_offer: { actor: 15, creator: 0 },
        community_join: { actor: 10, creator: 0 },
        stream_create: { actor: 25, creator: 0 },
        daily_login: { actor: 5, creator: 0 },
        creator_engagement_reaction: { actor: 0, creator: 1 },
        creator_engagement_comment: { actor: 0, creator: 2 },
        creator_engagement_repost: { actor: 0, creator: 3 },
        reaction_remove: { actor: -1, creator: -1 },
        poll_vote: { actor: 1, creator: 0 },
        poll_vote_received: { actor: 0, creator: 1 },
    },
    dailyCaps: {
        bronze: 200,
        silver: 300,
        gold: 500,
        platinum: 1000,
        diamond: 2000,
    },
    creatorDailyCaps: {
        spark: 1000,
        catalyst: 3000,
        luminary: 10000,
        supernova: 25000,
    },
    multipliers: {
        free: 1,
        lite: 1,
        creator: 1.5,
        pro: 2,
    }
};

const getCreatorEmail = async (base44, { relatedContentType, relatedContentId, recipientEmail }) => {
    if (recipientEmail) {
        return recipientEmail;
    }
    if (!relatedContentType || !relatedContentId) {
        return null;
    }
    
    try {
        let content;
        if (relatedContentType === 'post') {
            content = await base44.entities.Post.get(relatedContentId);
        } else if (relatedContentType === 'poll') { // Add handling for poll to get its creator
            content = await base44.entities.Poll.get(relatedContentId);
        }
        
        return content?.created_by || null;
    } catch (error) {
        console.error(`Could not fetch content ${relatedContentType} with id ${relatedContentId}`, error);
        return null;
    }
};

const updatePostEPRewards = async (base44, postId, additionalEP) => {
    if (!postId) return;
    
    try {
        const post = await base44.entities.Post.get(postId);
        if (post) {
            const newTotal = (post.ep_rewards_earned || 0) + additionalEP;
            await base44.asServiceRole.entities.Post.update(postId, {
                ep_rewards_earned: newTotal
            });
        }
    } catch (error) {
        console.error(`Failed to update post EP rewards for post ${postId}:`, error);
    }
};

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const {
        actionType,
        relatedContentId,
        relatedContentType,
        description,
        recipientEmail
    } = await req.json();

    try {
        const actor = await base44.auth.me();
        if (!actor) {
            return new Response(JSON.stringify({ error: "Unauthorized: User not authenticated." }), { status: 401 });
        }
        
        const actionConfig = EP_CONFIG.actions[actionType];
        if (!actionConfig) {
            return new Response(JSON.stringify({ error: `Invalid action type: ${actionType}` }), { status: 400 });
        }

        const creatorEmail = await getCreatorEmail(base44, { relatedContentType, relatedContentId, recipientEmail });
        const isSelfEngagement = !creatorEmail || actor.email === creatorEmail;
        
        let totalEPForPost = 0;

        // Award EP to the actor (person performing the action)
        if (actionConfig.actor > 0) {
            const actorPoints = actionConfig.actor;

            if (!actor.last_general_ep_reset_date || !isToday(new Date(actor.last_general_ep_reset_date))) {
                actor.general_daily_ep_earned = 0;
                actor.last_general_ep_reset_date = new Date().toISOString().split('T')[0];
            }

            // Determine actor's daily cap based on subscription tier
            const actorTier = (actor.subscription_tier || 'bronze').toLowerCase();
            const generalDailyCap = EP_CONFIG.dailyCaps[actorTier] || EP_CONFIG.dailyCaps.bronze;
            
            const remainingDailyCap = generalDailyCap - (actor.general_daily_ep_earned || 0);
            const pointsToAwardActor = Math.min(actorPoints, remainingDailyCap);

            if (pointsToAwardActor > 0) {
                await base44.entities.EngagementPoint.create({
                    created_by: actor.email,
                    action_type: actionType,
                    points_earned: actorPoints,
                    final_points: pointsToAwardActor,
                    points_awarded: pointsToAwardActor,
                    daily_total_before: actor.general_daily_ep_earned || 0,
                    daily_cap_reached: pointsToAwardActor < actorPoints,
                    related_content_id: relatedContentId,
                    related_content_type: relatedContentType,
                    description: description || `Earned for ${actionType}`,
                });

                await base44.entities.User.update(actor.id, {
                    total_ep_earned: (actor.total_ep_earned || 0) + pointsToAwardActor,
                    general_daily_ep_earned: (actor.general_daily_ep_earned || 0) + pointsToAwardActor,
                    last_general_ep_reset_date: actor.last_general_ep_reset_date
                });

                // For post_create, the actor gets EP shown on their own post
                // Or if it's a poll, and the actor is its creator
                if (actionType === 'post_create' && relatedContentType === 'post') {
                    totalEPForPost += pointsToAwardActor;
                }
            }
        }
        
        // Award EP to the creator (if different from actor)
        if (!isSelfEngagement && actionConfig.creator > 0) {
            const creatorUserRecords = await base44.asServiceRole.entities.User.filter({ email: creatorEmail });
            
            if (creatorUserRecords.length > 0) {
                const creator = creatorUserRecords[0];
                
                // Determine multiplier based on creator's subscription tier
                const creatorTierForMultiplier = (creator.subscription_tier || 'free').toLowerCase();
                const multiplier = EP_CONFIG.multipliers[creatorTierForMultiplier] || 1;
                const creatorPoints = Math.round(actionConfig.creator * multiplier);

                if (!creator.last_creator_ep_reset_date || !isToday(new Date(creator.last_creator_ep_reset_date))) {
                    creator.creator_daily_ep_earned = 0;
                    creator.last_creator_ep_reset_date = new Date().toISOString().split('T')[0];
                }
                
                // Determine creator's daily cap based on subscription tier
                const creatorTierForCaps = (creator.subscription_tier || 'spark').toLowerCase();
                const creatorDailyCap = EP_CONFIG.creatorDailyCaps[creatorTierForCaps] || EP_CONFIG.creatorDailyCaps.spark;
                
                const remainingCreatorCap = creatorDailyCap - (creator.creator_daily_ep_earned || 0);
                const pointsToAwardCreator = Math.min(creatorPoints, remainingCreatorCap);

                if (pointsToAwardCreator > 0) {
                     await base44.asServiceRole.entities.EngagementPoint.create({
                        created_by: actor.email,
                        recipient_email: creator.email,
                        action_type: `creator_engagement_${actionType}`,
                        points_earned: creatorPoints,
                        final_points: pointsToAwardCreator,
                        points_awarded: pointsToAwardCreator,
                        multiplier: multiplier,
                        daily_total_before: creator.creator_daily_ep_earned || 0,
                        daily_cap_reached: pointsToAwardCreator < creatorPoints,
                        related_content_id: relatedContentId,
                        related_content_type: relatedContentType,
                        description: `Received for engagement on your ${relatedContentType || 'content'}`
                    });

                    await base44.asServiceRole.entities.User.update(creator.id, {
                        total_creator_ep_earned: (creator.total_creator_ep_earned || 0) + pointsToAwardCreator,
                        creator_daily_ep_earned: (creator.creator_daily_ep_earned || 0) + pointsToAwardCreator,
                        last_creator_ep_reset_date: creator.last_creator_ep_reset_date
                    });

                    // Add creator rewards to the post's EP display
                    if (relatedContentType === 'post') {
                        totalEPForPost += pointsToAwardCreator;
                    }
                }
            }
        }

        // Update the post's EP rewards if applicable
        if (totalEPForPost > 0 && relatedContentType === 'post' && relatedContentId) {
            await updatePostEPRewards(base44, relatedContentId, totalEPForPost);
        }

        return new Response(JSON.stringify({ success: true, message: "EP awarded successfully." }), { status: 200 });

    } catch (error) {
        console.error("Error in awardEP function:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
