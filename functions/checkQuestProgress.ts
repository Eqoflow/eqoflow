import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = user.email;
        const userId = user.id;

        // Use service role for admin-level data access to avoid RLS issues with public/private data
        const adminClient = base44.asServiceRole;

        // 1. Get Active Season
        const seasons = await adminClient.entities.Season.list('-created_date');
        const now = new Date().toISOString().split('T')[0];
        const currentSeason = seasons.find((s) => s.status === 'active' || (s.start_date <= now && s.end_date >= now));

        if (!currentSeason) {
            return Response.json({ message: 'No active season' });
        }

        const seasonId = currentSeason.season_id;

        // 2. Get Active Quests for Season
        const quests = await adminClient.entities.Quest.filter({ season_id: seasonId, enabled: true });

        // 3. Fetch Data for Checks
        
        // Data for Quest 1: First Echo (Posts)
        // Use user client to ensure we see posts created by this user
        const posts = await base44.entities.Post.filter({ created_by: email }, '-created_date', 1);
        const hasPosted = posts.length > 0;

        // Data for Quest 2: Daily Supporter (Likes today)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const engagementPoints = await base44.entities.EngagementPoint.filter({ 
            created_by: email, 
            action_type: 'post_like' 
        }, '-created_date', 100); 
        
        const likesToday = engagementPoints.filter(ep => new Date(ep.created_date) >= todayStart).length;

        // Data for Quest 3: Community Explorer
        // Use admin client to check all communities, including private ones
        const communities = await adminClient.entities.Community.filter({}, '-created_date', 100); 
        const joinedCommunitiesCount = communities.filter(c => Array.isArray(c.member_emails) && c.member_emails.includes(email)).length;

        // Data for Quest 4: Identity Forged (Profile)
        const profiles = await base44.entities.Profile.filter({ user_id: userId });
        const profile = profiles[0];
        const isProfileComplete = profile && profile.avatar_url && profile.display_name && profile.handle;

        // 4. Update Completions
        const updates = [];

        for (const quest of quests) {
            let progress = 0;
            let completed = false;

            if (quest.quest_id === 'quest_1') {
                progress = hasPosted ? 100 : 0;
                completed = hasPosted;
            } else if (quest.quest_id === 'quest_2') {
                // Target: 10 likes
                progress = Math.min((likesToday / 10) * 100, 100);
                completed = likesToday >= 10;
            } else if (quest.quest_id === 'quest_3') {
                // Target: 3 communities
                progress = Math.min((joinedCommunitiesCount / 3) * 100, 100);
                completed = joinedCommunitiesCount >= 3;
            } else if (quest.quest_id === 'quest_4') {
                progress = isProfileComplete ? 100 : 0;
                completed = !!isProfileComplete;
            }

            // Upsert Logic using admin client
            const existingCompletion = await adminClient.entities.QuestCompletion.filter({
                quest_id: quest.quest_id,
                user_id: userId,
                season_id: seasonId
            });

            let pointsToAdd = 0;

            if (existingCompletion.length > 0) {
                const record = existingCompletion[0];
                // Only update if progress increased or completed status changed
                if (record.progress < progress || (!record.completed && completed)) {
                    
                    const shouldAwardPoints = completed && !record.completed;
                    
                    await adminClient.entities.QuestCompletion.update(record.id, {
                        progress: progress,
                        completed: completed,
                        completed_at: completed ? new Date().toISOString() : (record.completed_at || null),
                        sp_awarded: shouldAwardPoints ? quest.sp_reward : record.sp_awarded,
                        claim_count: shouldAwardPoints ? (record.claim_count || 0) + 1 : record.claim_count
                    });
                    updates.push({ quest_id: quest.quest_id, status: 'updated', progress });
                    
                    if (shouldAwardPoints) {
                        pointsToAdd = quest.sp_reward;
                    }
                }
            } else {
                await adminClient.entities.QuestCompletion.create({
                    quest_id: quest.quest_id,
                    user_id: userId,
                    season_id: seasonId,
                    progress: progress,
                    completed: completed,
                    completed_at: completed ? new Date().toISOString() : null,
                    claim_count: completed ? 1 : 0,
                    sp_awarded: completed ? quest.sp_reward : 0
                });
                updates.push({ quest_id: quest.quest_id, status: 'created', progress });
                
                if (completed) {
                    pointsToAdd = quest.sp_reward;
                }
            }

            // Award Seasonal EP
            if (pointsToAdd > 0) {
                const scores = await adminClient.entities.SeasonalScore.filter({
                    season_id: seasonId,
                    user_id: userId
                });
                
                if (scores.length > 0) {
                    const userScore = scores[0];
                    await adminClient.entities.SeasonalScore.update(userScore.id, {
                        sp_total: (userScore.sp_total || 0) + pointsToAdd,
                        last_sp_increase: new Date().toISOString()
                    });
                } else {
                    await adminClient.entities.SeasonalScore.create({
                        season_id: seasonId,
                        user_id: userId,
                        sp_total: pointsToAdd,
                        is_deleted: false,
                        last_sp_increase: new Date().toISOString()
                    });
                }
            }
        }

        return Response.json({ success: true, updates });

    } catch (error) {
        console.error("CheckQuestProgress Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});