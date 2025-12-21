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
    if (!currentUser || currentUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const { userEmail, badgeData, removeBadgeIndex } = await req.json();

    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'User email is required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Find the target user
    const users = await base44.entities.User.filter({ email: userEmail });
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const targetUser = users[0];
    let currentBadges = targetUser.custom_badges || [];

    if (typeof removeBadgeIndex === 'number') {
      // Remove badge
      if (removeBadgeIndex >= 0 && removeBadgeIndex < currentBadges.length) {
        currentBadges.splice(removeBadgeIndex, 1);
      } else {
        return new Response(JSON.stringify({ error: 'Invalid badge index' }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
    } else if (badgeData) {
      // Add badge
      if (!badgeData.name || !badgeData.icon || !badgeData.color) {
        return new Response(JSON.stringify({ error: 'Badge name, icon, and color are required' }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      // Check if user already has 5 custom badges (limit)
      if (currentBadges.length >= 5) {
        return new Response(JSON.stringify({ error: 'User already has maximum number of custom badges (5)' }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      currentBadges.push({
        ...badgeData,
        assignedAt: new Date().toISOString(),
        assignedBy: currentUser.email
      });
    } else {
      return new Response(JSON.stringify({ error: 'Either badgeData or removeBadgeIndex must be provided' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Update the user's custom badges in the main User entity
    await base44.entities.User.update(targetUser.id, {
      custom_badges: currentBadges
    });

    // CRITICAL: Also update the PublicUserDirectory to ensure badges show immediately
    try {
      const existingPublicEntries = await base44.entities.PublicUserDirectory.filter({ 
        user_email: userEmail 
      });

      if (existingPublicEntries && existingPublicEntries.length > 0) {
        // Update existing entry with custom badges
        const publicEntry = existingPublicEntries[0];
        await base44.entities.PublicUserDirectory.update(publicEntry.id, {
          ...publicEntry,
          custom_badges: currentBadges  // Add custom badges to public directory
        });
        console.log('Updated PublicUserDirectory with new custom badges for:', userEmail);
      }
    } catch (publicDirError) {
      console.warn('Could not update PublicUserDirectory with badges:', publicDirError);
      // Don't fail the entire operation if this fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: removeBadgeIndex !== undefined ? 'Badge removed successfully' : 'Badge assigned successfully',
      badgeCount: currentBadges.length,
      badges: currentBadges
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Badge assignment error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});