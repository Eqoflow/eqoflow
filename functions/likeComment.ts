import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId, action } = await req.json();

    if (!commentId) {
      return Response.json({ error: 'Missing commentId' }, { status: 400 });
    }

    // Default action to 'like' if not provided
    const commentAction = action || 'like';

    const comment = await base44.entities.Comment.get(commentId);

    if (!comment) {
      return Response.json({ error: 'Comment not found' }, { status: 404 });
    }

    let updatedLikedBy = [...(comment.liked_by || [])];
    let updatedDislikedBy = [...(comment.disliked_by || [])];
    let likesCount = comment.likes_count || 0;
    let dislikesCount = comment.dislikes_count || 0;

    if (commentAction === 'like') {
      const hasLiked = updatedLikedBy.includes(user.email);
      const hasDisliked = updatedDislikedBy.includes(user.email);

      if (hasLiked) {
        // Unlike
        updatedLikedBy = updatedLikedBy.filter(email => email !== user.email);
        likesCount = Math.max(0, likesCount - 1);
      } else {
        // Like
        updatedLikedBy.push(user.email);
        likesCount += 1;

        // Remove dislike if exists
        if (hasDisliked) {
          updatedDislikedBy = updatedDislikedBy.filter(email => email !== user.email);
          dislikesCount = Math.max(0, dislikesCount - 1);
        }
      }
    } else if (commentAction === 'dislike') {
      const hasLiked = updatedLikedBy.includes(user.email);
      const hasDisliked = updatedDislikedBy.includes(user.email);

      if (hasDisliked) {
        // Remove dislike
        updatedDislikedBy = updatedDislikedBy.filter(email => email !== user.email);
        dislikesCount = Math.max(0, dislikesCount - 1);
      } else {
        // Dislike
        updatedDislikedBy.push(user.email);
        dislikesCount += 1;

        // Remove like if exists
        if (hasLiked) {
          updatedLikedBy = updatedLikedBy.filter(email => email !== user.email);
          likesCount = Math.max(0, likesCount - 1);
        }
      }
    }

    await base44.entities.Comment.update(commentId, {
      liked_by: updatedLikedBy,
      disliked_by: updatedDislikedBy,
      likes_count: likesCount,
      dislikes_count: dislikesCount
    });

    return Response.json({
      success: true,
      comment: {
        id: commentId,
        liked_by: updatedLikedBy,
        disliked_by: updatedDislikedBy,
        likes_count: likesCount,
        dislikes_count: dislikesCount
      }
    });

  } catch (error) {
    console.error('Error in likeComment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});