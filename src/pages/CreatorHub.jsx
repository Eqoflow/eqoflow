import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUser } from "@/components/contexts/UserContext";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Video, TrendingUp, Users, DollarSign, BarChart3, Shield, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CreatorOnboarding from "@/components/creator/CreatorOnboarding";
import ContentStampModal from "@/components/creator/ContentStampModal";
import CreatorAnalyticsModal from "@/components/creator/CreatorAnalyticsModal";
import StampedContentGallery from "@/components/creator/StampedContentGallery";
import InlineStampingSection from "@/components/creator/InlineStampingSection";
import CreatorStatsCard from "@/components/creator/CreatorStatsCard";
import RecentActivityPanel from "@/components/creator/RecentActivityPanel";

export default function CreatorHub() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showStampModal, setShowStampModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [viewMode, setViewMode] = useState(searchParams.get('view') || 'creator'); // 'creator' or 'user'
  const [stampedContentCount, setStampedContentCount] = useState(0);
  const [publishedCreatorContent, setPublishedCreatorContent] = useState([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const userColorScheme = {
    primary: user?.color_scheme ? getColorScheme(user.color_scheme).primary : '#8b5cf6',
    secondary: user?.color_scheme ? getColorScheme(user.color_scheme).secondary : '#ec4899',
    accent: user?.color_scheme ? getColorScheme(user.color_scheme).accent : '#2d1b69'
  };

  useEffect(() => {
    loadCreatorProfile();
    loadStampedContent();
    loadPublishedContent();
    setIsWalletConnected(!!user?.solana_wallet_address);
  }, [user, user?.solana_wallet_address]);

  // Real-time subscription for creator profile updates
  useEffect(() => {
    if (!creatorProfile?.id) return;

    const unsubscribe = base44.entities.CreatorProfile.subscribe((event) => {
      if (event.id === creatorProfile.id && event.type === 'update') {
        setCreatorProfile(event.data);
      }
    });

    return unsubscribe;
  }, [creatorProfile?.id]);

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
      console.log("Loading published content...");
      const content = await base44.entities.Post.filter({ 
        is_creator_hub_published: true,
        blockchain_tx_id: { $ne: null }
      }, '-created_date', 50);
      console.log("Loaded published content count:", content.length);
      console.log("Published content items:", content);
      
      // Fetch creator profiles for all published content
      const contentWithCreators = await Promise.all(
        content.map(async (item) => {
          try {
            const creatorProfiles = await base44.entities.CreatorProfile.filter({ 
              created_by: item.created_by 
            });
            const creatorName = creatorProfiles.length > 0 ? creatorProfiles[0].channel_name : item.created_by.split('@')[0];
            const creatorLogo = creatorProfiles.length > 0 ? creatorProfiles[0].logo_url : null;
            return { ...item, creator_name: creatorName, creator_logo: creatorLogo };
          } catch (error) {
            console.error("Error fetching creator profile:", error);
            return { ...item, creator_name: item.created_by.split('@')[0], creator_logo: null };
          }
        })
      );
      
      setPublishedCreatorContent(contentWithCreators);
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

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !creatorProfile) return;

    setIsUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.CreatorProfile.update(creatorProfile.id, {
        logo_url: file_url
      });
      await loadCreatorProfile();
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Failed to upload logo. Please try again.");
    } finally {
      setIsUploadingLogo(false);
    }
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
              size="sm"
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
              onClick={async () => {
                setViewMode('user');
                await loadPublishedContent();
              }}
              size="sm"
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

      {/* Creator View Layout */}
      {showCreatorView && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Inline Stamping Section */}
            <InlineStampingSection
              user={user}
              userColorScheme={userColorScheme}
              onComplete={handleStampComplete}
            />

            {/* Stamped Content Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stampedContentCount > 0 ? (
                  // This will be populated by StampedContentGallery component below
                  <div className="col-span-full">
                    <StampedContentGallery 
                      user={user} 
                      userColorScheme={userColorScheme}
                      onContentUpdate={loadPublishedContent}
                    />
                  </div>
                ) : (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
                        <div className="aspect-video bg-black/40 flex items-center justify-center relative">
                          <Shield className="w-12 h-12 text-white/20" />
                          <div className="absolute top-2 right-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white/60">
                            On-chain
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-white font-semibold mb-2">Stamped Hub</h3>
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <Lock className="w-4 h-4" />
                            <span>On-chain</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-4">
            <CreatorStatsCard
              icon={Shield}
              title={`Stamped (${isWalletConnected ? 'wallet connected' : 'wallet disconnected'})`}
              subtitle={creatorProfile?.channel_name || "Connected channel"}
              userColorScheme={userColorScheme}
              delay={0}
              isWalletConnected={isWalletConnected}
            />
            <div onClick={() => navigate(createPageUrl("CreatorAnalytics"))} className="cursor-pointer">
              <CreatorStatsCard
                icon={TrendingUp}
                title="Engagement"
                subtitle="Total interactions"
                userColorScheme={userColorScheme}
                delay={0.1}
              />
            </div>
            <div onClick={() => navigate(createPageUrl("CreatorAnalytics"))} className="cursor-pointer">
              <CreatorStatsCard
                icon={Users}
                title="Subscribers"
                subtitle={`${creatorProfile?.subscriber_count || 0} members`}
                userColorScheme={userColorScheme}
                delay={0.2}
              />
            </div>
            <div onClick={() => navigate(createPageUrl("CreatorAnalytics"))} className="cursor-pointer">
              <CreatorStatsCard
                icon={DollarSign}
                title="Revenue"
                subtitle="Lifetime earnings"
                userColorScheme={userColorScheme}
                delay={0.3}
              />
            </div>
            <RecentActivityPanel />
          </div>
        </div>
      )}

      {/* User View - Published Content */}
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
                    <div 
                      key={item.id} 
                      onClick={() => navigate(createPageUrl("PublicCreatorProfile") + `?creator=${item.created_by}`)}
                      className="bg-black/40 rounded-lg border border-white/10 overflow-hidden group hover:border-purple-500/50 transition-all cursor-pointer">
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
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                          {item.creator_logo ? (
                            <img src={item.creator_logo} alt="Creator Logo" className="w-6 h-6 object-contain" />
                          ) : (
                            <Sparkles className="w-6 h-6 text-yellow-400" />
                          )}
                          <span className="text-white/80 text-xs">By {item.creator_name || item.created_by.split('@')[0]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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