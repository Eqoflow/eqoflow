
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Hash } from "lucide-react";
import { Post } from "@/entities/Post";
import { setInCache, CACHE_CONFIG, invalidateCache } from '../contexts/UserContext';

export default function TrendingTopics() {
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingTags = async () => {
      try {
        // Clear cached trending topics to force refresh
        invalidateCache(CACHE_CONFIG.TRENDING_TOPICS);

        setIsLoading(true);
        // Fetch last 200 posts to get a good sample size for trends
        const posts = await Post.list("-created_date", 200);

        const tagCounts = {};
        const excludedTags = [
        'hi to everybody! i am roy. we just signed up with echo and now trying out the platform. best wishes with the launch of the new app.',
        'hi to everybody! i am roy. we just signed up with echo and now trying out the platform. best wishes with the launch of the new app',
        'roy' // Also exclude just "roy" if it appears
        ];

        posts.forEach((post) => {
          if (post.tags && Array.isArray(post.tags)) {
            post.tags.forEach((tag) => {
              if (tag) {// Ensure tag is not null or empty
                const normalizedTag = tag.toLowerCase().trim();

                // More stringent filtering
                const isExcluded = excludedTags.some((excludedTag) =>
                normalizedTag.includes(excludedTag) || excludedTag.includes(normalizedTag)
                );

                if (!isExcluded &&
                normalizedTag.length <= 25 && // Reduced from 30 to 25
                normalizedTag.length >= 2 && // Exclude very short tags
                !normalizedTag.includes('everybody') && // Additional filter
                !normalizedTag.includes('signed up')) {// Additional filter
                  tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
                }
              }
            });
          }
        });

        const sortedTags = Object.entries(tagCounts).
        filter(([tag, count]) => count > 1) // Only show tags with more than 1 use
        .sort(([, a], [, b]) => b - a).
        slice(0, 5) // Get top 5
        .map(([tag, count]) => ({
          tag,
          count,
          growth: `+${Math.floor(Math.random() * 25) + 5}%` // Add random growth for visual flair
        }));

        setTrendingTopics(sortedTags);

        // Cache the trending topics
        setInCache(CACHE_CONFIG.TRENDING_TOPICS, sortedTags);
      } catch (error) {
        console.error("Failed to fetch trending topics:", error);
        setTrendingTopics([]); // Set to empty on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingTags();
  }, []);

  const renderSkeleton = () =>
  <div className="space-y-2">
      {[...Array(5)].map((_, index) =>
    <div key={index} className="flex items-center justify-between p-2 animate-pulse">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-5 h-5 rounded-full bg-gray-700" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 w-3/4 bg-gray-700 rounded" />
              <div className="h-3 w-1/4 bg-gray-700 rounded" />
            </div>
          </div>
          <div className="h-4 w-10 bg-gray-700 rounded" />
        </div>
    )}
    </div>;


  return (
    <Card className="dark-card">
      <CardHeader className="bg-[#000000] pb-4 p-6 flex flex-col space-y-1.5">
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-[#000000] pt-0 p-6">
        {isLoading ?
        renderSkeleton() :
        trendingTopics.length > 0 ?
        <div className="space-y-2">
            {trendingTopics.map((topic, index) =>
          <div
            key={topic.tag}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-black/20 cursor-pointer transition-colors group border border-transparent hover:border-purple-500/20">

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              index === 0 ? 'bg-purple-600 text-white' :
              index === 1 ? 'bg-pink-500 text-white' :
              index === 2 ? 'bg-cyan-500 text-white' :
              'bg-black/30 text-gray-400'}`
              }>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-200 font-medium group-hover:text-purple-400 transition-colors text-sm leading-tight capitalize">
                        {topic.tag}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-tight">{topic.count} {topic.count === 1 ? 'post' : 'posts'}</p>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <span className="text-xs font-medium text-green-400">
                    {topic.growth}
                  </span>
                </div>
              </div>
          )}
          </div> :

        <div className="text-center text-gray-500 p-4">
              <p>No trending topics right now.</p>
              <p className="text-xs">Create posts with tags to start trends!</p>
            </div>
        }
      </CardContent>
    </Card>);

}