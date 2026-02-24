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

      // Fetch only Creator Hub stamped/published posts (not regular echoes)
      const userPosts = await base44.entities.Post.filter({ 
        created_by: user.email,
        blockchain_tx_id: { $ne: null }
      }, '-created_date', 100);
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
          className="rounded-3xl p-8 relative overflow-hidden border"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            borderColor: `${userColorScheme.primary}40`
          }}>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white mb-2">Analytics dashboard</h1>
            <p className="text-white/50 text-base">Your content sync too channels command center</p>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>
          <div 
            className="rounded-2xl p-6 border text-center"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderColor: `${userColorScheme.primary}40`
            }}>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2">IMPRESSIONS</p>
            <p className="text-4xl font-bold text-white">{totalImpressions > 0 ? totalImpressions.toLocaleString() : '0'}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          <div 
            className="rounded-2xl p-6 border text-center"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderColor: `${userColorScheme.primary}40`
            }}>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2">LIKES</p>
            <p className="text-4xl font-bold text-white">{totalLikes > 0 ? totalLikes.toLocaleString() : '0'}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}>
          <div 
            className="rounded-2xl p-6 border text-center"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderColor: `${userColorScheme.primary}40`
            }}>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2">COMMENTS</p>
            <p className="text-4xl font-bold text-white">{totalComments > 0 ? totalComments.toLocaleString() : '0'}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}>
          <div 
            className="rounded-2xl p-6 border text-center"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              borderColor: `${userColorScheme.primary}40`
            }}>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2">REPOSTS</p>
            <p className="text-4xl font-bold text-white">{totalReposts > 0 ? totalReposts.toLocaleString() : '0'}</p>
          </div>
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
          <div 
            className="rounded-3xl p-6 border h-full"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              borderColor: `${userColorScheme.primary}40`
            }}>
            <h2 className="text-2xl font-bold text-white mb-6">Engagement over time</h2>
            
            <div className="flex justify-between items-center mb-6">
              <p className="text-white/40 text-sm uppercase tracking-wider">LAST 30 DAYS</p>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-white/50">TOTAL POSTS: </span>
                  <span className="text-white font-bold">{posts.length}</span>
                </div>
                <div>
                  <span className="text-white/50">TOTAL RATE: </span>
                  <span className="text-white font-bold">{engagementRate}%</span>
                </div>
                <div>
                  <span className="text-white/50">AVG LIKES/POST: </span>
                  <span className="text-white font-bold">{posts.length > 0 ? Math.round(totalLikes / posts.length) : 0}</span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="relative h-64 rounded-xl overflow-hidden" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
              <div className="absolute inset-0 flex items-end justify-center p-4">
                {posts.length === 0 ? (
                  <p className="text-white/40 text-center">No engagement data yet. Start creating content!</p>
                ) : (
                  <div className="w-full h-full relative">
                    {/* Simulated chart visualization */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-full"
                      style={{
                        background: `linear-gradient(to top, ${userColorScheme.primary}60, transparent)`,
                        clipPath: 'polygon(0% 100%, 5% 80%, 10% 85%, 15% 70%, 20% 75%, 25% 60%, 30% 65%, 35% 50%, 40% 55%, 45% 45%, 50% 40%, 55% 50%, 60% 45%, 65% 55%, 70% 50%, 75% 40%, 80% 35%, 85% 45%, 90% 30%, 95% 25%, 100% 20%, 100% 100%)'
                      }}
                    />
                    <div 
                      className="absolute bottom-0 left-0 right-0"
                      style={{
                        height: '2px',
                        background: userColorScheme.primary,
                        clipPath: 'polygon(0% 80%, 5% 80%, 10% 85%, 15% 70%, 20% 75%, 25% 60%, 30% 65%, 35% 50%, 40% 55%, 45% 45%, 50% 40%, 55% 50%, 60% 45%, 65% 55%, 70% 50%, 75% 40%, 80% 35%, 85% 45%, 90% 30%, 95% 25%, 100% 20%)',
                        boxShadow: `0 0 10px ${userColorScheme.primary}`
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Audience Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6">
          
          {/* Audience Card */}
          <div 
            className="rounded-3xl p-6 border"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              borderColor: `${userColorScheme.primary}40`
            }}>
            <div className="flex items-center gap-2 mb-4">
              <div 
                className="w-6 h-6 rounded"
                style={{ background: userColorScheme.primary }}
              />
              <h3 className="text-white font-semibold">Audience</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="transform -rotate-90" width="80" height="80">
                    <circle cx="40" cy="40" r="35" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
                    <circle 
                      cx="40" cy="40" r="35" 
                      stroke={userColorScheme.primary} 
                      strokeWidth="6" 
                      fill="none"
                      strokeDasharray={`${(user?.follower_count || 0) / 20000000 * 220} 220`}
                      style={{ filter: `drop-shadow(0 0 6px ${userColorScheme.primary})` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-white font-bold text-sm">{((user?.follower_count || 0) / 1000000).toFixed(1)}M</p>
                    <p className="text-white/50 text-xs">20M</p>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="transform -rotate-90" width="80" height="80">
                    <circle cx="40" cy="40" r="35" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
                    <circle 
                      cx="40" cy="40" r="35" 
                      stroke={userColorScheme.secondary} 
                      strokeWidth="6" 
                      fill="none"
                      strokeDasharray={`${(user?.following_count || 0) / 300 * 220} 220`}
                      style={{ filter: `drop-shadow(0 0 6px ${userColorScheme.secondary})` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-white font-bold text-sm">{((user?.following_count || 0) / 1000000).toFixed(1)}M</p>
                    <p className="text-white/50 text-xs">300</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subscribers Card */}
          <div 
            className="rounded-3xl p-6 border"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              borderColor: `${userColorScheme.primary}40`
            }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-pink-400 flex items-center justify-center">
                <span className="text-white text-xs font-bold">♪</span>
              </div>
              <h3 className="text-white font-semibold">Subscribers</h3>
            </div>
            <p className="text-3xl font-bold text-white">{creatorProfile?.subscriber_count || 0}</p>
          </div>

          {/* Top Content Card */}
          <div 
            className="rounded-3xl p-6 border"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              borderColor: `${userColorScheme.primary}40`
            }}>
            <h3 className="text-white font-semibold mb-4">Top content</h3>
            {posts.length > 0 ? (
              <div className="space-y-3">
                {posts.slice(0, 2).map((post) => (
                  <div key={post.id} className="text-white/60 text-sm">
                    <p className="line-clamp-1">{post.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-sm">No content yet</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top Performing Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}>
        <div 
          className="rounded-3xl p-6 border"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            borderColor: `${userColorScheme.primary}40`
          }}>
          <h2 className="text-2xl font-bold text-white mb-6">Top Performing Content</h2>
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
        </div>
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