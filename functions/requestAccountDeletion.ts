import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const userEmail = user.email;
        const userId = user.id;

        const anonName = "Former Member";
        const anonAvatar = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/deleted_user_avatar.png";
        const anonEmail = `deleted_${Date.now()}@quantumflow.app`;

        // 1. Anonymize user-generated content that should remain
        const posts = await base44.entities.Post.filter({ created_by: userEmail });
        for (const post of posts) {
            await base44.entities.Post.update(post.id, { author_full_name: anonName, author_avatar_url: anonAvatar, created_by: anonEmail });
        }

        const comments = await base44.entities.Comment.filter({ created_by: userEmail });
        for (const comment of comments) {
            await base44.entities.Comment.update(comment.id, { author_full_name: anonName, author_avatar_url: anonAvatar, created_by: anonEmail });
        }
        
        const workroomMessages = await base44.entities.WorkroomMessage.filter({ sender_email: userEmail });
        for (const msg of workroomMessages) {
             await base44.entities.WorkroomMessage.update(msg.id, { sender_name: anonName, sender_avatar: anonAvatar, sender_email: anonEmail });
        }

        const reviews = await base44.entities.SkillReview.filter({ reviewer_email: userEmail });
        for (const review of reviews) {
            await base44.entities.SkillReview.update(review.id, { reviewer_email: anonEmail, reviewer_name: anonName, reviewer_avatar: anonAvatar });
        }

        // 2. Delete all personal data and profile records
        const skills = await base44.entities.Skill.filter({ created_by: userEmail });
        for (const item of skills) await base44.entities.Skill.delete(item.id);

        const follows = await base44.entities.Follow.filter({ $or: [{ follower_email: userEmail }, { following_email: userEmail }] });
        for (const item of follows) await base44.entities.Follow.delete(item.id);

        const dms = await base44.entities.DirectMessage.filter({ $or: [{ created_by: userEmail }, { recipient_email: userEmail }] });
        for (const item of dms) await base44.entities.DirectMessage.delete(item.id);

        const notifications = await base44.entities.Notification.filter({ $or: [{ recipient_email: userEmail }, { actor_email: userEmail }] });
        for (const item of notifications) await base44.entities.Notification.delete(item.id);
        
        const epRecords = await base44.entities.EngagementPoint.filter({ $or: [{ created_by: userEmail }, { recipient_email: userEmail }] });
        for (const item of epRecords) await base44.entities.EngagementPoint.delete(item.id);
        
        const reactions = await base44.entities.Reaction.filter({ user_email: userEmail });
        for (const item of reactions) await base44.entities.Reaction.delete(item.id);

        const creatorProfiles = await base44.entities.CreatorProfile.filter({ user_email: userEmail });
        for (const item of creatorProfiles) await base44.entities.CreatorProfile.delete(item.id);

        const userProfileDataEntries = await base44.entities.UserProfileData.filter({ user_email: userEmail });
        for (const item of userProfileDataEntries) await base44.entities.UserProfileData.delete(item.id);
        
        const publicDirectoryEntries = await base44.entities.PublicUserDirectory.filter({ user_email: userEmail });
        for (const item of publicDirectoryEntries) await base44.entities.PublicUserDirectory.delete(item.id);
        
        const referralRequests = await base44.entities.ReferralCodeRequest.filter({ created_by: userEmail });
        for (const item of referralRequests) await base44.entities.ReferralCodeRequest.delete(item.id);

        // 3. Finally, delete the core User record itself. This will also log the user out.
        await base44.entities.User.delete(userId);

        return new Response(JSON.stringify({ success: true, message: 'Account has been deleted successfully.' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Account Deletion Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete account.', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});