import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return new Response('User not found', { status: 404 });
    }
    
    // Check if user already received welcome bonus
    if (user.welcome_bonus_received) {
      return new Response(JSON.stringify({ 
        message: 'Welcome bonus already received',
        already_received: true 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get welcome bonus configuration
    const configKeys = [
      'welcome_bonus_initial_amount',
      'welcome_bonus_user_limit', 
      'welcome_bonus_subsequent_amount',
      'welcome_bonus_awarded_count'
    ];

    const configs = await base44.asServiceRole.entities.PlatformConfig.filter({
      key: { $in: configKeys }
    });

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {});

    // Parse configuration values with defaults
    const initialAmount = parseInt(configMap.welcome_bonus_initial_amount, 10) || 1000;
    const userLimit = parseInt(configMap.welcome_bonus_user_limit, 10) || 100;
    const subsequentAmount = parseInt(configMap.welcome_bonus_subsequent_amount, 10) || 500;
    const awardedCount = parseInt(configMap.welcome_bonus_awarded_count, 10) || 0;

    // Determine bonus amount based on awarded count
    const bonusAmount = awardedCount < userLimit ? initialAmount : subsequentAmount;

    // Skip if subsequent amount is 0 (no more bonuses)
    if (bonusAmount === 0) {
      return new Response(JSON.stringify({ 
        message: 'Welcome bonus program has ended',
        bonus_amount: 0 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Award the welcome bonus
    const newTokenBalance = (user.token_balance || 0) + bonusAmount;
    
    // Check if user should get Pioneer badge (first 100 users by creation date)
    let shouldGetPioneerBadge = false;
    try {
      // Get the first 100 users by creation date
      const firstUsers = await base44.asServiceRole.entities.User.list('created_date', 100);
      const pioneerEmails = new Set(firstUsers.map(u => u.email));
      
      // Check if current user is in the first 100
      if (pioneerEmails.has(user.email)) {
        shouldGetPioneerBadge = true;
      }
    } catch (error) {
      console.warn('Could not check pioneer status:', error);
    }

    // Prepare update data
    const updateData = {
      token_balance: newTokenBalance,
      welcome_bonus_received: true
    };

    // Add Pioneer badge if eligible
    if (shouldGetPioneerBadge) {
      const currentBadges = user.custom_badges || [];
      
      // Check if user already has a Pioneer badge
      const hasPioneerBadge = currentBadges.some(badge => 
        badge.name === 'Pioneer' || badge.name === 'pioneer'
      );
      
      if (!hasPioneerBadge) {
        const pioneerBadge = {
          name: 'Pioneer',
          description: 'One of the first 100 users to join QuantumFlow',
          icon: 'Rocket',
          color: 'bg-gradient-to-r from-emerald-500 to-teal-500',
          textColor: 'text-white',
          borderColor: 'border-emerald-400/50',
          assignedAt: new Date().toISOString(),
          assignedBy: 'system'
        };
        
        currentBadges.push(pioneerBadge);
        updateData.custom_badges = currentBadges;
        
        console.log('Awarded Pioneer badge to:', user.email);
      }
    }

    // Update user
    await base44.asServiceRole.entities.User.update(user.id, updateData);
    
    // Increment the awarded count in config
    const currentCountConfig = configs.find(c => c.key === 'welcome_bonus_awarded_count');
    if (currentCountConfig) {
      await base44.asServiceRole.entities.PlatformConfig.update(currentCountConfig.id, {
        value: String(awardedCount + 1)
      });
    } else {
      // Create the config if it doesn't exist
      await base44.asServiceRole.entities.PlatformConfig.create({
        key: 'welcome_bonus_awarded_count',
        value: '1'
      });
    }
    
    // Ensure user is in PublicUserDirectory with latest data including badges
    try {
      const existingPublicEntries = await base44.asServiceRole.entities.PublicUserDirectory.filter({ 
        user_email: user.email 
      });
      
      const directoryEntry = {
        user_email: user.email,
        full_name: user.full_name || 'Anonymous User',
        username: user.username || null,
        avatar_url: user.avatar_url || null,
        banner_url: user.banner_url || null,
        bio: user.bio || null,
        skills: user.skills || [],
        interests: user.interests || [],
        reputation_score: user.reputation_score || 100,
        is_public: user.privacy_settings?.profile_visibility !== 'private',
        total_follower_count: 0,
        join_date: user.created_date,
        cross_platform_identity: user.cross_platform_identity || { web2_verifications: [], web3_connections: [] },
        professional_credentials: user.professional_credentials || { is_verified: false, credentials: [] },
        custom_badges: updateData.custom_badges || user.custom_badges || []
      };

      if (existingPublicEntries && existingPublicEntries.length > 0) {
        await base44.asServiceRole.entities.PublicUserDirectory.update(existingPublicEntries[0].id, directoryEntry);
      } else {
        await base44.asServiceRole.entities.PublicUserDirectory.create(directoryEntry);
      }
      
      console.log('Updated PublicUserDirectory with welcome bonus data for:', user.email);
    } catch (publicDirError) {
      console.warn('Could not update PublicUserDirectory:', publicDirError);
    }
    
    return new Response(JSON.stringify({ 
      message: 'Welcome bonus awarded successfully',
      bonus_amount: bonusAmount,
      new_balance: newTokenBalance,
      pioneer_badge_awarded: shouldGetPioneerBadge,
      bonus_type: awardedCount < userLimit ? 'initial' : 'subsequent'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Welcome bonus error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to award welcome bonus',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});