import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUser } from "@/components/contexts/UserContext";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Video, TrendingUp, Users, DollarSign, BarChart3, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CreatorOnboarding from "@/components/creator/CreatorOnboarding";
import ContentStampModal from "@/components/creator/ContentStampModal";
import CreatorAnalyticsModal from "@/components/creator/CreatorAnalyticsModal";
import StampedContentGallery from "@/components/creator/StampedContentGallery";

export default function CreatorHub() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showStampModal, setShowStampModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [viewMode, setViewMode] = useState('creator'); // 'creator' or 'user'
  const [stampedContentCount, setStampedContentCount] = useState(0);
  const [publishedCreatorContent, setPublishedCreatorContent] = useState([]);

  const userColorScheme = {
    primary: user?.color_scheme ? getColorScheme(user.color_scheme).primary : '#8b5cf6',
    secondary: user?.color_scheme ? getColorScheme(user.color_scheme).secondary : '#ec4899',
    accent: user?.color_scheme ? getColorScheme(user.color_scheme).accent : '#2d1b69'
  };

  useEffect(() => {
    loadCreatorProfile();
    loadStampedContent();
    loadPublishedContent();
  }, [user]);

  const loadCreatorProfile = async () => {
    if (!user) return;

    try {
      const profiles = await base44.entities.CreatorProfile.filter({ created_by: user.email });
      
      if (profiles.length === 0) {
        setShowOnboarding(true);
      } else {
        setCreatorProfile(profiles[0]);
        setShowOnboarding(false);
      }
    } catch (error) {
      console.error("Error loading creator profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStampedContent = async () => {
    if (!user) return;

    try {
      const stampedPosts = await base44.entities.Post.filter({ 
        created_by: user.email, 
        blockchain_tx_id: { $ne: null } 
      });
      setStampedContentCount(stampedPosts.length);
    } catch (error) {
      console.error("Error loading stamped content:", error);
    }
  };

  const loadPublishedContent = async () => {
    try {
      const content = await base44.entities.Post.filter({ 
        is_creator_hub_published: true,
        blockchain_tx_id: { $ne: null }
      }, '-created_date', 50);
      setPublishedCreatorContent(content);
    } catch (error) {
      console.error("Error loading published creator content:", error);
    }
  };

  const handleOnboardingComplete = async (isCreator) => {
    await loadCreatorProfile();
  };

  const handleStampComplete = async () => {
    setShowStampModal(false);
    await loadStampedContent();
    await loadPublishedContent();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/942c1cf5d_EqoFlowLogoDesign-14.png"
            alt="Loading"
            className="w-24 h-24 object-contain"
          />
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <CreatorOnboarding onComplete={handleOnboardingComplete} userColorScheme={userColorScheme} />;
  }

  const isCreator = creatorProfile?.is_creator;
  const showCreatorView = isCreator && viewMode === 'creator';

  return (
    <div className="min-h-screen pb-20">
      {/* View Mode Toggle - Only for Creators */}
      {isCreator && (
        <div className="mb-6 flex justify-start">
          <div className="bg-white/5 border border-white/20 rounded-lg p-1 flex gap-1">
            <Button
              onClick={() => setViewMode('creator')}
              className={`transition-all ${
                viewMode === 'creator'
                  ? 'text-white'
                  : 'bg-transparent text-white/60 hover:text-white hover:bg-white/5'
              }`}
              style={viewMode === 'creator' ? {
                background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`
              } : {}}>
              Creator View
            </Button>
            <Button
              onClick={() => setViewMode('user')}
              className={`transition-all ${
                viewMode === 'user'
                  ? 'text-white'
                  : 'bg-transparent text-white/60 hover:text-white hover:bg-white/5'
              }`}
              style={viewMode === 'user' ? {
                background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`
              } : {}}>
              User View
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${userColorScheme.accent}E6, ${userColorScheme.primary}40)`,
          border: `2px solid ${userColorScheme.primary}60`
        }}>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {showCreatorView ? (creatorProfile?.channel_name || "Creator Hub") : "Creator Hub"}
              </h1>
              <p className="text-xl text-white/70">
                {showCreatorView ? "Your content creation command center" : "Discover amazing creator content"}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          {showCreatorView && creatorProfile?.description && (
            <p className="text-white/80 text-lg max-w-2xl">
              {creatorProfile.description}
            </p>
          )}

          {showCreatorView && creatorProfile?.social_links && creatorProfile.social_links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {creatorProfile.social_links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 text-white text-sm transition-all duration-200 hover:scale-105">
                  {link.platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid - Only for Creators */}
      {showCreatorView && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Content Stamped
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stampedContentCount}</p>
              <p className="text-sm text-white/60">Total pieces protected</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">0</p>
              <p className="text-sm text-white/60">Total interactions</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Followers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{user?.follower_count || 0}</p>
              <p className="text-sm text-white/60">Community members</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">$0</p>
              <p className="text-sm text-white/60">Lifetime earnings</p>
            </CardContent>
          </Card>
        </motion.div>
        </div>
      )}

      {/* Content Section */}
      {!showCreatorView && (
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Featured Creator Content</CardTitle>
              <CardDescription className="text-white/70">
                Discover and enjoy content from EqoFlow creators
              </CardDescription>
            </CardHeader>
            <CardContent>
              {publishedCreatorContent.length === 0 ? (
                <p className="text-white/60 text-center py-8">
                  No creator content published yet...
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publishedCreatorContent.map((item) => (
                    <div key={item.id} className="bg-black/40 rounded-lg border border-white/10 overflow-hidden group hover:border-purple-500/50 transition-all">
                      {item.media_urls && item.media_urls.length > 0 && (
                        <div className="aspect-video bg-black/60 relative overflow-hidden">
                          {item.media_urls[0].match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                              src={item.media_urls[0]}
                              alt={item.author_full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : item.media_urls[0].match(/\.(mp4|webm|mov)$/i) ? (
                            <video
                              src={item.media_urls[0]}
                              className="w-full h-full object-cover"
                              controls
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Shield className="w-12 h-12 text-white/30" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                            <Shield className="w-4 h-4 text-green-400" />
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-white font-semibold mb-1">{item.author_full_name || "Untitled"}</h3>
                        <p className="text-white/60 text-sm mb-2 line-clamp-2">{item.content || "No description"}</p>
                        {item.author_avatar_url && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                            <img src={item.author_avatar_url} alt="Creator" className="w-6 h-6 rounded-full" />
                            <span className="text-white/80 text-xs">By {item.created_by.split('@')[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Grid - Only for Creators */}
      {showCreatorView && (
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}>
          <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20 h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-6 h-6" style={{ color: userColorScheme.primary }} />
                Blockchain Protection
              </CardTitle>
              <CardDescription className="text-white/70">
                Stamp your content with immutable proof of creation and ownership
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowStampModal(true)}
                className="w-full"
                style={{ background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})` }}>
                Stamp New Content
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}>
          <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20 h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6" style={{ color: userColorScheme.secondary }} />
                Analytics Dashboard
              </CardTitle>
              <CardDescription className="text-white/70">
                Track your content performance and audience insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowAnalyticsModal(true)}
                variant="outline"
                className="w-full border-white/20 text-black hover:bg-white/10">
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </motion.div>
        </div>
      )}

      {/* Stamped Content Gallery - Only for Creators */}
      {showCreatorView && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8">
          <StampedContentGallery 
            user={user} 
            userColorScheme={userColorScheme}
            onContentUpdate={loadPublishedContent}
          />
        </motion.div>
      )}

      {/* Coming Soon Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8 rounded-2xl p-8 text-center"
        style={{
          background: `linear-gradient(135deg, ${userColorScheme.primary}20, ${userColorScheme.secondary}20)`,
          border: `2px dashed ${userColorScheme.primary}40`
        }}>
        <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: userColorScheme.primary }} />
        <h3 className="text-2xl font-bold text-white mb-2">More Features Coming Soon</h3>
        <p className="text-white/70 max-w-2xl mx-auto">
          We're building advanced tools for content monetization, cross-platform distribution, 
          and AI-powered content optimization. Stay tuned!
        </p>
      </motion.div>

      {/* Modals */}
      <ContentStampModal 
        isOpen={showStampModal} 
        onClose={handleStampComplete} 
        userColorScheme={userColorScheme}
        user={user}
      />
      <CreatorAnalyticsModal 
        isOpen={showAnalyticsModal} 
        onClose={() => setShowAnalyticsModal(false)} 
        user={user}
        userColorScheme={userColorScheme}
      />
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