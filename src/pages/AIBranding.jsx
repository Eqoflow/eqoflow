
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  TrendingUp,
  Target,
  Users,
  Zap,
  DollarSign,
  BarChart3,
  Brain,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Star,
  Shield,
  Camera,
  MessageSquare,
  Share2,
  Heart,
  Sliders,
  Bot,
  Lightbulb,
  Rocket,
  Crown,
  Diamond,
  FileText // Add Check icon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import SponsorRegistrationModal from '../components/branding/SponsorRegistrationModal';

export default function AIBranding() {
  const [currentMetric, setCurrentMetric] = useState(0);
  const [budgetSlider, setBudgetSlider] = useState(5000);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [predictedRoi, setPredictedRoi] = useState(0);
  const [roiProgress, setRoiProgress] = useState(0);
  const [partneredPosts, setPartneredPosts] = useState({}); // New state for interactivity
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const mockMetrics = [
  { label: 'Predicted Reach', value: '2.4M', change: '+127%', color: 'text-cyan-400' },
  { label: 'Engagement Velocity', value: '89.3%', change: '+45%', color: 'text-green-400' },
  { label: 'Brand Safety Score', value: '94/100', change: '+12%', color: 'text-purple-400' },
  { label: 'Viral Probability', value: '78%', change: '+89%', color: 'text-pink-400' }];


  const mockViralContent = [
  {
    id: 1,
    author: 'Alex Chen',
    username: 'alexc',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
    timestamp: 'Sep 3, 2025 at 2:47 PM',
    content: 'Just dropped the most insane skateboarding trick compilation! The community response has been absolutely incredible 🛹✨',
    badges: ['Creator', 'Verified'],
    tags: ['#skateboarding', '#viral'],
    hearts: 12400,
    comments: 6200,
    shares: 3100,
    ep_earned: 25678,
    growth: '+2340%',
    engagement: 156000,
    sentiment: 'positive',
    category: 'sports',
    isPublic: true
  },
  {
    id: 2,
    author: 'Sarah Mitchell',
    username: 'sarahm',
    avatar: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/55bb0da03_image.png',
    timestamp: 'Sep 2, 2025 at 11:23 AM',
    content: 'Heartwarming rescue story that will restore your faith in humanity. Sometimes the smallest acts of kindness create the biggest waves 💙',
    badges: ['Co-CEO', 'Verified'],
    tags: ['#rescue', '#heartwarming'],
    hearts: 18700,
    comments: 4300,
    shares: 2800,
    ep_earned: 31245,
    growth: '+1890%',
    engagement: 234000,
    sentiment: 'positive',
    category: 'lifestyle',
    isPublic: true
  },
  {
    id: 3,
    author: 'Marcus Rodriguez',
    username: 'mrodriguez',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
    timestamp: 'Sep 1, 2025 at 4:15 PM',
    content: 'Revolutionary AI breakthrough that will change everything we know about machine learning. This demo literally broke the internet! 🤖🔥',
    badges: ['Creator', 'Verified'],
    tags: ['#AI', '#breakthrough'],
    hearts: 23600,
    comments: 8900,
    shares: 5400,
    ep_earned: 45892,
    growth: '+4560%',
    engagement: 567000,
    sentiment: 'positive',
    category: 'technology',
    isPublic: true
  }];


  // New: Mock brand data for partnerships
  const mockBrandPartners = {
    1: { name: 'Nike', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/664bd5b24_Screenshot_2025-09-03_190959-removebg-preview.png' },
    2: { name: 'WWF', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/4aa1e2df3_Screenshot2025-09-03200604.png' },
    3: { name: 'NVIDIA', logo: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/5512f94d4_Screenshot_2025-09-03_194927-removebg-preview.png' }
  };

  // New: Handler for the "Partner Now" button
  const handlePartnerNow = (postId) => {
    const brand = mockBrandPartners[postId];
    if (brand) {
      setPartneredPosts((prev) => ({
        ...prev,
        [postId]: brand
      }));
    }
  };

  const mockObjectDetection = [
  'Nike Shoes', 'Coca-Cola Can', 'iPhone Device', 'Tesla Vehicle', 'Starbucks Cup',
  'Apple Logo', 'Adidas Clothing', 'Samsung Phone', 'McDonald\'s Packaging'];


  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMetric((prev) => (prev + 1) % mockMetrics.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [mockMetrics.length]);

  useEffect(() => {
    // Calculate the real, uncapped ROI for the text display
    const realRoi = budgetSlider / 100 * 4.2;
    setPredictedRoi(realRoi);

    // Calculate progress bar based on slider position (0-100%)
    // Budget slider goes from 1000 to 50000, so calculate percentage of that range
    const minBudget = 1000;
    const maxBudget = 50000;
    const progress = (budgetSlider - minBudget) / (maxBudget - minBudget) * 100;
    setRoiProgress(progress);
  }, [budgetSlider]);

  return (
    <div className="text-white min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-black overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative py-8 md:py-20 px-4 md:px-6 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="bg-gradient-to-br absolute inset-0 from-purple-600/10 via-cyan-600/5 to-pink-600/10"></div>
          {[...Array(30)].map((_, i) =>
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5
            }} />
          )}
        </div>

        <div className="relative max-w-4xl mx-auto text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-6 md:mb-8">

            <Badge className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 text-cyan-300 border-cyan-500/30 text-sm md:text-lg px-4 md:px-6 py-2 mb-4 md:mb-6">
              <Sparkles className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              Revolutionary AI Technology
            </Badge>

            <motion.h1
              className="text-3xl sm:text-4xl md:text-7xl lg:text-8xl font-black mb-4 md:mb-6 leading-tight px-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.2 }}>

              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 block">
                Unlock Viral Reach.
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 block">
                Authentically.
              </span>
            </motion.h1>

            <motion.p
              className="text-sm sm:text-lg md:text-2xl lg:text-3xl text-gray-300 mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed px-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}>

              EqoFlow's <span className="text-cyan-400 font-semibold">AI-Powered Brand Partnerships</span> connect you with
              <span className="text-purple-400 font-semibold"> real-time viral content</span> and
              <span className="text-pink-400 font-semibold"> engaged audiences</span>.
            </motion.p>
          </motion.div>

          {/* Demo Video Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            className="relative max-w-4xl mx-auto mb-8 md:mb-12 px-2">

            <Card className="bg-gradient-to-br from-gray-900/80 via-purple-900/20 to-gray-900/80 border-purple-500/30 backdrop-blur-xl">
              <CardContent className="bg-slate-950 p-4 md:p-8">
                <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center group hover:from-purple-800/50 hover:to-cyan-800/50 transition-all duration-700 cursor-pointer">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center text-center">

                    <div className="w-12 md:w-20 h-12 md:h-20 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mb-3 md:mb-4 shadow-xl">
                      <Play className="w-5 md:w-8 h-5 md:h-8 text-white ml-1" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold mb-2">Dynamic Overlay Technology Demo</h3>
                    <p className="text-gray-400 text-sm md:text-base">See how brands seamlessly integrate with viral content</p>
                  </motion.div>

                  {/* Simulated overlay preview */}
                  <motion.div
                    className="absolute bottom-2 md:bottom-4 right-2 md:right-4 bg-gradient-to-r from-cyan-600/90 to-purple-600/90 rounded-lg p-2 md:p-3 backdrop-blur-sm"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}>

                    <div className="flex items-center gap-1 md:gap-2">
                      <Crown className="w-3 md:w-4 h-3 md:h-4" />
                      <span className="text-xs md:text-sm font-semibold">Sponsored by Brand</span>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex flex-col gap-4 justify-center mb-6 md:mb-8 px-4">

            <Button className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white px-6 md:px-8 py-4 md:py-6 text-base md:text-lg rounded-xl shadow-2xl group">
              <Rocket className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
              Schedule Demo
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" className="bg-background/20 text-slate-50 my-2 px-6 py-4 text-base font-medium w-full sm:w-auto md:px-8 md:py-6 md:text-lg inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-auto border-purple-500/10 rounded-xl backdrop-blur-sm hover:bg-purple-500/10">
              <FileText className="w-5 h-5 mr-2" />
              Investment Deck
            </Button>
          </motion.div>
          
          <div className="flex flex-col gap-4 justify-center items-center px-4">
            <Button
              onClick={() => alert("Creator registration feature is coming soon!")}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-semibold">

              Get Started as Creator
            </Button>
            
            <Button
              onClick={() => setShowRegistrationModal(true)}
              variant="outline" className="bg-background text-slate-50 px-8 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-full sm:w-auto border-purple-500/50 hover:bg-purple-500/10 rounded-lg">


              Register as Sponsor
            </Button>
          </div>
        </div>
      </section>

      {/* Brand Dashboard Simulation */}
      <section className="py-12 md:py-20 px-4 md:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16">

            <Badge className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 text-cyan-300 border-cyan-500/30 mb-4 md:mb-6 text-sm md:text-base">
              <BarChart3 className="w-4 h-4 mr-2" />
              Brand Intelligence Dashboard
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 px-4">
              Real-Time Viral Opportunities
            </h2>
            <p className="text-base md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Our AI continuously monitors content across platforms, identifying viral moments and matching them with brand objectives in real-time.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
            {/* Live Metrics */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-1">

              <div className="space-y-4 md:space-y-6">
                <Card className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 border-purple-500/30 backdrop-blur-xl h-full">
                  <CardHeader className="bg-slate-950 p-4 md:p-6 flex flex-col space-y-1.5">
                    <CardTitle className="text-cyan-400 flex items-center text-lg md:text-xl">
                      <TrendingUp className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                      Live Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-slate-950 pt-0 p-4 md:p-6 space-y-4 md:space-y-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentMetric}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center p-4 md:p-6 bg-gray-800/50 rounded-xl">

                        <div className={`text-2xl md:text-4xl font-bold mb-2 ${mockMetrics[currentMetric].color}`}>
                          {mockMetrics[currentMetric].value}
                        </div>
                        <div className="text-base md:text-lg text-white mb-1">{mockMetrics[currentMetric].label}</div>
                        <div className="text-green-400 text-xs md:text-sm">
                          {mockMetrics[currentMetric].change} vs last period
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    <div className="space-y-2 md:space-y-3">
                      {mockMetrics.map((metric, index) =>
                      <div key={index} className="flex justify-between items-center p-2 md:p-3 bg-gray-800/30 rounded-lg">
                          <span className="text-gray-300 text-sm md:text-base">{metric.label}</span>
                          <span className={`${metric.color} text-sm md:text-base`}>{metric.value}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Audience Demographics Card */}
                <Card className="bg-gradient-to-br from-gray-900/80 to-pink-900/20 border-pink-500/30 backdrop-blur-xl">
                  <CardHeader className="bg-slate-950 p-4 md:p-6 flex flex-col space-y-1.5">
                    <CardTitle className="text-pink-400 flex items-center text-lg md:text-xl">
                      <Users className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                      Audience Snapshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-slate-950 pt-0 p-4 md:p-6 space-y-3 md:space-y-4">
                    {/* Age Distribution */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-300">18-24</span>
                        <span className="text-pink-400">32%</span>
                      </div>
                      <Progress value={32} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-300">25-34</span>
                        <span className="text-cyan-400">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-300">35+</span>
                        <span className="text-purple-400">23%</span>
                      </div>
                      <Progress value={23} className="h-2" />
                    </div>

                    {/* Key Demographics */}
                    <div className="pt-3 border-t border-gray-700/50">
                      <div className="grid grid-cols-2 gap-2 md:gap-3 text-center">
                        <div className="p-2 bg-gray-800/30 rounded-lg">
                          <div className="text-base md:text-lg font-bold text-cyan-400">67%</div>
                          <div className="text-xs text-gray-400">Tech Enthusiasts</div>
                        </div>
                        <div className="p-2 bg-gray-800/30 rounded-lg">
                          <div className="text-base md:text-lg font-bold text-pink-400">84%</div>
                          <div className="text-xs text-gray-400">Early Adopters</div>
                        </div>
                      </div>
                    </div>

                    {/* Top Interests */}
                    <div className="pt-3 border-t border-gray-700/50">
                      <h4 className="text-xs md:text-sm font-semibold text-gray-300 mb-2">Top Interests</h4>
                      <div className="flex flex-wrap gap-1">
                        {['Gaming', 'Tech', 'Sports', 'Music', 'Fashion'].map((interest, index) =>
                        <Badge key={index} className="bg-pink-600/20 text-pink-300 border-pink-500/30 text-xs">
                            {interest}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Main Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-2">

              <Card className="bg-gradient-to-br from-gray-900/80 to-cyan-900/20 border-cyan-500/30 backdrop-blur-xl">
                <CardHeader className="bg-slate-950 p-4 md:p-6 flex flex-col space-y-1.5">
                  <div className="flex flex-col gap-4">
                    <CardTitle className="text-cyan-400 flex items-center text-lg md:text-xl">
                      <Brain className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                      AI Content Analysis
                    </CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      {['all', 'sports', 'lifestyle', 'technology'].map((filter) =>
                      <Button
                        key={filter}
                        variant={selectedFilter === filter ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedFilter(filter)}
                        className="capitalize text-xs md:text-sm px-3 py-1">
                          {filter}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="bg-slate-950 pt-0 p-4 md:p-6 space-y-3 md:space-y-4">
                  {mockViralContent.
                  filter((post) => selectedFilter === 'all' || post.category === selectedFilter).
                  map((post, index) =>
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-xl p-3 md:p-4 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300">

                        {/* Post Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            <img
                          src={post.avatar}
                          alt={post.author}
                          className="w-8 md:w-10 h-8 md:h-10 rounded-full object-cover flex-shrink-0" />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                                <span className="text-white font-semibold text-sm md:text-base">{post.author}</span>
                                {post.badges.includes('Creator') &&
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-yellow-500/50 text-xs px-1 md:px-2 py-0.5">
                                    <Crown className="w-2 md:w-3 h-2 md:h-3 mr-1" />
                                    Creator
                                  </Badge>
                            }
                                {post.badges.includes('Co-CEO') &&
                            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-500/50 text-xs px-1 md:px-2 py-0.5">
                                    Co-CEO
                                  </Badge>
                            }
                                {post.badges.includes('Verified') &&
                            <Badge className="bg-green-600/20 text-green-300 border-green-500/50 text-xs px-1 md:px-2 py-0.5">
                                    ✓ Verified
                                  </Badge>
                            }
                                <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/50 text-xs px-1 md:px-2 py-0.5">
                                  public
                                </Badge>
                              </div>
                              <div className="text-gray-400 text-xs md:text-sm">{post.timestamp}</div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-cyan-400 font-bold text-sm md:text-xl flex items-center">
                              <Zap className="w-3 md:w-4 h-3 md:h-4 mr-1" />
                              +{post.ep_earned.toLocaleString()} EP
                            </div>
                            <div className="text-green-400 text-xs md:text-sm font-bold">{post.growth}</div>
                          </div>
                        </div>

                        {/* Post Content */}
                        <div className="mb-3 md:mb-4">
                          <p className="text-white leading-relaxed text-sm md:text-base">{post.content}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {post.tags.map((tag, tagIndex) =>
                        <span key={tagIndex} className="text-cyan-400 text-xs md:text-sm hover:underline cursor-pointer">
                                {tag}
                              </span>
                        )}
                          </div>
                        </div>

                        {/* Engagement Stats */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 md:gap-6 text-gray-400 text-xs md:text-sm">
                            <div className="flex items-center gap-1 hover:text-red-400 transition-colors cursor-pointer">
                              <Heart className="w-3 md:w-4 h-3 md:h-4" />
                              <span className="font-medium">{(post.hearts / 1000).toFixed(1)}K</span>
                            </div>
                            <div className="flex items-center gap-1 hover:text-blue-400 transition-colors cursor-pointer">
                              <MessageSquare className="w-3 md:w-4 h-3 md:h-4" />
                              <span className="font-medium">{(post.comments / 1000).toFixed(1)}K</span>
                            </div>
                            <div className="flex items-center gap-1 hover:text-green-400 transition-colors cursor-pointer">
                              <Share2 className="w-3 md:w-4 h-3 md:h-4" />
                              <span className="font-medium">{(post.shares / 1000).toFixed(1)}K</span>
                            </div>
                          </div>

                          {/* INTERACTIVE BUTTON/SPONSOR SECTION */}
                          <div className="text-right">
                            <AnimatePresence mode="wait">
                              {partneredPosts[post.id] ?
                          <motion.div
                            key="sponsored"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center justify-end p-1 md:p-2 bg-green-900/40 rounded-lg border border-green-500/30">

                                  <img
                              src={partneredPosts[post.id].logo}
                              alt={`${partneredPosts[post.id].name} logo`}
                              className={`h-3 md:h-5 object-contain mr-1 md:mr-2 ${partneredPosts[post.id].name === 'Nike' ? 'invert' : ''}`} />

                                  <span className="text-xs md:text-sm font-semibold text-green-300">Sponsored</span>
                                </motion.div> :

                          <motion.div
                            key="partner-button"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}>

                                  <Button
                              size="sm"
                              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2"
                              onClick={() => handlePartnerNow(post.id)}>

                                    Partner Now
                                  </Button>
                                </motion.div>
                          }
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Brand Partnership Indicator */}
                        <div className="mt-3 p-2 bg-gradient-to-r from-purple-600/10 to-cyan-600/10 rounded-lg border border-purple-500/20">
                          <div className="flex items-center justify-between text-xs md:text-sm">
                            <span className="text-purple-300">🎯 Brand Match Score</span>
                            <span className="text-cyan-300 font-bold">94% Compatible</span>
                          </div>
                        </div>
                      </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Advanced Filtering */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

            <Card className="bg-slate-950 text-card-foreground rounded-lg border shadow-sm from-gray-900/80 to-pink-900/20 border-pink-500/30 backdrop-blur-xl">
              <CardHeader className="bg-slate-950 p-4 md:p-6 flex flex-col space-y-1.5">
                <CardTitle className="text-pink-400 flex items-center text-lg md:text-xl">
                  <Camera className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                  Object Detection (Future)
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-slate-950 pt-0 p-4 md:p-6">
                <p className="text-gray-300 mb-3 md:mb-4 text-sm md:text-base">Advanced AI will identify specific products and brands in visual content:</p>
                <div className="flex flex-wrap gap-1 md:gap-2">
                  {mockObjectDetection.map((item, index) =>
                  <Badge key={index} className="bg-pink-600/20 text-pink-300 border-pink-500/30 text-xs">
                      {item}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/80 to-green-900/20 border-green-500/30 backdrop-blur-xl">
              <CardHeader className="bg-slate-950 p-4 md:p-6 flex flex-col space-y-1.5">
                <CardTitle className="text-green-400 flex items-center text-lg md:text-xl">
                  <Sliders className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                  Campaign ROI Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-slate-950 pt-0 p-4 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="text-gray-300 mb-2 block text-sm md:text-base">Campaign Budget: ${budgetSlider.toLocaleString()}</label>
                    <input
                      type="range"
                      min="1000"
                      max="50000"
                      value={budgetSlider}
                      onChange={(e) => setBudgetSlider(Number(e.target.value))}
                      className="w-full" />
                  </div>
                  <div className="p-3 md:p-4 bg-gray-800/50 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 text-sm md:text-base">Predicted ROI</span>
                      <span className="text-green-400 font-bold text-lg md:text-xl">{predictedRoi.toFixed(1)}x</span>
                    </div>
                    <Progress value={roiProgress} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Creator Empowerment */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-gradient-to-r from-purple-950/20 to-cyan-950/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16">

            <Badge className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border-purple-500/30 mb-4 md:mb-6 text-sm md:text-base">
              <Users className="w-4 h-4 mr-2" />
              Creator Economy 2.0
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 px-4">
              Empowering Creators to Monetize Impact
            </h2>
            <p className="text-base md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Creators earn from their viral moments while maintaining authentic connections with their audience. No interruptions, just seamless value creation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Mock Creator Profile */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}>
              <div> 
                <Card className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 border-purple-500/30 backdrop-blur-xl">
                  <CardContent className="bg-slate-950 p-4 md:p-8">
                    <div className="flex items-center mb-4 md:mb-6">
                      <div className="w-12 md:w-16 h-12 md:h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mr-3 md:mr-4">
                        <span className="text-lg md:text-2xl font-bold">SK</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-bold text-white">Sarah Kim</h3>
                        <p className="text-gray-400 text-sm md:text-base">Content Creator • 2.3M followers</p>
                      </div>
                      <div className="ml-auto">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-3 h-3 bg-green-500 rounded-full">
                        </motion.div>
                      </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      <div className="flex justify-between items-center p-3 md:p-4 bg-gray-800/50 rounded-xl">
                        <span className="text-gray-300 text-sm md:text-base">Brand Partnership Status</span>
                        <Badge className="bg-green-600/20 text-green-300">Active</Badge>
                      </div>

                      <div className="p-3 md:p-4 bg-gradient-to-r from-cyan-600/10 to-purple-600/10 rounded-xl border border-cyan-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-cyan-300 font-medium text-sm md:text-base">Today's Earnings</span>
                          <span className="text-cyan-300 text-xl md:text-2xl font-bold">+$16,800</span>
                        </div>
                        <div className="text-xs md:text-sm text-gray-400">From 3 viral partnerships</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="text-center p-3 md:p-4 bg-gray-800/30 rounded-xl">
                          <div className="text-lg md:text-2xl font-bold text-purple-400">124,847</div>
                          <div className="text-xs md:text-sm text-gray-400">$EQOFLO Earned</div>
                        </div>
                        <div className="text-center p-3 md:p-4 bg-gray-800/30 rounded-xl">
                          <div className="text-lg md:text-2xl font-bold text-pink-400">87</div>
                          <div className="text-xs md:text-sm text-gray-400">Active Partnerships</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mock Notifications */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="mt-4 md:mt-6 space-y-2 md:space-y-3">

                  {[
                  { brand: 'TechCorp', amount: '$3,240', time: '2 min ago', type: 'video' },
                  { brand: 'StyleBrand', amount: '$5,670', time: '1 hr ago', type: 'image' },
                  { brand: 'FitnessCo', amount: '$7,890', time: '3 hrs ago', type: 'text' }].
                  map((notif, index) =>
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + index * 0.2 }}
                    className="p-3 md:p-4 bg-gradient-to-r from-green-600/20 to-cyan-600/20 border border-green-500/20 rounded-xl">

                        <div className="flex items-center justify-between">
                          <div className="flex items-center min-w-0 flex-1">
                            <CheckCircle className="w-4 md:w-5 h-4 md:h-5 text-green-400 mr-2 md:mr-3 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-white font-medium text-sm md:text-base">
                                Partnership activated with {notif.brand}
                              </div>
                              <div className="text-gray-400 text-xs md:text-sm">{notif.time}</div>
                            </div>
                          </div>
                          <div className="text-green-400 font-bold text-sm md:text-base flex-shrink-0 ml-2">{notif.amount}</div>
                        </div>
                      </motion.div>
                  )}
                </motion.div>
              </div>
            </motion.div>

            {/* Earnings Analytics */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-4 md:space-y-6">

              <Card className="bg-gradient-to-br from-gray-900/80 to-cyan-900/20 border-cyan-500/30 backdrop-blur-xl">
                <CardHeader className="bg-slate-950 p-4 md:p-6 flex flex-col space-y-1.5">
                  <CardTitle className="text-cyan-400 flex items-center text-lg md:text-xl">
                    <BarChart3 className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                    Partnership Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-slate-950 pt-0 p-4 md:p-6">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm md:text-base">This Month</span>
                      <span className="text-cyan-400 text-xl md:text-2xl font-bold">$847,920</span>
                    </div>
                    <Progress value={78} className="h-2 md:h-3" />
                    <div className="text-xs md:text-sm text-gray-400">+234% vs last month</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-900/80 to-pink-900/20 border-pink-500/30 backdrop-blur-xl">
                <CardHeader className="bg-slate-950 p-4 md:p-6 flex flex-col space-y-1.5">
                  <CardTitle className="text-pink-400 flex items-center text-lg md:text-xl">
                    <Star className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-slate-950 pt-0 p-4 md:p-6 space-y-3 md:space-y-4">
                  <div className="grid grid-cols-2 gap-3 md:gap-4 text-center">
                    <div>
                      <div className="text-2xl md:text-3xl font-bold text-pink-400">98.4%</div>
                      <div className="text-xs md:text-sm text-gray-400">Brand Satisfaction</div>
                    </div>
                    <div>
                      <div className="text-2xl md:text-3xl font-bold text-purple-400">4.9</div>
                      <div className="text-xs md:text-sm text-gray-400">Creator Rating</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Engagement Rate</span>
                      <span className="text-pink-400">89.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Conversion Rate</span>
                      <span className="text-purple-400">23.7%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Dynamic Overlay Showcase */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16">

            <Badge className="bg-gradient-to-r from-cyan-600/20 to-pink-600/20 text-cyan-300 border-cyan-500/30 mb-4 md:mb-6 text-sm md:text-base">
              <Lightbulb className="w-4 h-4 mr-2" />
              Revolutionary Technology
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-400 px-4">
              Dynamic Content Integration
            </h2>
            <p className="text-base md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Our proprietary AI seamlessly integrates brand elements into viral content moments, maintaining authenticity while maximizing impact.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
            {
              title: 'Subtle Corner Logo',
              description: 'Non-intrusive brand presence that enhances rather than disrupts',
              demo: 'Corner placement with smart opacity adjustment',
              color: 'from-cyan-600 to-blue-600',
              image_url: 'https://images.unsplash.com/photo-1510915228384-e8f1f83fe156?w=400&h=225&fit=crop&q=80'
            },
            {
              title: 'Context-Aware Overlays',
              description: 'AI analyzes content context to place brand elements naturally',
              demo: 'Dynamic positioning based on content analysis',
              color: 'from-purple-600 to-pink-600',
              image_url: 'https://images.unsplash.com/photo-1549673418-e3c3b0de6321?w=400&h=225&fit=crop&q=80'
            },
            {
              title: 'Interactive End Cards',
              description: 'Engaging call-to-actions that drive meaningful conversions',
              demo: 'Seamless transition to brand engagement',
              color: 'from-pink-600 to-red-600',
              image_url: 'https://images.unsplash.com/photo-1518342410887-2f3b9c7b9c9f?w=400&h=225&fit=crop&q=80'
            }].
            map((overlay, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}>

                <Card className="bg-slate-950 text-card-foreground rounded-lg border shadow-sm from-gray-900/80 to-purple-900/20 border-purple-500/30 backdrop-blur-xl h-full group hover:scale-105 transition-transform duration-300">
                  <CardContent className="bg-slate-950 p-4 md:p-6">
                    <div
                    className="relative mb-4 md:mb-6 aspect-video rounded-xl overflow-hidden"
                    style={{
                      backgroundImage: `url(${overlay.image_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}>

                      <div className="absolute inset-0 bg-black/40"></div>
                      <motion.div
                      className={`absolute bottom-2 md:bottom-4 right-2 md:right-4 bg-gradient-to-r ${overlay.color} rounded-lg p-1 md:p-2 opacity-80`}
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 3, repeat: Infinity }}>

                        <div className="text-white text-xs font-semibold">Brand Logo</div>
                      </motion.div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-8 md:w-12 h-8 md:h-12 text-white/50" />
                      </div>
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">{overlay.title}</h3>
                    <p className="text-gray-400 mb-3 md:mb-4 text-sm md:text-base">{overlay.description}</p>
                    <div className="text-xs md:text-sm text-cyan-400">{overlay.demo}</div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-gradient-to-r from-cyan-950/20 to-purple-950/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 md:mb-16">

            <Badge className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 text-purple-300 border-purple-500/30 mb-4 md:mb-6 text-sm md:text-base">
              <Zap className="w-4 h-4 mr-2" />
              Platform Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 px-4">
              Built for the Future of Marketing
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
            {
              icon: TrendingUp,
              title: 'Real-Time Trending',
              description: 'AI monitors millions of content pieces per second, identifying viral potential before it peaks.',
              color: 'text-cyan-400',
              bgColor: 'from-cyan-600/10 to-blue-600/10'
            },
            {
              icon: Target,
              title: 'Customizable Targeting',
              description: 'Precise audience matching based on demographics, interests, and behavioral patterns.',
              color: 'text-purple-400',
              bgColor: 'from-purple-600/10 to-pink-600/10'
            },
            {
              icon: BarChart3,
              title: 'Performance Benchmarking',
              description: 'Industry-leading analytics and competitive benchmarking for optimal campaign performance.',
              color: 'text-pink-400',
              bgColor: 'from-pink-600/10 to-red-600/10'
            },
            {
              icon: Bot,
              title: 'Automated Partnerships',
              description: 'Smart contract-based partnerships that execute automatically when criteria are met.',
              color: 'text-green-400',
              bgColor: 'from-green-600/10 to-cyan-600/10'
            },
            {
              icon: DollarSign,
              title: 'Budget Optimization',
              description: 'AI-driven budget allocation ensures maximum ROI across all campaign elements.',
              color: 'text-yellow-400',
              bgColor: 'from-yellow-600/10 to-orange-600/10'
            },
            {
              icon: Shield,
              title: 'Brand Safety',
              description: 'Advanced content filtering and brand safety measures protect your reputation.',
              color: 'text-red-400',
              bgColor: 'from-red-600/10 to-pink-600/10'
            }].
            map((feature, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}>

                  <Card className="bg-slate-950 text-card-foreground rounded-lg border shadow-sm from-gray-900/80 to-purple-900/20 border-purple-500/30 backdrop-blur-xl h-full group hover:border-purple-400/50 transition-all duration-300">
                    <CardContent className="p-4 md:p-6">
                      <div className={`w-10 md:w-12 h-10 md:h-12 bg-gradient-to-r ${feature.bgColor} rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className={`w-5 md:w-6 h-5 md:h-6 ${feature.color}`} />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3">{feature.title}</h3>
                      <p className="text-gray-400 text-sm md:text-base">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 md:py-32 px-4 md:px-6 relative overflow-hidden">
        <div className="bg-gradient-to-r my-32 absolute inset-0 from-purple-600/20 via-cyan-600/20 to-pink-600/20"></div>
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) =>
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5
            }} />
          )}
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}>

            <Badge className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 text-cyan-300 border-cyan-500/30 text-base md:text-lg px-4 md:px-6 py-2 mb-6 md:mb-8">
              <Diamond className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              Ready to Transform Marketing?
            </Badge>

            <h2 className="text-4xl md:text-6xl font-black mb-6 md:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 px-4">
              The Future of Brand Partnerships is Here
            </h2>

            <p className="text-lg md:text-2xl text-gray-300 mb-8 md:mb-12 leading-relaxed px-4">
              Join the revolution in authentic, AI-powered marketing. Connect with viral moments,
              empower creators, and drive unprecedented engagement for your brand.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center mb-8 md:mb-12 px-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>

                <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white px-6 py-4 text-lg md:text-base md:py-3 rounded-2xl shadow-2xl">
                  <span className="whitespace-nowrap">Schedule Partnership Demo</span>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>

                <Button variant="outline" className="w-full sm:w-auto bg-background text-slate-50 px-6 py-4 text-lg md:text-base md:py-3 font-medium whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border hover:text-accent-foreground h-auto border-purple-500/30 hover:bg-purple-500/10 rounded-2xl backdrop-blur-sm">
                  <span className="whitespace-nowrap">Download Investment Deck</span>
                </Button>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center px-4">
              <div>
                <div className="text-2xl md:text-4xl font-bold text-cyan-400 mb-2">$2.4B+</div>
                <div className="text-gray-400 text-sm md:text-base">Projected Market Size</div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-bold text-purple-400 mb-2">94%</div>
                <div className="text-gray-400 text-sm md:text-base">Brand Satisfaction Rate</div>
              </div>
              <div>
                <div className="text-2xl md:text-4xl font-bold text-pink-400 mb-2">10M+</div>
                <div className="text-400 text-sm md:text-base">Creator Network</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <SponsorRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)} />

    </div>);

}
