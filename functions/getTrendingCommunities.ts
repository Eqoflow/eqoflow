import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    const { interests, limit = 20 } = await req.json();
    const userInterests = interests || [];
    const interestSet = new Set(userInterests.map(i => i.toLowerCase()));

    // Fetch ALL featured communities (including private ones)
    const now = new Date().toISOString();
    const featuredCommunities = await base44.asServiceRole.entities.Community.filter({
      is_featured: true,
      featured_until: { $gt: now }
    }, '-featured_until', 100);

    const featuredWithInterestMatch = [];
    const featuredWithoutInterestMatch = [];

    featuredCommunities.forEach(community => {
      const hasMatchingTags = community.tags?.some(tag => interestSet.has(tag.toLowerCase()));
      if (hasMatchingTags) {
        featuredWithInterestMatch.push(community);
      } else {
        featuredWithoutInterestMatch.push(community);
      }
    });

    const sortedFeaturedCommunities = [...featuredWithInterestMatch, ...featuredWithoutInterestMatch];

    let organicCommunities = [];
    
    if (userInterests.length > 0) {
      // Fetch ALL organic communities (including private ones)
      const allOrganicCommunities = await base44.asServiceRole.entities.Community.filter({
        is_featured: false
      }, '-created_date', limit * 3);

      const matchingOrganicCommunities = allOrganicCommunities.filter(community => {
        return community.tags?.some(tag => interestSet.has(tag.toLowerCase()));
      });

      matchingOrganicCommunities.sort((a, b) => (b.member_emails?.length || 0) - (a.member_emails?.length || 0));
      
      organicCommunities = matchingOrganicCommunities;
    }

    const finalCommunities = [...sortedFeaturedCommunities, ...organicCommunities];

    const shouldShowUpdateMessage = userInterests.length === 0 || (finalCommunities.length === 0 && userInterests.length > 0);

    return new Response(JSON.stringify({
      communities: finalCommunities.slice(0, limit),
      shouldShowUpdateMessage,
      userHasInterests: userInterests.length > 0
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});