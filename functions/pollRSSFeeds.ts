import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Strip HTML tags from a string
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
}

// Parse RSS XML and return array of items
function parseRSS(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(xmlText)) !== null) {
    const itemXml = itemMatch[1];

    const getTag = (tag) => {
      const m = new RegExp(`<${tag}[^>]*>(?:<\\!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 'si').exec(itemXml);
      return m ? m[1].trim() : '';
    };

    const getLinkAlt = () => {
      // Try <link> tag (may be self-closing or have CDATA)
      const m = itemXml.match(/<link>(.*?)<\/link>/si);
      if (m) return m[1].trim();
      // Atom-style
      const m2 = itemXml.match(/<link[^>]+href="([^"]+)"/i);
      return m2 ? m2[1] : '';
    };

    const title = stripHtml(getTag('title'));
    const link = getLinkAlt() || getTag('guid');
    const guid = getTag('guid') || link;
    const description = stripHtml(getTag('description') || getTag('summary') || getTag('content:encoded'));
    const pubDate = getTag('pubDate') || getTag('published') || getTag('dc:date');

    if (title && guid) {
      items.push({
        title,
        link,
        guid,
        excerpt: description.slice(0, 250),
        published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }
  }
  return items;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const communityId = body.community_id; // optional: poll only one community

    // Get all RSS-enabled communities
    const query = communityId ? { id: communityId, rss_enabled: true } : { rss_enabled: true };
    const communities = await base44.asServiceRole.entities.Community.filter(query);

    const results = [];

    for (const community of communities) {
      const sources = (community.rss_sources || []).filter(s => s.enabled !== false && s.url);
      if (sources.length === 0) continue;

      // Count posts created today for this community
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayPosts = await base44.asServiceRole.entities.RSSFeedPost.filter({
        community_id: community.id,
        created_date: { $gte: today.toISOString() }
      });
      let dailyCount = todayPosts.length;
      const maxPerDay = community.rss_max_per_day || 24;

      let communityNew = 0;

      for (const source of sources) {
        if (dailyCount >= maxPerDay) break;

        // Fetch RSS
        let xmlText;
        try {
          const resp = await fetch(source.url, {
            headers: { 'User-Agent': 'EqoFlow-RSS-Bot/1.0', 'Accept': 'application/rss+xml, application/xml, text/xml' },
            signal: AbortSignal.timeout(10000),
          });
          xmlText = await resp.text();
        } catch (e) {
          console.warn(`Failed to fetch RSS from ${source.url}:`, e.message);
          continue;
        }

        const items = parseRSS(xmlText);

        for (const item of items) {
          if (dailyCount >= maxPerDay) break;

          // Deduplication: check if guid already exists for this community
          const existing = await base44.asServiceRole.entities.RSSFeedPost.filter({
            community_id: community.id,
            item_guid: item.guid,
          });
          if (existing.length > 0) continue;

          const channelId = community.rss_channel_id || 'general';
          const status = community.rss_mode === 'moderated' ? 'pending' : 'approved';

          // Create RSSFeedPost record
          const rssPost = await base44.asServiceRole.entities.RSSFeedPost.create({
            community_id: community.id,
            channel_id: channelId,
            source_url: source.url,
            source_name: source.name || new URL(source.url).hostname,
            item_guid: item.guid,
            title: item.title,
            excerpt: item.excerpt,
            article_url: item.link,
            published_at: item.published_at,
            status,
          });

          // If auto mode: immediately create a CommunityMessage
          if (status === 'approved') {
            const messageContent = `**${item.title}**\n\n${item.excerpt}\n\n🔗 [Read full article](${item.link})`;
            const msg = await base44.asServiceRole.entities.CommunityMessage.create({
              community_id: community.id,
              channel_id: channelId,
              content: messageContent,
              author_email: 'rss-bot@eqoflow.app',
              author_name: source.name || 'RSS Bot',
              author_avatar_url: null,
              is_rss: true,
              rss_source_name: source.name || new URL(source.url).hostname,
              rss_article_url: item.link,
              rss_title: item.title,
              rss_excerpt: item.excerpt,
            });

            // Update rssPost with message id
            await base44.asServiceRole.entities.RSSFeedPost.update(rssPost.id, {
              community_message_id: msg.id,
            });
          }

          dailyCount++;
          communityNew++;
        }
      }

      // Update last fetched timestamp
      await base44.asServiceRole.entities.Community.update(community.id, {
        rss_last_fetched_at: new Date().toISOString(),
      });

      results.push({ community_id: community.id, community_name: community.name, new_items: communityNew });
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});