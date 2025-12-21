
import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Vote,
  Coins,
  Users,
  Eye,
  Lock,
  Globe,
  TrendingUp,
  Heart,
  Crown,
  Sparkles,
  CheckCircle,
  PlayCircle,
  GraduationCap,
  LayoutGrid,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

// New imports for the Video Tutorial System
import { VideoTutorial } from '@/entities/VideoTutorial';
import AdminVideoUploadModal from '../components/knowledge/AdminVideoUploadModal';
import VideoPlayerModal from '../components/knowledge/VideoPlayerModal';


// Placeholder for QuantumFlowLoader if it doesn't exist yet.
// In a real project, this would be a separate file like '@/components/animations/QuantumFlowLoader'.
// For a fully functional file, we need at least a basic definition.
const QuantumFlowLoader = ({ message }) => (
  <div className="flex flex-col items-center justify-center space-y-4 text-gray-400">
    <svg className="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p>{message || 'Loading...'}</p>
  </div>
);


export default function KnowledgeHubPage() {
  const [user, setUser] = useState(null);

  // States for video tutorials
  const [videoTutorials, setVideoTutorials] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [showAdminVideoModal, setShowAdminVideoModal] = useState(false);
  const [showVideoPlayerModal, setShowVideoPlayerModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('video-tutorials'); // Changed default tab

  useEffect(() => {
    User.me().then(setUser).catch(() => {});
  }, []);

  // Load video tutorials on component mount
  useEffect(() => {
    loadVideoTutorials();
  }, []);

  const loadVideoTutorials = async () => {
    try {
      setIsLoadingVideos(true);
      const videos = await VideoTutorial.list('order', 100); // Assuming 'order' is the field to sort by
      setVideoTutorials(videos);
    } catch (error) {
      console.error('Failed to load video tutorials:', error);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleVideoClick = async (video) => {
    // Increment view count
    try {
      // Create a copy to prevent direct state mutation issues and ensure reactivity
      const updatedVideo = { ...video, views_count: (video.views_count || 0) + 1 };
      await VideoTutorial.update(video.id, {
        views_count: updatedVideo.views_count
      });
      // Optionally update the video in the local state to reflect the new view count
      setVideoTutorials(prevVideos =>
        prevVideos.map(v => (v.id === video.id ? updatedVideo : v))
      );
    } catch (error) {
      console.error('Failed to update view count:', error);
    }

    setSelectedVideo(video); // Use the original video for display in the modal, as the modal might not need the updated views_count right away.
    setShowVideoPlayerModal(true);
  };

  // Color scheme configurations
  const colorSchemes = {
    purple: { primary: '#8b5cf6', secondary: '#ec4899' },
    blue: { primary: '#3b82f6', secondary: '#06b6d4' },
    green: { primary: '#10b981', secondary: '#059669' },
    orange: { primary: '#f97316', secondary: '#eab308' },
    red: { primary: '#ef4444', secondary: '#ec4899' },
    pink: { primary: '#ec4899', secondary: '#f472b6' },
    cyan: { primary: '#06b6d4', secondary: '#3b82f6' },
    yellow: { primary: '#eab308', secondary: '#f97316' },
    indigo: { primary: '#6366f1', secondary: '#8b5cf6' },
    emerald: { primary: '#10b981', secondary: '#059646' }
  };

  // Get user's color scheme or default to purple
  const userColorScheme = user?.color_scheme || 'purple';
  const currentColors = colorSchemes[userColorScheme];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">

      <div className="max-w-6xl mx-auto">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12">

          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${currentColors.primary}, ${currentColors.secondary})` }}>
              EqoAssist
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed px-4">
            Welcome to the future of social networking. Understanding why EqoFlow changes everything
            about how social platforms work, and how you benefit from every interaction.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
            <Badge className="bg-green-500/20 text-green-300 border-green-500/40">
              <Sparkles className="w-3 h-3 mr-1" />
              Revolutionary Privacy
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
              <Crown className="w-3 h-3 mr-1" />
              Community Owned
            </Badge>
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40">
              <Coins className="w-3 h-3 mr-1" />
              Revenue Sharing
            </Badge>
          </div>
        </motion.div>

        <Tabs defaultValue="video-tutorials" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-900/80 border border-purple-500/20"> {/* Changed grid-cols from 4 to 2 */}
            <TabsTrigger value="video-tutorials" className="flex items-center gap-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-purple-600/30">
              <PlayCircle className="w-4 h-4" /> Video Tutorials
            </TabsTrigger>
            <TabsTrigger value="core-concepts" className="flex items-center gap-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-purple-600/30">
              <LayoutGrid className="w-4 h-4" /> Core Concepts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video-tutorials">
            <Card className="dark-card">
              <CardHeader className="bg-slate-950">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold text-white">Video Tutorials</CardTitle>
                    <CardDescription className="text-gray-400">Watch and learn the key features of EqoFlow.</CardDescription>
                  </div>
                  {user?.role === 'admin' && (
                    <Button
                      onClick={() => setShowAdminVideoModal(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-500"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Video
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="bg-slate-950">
                {isLoadingVideos ? (
                  <div className="flex items-center justify-center py-16">
                    <QuantumFlowLoader message="Loading videos..." />
                  </div>
                ) : videoTutorials.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videoTutorials.map((video, index) => (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Card
                          className="dark-card overflow-hidden group hover-lift cursor-pointer"
                          onClick={() => handleVideoClick(video)}
                        >
                          <div className="relative">
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlayCircle className="w-16 h-16 text-white/80" />
                            </div>
                            <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                              {video.duration}
                            </Badge>
                          </div>
                          <CardHeader className="bg-slate-950">
                            <CardTitle className="text-lg text-white">{video.title}</CardTitle>
                            <CardDescription className="text-sm text-gray-400">{video.description}</CardDescription>
                          </CardHeader>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <PlayCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No video tutorials yet</h3>
                    <p className="text-gray-400">
                      {user?.role === 'admin'
                        ? 'Add your first video tutorial to help users learn about EqoFlow!'
                        : 'Check back soon for helpful video tutorials!'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Core Concepts Content */}
          <TabsContent value="core-concepts">
            {/* Introduction Card (Renamed to EqoUniversity) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12">

              <Card className="dark-card neon-glow">
                <CardHeader className="bg-slate-950 p-6 flex flex-col space-y-1.5">
                  <CardTitle className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                    The EqoFlow Difference
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Dive deep into EqoFlow's unique ecosystem, privacy tech, and community-driven future. Discover how you own your data, earn real value, and shape the platform's destiny.
                  </CardDescription>
                </CardHeader>
                <CardContent className="bg-slate-950 pt-0 p-6 space-y-4">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    EqoFlow looks and feels like your favorite social network, but it's built completely differently.
                    Here, <span className="text-white font-semibold">you own your data</span>, <span className="text-white font-semibold">you earn from your activity</span>,
                    and <span className="text-white font-semibold">you have a real say in the platform's future</span>.
                  </p>

                  {/* Image Comparison Section */}
                  <div className="my-8 grid md:grid-cols-2 gap-4 md:gap-8">
                    {/* Web2 - The Old Way */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="relative rounded-2xl overflow-hidden border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">

                      <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/37aa10150_cuzintray_a_person_hunched_over_their_phone_7015f5d2-f814-4403-a4d4-69076dd79f50.png"
                        alt="Web2 Data Exploitation"
                        className="w-full h-full object-cover" />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-4 md:p-6">
                        <h3 className="text-xl md:text-2xl font-bold text-red-300">The Old Way</h3>
                        <p className="text-sm md:text-base text-white">Your data is harvested and sold. You create value, but they keep the profits.</p>
                      </div>
                    </motion.div>

                    {/* EqoFlow - The New Way */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="relative rounded-2xl overflow-hidden border border-green-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">

                      <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b7bed4073_cuzintray_a_realistic_image_of_a_person_using_their_phone_on_s_ae29e8ad-39fd-4b7e-88e1-741af7302ed4.png"
                        alt="EqoFlow User Empowerment"
                        className="w-full h-full object-cover" />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-4 md:p-6">
                        <h3 className="text-xl md:text-2xl font-bold text-green-300">The EqoFlow Way</h3>
                        <p className="text-sm md:text-base text-white">Your data is yours. Your engagement creates value that you own and control.</p>
                      </div>
                    </motion.div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4 text-center">
                      <Eye className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <h4 className="text-white font-semibold">You Own Your Data</h4>
                      <p className="text-gray-400 text-sm">No corporate surveillance or data harvesting</p>
                    </div>
                    <div className="bg-green-600/10 border border-green-500/20 rounded-lg p-4 text-center">
                      <Coins className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <h4 className="text-white font-semibold">Earn Real Value</h4>
                      <p className="text-gray-400 text-sm">Get rewarded for every like, comment, and post</p>
                    </div>
                    <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg p-4 text-center">
                      <Vote className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <h4 className="text-white font-semibold">Shape the Future</h4>
                      <p className="text-gray-400 text-sm">Vote on features, policies, and platform direction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Sections */}
            <div className="bg-slate-950 space-y-8">

              {/* Section 1: How EqoFlow Works */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}>

                <Card className="dark-card">
                  <CardHeader className="bg-slate-950">
                    <CardTitle className="text-xl md:text-2xl text-white flex items-center gap-3">
                      <Globe className="w-6 h-6 text-blue-400" />
                      How EqoFlow Works: The Basics, Simplified
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-slate-950 space-y-6">

                    {/* User Journey Illustration */}
                    <div className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-500/20 rounded-xl p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

                        {/* Step 1 */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.4 }}
                          className="text-center relative group">

                          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/eddb06338_Screenshot2025-08-24003926.png" alt="Earn Engagement Points" className="rounded-lg mb-4 shadow-lg w-full group-hover:scale-105 transition-transform duration-300" />
                          <h4 className="text-lg font-semibold text-white">1. Earn Engagement Points (EP)</h4>
                          <p className="text-sm text-gray-300">Your likes, comments, and posts reward you with EP. Creators also earn when others engage with their content.</p>
                        </motion.div>

                        {/* Step 2 */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                          className="text-center relative group">

                          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/41636d44a_cuzintray_create_a_token_with_QFLOW_in_gold_and_silver_9cb43b72-6ed9-471e-b303-fb2e84c9aac4.png" alt="Convert to EQOFLO Tokens" className="rounded-lg mb-4 shadow-lg w-full group-hover:scale-105 transition-transform duration-300" />
                          <h4 className="text-lg font-semibold text-white">2. Convert to $EQOFLO Tokens</h4>
                          <p className="text-sm text-gray-300">Turn your points into real, valuable platform currency.</p>
                        </motion.div>

                        {/* Step 3 */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.6 }}
                          className="text-center relative group">

                          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/32957eccc_cuzintray_a_group_of_people_voting_and_discussing_ways_to_bett_97f8f1ae-e0de-4c69-a554fa9bedd7.png" alt="Exercise Ownership and Vote" className="rounded-lg mb-4 shadow-lg w-full group-hover:scale-105 transition-transform duration-300" />
                          <h4 className="text-lg font-semibold text-white">3. Use Tokens to Vote and Make Purchases</h4>
                          <p className="text-sm text-gray-300">Use tokens to vote, propose meaningful improvements to the platform, and purchase items and services.</p>
                        </motion.div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-400" />
                          The Familiar Experience
                        </h3>
                        <ul className="space-y-3 text-gray-300">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                            Post content, photos, and thoughts just like any social platform
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                            Connect with friends, discover new creators, and join communities
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                            Like, comment, share, and engage with content you love
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                            Stream live content, showcase skills, and build your audience
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-400" />
                          The Revolutionary Difference
                        </h3>
                        <div className="space-y-4">
                          <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg p-4">
                            <h4 className="text-white font-semibold mb-2">Engagement Points (EP)</h4>
                            <p className="text-gray-300 text-sm">Every like, comment, post, and interaction earns you Engagement Points. Think of them as your activity rewards.</p>
                          </div>
                          <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-4">
                            <h4 className="text-white font-semibold mb-2">$EQOFLO Tokens</h4>
                            <p className="text-gray-300 text-sm">Convert your EP into $EQOFLO tokens - the platform's digital currency that you own and holds voting power and other benefits</p>
                          </div>
                          <div className="bg-green-600/10 border border-green-500/20 rounded-lg p-4">
                            <h4 className="text-white font-semibold mb-2">Token Ownership</h4>
                            <p className="text-gray-300 text-sm">By holding tokens, you gain direct control over platform features and governance processes. Decisions about the platform are made collectively by the community, helping to ensure transparency and decentralization – without traditional corporate control.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Section 2: Nillion Partnership */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}>

                <Card className="dark-card neon-glow">
                  <CardHeader className="bg-slate-950">
                    <CardTitle className="text-xl md:text-2xl text-white flex items-center gap-3">
                      <ShieldCheck className="w-6 h-6 text-green-400" />
                      Your Data, Truly Private: The Revolutionary Nillion Partnership
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-slate-950 space-y-6">

                    <div className="grid md:grid-cols-2 gap-4 md:gap-8 my-4">
                      {/* Image 1: The Sanctuary */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="relative rounded-2xl overflow-hidden border border-green-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">

                        <img
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/25ee804e7_cuzintray_a_user_in_a_block_chain_house_silhoeutte_with_a_key__d16cbdc6-8131-43fb-98db-2824c9e557b5.png"
                          alt="Your Digital Sanctuary"
                          className="w-full h-full object-cover" />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-4 md:p-6">
                          <h3 className="text-xl md:text-2xl font-bold text-green-300">Your Digital Sanctuary</h3>
                          <p className="text-sm md:text-base text-white">Your data lives in a private vault, computed on without ever being seen. It is fundamentally yours.</p>
                        </div>
                      </motion.div>

                      {/* Image 2: The Key */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="relative rounded-2xl overflow-hidden border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]">

                        <img
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/cd863987d_cuzintray_a_user_in_a_block_chain_house_silhoeutte_with_a_key__955b009b-767e-466f-8aaa-0f494ffcd2c8.png"
                          alt="You Hold the Key"
                          className="w-full h-full object-cover" />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-4 md:p-6">
                          <h3 className="text-xl md:text-2xl font-bold text-cyan-300">You Hold the Key</h3>
                          <p className="text-sm md:text-base text-white">Nillion's technology ensures that only you can decrypt and access your raw personal information. No backdoors, no exceptions.</p>
                        </div>
                      </motion.div>
                    </div>

                    <div className="bg-red-600/10 border border-red-500/20 rounded-lg p-4 md:p-6 mb-6">
                      <h3 className="text-lg md:text-xl font-semibold text-red-300 mb-3">The Web2 Problem</h3>
                      <p className="text-gray-300 leading-relaxed">
                        Traditional social media platforms like Facebook, Twitter, and TikTok collect massive amounts of your personal data
                        - your interests, behavior patterns, location, contacts, and more. They then sell this data to advertisers and use it
                        to manipulate what you see. <span className="text-white font-semibold">You get none of the profits, but bear all the privacy risks.</span>
                      </p>
                    </div>

                    <div className="bg-green-600/10 border border-green-500/20 rounded-lg p-4 md:p-6">
                      <h3 className="text-lg md:text-xl font-semibold text-green-300 mb-4">The Nillion Solution: Privacy Computing</h3>
                      <p className="text-gray-300 leading-relaxed mb-4">
                        Imagine you want to calculate something with a friend's secret number, but without either of you ever revealing
                        your numbers to each other. Nillion makes this possible for your data on EqoFlow.
                      </p>

                      <div className="grid md:grid-cols-2 gap-6 mt-6">
                        <div>
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-green-400" />
                            How It Works
                          </h4>
                          <ul className="space-y-2 text-gray-300 text-sm">
                            <li>• Your data stays encrypted at all times</li>
                            <li>• EqoFlow can process it without seeing the raw information</li>
                            <li>• Recommendations and features work without compromising privacy</li>
                            <li>• Only you have the keys to decrypt your personal information</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            Why This Matters
                          </h4>
                          <ul className="space-y-2 text-gray-300 text-sm">
                            <li>• No corporate surveillance or data harvesting</li>
                            <li>• Your personal information remains truly yours</li>
                            <li>• Advanced features without privacy compromise</li>
                            <li>• Groundbreaking technology unseen in social media</li>
                          <li>• Built on trust, not exploitation</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
                      <p className="text-blue-300 font-semibold text-center">
                        <Sparkles className="w-4 h-4 inline mr-2" />
                        This partnership represents the most advanced privacy technology ever deployed in social networking.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Section 3: DAO Governance */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}>

                <Card className="dark-card">
                  <CardHeader className="bg-slate-950">
                    <CardTitle className="text-xl md:text-2xl text-white flex items-center gap-3">
                      <Vote className="w-6 h-6 text-purple-400" />
                      Your Voice, Your Vote: Community-Owned Platform Governance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-slate-950 space-y-6">

                    {/* DAO governance illustration */}
                    <div className="bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-xl p-6">
                      <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/24adbbcd6_cuzintray_Multiple_hands_each_holding_a_glowing_ballot_or_digi_6ce1e236-7ea0-4fb1-9ec0-98b01f382d8.png"
                        alt="Community Governance - Multiple hands reaching toward a glowing network representing collective decision-making"
                        className="w-full h-64 object-cover rounded-lg mb-4 shadow-lg" />

                      <div className="text-center">
                        <h3 className="text-lg md:text-xl font-semibold text-purple-300 mb-2">Collective Power in Action</h3>
                        <p className="text-gray-300">Every token holder has a voice in shaping EqoFlow's future through transparent, on-chain governance.</p>
                      </div>
                    </div>

                    <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg p-4 md:p-6">
                      <h3 className="text-lg md:text-xl font-semibold text-purple-300 mb-4">What is a DAO?</h3>
                      <p className="text-gray-300 leading-relaxed mb-4">
                        DAO stands for "Decentralized Autonomous Organization." Think of it as a community-owned and governed organization
                        where every major decision is made by the community members (you!) through voting.
                      </p>
                      <p className="text-gray-300 leading-relaxed">
                        <span className="text-white font-semibold">You're not just a user - you're a decision-maker.</span>
                        Your $EQOFLO tokens give you voting power proportional to your stake in the platform.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4 text-center">
                        <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                        <h4 className="text-white font-semibold mb-2">Platform Features</h4>
                        <p className="text-gray-300 text-sm">Vote on new features, algorithm changes, and platform improvements</p>
                      </div>

                      <div className="bg-green-600/10 border border-green-500/20 rounded-lg p-4 text-center">
                        <Coins className="w-8 h-8 text-green-400 mx-auto mb-3" />
                        <h4 className="text-white font-semibold mb-2">Treasury Decisions</h4>
                        <p className="text-gray-300 text-sm">Decide how platform funds are used, invested, or distributed</p>
                      </div>

                      <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                        <ShieldCheck className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                        <h4 className="text-white font-semibold mb-2">Platform Policies</h4>
                        <p className="text-gray-300 text-sm">Shape community guidelines, moderation rules, and platform values</p>
                      </div>
                    </div>

                    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-lg p-4">
                      <h4 className="text-indigo-300 font-semibold mb-2 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Complete Transparency
                      </h4>
                      <p className="text-gray-300 text-sm">
                        All proposals, votes, and decisions are publicly recorded and verifiable. No secret board meetings or hidden agendas.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Section 4: Revenue Sharing */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}>

                <Card className="dark-card neon-glow">
                  <CardHeader className="bg-slate-950">
                    <CardTitle className="text-xl md:text-2xl text-white flex items-center gap-3">
                      <Coins className="w-6 h-6 text-yellow-400" />
                      Sharing the Wealth: Quarterly Revenue Distributions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-slate-950 space-y-6">

                    {/* Revenue sharing illustration */}
                    <div className="bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-500/20 rounded-xl p-6">
                       <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/562f4f165_cuzintray_revenue_sharing_model_where_the_community_is_involve_61ff6c63-370e-4cba-8ade-d005a742aa70.png"
                        alt="A miniature city where houses are built on foundations of coins, symbolizing community-owned wealth"
                        className="w-full h-64 object-cover rounded-lg mb-4 shadow-lg" />

                      <div className="text-center">
                        <h3 className="text-lg md:text-xl font-semibold text-yellow-300 mb-2">From Corporate Profit to Community Prosperity</h3>
                        <p className="text-gray-300">Platform revenue flows back to the community treasury, empowering you—the token holders—to decide how it's used, invested, or shared.</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-green-600/10 border border-green-500/20 rounded-lg p-4 md:p-6">
                        <h3 className="text-lg md:text-xl font-semibold text-green-300 mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          How Platform Revenue Works
                        </h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                          EqoFlow generates revenue from various sources: marketplace transaction fees, premium subscriptions,
                          advertising partnerships, and other platform services. Instead of this money going to corporate shareholders,
                          it goes into the <span className="text-white font-semibold">DAO Treasury</span> - a community-controlled fund.
                        </p>

                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div className="bg-black/20 rounded-lg p-4">
                            <h4 className="text-white font-semibold mb-2">Revenue Sources</h4>
                            <ul className="text-gray-300 text-sm space-y-1">
                              <li>• Skills marketplace fees</li>
                              <li>• Community creation fees</li>
                              <li>• Premium subscriptions</li>
                              <li>• NFT marketplace transactions</li>
                              <li>• Partnership revenue</li>
                            </ul>
                          </div>
                          <div className="bg-black/20 rounded-lg p-4">
                            <h4 className="text-white font-semibold mb-2">Treasury Management</h4>
                            <ul className="text-gray-300 text-sm space-y-1">
                              <li>• 100% transparent tracking</li>
                              <li>• Regular distribution votes</li>
                              <li>• Growth reinvestment options</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-4 md:p-6">
                        <h3 className="text-lg md:text-xl font-semibold text-yellow-300 mb-4 flex items-center gap-2">
                          <Coins className="w-5 h-5" />
                          Your Quarterly Share
                        </h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                          Every quarter, $EQOFLO token holders can vote on proposals to distribute a portion of the treasury
                          directly back to the community. The distribution is proportional to your token holdings.
                        </p>

                        <div className="bg-black/20 rounded-lg p-4 mb-4">
                          <h4 className="text-white font-semibold mb-3">Example Distribution Scenario:</h4>
                          <div className="text-gray-300 text-sm space-y-2">
                            <p>• Treasury Balance: $100,000</p>
                            <p>• Community votes to distribute: 15%</p>
                            <p>• Distribution Amount: $15,000</p>
                            <p>• You hold: 1,000 tokens (1% of total supply)</p>
                            <p className="text-green-300 font-semibold">• Your Share: $150 in $EQOFLO tokens</p>
                          </div>
                        </div>

                        <p className="text-yellow-300 font-semibold">
                          <span className="text-white">The more tokens you hold, the larger your share.</span>
                          As EqoFlow succeeds, you directly benefit simply by being part of the community.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Conclusion Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}>

                <Card className="dark-card neon-glow">
                  <CardContent className="bg-slate-950 p-4 md:p-8 text-center">
                    <div className="mb-6">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        Beyond the Status Quo: The EqoFlow Revolution
                      </h2>
                    </div>

                    <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8 max-w-4xl mx-auto">
                      EqoFlow's unique combination of <span className="text-green-300 font-semibold">revolutionary data privacy</span>,
                      <span className="text-yellow-300 font-semibold"> direct earning potential</span>,
                      <span className="text-purple-300 font-semibold"> community governance</span>, and
                      <span className="text-blue-300 font-semibold"> shared profits</span> creates something that has never existed before.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                      <div className="text-left">
                        <h3 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                          <Heart className="w-5 h-5 text-red-400" />
                          Traditional Social Media
                        </h3>
                        <ul className="space-y-2 text-gray-400">
                          <li>• Your data is harvested and sold</li>
                          <li>• You create content for free</li>
                          <li>• Corporate decisions without your input</li>
                          <li>• Platform profits go to shareholders</li>
                          <li>• No transparency in operations</li>
                        </ul>
                      </div>

                      <div className="text-left">
                        <h3 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                          <Crown className="w-5 h-5 text-yellow-400" />
                          EqoFlow Experience
                        </h3>
                        <ul className="space-y-2 text-green-300">
                          <li>• Your data stays private and encrypted</li>
                          <li>• You earn tokens for every interaction</li>
                          <li>• You vote on all platform decisions</li>
                          <li>• Platform profits are shared with you</li>
                          <li>• Complete transparency in operations</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                        This is more than just a social platform.
                      </h3>
                      <p className="text-md md:text-lg text-gray-300">
                        It's a <span className="text-purple-300 font-semibold">fairer</span>,
                        more <span className="text-green-300 font-semibold">transparent</span>, and
                        <span className="text-yellow-300 font-semibold"> empowering digital experience</span> for everyone.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Admin Video Upload Modal */}
      {user?.role === 'admin' && (
        <AdminVideoUploadModal
          isOpen={showAdminVideoModal}
          onClose={() => setShowAdminVideoModal(false)}
          onVideoAdded={loadVideoTutorials}
        />
      )}

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={showVideoPlayerModal}
        onClose={() => {
          setShowVideoPlayerModal(false);
          setSelectedVideo(null);
        }}
        video={selectedVideo}
      />
    </div>
  );
}
