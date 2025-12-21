import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { TrendingUp, Users, Hash } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TrendingWidgets() {
  const [trendingTags, setTrendingTags] = useState([]);
  const [trendingCommunities, setTrendingCommunities] = useState([]);

  useEffect(() => {
    loadTrendingData();
  }, []);

  const loadTrendingData = async () => {
    try {
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

      // Load posts and extract trending tags
      const posts = await base44.entities.Post.list('-created_date', 30);
      const tagCounts = {};
      
      posts.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));

      setTrendingTags(sortedTags);

      // Add delay between calls
      await new Promise(resolve => setTimeout(resolve, 300));

      // Load trending communities
      const communities = await base44.entities.Community.list('-created_date', 5);
      setTrendingCommunities(communities);

    } catch (error) {
      console.warn("Could not load trending data:", error);
      // Set empty arrays on error to avoid UI issues
      setTrendingTags([]);
      setTrendingCommunities([]);
    }
  };

  return (
    <div className="space-y-6 sticky top-32">
      {/* Trending Topics */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-white">Trending Topics</h3>
        </div>
        <div className="space-y-3">
          {trendingTags.length > 0 ? (
            trendingTags.map((item, index) => (
              <Link
                key={item.tag}
                to={createPageUrl(`TagPage?tag=${encodeURIComponent(item.tag)}`)}
                className="block"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Hash className="w-4 h-4 text-purple-400" />
                    <span className="text-white group-hover:text-purple-300 transition-colors">
                      {item.tag}
                    </span>
                  </div>
                  <span className="text-xs text-white/50">{item.count} posts</span>
                </motion.div>
              </Link>
            ))
          ) : (
            <p className="text-white/30 text-sm">No trending topics yet</p>
          )}
        </div>
      </motion.div>

      {/* Trending Communities */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-teal-400" />
          <h3 className="text-lg font-bold text-white">EqoChambers</h3>
        </div>
        <div className="space-y-3">
          {trendingCommunities.length > 0 ? (
            trendingCommunities.map((community, index) => (
              <Link
                key={community.id}
                to={`${createPageUrl("CommunityProfile")}?id=${community.id}`}
                className="block"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  {community.logo_url ? (
                    <img 
                      src={community.logo_url} 
                      alt={community.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate group-hover:text-teal-300 transition-colors">
                      {community.name}
                    </p>
                    <p className="text-white/30 text-xs truncate">
                      {community.member_emails?.length || 0} members
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))
          ) : (
            <p className="text-white/30 text-sm">No communities yet</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}