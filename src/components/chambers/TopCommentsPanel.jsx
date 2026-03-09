import React from 'react';
import { MoreHorizontal, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function CommentCard({ comment }) {
  const timeAgo = comment.created_date
    ? formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })
    : '';

  return (
    <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-2">
      {/* Author row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
            {comment.author_avatar_url ? (
              <img
                src={comment.author_avatar_url}
                alt={comment.author_full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xs font-bold">
                {comment.author_full_name?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <span className="text-white text-sm font-semibold truncate">
            {comment.author_full_name || 'Anonymous'}
          </span>
        </div>
        <button className="text-gray-600 hover:text-gray-400 flex-shrink-0">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">
        {comment.content}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-xs">{timeAgo}</span>
        {comment.likes_count > 0 && (
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
            <span className="text-gray-500 text-xs">{comment.likes_count}</span>
          </div>
        )}
      </div>

      {/* Nested replies preview */}
      {comment.reply_count > 0 && (
        <div className="pl-3 border-l border-white/10 pt-1 space-y-1">
          <p className="text-gray-600 text-xs">{comment.reply_count} repl{comment.reply_count === 1 ? 'y' : 'ies'}</p>
        </div>
      )}
    </div>
  );
}

export default function TopCommentsPanel({ comments }) {
  return (
    <div className="w-[280px] flex-shrink-0 bg-black/20 border-l border-white/5 flex flex-col overflow-hidden">
      <div className="p-4 flex-shrink-0 border-b border-white/5">
        <h2 className="text-white font-semibold text-base">Top Comments</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {comments.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">No comments yet</p>
        ) : (
          comments.map(comment => (
            <CommentCard key={comment.id} comment={comment} />
          ))
        )}
      </div>

      <NewsAndUpdatesWidget />
    </div>
  );
}