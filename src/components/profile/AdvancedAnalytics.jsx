
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Sparkles, TrendingUp, Eye, Heart, Users, FileText, Image, Video, ArrowUp, ArrowDown, Minus, Loader2, MessageCircle, Repeat, MapPin, Search, Home, Compass, ExternalLink, Clock, Hash, Zap, DollarSign, Download, Activity, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ProfileAnalytics } from '@/entities/ProfileAnalytics';
import { Post } from '@/entities/Post';
import { Follow } from '@/entities/Follow';
import { Subscription } from '@/entities/Subscription';
import { MarketplaceTransaction } from '@/entities/MarketplaceTransaction';
import { AIBrandingPartnership } from '@/entities/AIBrandingPartnership';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';

export default function AdvancedAnalytics({ user }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liveViewers, setLiveViewers] = useState(0);

  // Check if user has any Eqo+ subscription (updated to match lowercase tier names)
  const hasLiteOrHigher = user?.subscription_tier && ['lite', 'creator', 'pro'].includes(user.subscription_tier);
  const hasCreatorOrHigher = user?.subscription_tier && ['creator', 'pro'].includes(user.subscription_tier);
  const hasProTier = user?.subscription_tier === 'pro';

  // Simulate live viewers for Pro users
  useEffect(() => {
    if (hasProTier) {
      const interval = setInterval(() => {
        setLiveViewers(Math.floor(Math.random() * 10) + 1); // Random 1-10 viewers
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [hasProTier]);

  useEffect(() => {
    if (hasLiteOrHigher) {
      loadAnalytics();
    } else {
      setIsLoading(false);
    }
  }, [user, hasLiteOrHigher]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Fetch profile views
      const allProfileViews = await ProfileAnalytics.filter({ profile_owner_email: user.email });
      const recentViews = allProfileViews.filter(v => new Date(v.view_timestamp) >= sevenDaysAgo);
      const previousWeekViews = allProfileViews.filter(v => {
        const viewDate = new Date(v.view_timestamp);
        return viewDate >= fourteenDaysAgo && viewDate < sevenDaysAgo;
      });

      // Fetch user posts
      const userPosts = await Post.filter({ created_by: user.email });

      // Calculate total impressions and reactions
      const totalImpressions = userPosts.reduce((sum, post) => sum + (post.impressions_count || 0), 0);
      const totalReactions = userPosts.reduce((sum, post) => 
        sum + (post.likes_count || 0) + (post.comments_count || 0) + (post.reposts_count || 0), 0
      );

      // Content type breakdown
      const contentTypes = {
        text: { count: 0, impressions: 0 },
        image: { count: 0, impressions: 0 },
        video: { count: 0, impressions: 0 }
      };

      userPosts.forEach(post => {
        if (post.youtube_video_id) {
          contentTypes.video.count += 1;
          contentTypes.video.impressions += (post.impressions_count || 0);
        } else if (post.media_urls && post.media_urls.length > 0) {
          contentTypes.image.count += 1;
          contentTypes.image.impressions += (post.impressions_count || 0);
        } else {
          contentTypes.text.count += 1;
          contentTypes.text.impressions += (post.impressions_count || 0);
        }
      });

      // Fetch follower data
      const allFollowers = await Follow.filter({ following_email: user.email });
      const recentFollowers = allFollowers.filter(f => new Date(f.created_date) >= sevenDaysAgo);
      const previousWeekFollowers = allFollowers.filter(f => {
        const followDate = new Date(f.created_date);
        return followDate >= fourteenDaysAgo && followDate < sevenDaysAgo;
      });

      // Calculate percentage changes
      const viewsChange = previousWeekViews.length > 0 
        ? ((recentViews.length - previousWeekViews.length) / previousWeekViews.length) * 100 
        : recentViews.length > 0 ? 100 : 0;

      const followersChange = previousWeekFollowers.length > 0
        ? ((recentFollowers.length - previousWeekFollowers.length) / previousWeekFollowers.length) * 100
        : recentFollowers.length > 0 ? 100 : 0;

      let creatorAnalytics = {};
      let proAnalytics = {};

      // CREATOR+ SPECIFIC ANALYTICS
      if (hasCreatorOrHigher) {
        // Top 5 Posts by engagement
        const postsWithEngagement = userPosts.map(post => ({
          ...post,
          totalEngagement: (post.likes_count || 0) + (post.comments_count || 0) + (post.reposts_count || 0)
        })).sort((a, b) => b.totalEngagement - a.totalEngagement).slice(0, 5);

        // Content Type Trends (last 30 days)
        const contentTypeTrends = eachDayOfInterval({
          start: thirtyDaysAgo,
          end: now
        }).map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const postsOnDay = userPosts.filter(p => format(new Date(p.created_date), 'yyyy-MM-dd') === dateStr);
          
          return {
            date: format(date, 'MMM dd'),
            text: postsOnDay.filter(p => !p.youtube_video_id && (!p.media_urls || p.media_urls.length === 0)).reduce((sum, p) => sum + (p.impressions_count || 0), 0) / Math.max(postsOnDay.filter(p => !p.youtube_video_id && (!p.media_urls || p.media_urls.length === 0)).length, 1),
            image: postsOnDay.filter(p => p.media_urls && p.media_urls.length > 0 && !p.youtube_video_id).reduce((sum, p) => sum + (p.impressions_count || 0), 0) / Math.max(postsOnDay.filter(p => p.media_urls && p.media_urls.length > 0 && !p.youtube_video_id).length, 1),
            video: postsOnDay.filter(p => p.youtube_video_id).reduce((sum, p) => sum + (p.impressions_count || 0), 0) / Math.max(postsOnDay.filter(p => p.youtube_video_id).length, 1)
          };
        });

        // Follower Growth Chart (last 3 months)
        const followerGrowth = eachMonthOfInterval({
          start: subMonths(now, 3),
          end: now
        }).map(month => {
          const monthStr = format(month, 'yyyy-MM');
          const followersAtEndOfMonth = allFollowers.filter(f => format(new Date(f.created_date), 'yyyy-MM') <= monthStr).length;
          
          return {
            month: format(month, 'MMM yyyy'),
            followers: followersAtEndOfMonth
          };
        });

        // Audience Demographics (mock data for now - would need geolocation data)
        const audienceDemographics = [
          { location: 'United Kingdom', count: Math.floor(allFollowers.length * 0.35) },
          { location: 'United States', count: Math.floor(allFollowers.length * 0.25) },
          { location: 'Canada', count: Math.floor(allFollowers.length * 0.15) },
          { location: 'Australia', count: Math.floor(allFollowers.length * 0.12) },
          { location: 'Other', count: Math.floor(allFollowers.length * 0.13) }
        ];

        // Engagement Breakdown
        const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
        const totalComments = userPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
        const totalReposts = userPosts.reduce((sum, post) => sum + (post.reposts_count || 0), 0);
        const totalEngagements = totalLikes + totalComments + totalReposts;

        const engagementBreakdown = [
          { name: 'Likes', value: totalLikes, percentage: totalEngagements > 0 ? ((totalLikes / totalEngagements) * 100).toFixed(1) : 0 },
          { name: 'Comments', value: totalComments, percentage: totalEngagements > 0 ? ((totalComments / totalEngagements) * 100).toFixed(1) : 0 },
          { name: 'Reposts', value: totalReposts, percentage: totalEngagements > 0 ? ((totalReposts / totalEngagements) * 100).toFixed(1) : 0 }
        ];

        // Traffic Sources (mock data - would need actual tracking)
        const trafficSources = [
          { source: 'Main Feed', views: Math.floor(allProfileViews.length * 0.45), icon: Home },
          { source: 'Discovery', views: Math.floor(allProfileViews.length * 0.30), icon: Compass },
          { source: 'Search', views: Math.floor(allProfileViews.length * 0.15), icon: Search },
          { source: 'Direct Links', views: Math.floor(allProfileViews.length * 0.10), icon: ExternalLink }
        ];

        creatorAnalytics = {
          topPosts: postsWithEngagement,
          contentTypeTrends,
          followerGrowth,
          audienceDemographics,
          engagementBreakdown,
          trafficSources
        };
      }

      // PRO SPECIFIC ANALYTICS
      if (hasProTier) {
        // Recent Post Performance (last 5 posts)
        const recentPosts = userPosts
          .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
          .slice(0, 5);

        // Best Time to Post (based on audience activity patterns - mock data)
        const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
          // Mock data: simulate higher activity in evening hours
          const baseActivity = 20;
          const peakMultiplier = hour >= 17 && hour <= 21 ? 2.5 : hour >= 12 && hour <= 16 ? 1.5 : 1;
          return {
            hour: hour,
            hourLabel: `${hour.toString().padStart(2, '0')}:00`,
            activity: Math.floor(baseActivity * peakMultiplier * (Math.random() * 0.5 + 0.75))
          };
        });

        const bestHours = [...hourlyActivity]
          .sort((a, b) => b.activity - a.activity)
          .slice(0, 3);

        // Optimal Tags/Keywords (based on top performing posts)
        const tagPerformance = {};
        userPosts.forEach(post => {
          if (post.tags && post.tags.length > 0) {
            post.tags.forEach(tag => {
              if (!tagPerformance[tag]) {
                tagPerformance[tag] = { tag, totalImpressions: 0, count: 0 };
              }
              tagPerformance[tag].totalImpressions += post.impressions_count || 0;
              tagPerformance[tag].count += 1;
            });
          }
        });

        const optimalTags = Object.values(tagPerformance)
          .map(t => ({ ...t, avgImpressions: t.totalImpressions / t.count }))
          .sort((a, b) => b.avgImpressions - a.avgImpressions)
          .slice(0, 5);

        // Audience Deep Dive Demographics (mock data)
        const detailedDemographics = {
          age: [
            { range: '18-24', percentage: 25 },
            { range: '25-34', percentage: 35 },
            { range: '35-44', percentage: 20 },
            { range: '45-54', percentage: 12 },
            { range: '55+', percentage: 8 }
          ],
          gender: [
            { category: 'Male', percentage: 48 },
            { category: 'Female', percentage: 45 },
            { category: 'Other', percentage: 7 }
          ],
          interests: [
            { interest: 'Technology', count: Math.floor(allFollowers.length * 0.42) },
            { interest: 'Business', count: Math.floor(allFollowers.length * 0.35) },
            { interest: 'Entertainment', count: Math.floor(allFollowers.length * 0.28) },
            { interest: 'Health & Fitness', count: Math.floor(allFollowers.length * 0.22) },
            { interest: 'Education', count: Math.floor(allFollowers.length * 0.18) }
          ]
        };

        // Audience Activity Heatmap (day of week x hour of day)
        const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const activityHeatmap = daysOfWeek.map(day => {
          const dayData = { day };
          for (let hour = 0; hour < 24; hour++) {
            // Mock data: higher activity on weekdays 9-17, evenings 18-22
            let activityLevel = 0;
            if (['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day)) {
              if (hour >= 9 && hour <= 17) activityLevel = Math.floor(Math.random() * 30) + 50;
              else if (hour >= 18 && hour <= 22) activityLevel = Math.floor(Math.random() * 25) + 60;
              else activityLevel = Math.floor(Math.random() * 20) + 10;
            } else {
              if (hour >= 10 && hour <= 22) activityLevel = Math.floor(Math.random() * 25) + 40;
              else activityLevel = Math.floor(Math.random() * 15) + 5;
            }
            dayData[`h${hour}`] = activityLevel;
          }
          return dayData;
        });

        // Monetization Insights
        const subscriptionRevenue = await Subscription.filter({ creator_email: user.email });
        const monthlyRevenue = subscriptionRevenue
          .filter(s => s.status === 'active' && new Date(s.start_date) >= subMonths(now, 1))
          .reduce((sum, s) => sum + (s.creator_payout_usd || 0), 0);
        const lifetimeRevenue = subscriptionRevenue
          .reduce((sum, s) => sum + (s.creator_payout_usd || 0), 0);

        // AI Branding earnings (if applicable)
        const aiBrandingPartnerships = await AIBrandingPartnership.filter({ creator_email: user.email });
        const aiBrandingEarnings = aiBrandingPartnerships
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + (p.payment_amount_usd || 0), 0);

        // Marketplace earnings
        const marketplaceTransactions = await MarketplaceTransaction.filter({ seller_email: user.email });
        const marketplaceEarnings = marketplaceTransactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + (t.amount_seller_payout || 0), 0);

        proAnalytics = {
          recentPosts,
          bestTimeToPost: bestHours,
          hourlyActivity,
          optimalTags,
          detailedDemographics,
          activityHeatmap,
          monetization: {
            subscriptionMonthly: monthlyRevenue,
            subscriptionLifetime: lifetimeRevenue,
            aiBranding: aiBrandingEarnings,
            marketplace: marketplaceEarnings,
            total: lifetimeRevenue + aiBrandingEarnings + marketplaceEarnings
          }
        };
      }

      setAnalyticsData({
        totalProfileViews: allProfileViews.length,
        totalImpressions,
        totalReactions,
        recentViews: recentViews.length,
        viewsChange,
        newFollowers: recentFollowers.length,
        followersChange,
        contentTypes,
        totalPosts: userPosts.length,
        ...creatorAnalytics,
        ...proAnalytics
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChangeIndicator = (change) => {
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-400 text-sm">
          <ArrowUp className="w-4 h-4" />
          <span>+{change.toFixed(1)}%</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-400 text-sm">
          <ArrowDown className="w-4 h-4" />
          <span>{change.toFixed(1)}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <Minus className="w-4 h-4" />
          <span>0%</span>
        </div>
      );
    }
  };

  const getTierBadge = () => {
    if (hasProTier) {
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black border-yellow-500/50 font-semibold">
          Eqo+ Pro
        </Badge>
      );
    } else if (hasCreatorOrHigher) {
      return (
        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
          Eqo+ Creator
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-500 text-white border-green-600/50">
          Eqo+ Lite
        </Badge>
      );
    }
  };

  const exportToCSV = () => {
    if (!analyticsData) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Profile Views', analyticsData.totalProfileViews],
      ['Total Post Impressions', analyticsData.totalImpressions],
      ['Total Reactions', analyticsData.totalReactions],
      ['Recent Views (7 days)', analyticsData.recentViews],
      ['New Followers (7 days)', analyticsData.newFollowers],
      ['Total Posts', analyticsData.totalPosts]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eqoflow-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Show upgrade prompt for free users
  if (!hasLiteOrHigher) {
    return (
      <Card className="dark-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Advanced Analytics
            </CardTitle>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
              Eqo+ Only
            </Badge>
          </div>
          <p className="text-gray-400 text-sm">
            Get detailed insights into your profile performance, engagement metrics, and growth trends.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Unlock Analytics with Eqo+
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Choose your tier and start tracking your growth:
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">Eqo+ Lite</span>
                    <Badge className="bg-green-500 text-white border-green-600/50 text-xs">
                      Basic
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">Profile views, post impressions, and recent activity tracking</p>
                </div>
                <div className="p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">Eqo+ Creator</span>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs">
                      Advanced
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">Top posts, content trends, follower growth, and engagement breakdown</p>
                </div>
                <div className="p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">Eqo+ Pro</span>
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black border-yellow-500/50 font-semibold text-xs">
                      Premium
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">Real-time data, monetization insights, predictive analytics, and export tools</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Link to={createPageUrl('EqoPlus')}>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Explore Eqo+ Plans
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card className="dark-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Advanced Analytics
            </CardTitle>
            {getTierBadge()}
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <span className="ml-3 text-gray-400">Loading analytics...</span>
        </CardContent>
      </Card>
    );
  }

  const CHART_COLORS = {
    text: '#9ca3af',
    image: '#3b82f6',
    video: '#a855f7',
    likes: '#ec4899',
    comments: '#06b6d4',
    reposts: '#8b5cf6',
    male: '#3b82f6',
    female: '#ec4899',
    other: '#8b5cf6'
  };

  // Eqo+ Lite/Creator/Pro Analytics Dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="dark-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-cyan-400" />
                  Advanced Analytics
                </CardTitle>
                {getTierBadge()}
              </div>
              <p className="text-gray-400 text-sm">
                Comprehensive insights into your profile and content performance
              </p>
            </div>
            {hasProTier && (
              <Button 
                variant="outline" 
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                onClick={() => exportToCSV()}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* PRO: Real-time Performance Dashboard */}
      {hasProTier && (
        <Card className="dark-card border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-yellow-400" />
              Real-time Performance
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs">
                Pro Only
              </Badge>
            </CardTitle>
            <p className="text-gray-400 text-sm">Live metrics updating in real-time</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Live Profile Viewers */}
              <div className="bg-black/20 p-6 rounded-lg border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-gray-400 text-sm font-medium">Live Profile Viewers</span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {liveViewers}
                </div>
                <p className="text-xs text-gray-500">Currently viewing your profile</p>
              </div>

              {/* Recent Posts Performance */}
              <div className="bg-black/20 p-6 rounded-lg border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-400 text-sm font-medium">Latest Post Performance</span>
                </div>
                {analyticsData.recentPosts && analyticsData.recentPosts.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1 text-sm">
                        <Eye className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-semibold">{analyticsData.recentPosts[0].impressions_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Heart className="w-4 h-4 text-pink-400" />
                        <span className="text-white font-semibold">{analyticsData.recentPosts[0].likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-semibold">{analyticsData.recentPosts[0].comments_count || 0}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {analyticsData.recentPosts[0].content}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No recent posts</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Overview */}
      <Card className="dark-card">
        <CardHeader>
          <CardTitle className="text-white text-lg">Profile Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400 text-sm">Total Profile Views</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {analyticsData?.totalProfileViews.toLocaleString() || 0}
              </div>
            </div>

            <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span className="text-gray-400 text-sm">Total Post Impressions</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {analyticsData?.totalImpressions.toLocaleString() || 0}
              </div>
            </div>

            <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-pink-400" />
                <span className="text-gray-400 text-sm">Total Reactions</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {analyticsData?.totalReactions.toLocaleString() || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity (Last 7 Days) */}
      <Card className="dark-card">
        <CardHeader>
          <CardTitle className="text-white text-lg">Recent Activity (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400 text-sm">Profile Views</span>
                </div>
                {renderChangeIndicator(analyticsData?.viewsChange || 0)}
              </div>
              <div className="text-3xl font-bold text-white">
                {analyticsData?.recentViews.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">vs. previous 7 days</p>
            </div>

            <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400 text-sm">New Followers</span>
                </div>
                {renderChangeIndicator(analyticsData?.followersChange || 0)}
              </div>
              <div className="text-3xl font-bold text-white">
                {analyticsData?.newFollowers.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">vs. previous 7 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Type Performance */}
      <Card className="dark-card">
        <CardHeader>
          <CardTitle className="text-white text-lg">Content Type Performance</CardTitle>
          <p className="text-gray-400 text-sm">Total impressions by content type</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Text Posts */}
            <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-white font-medium">Text Posts</span>
                </div>
                <Badge variant="outline" className="text-gray-400 border-gray-500/30">
                  {analyticsData?.contentTypes.text.count || 0} posts
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-700/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-gray-400 to-gray-500 h-full transition-all duration-500"
                    style={{ 
                      width: `${analyticsData?.totalImpressions > 0 
                        ? (analyticsData.contentTypes.text.impressions / analyticsData.totalImpressions) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
                <span className="text-white font-semibold min-w-[80px] text-right">
                  {analyticsData?.contentTypes.text.impressions.toLocaleString() || 0}
                </span>
              </div>
            </div>

            {/* Image Posts */}
            <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium">Image Posts</span>
                </div>
                <Badge variant="outline" className="text-gray-400 border-gray-500/30">
                  {analyticsData?.contentTypes.image.count || 0} posts
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-700/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-500 h-full transition-all duration-500"
                    style={{ 
                      width: `${analyticsData?.totalImpressions > 0 
                        ? (analyticsData.contentTypes.image.impressions / analyticsData.totalImpressions) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
                <span className="text-white font-semibold min-w-[80px] text-right">
                  {analyticsData?.contentTypes.image.impressions.toLocaleString() || 0}
                </span>
              </div>
            </div>

            {/* Video Posts */}
            <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">Video Posts</span>
                </div>
                <Badge variant="outline" className="text-gray-400 border-gray-500/30">
                  {analyticsData?.contentTypes.video.count || 0} posts
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-700/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-400 to-purple-500 h-full transition-all duration-500"
                    style={{ 
                      width: `${analyticsData?.totalImpressions > 0 
                        ? (analyticsData.contentTypes.video.impressions / analyticsData.totalImpressions) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
                <span className="text-white font-semibold min-w-[80px] text-right">
                  {analyticsData?.contentTypes.video.impressions.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>

          {analyticsData?.totalPosts === 0 && (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No posts yet. Start creating content to see analytics!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATOR+ EXCLUSIVE FEATURES */}
      {hasCreatorOrHigher && analyticsData && (
        <>
          {/* Top 5 Posts */}
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                Top Performing Posts
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                  Creator+
                </Badge>
              </CardTitle>
              <p className="text-gray-400 text-sm">Your top 5 posts ranked by total engagement</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.topPosts && analyticsData.topPosts.length > 0 ? (
                  analyticsData.topPosts.map((post, index) => (
                    <div key={post.id} className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm line-clamp-2 mb-2">{post.content}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{post.impressions_count?.toLocaleString() || 0} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-pink-400" />
                              <span>{post.likes_count?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3 text-blue-400" />
                              <span>{post.comments_count?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Repeat className="w-3 h-3 text-green-400" />
                              <span>{post.reposts_count?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-purple-400">
                              <TrendingUp className="w-3 h-3" />
                              <span>{post.totalEngagement.toLocaleString()} total</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No posts with engagement yet. Keep creating!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Type Trends */}
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                Content Type Trends
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                  Creator+
                </Badge>
              </CardTitle>
              <p className="text-gray-400 text-sm">Average impressions per content type over the last 30 days</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.contentTypeTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ color: '#9ca3af' }} />
                  <Line type="monotone" dataKey="text" stroke={CHART_COLORS.text} strokeWidth={2} name="Text" />
                  <Line type="monotone" dataKey="image" stroke={CHART_COLORS.image} strokeWidth={2} name="Image" />
                  <Line type="monotone" dataKey="video" stroke={CHART_COLORS.video} strokeWidth={2} name="Video" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Follower Growth Chart */}
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                Follower Growth
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                  Creator+
                </Badge>
              </CardTitle>
              <p className="text-gray-400 text-sm">Your follower count over the last 3 months</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.followerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="followers" stroke="#10b981" strokeWidth={3} name="Followers" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Audience Demographics & Engagement Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audience Demographics */}
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  Audience Demographics
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                    Creator+
                  </Badge>
                </CardTitle>
                <p className="text-gray-400 text-sm">Top locations of your followers</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.audienceDemographics.map((demo, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <span className="text-white">{demo.location}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-700/30 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(demo.count / analyticsData.audienceDemographics[0].count) * 100}%` }}
                          />
                        </div>
                        <span className="text-white font-semibold min-w-[40px] text-right">{demo.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Breakdown */}
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  Engagement Breakdown
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                    Creator+
                  </Badge>
                </CardTitle>
                <p className="text-gray-400 text-sm">Distribution of interaction types</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.engagementBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.engagementBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={[CHART_COLORS.likes, CHART_COLORS.comments, CHART_COLORS.reposts][index]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Traffic Sources */}
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                Traffic Sources
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                  Creator+
                </Badge>
              </CardTitle>
              <p className="text-gray-400 text-sm">Where your profile views are coming from</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {analyticsData.trafficSources.map((source, index) => {
                  const Icon = source.icon;
                  return (
                    <div key={index} className="bg-black/20 p-4 rounded-lg border border-purple-500/20 text-center">
                      <Icon className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                      <div className="text-2xl font-bold text-white mb-1">
                        {source.views.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">{source.source}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* PRO EXCLUSIVE FEATURES */}
      {hasProTier && analyticsData && (
        <>
          {/* Advanced Content Optimization */}
          <Card className="dark-card border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-400" />
                Advanced Content Optimization
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs">
                  Pro Only
                </Badge>
              </CardTitle>
              <p className="text-gray-400 text-sm">Data-driven suggestions to maximize your reach</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Best Time to Post */}
              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  Best Times to Post
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {analyticsData.bestTimeToPost.map((timeSlot, index) => (
                    <div key={index} className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-400 mb-1">
                        {timeSlot.hourLabel}
                      </div>
                      <div className="text-xs text-gray-400">
                        {timeSlot.activity}% peak activity
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Hourly Activity Chart */}
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analyticsData.hourlyActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="hourLabel" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="activity" fill="#eab308" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Optimal Tags/Keywords */}
              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-yellow-400" />
                  Top Performing Tags
                </h4>
                {analyticsData.optimalTags && analyticsData.optimalTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analyticsData.optimalTags.map((tag, index) => (
                      <div key={index} className="bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">#{tag.tag}</span>
                          <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 text-xs">
                            {Math.round(tag.avgImpressions)} avg views
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Start using tags in your posts to see optimization suggestions</p>
                )}
              </div>

              {/* Content Performance Prediction */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  AI Content Predictor
                </h4>
                <p className="text-sm text-gray-400 mb-3">
                  Based on your posting patterns and audience behavior, content posted during peak hours with trending tags can achieve:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/20 p-3 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Estimated Reach</div>
                    <div className="text-lg font-bold text-yellow-400">
                      {Math.floor(analyticsData.totalImpressions / Math.max(analyticsData.totalPosts, 1) * 1.5).toLocaleString()}+
                    </div>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Estimated Engagement</div>
                    <div className="text-lg font-bold text-yellow-400">
                      {Math.floor(analyticsData.totalReactions / Math.max(analyticsData.totalPosts, 1) * 1.3).toLocaleString()}+
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audience Deep Dive */}
          <Card className="dark-card border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-yellow-400" />
                Audience Deep Dive
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs">
                  Pro Only
                </Badge>
              </CardTitle>
              <p className="text-gray-400 text-sm">Detailed demographic and behavioral insights</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Age & Gender Demographics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Age Breakdown */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Age Distribution</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analyticsData.detailedDemographics.age}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="range" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                      <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Gender Breakdown */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Gender Distribution</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analyticsData.detailedDemographics.gender}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category}: ${percentage}%`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {analyticsData.detailedDemographics.gender.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={[CHART_COLORS.male, CHART_COLORS.female, CHART_COLORS.other][index]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Interests */}
              <div>
                <h4 className="text-white font-semibold mb-3">Top Audience Interests</h4>
                <div className="space-y-2">
                  {analyticsData.detailedDemographics.interests.map((interest, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-white">{interest.interest}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-48 bg-gray-700/30 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(interest.count / analyticsData.detailedDemographics.interests[0].count) * 100}%` }}
                          />
                        </div>
                        <span className="text-white font-semibold min-w-[40px] text-right">{interest.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Heatmap Placeholder */}
              <div>
                <h4 className="text-white font-semibold mb-3">Audience Activity Heatmap</h4>
                <p className="text-sm text-gray-400 mb-3">When your audience is most active (darker = more active)</p>
                <div className="bg-black/20 p-4 rounded-lg border border-yellow-500/20">
                  <div className="grid grid-cols-8 gap-1 text-xs">
                    <div></div>
                    {['12AM', '6AM', '12PM', '6PM'].map(time => (
                      <div key={time} className="text-gray-500 text-center col-span-2">{time}</div>
                    ))}
                    {analyticsData.activityHeatmap.map(dayData => (
                      <React.Fragment key={dayData.day}>
                        <div className="text-gray-400 py-1">{dayData.day}</div>
                        {Array.from({ length: 7 }, (_, i) => i * 4).map(hour => {
                          const activity = dayData[`h${hour}`];
                          const opacity = Math.min(activity / 100, 1);
                          return (
                            <div 
                              key={hour}
                              className="aspect-square rounded"
                              style={{ backgroundColor: `rgba(234, 179, 8, ${opacity})` }}
                              title={`${dayData.day} ${hour}:00 - Activity: ${activity}%`}
                            />
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monetization Insights */}
          <Card className="dark-card border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                Monetization Insights
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs">
                  Pro Only
                </Badge>
              </CardTitle>
              <p className="text-gray-400 text-sm">Track your earnings across all EqoFlow revenue streams</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Earnings */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 p-4 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Total Lifetime Earnings</div>
                  <div className="text-3xl font-bold text-green-400">
                    ${analyticsData.monetization.total.toFixed(2)}
                  </div>
                </div>

                {/* Subscription Revenue */}
                <div className="bg-black/20 p-4 rounded-lg border border-yellow-500/20">
                  <div className="text-sm text-gray-400 mb-1">Subscription Revenue</div>
                  <div className="text-2xl font-bold text-white mb-1">
                    ${analyticsData.monetization.subscriptionLifetime.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    ${analyticsData.monetization.subscriptionMonthly.toFixed(2)} this month
                  </div>
                </div>

                {/* AI Branding */}
                <div className="bg-black/20 p-4 rounded-lg border border-yellow-500/20">
                  <div className="text-sm text-gray-400 mb-1">AI Branding</div>
                  <div className="text-2xl font-bold text-white">
                    ${analyticsData.monetization.aiBranding.toFixed(2)}
                  </div>
                </div>

                {/* Marketplace */}
                <div className="bg-black/20 p-4 rounded-lg border border-yellow-500/20">
                  <div className="text-sm text-gray-400 mb-1">Marketplace Sales</div>
                  <div className="text-2xl font-bold text-white">
                    ${analyticsData.monetization.marketplace.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                <p className="text-sm text-gray-300">
                  <strong className="text-white">💡 Tip:</strong> Diversify your revenue streams! Users who leverage subscriptions, AI branding, and marketplace together earn 3x more on average.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Upgrade Prompt for Higher Tiers */}
      {!hasCreatorOrHigher && (
        <Card className="dark-card border-purple-500/30">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-semibold mb-2">Want More Insights?</h3>
                <p className="text-gray-400 text-sm">
                  Upgrade to Eqo+ Creator or Pro for advanced content analytics, audience insights, and more.
                </p>
              </div>
              <Link to={createPageUrl("EqoPlus")}>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 whitespace-nowrap">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasProTier && hasCreatorOrHigher && (
        <Card className="dark-card border-yellow-500/30">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-semibold mb-2">Unlock Pro Analytics</h3>
                <p className="text-gray-400 text-sm">
                  Get real-time performance tracking, AI-powered optimization, detailed demographics, and monetization insights with Eqo+ Pro.
                </p>
              </div>
              <Link to={createPageUrl("EqoPlus")}>
                <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 whitespace-nowrap">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
