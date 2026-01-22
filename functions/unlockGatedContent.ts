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

    // Get user's current balance from User entity
    const currentBalance = parseFloat(user.token_balance) || 0;
    const requiredPrice = parseFloat(post.eqoflo_price) || 0;

    // Check if user has enough balance
    if (currentBalance < requiredPrice) {
      return Response.json({ 
        error: 'Insufficient balance',
        required: requiredPrice,
        current: currentBalance
      }, { status: 400 });
    }

    // Calculate platform fee (7%) and creator amount (93%)
    const platformFee = Math.round(requiredPrice * 0.07);
    const creatorAmount = requiredPrice - platformFee;

    // Deduct from user's balance
    const newUserBalance = currentBalance - requiredPrice;
    const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
    if (users.length > 0) {
      await base44.asServiceRole.entities.User.update(users[0].id, {
        token_balance: newUserBalance
      });
    }

    // Add to creator's balance
    const creatorUsers = await base44.asServiceRole.entities.User.filter({ email: post.created_by });
    if (creatorUsers.length > 0) {
      const creatorCurrentBalance = parseFloat(creatorUsers[0].token_balance) || 0;
      await base44.asServiceRole.entities.User.update(creatorUsers[0].id, {
        token_balance: creatorCurrentBalance + creatorAmount
      });
    }

    // Add platform fee to platform wallet
    const platformUsers = await base44.asServiceRole.entities.User.filter({ email: 'admin@eqoflow.app' });
    if (platformUsers.length > 0) {
      const platformCurrentBalance = parseFloat(platformUsers[0].token_balance) || 0;
      await base44.asServiceRole.entities.User.update(platformUsers[0].id, {
        token_balance: platformCurrentBalance + platformFee
      });
    }

    // Log to PlatformWallet for gamify transactions display
    const walletRecord = {
      transaction_type: 'ep_purchase_qflow',
      amount_qflow: platformFee,
      source_description: `Gated Content Unlock Fee from ${post.created_by}`,
      user_email: user.email,
      notes: `Buyer: ${user.email} | Creator: ${post.created_by} | Post: ${postId}`
    };

    console.log('Creating PlatformWallet record:', walletRecord);

    try {
      const createdRecord = await base44.asServiceRole.entities.PlatformWallet.create(walletRecord);
      console.log('PlatformWallet record created:', createdRecord);
    } catch (e) {
      console.error("Failed to log to PlatformWallet:", e);
    }

    // Update post - add user to unlocked_by and update total_revenue
    const currentUnlockedBy = post.unlocked_by || [];
    const currentTotalRevenue = parseFloat(post.total_revenue) || 0;

    await base44.asServiceRole.entities.Post.update(postId, {
      unlocked_by: [...currentUnlockedBy, user.email],
      total_revenue: currentTotalRevenue + requiredPrice
    });

    return Response.json({
      success: true,
      message: 'Content unlocked successfully',
      paid: requiredPrice,
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