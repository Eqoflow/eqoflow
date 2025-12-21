import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  CheckCircle,
  Edit,
  Download,
  Star,
  Target,
  MessageSquare,
  LineChart } from
'lucide-react';

export default function CourseAnalytics({ course, onEdit }) {
  const [timeRange, setTimeRange] = useState('30d');
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [engagementAnalytics, setEngagementAnalytics] = useState(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [course, timeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);

      // Calculate basic metrics from course data
      const totalRevenue = (course.price_amount || 0) * (course.enrolled_count || 0);
      const platformFee = totalRevenue * (course.platform_fee_percentage || 10) / 100;
      const creatorRevenue = totalRevenue - platformFee;
      const revenuePerStudent = course.enrolled_count > 0 ?
      (course.price_amount || 0).toFixed(2) :
      '0.00';

      setSalesAnalytics({
        totalRevenue,
        creatorRevenue,
        revenuePerStudent,
        conversionRate: 0,
        cac: 0,
        peakSalesDays: [],
        trafficSources: [],
        bounceRate: 0,
        avgSessionDuration: '0m 0s'
      });

      setEngagementAnalytics({
        engagementRate: 0,
        completionRate: 0,
        churnRate: 0,
        avgModuleProgress: 0,
        avgAssessmentScore: 0,
        activeStudents: 0,
        weeklyActiveUsers: 0,
        avgTimeOnTask: '0h 0m'
      });

      setAdvancedAnalytics({
        atRiskStudents: 0,
        topPerformers: 0,
        cohortRetention: [],
        mostViewedModules: []
      });

      setFeedbackData({
        averageRating: course.average_rating || 0,
        totalReviews: course.reviews_count || 0,
        ratingDistribution: [
        { stars: 5, count: 0, percentage: 0 },
        { stars: 4, count: 0, percentage: 0 },
        { stars: 3, count: 0, percentage: 0 },
        { stars: 2, count: 0, percentage: 0 },
        { stars: 1, count: 0, percentage: 0 }],

        commonPraise: [],
        areasForImprovement: []
      });

    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>);

  }

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card className="dark-card border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              {course.thumbnail_url &&
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-32 h-20 object-cover rounded-lg" />

              }
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{course.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {course.enrolled_count || 0} students
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    {course.average_rating?.toFixed(1) || '0.0'} ({course.reviews_count || 0} reviews)
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    ${course.price_amount || 0}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Button
                onClick={onEdit}
                variant="outline"
                className="bg-background text-slate-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:bg-accent hover:text-accent-foreground h-10 border-purple-500/30">

                <Edit className="w-4 h-4 mr-2" />
                Edit Course
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Course Analytics</h3>
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'all'].map((range) =>
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
            className="bg-background text-slate-950 px-3 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:bg-accent hover:text-accent-foreground h-9 border-purple-500/30">

              {range === 'all' ? 'All Time' : `Last ${range}`}
            </Button>
          )}
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-900/80 border border-purple-500/20">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Sales & Marketing
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <Activity className="w-4 h-4" /> Student Engagement
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <LineChart className="w-4 h-4" /> Advanced Analytics
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Student Feedback
          </TabsTrigger>
        </TabsList>

        {/* Sales & Marketing Analytics */}
        <TabsContent value="sales" className="bg-black mt-6 space-y-6">
          {/* Revenue Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="dark-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-50 text-sm">Total Revenue</p>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-white">${salesAnalytics.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-green-400 mt-1">Lifetime earnings</p>
              </CardContent>
            </Card>

            <Card className="dark-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-50 text-sm">Your Earnings</p>
                  <DollarSign className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-white">${salesAnalytics.creatorRevenue.toFixed(2)}</p>
                <p className="text-slate-50 mt-1 text-xs">After 10% platform fee</p>
              </CardContent>
            </Card>

            <Card className="dark-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-50 text-sm">Revenue Per Student</p>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-white">${salesAnalytics.revenuePerStudent}</p>
                <p className="text-slate-50 mt-1 text-xs">Average per enrollment</p>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder for future data */}
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <LineChart className="w-5 h-5 text-purple-400" />
                Advanced Metrics Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <LineChart className="text-slate-50 mb-4 mx-auto lucide lucide-chart-line w-16 h-16" />
                <h3 className="text-lg font-semibold text-white mb-2">More Analytics on the Way</h3>
                <p className="text-slate-50 mx-auto max-w-md">Detailed conversion metrics, traffic sources, and marketing insights will appear here as you gain more students.

                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Engagement Analytics */}
        <TabsContent value="engagement" className="bg-black mt-6 space-y-6">
          {/* Engagement Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="dark-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-50 text-sm">Engagement Rate</p>
                  <Activity className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-white">{engagementAnalytics.engagementRate}%</p>
                <p className="text-xs text-gray-400 mt-1">
                  <span className="text-green-400">Coming soon</span>
                </p>
              </CardContent>
            </Card>

            <Card className="dark-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-50 text-sm">Completion Rate</p>
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-white">{engagementAnalytics.completionRate}%</p>
                <p className="text-slate-50 mt-1 text-xs">Students finishing the course</p>
              </CardContent>
            </Card>

            <Card className="dark-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-50 text-sm">Active Students</p>
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-white">{engagementAnalytics.activeStudents}</p>
                <p className="text-slate-50 mt-1 text-xs">Currently learning</p>
              </CardContent>
            </Card>
          </div>

          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Student Engagement Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Engagement Data Coming Soon</h3>
                <p className="text-slate-50 mx-auto max-w-md">Track how students interact with your course content, completion rates, and time spent learning.

                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Analytics */}
        <TabsContent value="advanced" className="bg-black mt-6 space-y-6">
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Predictive Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Advanced Insights Coming Soon</h3>
                <p className="text-slate-50 mx-auto max-w-md">Get predictive analytics, cohort analysis, and detailed student segmentation to optimize your course.

                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Feedback */}
        <TabsContent value="feedback" className="bg-black mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Overall Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-5xl font-bold text-white mb-2">
                    {feedbackData.averageRating.toFixed(1)}
                  </p>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) =>
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                      i < Math.round(feedbackData.averageRating) ?
                      'text-yellow-400 fill-yellow-400' :
                      'text-gray-600'}`
                      } />

                    )}
                  </div>
                  <p className="text-slate-50 text-sm">Based on {feedbackData.totalReviews} reviews</p>
                </div>

                {feedbackData.totalReviews === 0 &&
                <div className="text-center py-8">
                    <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Reviews Yet</h3>
                    <p className="text-slate-50">Reviews from your students will appear here once they complete your course.

                  </p>
                  </div>
                }
              </CardContent>
            </Card>

            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Student Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Feedback Analysis Coming Soon</h3>
                  <p className="text-slate-50 mx-auto max-w-md">View common praise and areas for improvement from student reviews and surveys.

                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Report Button */}
      <Card className="dark-card border-purple-500/20">
        <CardContent className="p-6">
          <div className="text-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold mb-1">Export Full Analytics Report</h3>
              <p className="text-slate-50 text-sm">
                Download a comprehensive PDF report of all your course analytics
              </p>
            </div>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-500" disabled>
              <Download className="w-4 h-4 mr-2" />
              Export Report (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>);

}