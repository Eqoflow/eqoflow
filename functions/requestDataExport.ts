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

        const userEmail = user.email;

        // Fetch all user-related data in parallel
        const [
            userProfile,
            posts,
            comments,
            skills,
            marketplaceTransactions,
            followers,
            following,
            engagementPoints,
            proposals,
            directMessages
        ] = await Promise.all([
            base44.entities.UserProfileData.filter({ user_email: userEmail }),
            base44.entities.Post.filter({ created_by: userEmail }),
            base44.entities.Comment.filter({ created_by: userEmail }),
            base44.entities.Skill.filter({ created_by: userEmail }),
            base44.entities.MarketplaceTransaction.filter({ $or: [{ buyer_email: userEmail }, { seller_email: userEmail }] }),
            base44.entities.Follow.filter({ following_email: userEmail }),
            base44.entities.Follow.filter({ follower_email: userEmail }),
            base44.entities.EngagementPoint.filter({ created_by: userEmail }),
            base44.entities.GovernanceProposal.filter({ created_by: userEmail }),
            base44.entities.DirectMessage.filter({ $or: [{ created_by: userEmail }, { recipient_email: userEmail }] })
        ]);

        const exportData = {
            profile: userProfile.length > 0 ? userProfile[0] : null,
            posts,
            comments,
            skills,
            marketplaceTransactions,
            followers: followers.map(f => f.follower_email),
            following: following.map(f => f.following_email),
            engagementPoints,
            proposals,
            directMessages,
        };

        return new Response(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="quantumflow_data_export_${userEmail}.json"`
            }
        });

    } catch (error) {
        console.error('Data Export Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to export data.', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});