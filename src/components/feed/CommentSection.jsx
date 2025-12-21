import React, { useState, useEffect } from "react";
import { Comment } from "@/entities/Comment";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Heart, Reply, ThumbsDown, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const isPngImage = (url) => {
  if (!url) return false;
  return url.toLowerCase().includes('.png') || url.toLowerCase().includes('image/png');
};

const getAvatarBackgroundStyle = (avatarUrl) => {
  if (isPngImage(avatarUrl)) {
    return { background: 'linear-gradient(to right, #000000, #1a1a1a)' };
  }
  return { background: 'linear-gradient(to right, #8b5cf6, #ec4899)' };
};

export default function CommentSection({ post, onCommentAdded, currentUser, highlightCommentId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [post.id]);

  const loadComments = async () => {
    try {
      const fetchedComments = await Comment.filter({ post_id: post.id }, "-created_date");
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        content: newComment,
        post_id: post.id,
        parent_comment_id: replyTo?.id || null,
        author_full_name: currentUser.full_name || currentUser.username || currentUser.email?.split('@')[0] || "Anonymous",
        author_avatar_url: currentUser.avatar_url || null,
        author_username: currentUser.username || null,
        liked_by: [],
        disliked_by: [],
        likes_count: 0,
        dislikes_count: 0,
        reply_count: 0
      };

      const createdComment = await Comment.create(commentData);
      
      setComments([createdComment, ...comments]);
      setNewComment("");
      setReplyTo(null);

      if (onCommentAdded) {
        onCommentAdded(post, createdComment);
      }
    } catch (error) {
      console.error("Error creating comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (comment) => {
    if (!currentUser) return;

    const isLiked = comment.liked_by?.includes(currentUser.email);
    const newLikedBy = isLiked
      ? comment.liked_by.filter((email) => email !== currentUser.email)
      : [...(comment.liked_by || []), currentUser.email];

    const updatedComment = {
      ...comment,
      liked_by: newLikedBy,
      likes_count: newLikedBy.length
    };

    setComments(comments.map((c) => (c.id === comment.id ? updatedComment : c)));

    try {
      await base44.functions.invoke('likeComment', {
        commentId: comment.id,
        isLiked: !isLiked
      });
    } catch (error) {
      console.error("Error liking comment:", error);
      setComments(comments);
    }
  };

  const handleDislikeComment = async (comment) => {
    if (!currentUser) return;

    const isDisliked = comment.disliked_by?.includes(currentUser.email);
    const newDislikedBy = isDisliked
      ? comment.disliked_by.filter((email) => email !== currentUser.email)
      : [...(comment.disliked_by || []), currentUser.email];

    const updatedComment = {
      ...comment,
      disliked_by: newDislikedBy,
      dislikes_count: newDislikedBy.length
    };

    setComments(comments.map((c) => (c.id === comment.id ? updatedComment : c)));

    try {
      await Comment.update(comment.id, {
        disliked_by: newDislikedBy,
        dislikes_count: newDislikedBy.length
      });
    } catch (error) {
      console.error("Error disliking comment:", error);
      setComments(comments);
    }
  };

  const handleReplyToComment = async (parentComment, replyContent) => {
    if (!currentUser || !replyContent.trim()) return;

    try {
      const replyData = {
        content: replyContent,
        post_id: post.id,
        parent_comment_id: parentComment.id,
        author_full_name: currentUser.full_name || currentUser.username || currentUser.email?.split('@')[0] || "Anonymous",
        author_avatar_url: currentUser.avatar_url || null,
        author_username: currentUser.username || null,
        liked_by: [],
        disliked_by: [],
        likes_count: 0,
        dislikes_count: 0,
        reply_count: 0
      };

      const createdReply = await Comment.create(replyData);
      
      // Update parent comment's reply count
      await Comment.update(parentComment.id, {
        reply_count: (parentComment.reply_count || 0) + 1
      });

      setComments([createdReply, ...comments]);
      
      if (onCommentAdded) {
        onCommentAdded(post, createdReply);
      }
      
      return createdReply;
    } catch (error) {
      console.error("Error replying to comment:", error);
      throw error;
    }
  };

  const getCommentAuthorDisplayName = (comment) => {
    // Priority: full_name > username > email (as last resort)
    // Check author_full_name first (should exist for all new comments)
    if (comment.author_full_name && comment.author_full_name.trim() !== '') {
      return comment.author_full_name;
    }
    
    // Fallback to username
    if (comment.author_username && comment.author_username.trim() !== '') {
      return comment.author_username;
    }
    
    // Last resort: extract from email only if nothing else exists
    if (comment.created_by && comment.created_by.includes('@')) {
      return comment.created_by.split('@')[0];
    }
    
    return "Anonymous";
  };

  const topLevelComments = comments.filter((c) => !c.parent_comment_id);
  const getReplies = (commentId) => comments.filter((c) => c.parent_comment_id === commentId);

  const CommentItem = ({ comment, isReply = false }) => {
    const [showReplies, setShowReplies] = useState(false);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const replies = getReplies(comment.id);
    const isHighlighted = highlightCommentId === comment.id;

    const handleSubmitReply = async (e) => {
      e.preventDefault();
      if (!replyContent.trim() || isSubmittingReply) return;

      setIsSubmittingReply(true);
      try {
        await handleReplyToComment(comment, replyContent);
        setReplyContent("");
        setShowReplyInput(false);
        setShowReplies(true);
      } catch (error) {
        console.error("Error submitting reply:", error);
      } finally {
        setIsSubmittingReply(false);
      }
    };

    // Only create profile link if username exists
    const profileUrl = comment.author_username && comment.author_username.trim() !== '' 
      ? `${createPageUrl("PublicProfile")}?username=${comment.author_username}`
      : null;

    return (
      <motion.div
        id={`comment-${comment.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isReply ? "ml-8 md:ml-12" : ""} ${isHighlighted ? 'highlight-flash' : ''}`}
      >
        <div className="flex gap-3 p-3 bg-black/20 rounded-lg border border-purple-500/10 hover:border-purple-500/20 transition-colors">
          {profileUrl ? (
            <Link to={profileUrl} className="flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={getAvatarBackgroundStyle(comment.author_avatar_url)}
              >
                {comment.author_avatar_url ? (
                  <img
                    src={comment.author_avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
            </Link>
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={getAvatarBackgroundStyle(comment.author_avatar_url)}
            >
              {comment.author_avatar_url ? (
                <img
                  src={comment.author_avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {profileUrl ? (
                <Link to={profileUrl} className="font-medium text-white hover:text-purple-400 transition-colors">
                  {getCommentAuthorDisplayName(comment)}
                </Link>
              ) : (
                <span className="font-medium text-white">
                  {getCommentAuthorDisplayName(comment)}
                </span>
              )}
              <span className="text-xs text-gray-500">
                {format(new Date(comment.created_date), "MMM d, h:mm a")}
              </span>
            </div>
            
            <p className="text-gray-300 text-sm mt-1 break-words">{comment.content}</p>
            
            <div className="flex items-center gap-4 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLikeComment(comment)}
                className={`flex items-center gap-1 p-1 h-auto ${
                  comment.liked_by?.includes(currentUser?.email)
                    ? "text-red-400"
                    : "text-gray-400 hover:text-red-400"
                }`}
              >
                <Heart className={`w-3 h-3 ${comment.liked_by?.includes(currentUser?.email) ? 'fill-current' : ''}`} />
                <span className="text-xs">{comment.likes_count || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDislikeComment(comment)}
                className={`flex items-center gap-1 p-1 h-auto ${
                  comment.disliked_by?.includes(currentUser?.email)
                    ? "text-blue-400"
                    : "text-gray-400 hover:text-blue-400"
                }`}
              >
                <ThumbsDown className="w-3 h-3" />
                <span className="text-xs">{comment.dislikes_count || 0}</span>
              </Button>

              {currentUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className="flex items-center gap-1 text-gray-400 hover:text-purple-400 p-1 h-auto"
                >
                  <Reply className="w-3 h-3" />
                  <span className="text-xs">Reply</span>
                </Button>
              )}

              {replies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-gray-400 hover:text-purple-400 text-xs p-1 h-auto"
                >
                  {showReplies ? "Hide" : "Show"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </Button>
              )}
            </div>

            {showReplyInput && currentUser && (
              <form onSubmit={handleSubmitReply} className="mt-3">
                <div className="flex gap-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${getCommentAuthorDisplayName(comment)}...`}
                    className="flex-1 bg-black/20 border-purple-500/20 text-white text-sm"
                    rows={2}
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      type="submit"
                      disabled={!replyContent.trim() || isSubmittingReply}
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowReplyInput(false);
                        setReplyContent("");
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showReplies && replies.map((reply) => (
            <div key={reply.id} className="mt-2">
              <CommentItem comment={reply} isReply={true} />
            </div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-700/50">
      <h4 className="text-white font-medium mb-4">Comments</h4>

      {currentUser && (
        <form onSubmit={handleSubmitComment} className="mb-4">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-sm text-purple-400">
              <Reply className="w-4 h-4" />
              <span>Replying to {getCommentAuthorDisplayName(replyTo)}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
                className="text-gray-400 hover:text-white p-1 h-auto"
              >
                Cancel
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
              className="flex-1 bg-black/20 border-purple-500/20 text-white text-sm"
              rows={2}
            />
            <Button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        <AnimatePresence>
          {topLevelComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </AnimatePresence>
      </div>

      {comments.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}