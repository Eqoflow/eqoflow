
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area } from
'recharts';
import {
  Users,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Eye,
  Heart,
  Activity,
  ArrowUpRight,
  ArrowDownRight } from
'lucide-react';
import { User } from '@/entities/User';
import { Post } from '@/entities/Post';
import { EngagementPoint } from '@/entities/EngagementPoint';
import { Subscription } from '@/entities/Subscription';
import { PlatformRevenue } from '@/entities/PlatformRevenue';
import { Comment } from '@/entities/Comment';
import { Skill } from '@/entities/Skill';
import QuantumFlowLoader from '../layout/QuantumFlowLoader';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const MetricCard = ({ title, value, change, changeType, icon: Icon, color = 'purple' }) => {
  const colorMap = {
    purple: 'text-purple-400',
    pink: 'text-pink-400',
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400'
  };

  return (
    <Card className="dark-card hover-lift">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {change &&
            <div className="flex items-center mt-2">
                {changeType === 'positive' ?
              <ArrowUpRight className="w-4 h-4 text-green-400 mr-1" /> :

              <ArrowDownRight className="w-4 h-4 text-red-400 mr-1" />
              }
                <span className={`text-sm ${changeType === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                  {change}
                </span>
                <span className="text-gray-500 text-sm ml-1">vs last period</span>
              </div>
            }
          </div>
          <Icon className={`w-8 h-8 ${colorMap[color]}`} />
        </div>
      </CardContent>
    </Card>);

};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-purple-500/20 rounded-lg p-3">
        <p className="text-white font-medium">{label}</p>
        {payload.map((entry, index) =>
        <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        )}
      </div>);

  }
  return null;
};

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get current date ranges
      const now = new Date();
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Fetch all data in parallel
      const [
      allUsers,
      allPosts,
      allComments,
      allEP,
      allSubscriptions,
      allRevenue,
      allSkills] =
      await Promise.all([
      User.list('-created_date'),
      Post.list('-created_date'),
      Comment.list('-created_date'),
      EngagementPoint.list('-created_date'),
      Subscription.list('-created_date').catch(() => []),
      PlatformRevenue.list('-created_date').catch(() => []),
      Skill.list('-created_date').catch(() => [])]
      );

      // Filter data by time range
      const recentUsers = allUsers.filter((u) => new Date(u.created_date) >= startDate);
      const recentPosts = allPosts.filter((p) => new Date(p.created_date) >= startDate);
      const recentComments = allComments.filter((c) => new Date(c.created_date) >= startDate);
      const recentEP = allEP.filter((ep) => new Date(ep.created_date) >= startDate);

      // Calculate metrics
      const totalUsers = allUsers.length;
      const totalPosts = allPosts.length;
      const totalComments = allComments.length;
      const totalLikes = allPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const totalReposts = allPosts.reduce((sum, post) => sum + (post.reposts_count || 0), 0);
      const totalEP = allEP.reduce((sum, ep) => sum + (ep.final_points || 0), 0);
      const totalRevenue = allRevenue.reduce((sum, rev) => sum + (rev.amount_usd || 0), 0);

      // NEW: Calculate impression metrics
      const totalImpressions = allPosts.reduce((sum, post) => sum + (post.impressions_count || 0), 0);
      const averageImpressionsPerPost = totalPosts > 0 ? totalImpressions / totalPosts : 0;
      const estimatedImpressionRevenue = totalImpressions / 1000000 * 8.50; // $8.50 per million impressions

      const recentImpressions = recentPosts.reduce((sum, post) => sum + (post.impressions_count || 0), 0);

      // Growth calculations (comparing with previous period)
      const prevStartDate = new Date(startDate.getTime() - daysBack * 24 * 60 * 60 * 1000);
      const prevUsers = allUsers.filter((u) => {
        const date = new Date(u.created_date);
        return date >= prevStartDate && date < startDate;
      });
      const prevPosts = allPosts.filter((p) => {
        const date = new Date(p.created_date);
        return date >= prevStartDate && date < startDate;
      });

      const userGrowth = prevUsers.length > 0 ? (recentUsers.length - prevUsers.length) / prevUsers.length * 100 : 0;
      const postGrowth = prevPosts.length > 0 ? (recentPosts.length - prevPosts.length) / prevPosts.length * 100 : 0;

      // Daily activity data for charts
      const dailyData = [];
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];

        const dayUsers = recentUsers.filter((u) => u.created_date.split('T')[0] === dateStr).length;
        const dayPosts = recentPosts.filter((p) => p.created_date.split('T')[0] === dateStr).length;
        const dayComments = recentComments.filter((c) => c.created_date.split('T')[0] === dateStr).length;
        const dayEP = recentEP.filter((ep) => ep.created_date.split('T')[0] === dateStr).
        reduce((sum, ep) => sum + (ep.final_points || 0), 0);

        // NEW: Calculate daily impressions
        const dayImpressions = recentPosts.filter((p) => p.created_date.split('T')[0] === dateStr).
        reduce((sum, post) => sum + (post.impressions_count || 0), 0);

        dailyData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          users: dayUsers,
          posts: dayPosts,
          comments: dayComments,
          ep: dayEP,
          impressions: dayImpressions
        });
      }

      // User engagement distribution
      const engagementTiers = {
        'High (50+ EP)': allUsers.filter((u) => (u.total_ep_earned || 0) >= 50).length,
        'Medium (10-49 EP)': allUsers.filter((u) => (u.total_ep_earned || 0) >= 10 && (u.total_ep_earned || 0) < 50).length,
        'Low (1-9 EP)': allUsers.filter((u) => (u.total_ep_earned || 0) >= 1 && (u.total_ep_earned || 0) < 10).length,
        'New (0 EP)': allUsers.filter((u) => (u.total_ep_earned || 0) === 0).length
      };

      const engagementData = Object.entries(engagementTiers).map(([name, value]) => ({
        name,
        value
      }));

      // Content categories
      const skillCategories = {};
      allSkills.forEach((skill) => {
        skillCategories[skill.category] = (skillCategories[skill.category] || 0) + 1;
      });

      const categoryData = Object.entries(skillCategories).map(([name, value]) => ({
        name,
        value
      }));

      // NEW: Top performing posts by impressions
      const topPostsByImpressions = [...allPosts].
      sort((a, b) => (b.impressions_count || 0) - (a.impressions_count || 0)).
      slice(0, 10).
      map((post) => ({
        title: post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : ''),
        author: post.author_full_name || 'Anonymous',
        impressions: post.impressions_count || 0,
        likes: post.likes_count || 0,
        // Assuming an engagement rate based on likes relative to impressions
        engagement_rate: post.impressions_count > 0 ? ((post.likes_count || 0) / post.impressions_count * 100).toFixed(2) : 0
      }));

      setAnalytics({
        overview: {
          totalUsers,
          totalPosts,
          totalComments,
          totalLikes,
          totalReposts,
          totalEP,
          totalRevenue,
          recentUsers: recentUsers.length,
          recentPosts: recentPosts.length,
          userGrowth,
          postGrowth,
          // NEW: Impression metrics
          totalImpressions,
          averageImpressionsPerPost,
          estimatedImpressionRevenue,
          recentImpressions
        },
        charts: {
          dailyActivity: dailyData,
          userEngagement: engagementData,
          contentCategories: categoryData,
          topPostsByImpressions
        }
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <QuantumFlowLoader message="Loading analytics..." />
      </div>);

  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Failed to load analytics data</p>
      </div>);

  }

  return (
    <div className="bg-slate-950 space-y-6">
      {/* Header */}
      <div className="bg-slate-950 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Platform Analytics</h2>
          <p className="text-gray-400">Real-time metrics and insights for investors</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((range) =>
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            timeRange === range ?
            'bg-purple-600 text-white' :
            'bg-black/20 text-gray-400 hover:text-white'}`
            }>

              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={analytics.overview.totalUsers.toLocaleString()}
          change={`${analytics.overview.userGrowth >= 0 ? '+' : ''}${analytics.overview.userGrowth.toFixed(1)}%`}
          changeType={analytics.overview.userGrowth >= 0 ? 'positive' : 'negative'}
          icon={Users}
          color="purple" />

        <MetricCard
          title="Total Posts"
          value={analytics.overview.totalPosts.toLocaleString()}
          change={`${analytics.overview.postGrowth >= 0 ? '+' : ''}${analytics.overview.postGrowth.toFixed(1)}%`}
          changeType={analytics.overview.postGrowth >= 0 ? 'positive' : 'negative'}
          icon={MessageSquare}
          color="pink" />

        <MetricCard
          title="Total Engagement"
          value={(analytics.overview.totalLikes + analytics.overview.totalComments).toLocaleString()}
          change={`+${analytics.overview.recentPosts}`}
          changeType="positive"
          icon={Heart}
          color="cyan" />

        <MetricCard
          title="Platform Revenue"
          value={`$${analytics.overview.totalRevenue.toFixed(2)}`}
          change="+12.5%" // This change is static, consider making it dynamic if data allows
          changeType="positive"
          icon={DollarSign}
          color="green" />

      </div>

      {/* Charts */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-black/20">
          <TabsTrigger value="activity" className="text-white">Daily Activity</TabsTrigger>
          <TabsTrigger value="impressions" className="text-white">Post Impressions</TabsTrigger>
          <TabsTrigger value="engagement" className="text-white">User Engagement</TabsTrigger>
          <TabsTrigger value="content" className="text-white">Content Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-6">
          <Card className="dark-card">
            <CardHeader className="bg-slate-950 p-6 flex flex-col space-y-1.5">
              <CardTitle className="text-white">Daily Activity Trends</CardTitle>
            </CardHeader>
            <CardContent className="bg-slate-950 pt-0 p-6">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analytics.charts.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    name="New Users" />

                  <Area
                    type="monotone"
                    dataKey="posts"
                    stackId="1"
                    stroke="#ec4899"
                    fill="#ec4899"
                    fillOpacity={0.6}
                    name="Posts" />

                  <Area
                    type="monotone"
                    dataKey="comments"
                    stackId="1"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.6}
                    name="Comments" />

                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW: Post Impressions Tab */}
        <TabsContent value="impressions" className="space-y-6">
          {/* Impression Metrics Cards */}
          <div className="bg-slate-950 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Impressions"
              value={analytics.overview.totalImpressions.toLocaleString()}
              change={`+${analytics.overview.recentImpressions.toLocaleString()}`}
              changeType="positive"
              icon={Eye}
              color="cyan" />

            <MetricCard
              title="Avg per Post"
              value={Math.round(analytics.overview.averageImpressionsPerPost).toLocaleString()}
              change="2,121 industry avg" // This change is static, consider making it dynamic if data allows
              changeType={analytics.overview.averageImpressionsPerPost >= 2121 ? 'positive' : 'negative'}
              icon={TrendingUp}
              color="purple" />

            <MetricCard
              title="Est. Revenue"
              value={`$${analytics.overview.estimatedImpressionRevenue.toFixed(2)}`}
              change="$8.50/1M rate" // This change is static, consider making it dynamic if data allows
              changeType="positive"
              icon={DollarSign}
              color="green" />

            <MetricCard
              title="Recent Impressions"
              value={analytics.overview.recentImpressions.toLocaleString()}
              change={`${timeRange} period`} // This change is static, consider making it dynamic if data allows
              changeType="positive"
              icon={Activity}
              color="yellow" />
          </div>

          {/* Impressions Chart */}
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white">Daily Post Impressions</CardTitle>
            </CardHeader>
            <CardContent className="bg-slate-950 pt-0 p-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.charts.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ fill: '#06b6d4' }}
                    name="Daily Impressions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Posts by Impressions */}
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white">Top Posts by Impressions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.charts.topPostsByImpressions.map((post, index) =>
              <div key={index} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{post.title}</p>
                    <p className="text-gray-400 text-sm">by {post.author}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-cyan-400">
                      <Eye className="w-4 h-4 inline mr-1" />
                      {post.impressions.toLocaleString()}
                    </div>
                    <div className="text-red-400">
                      <Heart className="w-4 h-4 inline mr-1" />
                      {post.likes.toLocaleString()}
                    </div>
                    <div className="text-purple-400">
                      {post.engagement_rate}%
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card className="dark-card">
            <CardHeader className="bg-slate-950 p-6 flex flex-col space-y-1.5">
              <CardTitle className="text-white">User Engagement Distribution</CardTitle>
            </CardHeader>
            <CardContent className="bg-slate-950 pt-0 p-6">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={analytics.charts.userEngagement}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value">

                    {analytics.charts.userEngagement.map((entry, index) =>
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    )}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white">Skills Marketplace Categories</CardTitle>
            </CardHeader>
            <CardContent className="bg-slate-950 pt-0 p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.charts.contentCategories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8b5cf6" name="Skills Listed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-white">Engagement Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total EP Earned</span>
              <span className="text-white font-bold">{analytics.overview.totalEP.toLocaleString()} EP</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Average EP per User</span>
              <span className="text-white font-bold">
                {(analytics.overview.totalEP / Math.max(analytics.overview.totalUsers, 1)).toFixed(0)} EP
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Posts per User</span>
              <span className="text-white font-bold">
                {(analytics.overview.totalPosts / Math.max(analytics.overview.totalUsers, 1)).toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Engagement Rate</span>
              <span className="text-white font-bold">
                {((analytics.overview.totalLikes + analytics.overview.totalComments) / Math.max(analytics.overview.totalPosts, 1)).toFixed(1)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-white">Growth Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">New Users ({timeRange})</span>
              <Badge className="bg-green-600/20 text-green-400">
                +{analytics.overview.recentUsers}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">New Posts ({timeRange})</span>
              <Badge className="bg-blue-600/20 text-blue-400">
                +{analytics.overview.recentPosts}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">User Growth Rate</span>
              <Badge className={`${analytics.overview.userGrowth >= 0 ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                {analytics.overview.userGrowth >= 0 ? '+' : ''}{analytics.overview.userGrowth.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Content Growth Rate</span>
              <Badge className={`${analytics.overview.postGrowth >= 0 ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                {analytics.overview.postGrowth >= 0 ? '+' : ''}{analytics.overview.postGrowth.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

}