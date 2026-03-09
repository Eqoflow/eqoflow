import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { rss_post_id, action } = await req.json(); // action: 'approve' | 'reject'
    if (!rss_post_id || !['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Invalid params' }, { status: 400 });
    }

    const rssPost = await base44.asServiceRole.entities.RSSFeedPost.filter({ id: rss_post_id });
    if (!rssPost.length) return Response.json({ error: 'Not found' }, { status: 404 });
    const post = rssPost[0];

    // Verify user is creator or admin
    const community = await base44.asServiceRole.entities.Community.filter({ id: post.community_id });
    if (!community.length) return Response.json({ error: 'Community not found' }, { status: 404 });
    const comm = community[0];

    const isCreator = comm.created_by === user.email;
    const isAdmin = user.role === 'admin';
    if (!isCreator && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'reject') {
      await base44.asServiceRole.entities.RSSFeedPost.update(rss_post_id, { status: 'rejected' });
      return Response.json({ success: true, action: 'rejected' });
    }

    // Approve: create CommunityMessage
    const messageContent = `**${post.title}**\n\n${post.excerpt || ''}\n\n🔗 [Read full article](${post.article_url})`;
    const msg = await base44.asServiceRole.entities.CommunityMessage.create({
      community_id: post.community_id,
      channel_id: post.channel_id || 'general',
      content: messageContent,
      author_email: 'rss-bot@eqoflow.app',
      author_name: post.source_name || 'RSS Bot',
      author_avatar_url: null,
      is_rss: true,
      rss_source_name: post.source_name,
      rss_article_url: post.article_url,
      rss_title: post.title,
      rss_excerpt: post.excerpt,
    });

    await base44.asServiceRole.entities.RSSFeedPost.update(rss_post_id, {
      status: 'approved',
      community_message_id: msg.id,
    });

    return Response.json({ success: true, action: 'approved', message_id: msg.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});