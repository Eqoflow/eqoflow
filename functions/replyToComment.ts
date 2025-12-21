import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { parentCommentId, content, postId } = await req.json();

    if (!parentCommentId || !content || !postId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the parent comment to get author info
    const parentComment = await base44.entities.Comment.get(parentCommentId);
    if (!parentComment) {
      return Response.json({ error: 'Parent comment not found' }, { status: 404 });
    }

    // Create the reply comment
    const newReply = await base44.entities.Comment.create({
      content: content.trim(),
      post_id: postId,
      parent_comment_id: parentCommentId,
      author_full_name: user.full_name,
      author_avatar_url: user.avatar_url,
      author_username: user.username,
      liked_by: [],
      disliked_by: [],
      likes_count: 0,
      dislikes_count: 0,
      reply_count: 0
    });

    // Update parent comment's reply count
    await base44.entities.Comment.update(parentCommentId, {
      reply_count: (parentComment.reply_count || 0) + 1
    });

    // Create notification for the parent comment author if they're not the one replying
    if (parentComment.created_by !== user.email) {
      try {
        await base44.entities.Notification.create({
          recipient_email: parentComment.created_by,
          type: 'comment',
          message: `${user.full_name} replied to your comment`,
          actor_email: user.email,
          actor_name: user.full_name,
          actor_avatar: user.avatar_url,
          related_content_id: newReply.id,
          related_content_type: 'comment',
          action_url: `${Deno.env.get('BASE44_APP_URL') || 'https://www.eqoflow.app'}/Feed?postId=${postId}&commentId=${newReply.id}`,
          is_read: false
        });
        console.log('Comment reply notification created successfully');
      } catch (notifError) {
        console.error('Failed to create notification for comment reply:', notifError);
        // Don't fail the reply operation if notification fails
      }
    }

    return Response.json({ 
      success: true,
      reply: newReply
    });

  } catch (error) {
    console.error('Error in replyToComment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});