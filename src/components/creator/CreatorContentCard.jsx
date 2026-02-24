import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useUser } from "@/components/contexts/UserContext";
import { Heart, MessageSquare, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

export default function CreatorContentCard({ item, userColorScheme, onUpdate }) {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(item.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && item.liked_by) {
      setIsLiked(item.liked_by.includes(user.email));
    }
    setLikesCount(item.likes_count || 0);
    setCommentsCount(item.comments_count || 0);
  }, [item, user]);

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const loadComments = async () => {
    try {
      const postComments = await base44.entities.Comment.filter({ post_id: item.id }, '-created_date', 50);
      setComments(postComments);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const currentLikedBy = item.liked_by || [];
      const newIsLiked = !isLiked;
      
      let updatedLikedBy;
      let newLikesCount;

      if (newIsLiked) {
        updatedLikedBy = [...currentLikedBy, user.email];
        newLikesCount = likesCount + 1;
      } else {
        updatedLikedBy = currentLikedBy.filter(email => email !== user.email);
        newLikesCount = Math.max(0, likesCount - 1);
      }

      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);

      await base44.entities.Post.update(item.id, {
        liked_by: updatedLikedBy,
        likes_count: newLikesCount
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error liking post:", error);
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount + 1 : likesCount - 1);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await base44.entities.Comment.create({
        post_id: item.id,
        content: newComment.trim(),
        author_full_name: user.full_name,
        author_avatar_url: user.avatar_url,
        author_username: user.username
      });

      const newCommentsCount = commentsCount + 1;
      setCommentsCount(newCommentsCount);

      await base44.entities.Post.update(item.id, {
        comments_count: newCommentsCount
      });

      setNewComment("");
      await loadComments();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-black/40 rounded-lg border border-white/10 overflow-hidden group hover:border-purple-500/50 transition-all">
      {item.media_urls && item.media_urls.length > 0 && (
        <div className="aspect-video bg-black/60 relative overflow-hidden">
          {item.media_urls[0].match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <img
              src={item.media_urls[0]}
              alt={item.author_full_name}
              className="w-full h-full object-cover"
            />
          ) : item.media_urls[0].match(/\.(mp4|webm|mov)$/i) ? (
            <video
              src={item.media_urls[0]}
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Shield className="w-12 h-12 text-white/30" />
            </div>
          )}
          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
            <Shield className="w-4 h-4 text-green-400" />
          </div>
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-white font-semibold mb-1">{item.author_full_name || "Untitled"}</h3>
        <p className="text-white/60 text-sm mb-3 line-clamp-2">{item.content || "No description"}</p>
        
        {/* Interactions */}
        <div className="flex items-center gap-4 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex items-center gap-2 ${isLiked ? 'text-red-400' : 'text-white/60'} hover:text-red-400`}>
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likesCount}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
            className="flex items-center gap-2 text-white/60 hover:text-white">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">{commentsCount}</span>
          </Button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 pt-3 space-y-3"
              onClick={(e) => e.stopPropagation()}>
              
              {/* Comment Form */}
              {user && (
                <form onSubmit={handleComment} className="space-y-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-black/40 border-white/20 text-white placeholder:text-white/40 min-h-[60px]"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim() || isSubmitting}
                    style={{
                      background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`
                    }}>
                    {isSubmitting ? "Posting..." : "Post Comment"}
                  </Button>
                </form>
              )}

              {/* Comments List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-white/40 text-xs text-center py-2">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-white/5 rounded-lg p-2">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold">{comment.author_full_name}</p>
                          <p className="text-white/70 text-xs mt-1">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Creator Info */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
          {item.creator_logo ? (
            <img src={item.creator_logo} alt="Creator Logo" className="w-6 h-6 object-contain" />
          ) : (
            <Sparkles className="w-6 h-6 text-yellow-400" />
          )}
          <span className="text-white/80 text-xs">By {item.creator_name || item.created_by.split('@')[0]}</span>
        </div>
      </div>
    </div>
  );
}