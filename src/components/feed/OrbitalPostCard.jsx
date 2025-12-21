import React from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, User } from "lucide-react";
import { format } from "date-fns";

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

export default function OrbitalPostCard({ post, onClick }) {
  const displayName = post.author_full_name || post.author?.full_name || post.created_by?.split('@')[0] || 'Anonymous';
  const avatarUrl = post.author_avatar_url || post.author?.avatar_url;

  const hasMedia = post.media_urls && post.media_urls.length > 0;
  const firstMediaUrl = hasMedia ? post.media_urls[0] : null;
  const isImage = firstMediaUrl && ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(
    firstMediaUrl.split('.').pop().toLowerCase().split('?')[0]
  );

  return (
    <motion.div
      onClick={onClick}
      className="w-64 backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl overflow-hidden shadow-2xl hover:shadow-purple-500/30 transition-shadow cursor-pointer"
      whileHover={{ scale: 1.02 }}
    >
      {/* Media Preview */}
      {hasMedia && isImage && (
        <div className="w-full h-40 overflow-hidden">
          <img 
            src={firstMediaUrl} 
            alt="Post media"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={getAvatarBackgroundStyle(avatarUrl)}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{displayName}</p>
            <p className="text-white/40 text-xs">
              {format(new Date(post.created_date), "MMM d")}
            </p>
          </div>
        </div>

        {/* Post Content */}
        <p className="text-white/80 text-sm line-clamp-3 mb-3">
          {post.content}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-white/50 text-xs">
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            <span>{post.likes_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            <span>{post.comments_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="w-3 h-3" />
            <span>{post.reposts_count || 0}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}