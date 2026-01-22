import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await req.json();

    if (!postId) {
      return Response.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Fetch the post
    const posts = await base44.entities.Post.filter({ id: postId });
    if (posts.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = posts[0];

    // Check if content is gated
    if (!post.eqoflo_price || post.eqoflo_price <= 0) {
      return Response.json({ error: 'This content is not gated' }, { status: 400 });
    }

    // Check if user already unlocked
    if (post.unlocked_by && post.unlocked_by.includes(user.email)) {
      return Response.json({ error: 'You have already unlocked this content' }, { status: 400 });
    }

    // Check if user is the creator
    if (post.created_by === user.email) {
      return Response.json({ error: 'You cannot unlock your own content' }, { status: 400 });
    }

    // Get user's current balance
    const userProfiles = await base44.entities.UserProfileData.filter({ user_email: user.email });
    const userProfile = userProfiles.length > 0 ? userProfiles[0] : null;
    const currentBalance = userProfile?.token_balance || 0;

    // Check if user has enough balance
    if (currentBalance < post.eqoflo_price) {
      return Response.json({ 
        error: 'Insufficient balance',
        required: post.eqoflo_price,
        current: currentBalance
      }, { status: 400 });
    }

    // Calculate platform fee (7%) and creator amount (93%)
    const platformFee = Math.floor(post.eqoflo_price * 0.07);
    const creatorAmount = post.eqoflo_price - platformFee;

    // Deduct from user's balance
    const newUserBalance = currentBalance - post.eqoflo_price;
    if (userProfile) {
      await base44.entities.UserProfileData.update(userProfile.id, {
        token_balance: newUserBalance
      });
    } else {
      await base44.entities.UserProfileData.create({
        user_email: user.email,
        token_balance: newUserBalance
      });
    }

    // Add to creator's balance
    const creatorProfiles = await base44.entities.UserProfileData.filter({ user_email: post.created_by });
    if (creatorProfiles.length > 0) {
      const creatorProfile = creatorProfiles[0];
      await base44.entities.UserProfileData.update(creatorProfile.id, {
        token_balance: (creatorProfile.token_balance || 0) + creatorAmount
      });
    } else {
      await base44.entities.UserProfileData.create({
        user_email: post.created_by,
        token_balance: creatorAmount
      });
    }

    // Log platform fee as revenue
    await base44.entities.PlatformRevenue.create({
      source: 'gated_content',
      amount: platformFee,
      currency: 'eqoflo',
      description: `Platform fee from gated content unlock (Post ID: ${postId})`,
      user_email: user.email,
      creator_email: post.created_by
    });

    // Update post - add user to unlocked_by and update total_revenue
    const currentUnlockedBy = post.unlocked_by || [];
    const currentTotalRevenue = post.total_revenue || 0;

    await base44.entities.Post.update(postId, {
      unlocked_by: [...currentUnlockedBy, user.email],
      total_revenue: currentTotalRevenue + post.eqoflo_price
    });

    return Response.json({
      success: true,
      message: 'Content unlocked successfully',
      paid: post.eqoflo_price,
      creatorReceived: creatorAmount,
      platformFee: platformFee,
      newBalance: newUserBalance
    });

  } catch (error) {
    console.error('Error unlocking content:', error);
    return Response.json({ 
      error: error.message || 'Failed to unlock content' 
    }, { status: 500 });
  }
});