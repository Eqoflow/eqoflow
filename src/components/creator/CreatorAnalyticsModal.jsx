import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, Eye, Heart, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getProfileAnalytics } from "@/functions/getProfileAnalytics";

export default function CreatorAnalyticsModal({ isOpen, onClose, user, userColorScheme }) {
  const [analytics, setAnalytics] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stampedCount, setStampedCount] = useState(0);

  useEffect(() => {
    if (isOpen && user) {
      loadAnalytics();
    }
  }, [isOpen, user]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Fetch analytics data
      const { data: analyticsData } = await getProfileAnalytics();
      setAnalytics(analyticsData);

      // Fetch user's posts
      const userPosts = await base44.entities.Post.filter({ created_by: user.email }, '-created_date', 50);
      setPosts(userPosts);

      // Count stamped content
      const stampedContent = userPosts.filter(post => post.blockchain_tx_id);
      setStampedCount(stampedContent.length);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
  const totalImpressions = posts.reduce((sum, post) => sum + (post.impressions_count || 0), 0);
  const totalReposts = posts.reduce((sum, post) => sum + (post.reposts_count || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-white/20 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BarChart3 className="w-6 h-6" style={{ color: userColorScheme.secondary }} />
            Creator Analytics Dashboard
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Track your content performance and audience insights
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-3 bg-black">
              <TabsTrigger value="overview" className="data-[state=active]:bg-black data-[state=active]:border data-[state=active]:border-white/20">Overview</TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-black data-[state=active]:border data-[state=active]:border-white/20">Content</TabsTrigger>
              <TabsTrigger value="audience" className="data-[state=active]:bg-black data-[state=active]:border data-[state=active]:border-white/20">Audience</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-black border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Impressions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-white">{totalImpressions.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card className="bg-black border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Total Likes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-white">{totalLikes.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card className="bg-black border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-white">{totalComments.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card className="bg-black border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Reposts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-white">{totalReposts.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-black border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Engagement Overview</CardTitle>
                  <CardDescription className="text-white/70">Your content performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-white/70 text-sm">Total Posts</span>
                      <span className="text-white font-bold">{posts.length}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-white/70 text-sm">Avg. Likes per Post</span>
                      <span className="text-white font-bold">{posts.length > 0 ? Math.round(totalLikes / posts.length) : 0}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-white/70 text-sm">Avg. Comments per Post</span>
                      <span className="text-white font-bold">{posts.length > 0 ? Math.round(totalComments / posts.length) : 0}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-white/70 text-sm">Engagement Rate</span>
                      <span className="text-white font-bold">
                        {totalImpressions > 0 ? ((totalLikes + totalComments) / totalImpressions * 100).toFixed(2) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card className="bg-black border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Top Performing Content</CardTitle>
                  <CardDescription className="text-white/70">Your most engaged posts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {posts
                      .sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count))
                      .slice(0, 10)
                      .map((post, index) => (
                        <div key={post.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">{post.content}</p>
                              <p className="text-white/50 text-xs mt-1">
                                {new Date(post.created_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-3 text-xs text-white/70">
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {post.likes_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {post.comments_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {post.impressions_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    {posts.length === 0 && (
                      <p className="text-white/50 text-center py-8">No content yet. Start creating!</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audience" className="space-y-4">
              <Card className="bg-black border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Audience Statistics
                  </CardTitle>
                  <CardDescription className="text-white/70">Your follower metrics and growth</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/70">Total Followers</span>
                      <span className="text-2xl font-bold text-white">{user?.follower_count || 0}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/70">Total Following</span>
                      <span className="text-2xl font-bold text-white">{user?.following_count || 0}</span>
                    </div>
                  </div>
                  {analytics?.total_profile_views && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white/70">Profile Views</span>
                        <span className="text-2xl font-bold text-white">{analytics.total_profile_views.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}