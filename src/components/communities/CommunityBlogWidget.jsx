import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function CommunityMediaWidget({ posts }) {
  const recentPosts = posts.slice(0, 5);

  return (
    <Card className="dark-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm font-semibold">MEDIA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recentPosts.length > 0 ? (
          recentPosts.map((post) => (
            <div key={post.id} className="flex gap-3 p-2 rounded-lg hover:bg-black/20 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex-shrink-0 overflow-hidden">
                {post.media_urls?.[0] ? (
                  <img src={post.media_urls[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium line-clamp-2 mb-1">
                  {post.content.substring(0, 60)}...
                </p>
                <p className="text-gray-500 text-[10px] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(post.created_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-xs text-center py-4">No posts yet</p>
        )}
      </CardContent>
    </Card>
  );
}