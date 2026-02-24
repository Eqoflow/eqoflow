import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUser } from "@/components/contexts/UserContext";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, TrendingUp, Users, Eye, Heart, MessageSquare, DollarSign, Activity, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfileAnalytics } from "@/functions/getProfileAnalytics";

export default function CreatorAnalytics() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creatorProfile, setCreatorProfile] = useState(null);

  const userColorScheme = {
    primary: user?.color_scheme ? getColorScheme(user.color_scheme).primary : '#8b5cf6',
    secondary: user?.color_scheme ? getColorScheme(user.color_scheme).secondary : '#ec4899',
    accent: user?.color_scheme ? getColorScheme(user.color_scheme).accent : '#2d1b69'
  };

  useEffect(() => {
    loadData();
    
    // Set up real-time updates every 5 seconds
    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // Real-time subscription for posts
  useEffect(() => {
    if (!user) return;

    const unsubscribe = base44.entities.Post.subscribe((event) => {
      if (event.data.created_by === user.email) {
        loadData();
      }
    });

    return unsubscribe;
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Fetch analytics data
      const { data: analyticsData } = await getProfileAnalytics();
      setAnalytics(analyticsData);

      // Fetch user's posts
      const userPosts = await base44.entities.Post.filter({ created_by: user.email }, '-created_date', 100);
      setPosts(userPosts);

      // Fetch creator profile
      const profiles = await base44.entities.CreatorProfile.filter({ created_by: user.email });
      if (profiles.length > 0) {
        setCreatorProfile(profiles[0]);
      }
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
  const engagementRate = totalImpressions > 0 ? ((totalLikes + totalComments) / totalImpressions * 100).toFixed(2) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <BarChart3 className="w-16 h-16 text-white/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8">
        <Button
          onClick={() => navigate(createPageUrl("CreatorHub"))}
          variant="ghost"
          className="mb-4 text-white/60 hover:text-white hover:bg-white/5">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Creator Hub
        </Button>

        <div 
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${userColorScheme.accent}E6, ${userColorScheme.primary}40)`,
            border: `2px solid ${userColorScheme.primary}60`
          }}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`
                }}>
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Analytics Dashboard</h1>
                <p className="text-white/70 text-lg">Real-time performance insights</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Impressions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{totalImpressions.toLocaleString()}</p>
              <p className="text-xs text-white/60 mt-1">Total views</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 border-pink-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Total Likes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{totalLikes.toLocaleString()}</p>
              <p className="text-xs text-white/60 mt-1">Across all content</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{totalComments.toLocaleString()}</p>
              <p className="text-xs text-white/60 mt-1">Community engagement</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Reposts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{totalReposts.toLocaleString()}</p>
              <p className="text-xs text-white/60 mt-1">Content shares</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Engagement Overview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20 h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" style={{ color: userColorScheme.primary }} />
                Engagement Overview
              </CardTitle>
              <CardDescription className="text-white/70">Your content performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                  <p className="text-white/60 text-sm mb-1">Total Posts</p>
                  <p className="text-3xl font-bold text-white">{posts.length}</p>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                  <p className="text-white/60 text-sm mb-1">Engagement Rate</p>
                  <p className="text-3xl font-bold text-white">{engagementRate}%</p>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                  <p className="text-white/60 text-sm mb-1">Avg. Likes/Post</p>
                  <p className="text-3xl font-bold text-white">{posts.length > 0 ? Math.round(totalLikes / posts.length) : 0}</p>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                  <p className="text-white/60 text-sm mb-1">Avg. Comments/Post</p>
                  <p className="text-3xl font-bold text-white">{posts.length > 0 ? Math.round(totalComments / posts.length) : 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Audience Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}>
          <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20 h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: userColorScheme.secondary }} />
                Audience
              </CardTitle>
              <CardDescription className="text-white/70">Community statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-white/60 text-sm mb-2">Followers</p>
                <p className="text-4xl font-bold text-white">{user?.follower_count || 0}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-2">Following</p>
                <p className="text-4xl font-bold text-white">{user?.following_count || 0}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-2">Subscribers</p>
                <p className="text-4xl font-bold text-white">{creatorProfile?.subscriber_count || 0}</p>
              </div>
              {analytics?.total_profile_views && (
                <div>
                  <p className="text-white/60 text-sm mb-2">Profile Views</p>
                  <p className="text-4xl font-bold text-white">{analytics.total_profile_views.toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Performing Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}>
        <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5" style={{ color: userColorScheme.primary }} />
              Top Performing Content
            </CardTitle>
            <CardDescription className="text-white/70">Your most engaged posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {posts
                .sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count))
                .slice(0, 10)
                .map((post, index) => (
                  <div key={post.id} className="bg-black/40 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{
                              background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`
                            }}>
                            {index + 1}
                          </div>
                          <p className="text-white text-sm line-clamp-2">{post.content}</p>
                        </div>
                        <p className="text-white/40 text-xs">
                          {new Date(post.created_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm text-white/70">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {post.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {post.comments_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.impressions_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              {posts.length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-white/20" />
                  <p className="text-white/50">No content yet. Start creating to see analytics!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Revenue Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6">
        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Revenue
            </CardTitle>
            <CardDescription className="text-white/70">Your earnings overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-white/60 text-sm mb-2">Lifetime Earnings</p>
                <p className="text-4xl font-bold text-white">$0.00</p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-2">This Month</p>
                <p className="text-4xl font-bold text-white">$0.00</p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-2">Pending</p>
                <p className="text-4xl font-bold text-white">$0.00</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function getColorScheme(schemeName) {
  const colorSchemes = {
    purple: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#2d1b69' },
    blue: { primary: '#3b82f6', secondary: '#06b6d4', accent: '#1e3a8a' },
    green: { primary: '#10b981', secondary: '#059669', accent: '#064e3b' },
    orange: { primary: '#f97316', secondary: '#eab308', accent: '#92400e' },
    red: { primary: '#ef4444', secondary: '#ec4899', accent: '#991b1b' },
    pink: { primary: '#ec4899', secondary: '#f472b6', accent: '#be185d' },
    cyan: { primary: '#06b6d4', secondary: '#3b82f6', accent: '#0e7490' },
    yellow: { primary: '#eab308', secondary: '#f97316', accent: '#a16207' },
    indigo: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#4338ca' },
    emerald: { primary: '#10b981', secondary: '#059646', accent: '#065f46' }
  };
  return colorSchemes[schemeName] || colorSchemes.purple;
}