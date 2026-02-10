import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, ArrowLeft, User as UserIcon, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PostCard from "../components/feed/PostCard";
import TrendingWidgets from "../components/feed/TrendingWidgets";
import ParallaxBackground from "../components/feed/ParallaxBackground";
import CreatePostModal from "../components/feed/CreatePostModal";
import { Button } from "@/components/ui/button";
import NotificationBell from "../components/layout/NotificationBell";
import MessageButton from "../components/layout/MessageButton";
import HeaderIconDrawer from "../components/layout/HeaderIconDrawer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Color schemes
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

const getColorScheme = (schemeName) => {
  return colorSchemes[schemeName] || colorSchemes.purple;
};

export default function OrbitalFeed() {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [centerPosition, setCenterPosition] = useState({ x: 0, y: 0 });
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [savedPositions, setSavedPositions] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [globalSettingsId, setGlobalSettingsId] = useState(null);
  const [layoutLoaded, setLayoutLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load user and global orbital positions - MUST happen first
  useEffect(() => {
    const loadUserAndSettings = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Load ALL orbital feed settings to find the active one
        const allSettings = await base44.entities.OrbitalFeedSettings.list('-created_date', 100);
        
        // Find the one with actual positions data
        let foundSettings = null;
        for (const setting of allSettings) {
          if (setting.positions && Object.keys(setting.positions).length > 0) {
            foundSettings = setting;
            break;
          }
        }
        
        if (foundSettings) {
          setSavedPositions(foundSettings.positions || {});
          setGlobalSettingsId(foundSettings.id);
        }
        
        setLayoutLoaded(true);
      } catch (error) {
        console.warn("Could not load settings:", error);
        setLayoutLoaded(true);
      }
    };
    loadUserAndSettings();
  }, []);

  // Load trending topics with top posts (same logic as main feed)
  useEffect(() => {
    const loadTrendingTopics = async () => {
      try {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Load posts - same as TrendingWidgets component (last 30 posts)
        const fetchedPosts = await base44.entities.Post.list('-created_date', 30);

        // Calculate trending topics - count posts per tag
        const tagCounts = {};
        fetchedPosts.forEach((post) => {
          if (post.tags && Array.isArray(post.tags)) {
            post.tags.forEach((tag) => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        });

        // Sort by post count and take top 5
        const sortedTags = Object.entries(tagCounts).
        sort((a, b) => b[1] - a[1]).
        slice(0, 5);

        // For each trending tag, get all posts with that tag and find the top one
        const sortedTopics = await Promise.all(
          sortedTags.map(async ([tag, count]) => {
            // Get posts with this tag
            const tagPosts = fetchedPosts.filter((post) =>
            post.tags && post.tags.includes(tag)
            );

            // Get top post by engagement
            const topPost = tagPosts.sort((a, b) => {
              const aEngagement = (a.likes_count || 0) + (a.comments_count || 0) + (a.reposts_count || 0);
              const bEngagement = (b.likes_count || 0) + (b.comments_count || 0) + (b.reposts_count || 0);
              return bEngagement - aEngagement;
            })[0];

            return {
              tag,
              count: count,
              topPost: topPost
            };
          })
        );

        // Add main feed as 6th item
        const topFeedPost = [...fetchedPosts].sort((a, b) => {
          const aEngagement = (a.likes_count || 0) + (a.comments_count || 0) + (a.reposts_count || 0);
          const bEngagement = (b.likes_count || 0) + (b.comments_count || 0) + (b.reposts_count || 0);
          return bEngagement - aEngagement;
        })[0];

        setTrendingTopics([
        ...sortedTopics,
        { tag: 'main_feed', count: fetchedPosts.length, topPost: topFeedPost, isMainFeed: true }]
        );
      } catch (error) {
        console.warn("Could not load trending topics:", error);
        setTrendingTopics([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadTrendingTopics();
  }, []);

  useEffect(() => {
    const updateCenter = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCenterPosition({
          x: rect.width / 2,
          y: rect.height / 2
        });
      }
    };

    updateCenter();
    window.addEventListener('resize', updateCenter);
    return () => window.removeEventListener('resize', updateCenter);
  }, []);

  // Default fixed positions around center (6 positions + broadcast button)
  const defaultPositions = [
  { x: 0, y: -320 }, // Top
  { x: -380, y: -100 }, // Top Left
  { x: 380, y: -100 }, // Top Right
  { x: -380, y: 180 }, // Bottom Left
  { x: 380, y: 180 }, // Bottom Right
  { x: 0, y: 300 }, // Bottom (Main Feed)
  { x: 0, y: -200 } // Broadcast Button
  ];

  const calculateOrbitPosition = (topic, index) => {
    // Check savedPositions first - if it exists, ALWAYS use it
    const saved = savedPositions[topic.tag];
    if (saved) {
      return saved;
    }

    // Use default only if no saved position exists
    const defaultPos = defaultPositions[index % defaultPositions.length];
    return {
      x: defaultPos.x,
      y: defaultPos.y,
      angle: Math.atan2(defaultPos.y, defaultPos.x),
      radius: Math.sqrt(defaultPos.x ** 2 + defaultPos.y ** 2)
    };
  };

  const handlePositionChange = useCallback(async (topicTag, newPosition) => {
    const positionData = {
      x: Math.round(newPosition.x * 100) / 100,
      y: Math.round(newPosition.y * 100) / 100
    };

    const updatedPositions = {
      ...savedPositions,
      [topicTag]: positionData
    };

    setSavedPositions(updatedPositions);

    // Save to database immediately
    if (globalSettingsId) {
      await base44.entities.OrbitalFeedSettings.update(globalSettingsId, {
        positions: updatedPositions
      });
    } else {
      const newSettings = await base44.entities.OrbitalFeedSettings.create({
        is_active: true,
        positions: updatedPositions
      });
      setGlobalSettingsId(newSettings.id);
    }
  }, [savedPositions, globalSettingsId]);

  const handleTopicClick = (topicData) => {
    setSelectedTopic(topicData);
  };

  const handleUserUpdate = async () => {
    try {
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
    } catch (error) {
      console.warn("Could not update user:", error);
    }
  };

  const isPngImage = (url) => {
    if (!url) return false;
    return url.toLowerCase().includes('.png') || url.toLowerCase().includes('image/png');
  };

  const getAvatarBackgroundStyle = (avatarUrl) => {
    if (isPngImage(avatarUrl)) {
      return { background: 'linear-gradient(to right, #000000, #1a1a1a)' };
    }
    return { background: 'linear-gradient(to right, #8b5cf6, #ec4899)' };
  };

  const userColorScheme = getColorScheme(user?.color_scheme);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Parallax Background */}
      <ParallaxBackground />

      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/10 px-4 md:px-12 py-4 md:py-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <Link to={createPageUrl("Feed")}>
              <Button
                variant="outline"
                size="sm"
                style={{
                  borderColor: `${userColorScheme.primary}33`,
                  color: userColorScheme.primary
                }}
                className="hover:bg-white/5 transition-colors shrink-0"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = `${userColorScheme.primary}80`}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = `${userColorScheme.primary}33`}>
                <ArrowLeft className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Traditional Feed</span>
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(to right, white, ${userColorScheme.primary}, ${userColorScheme.secondary})`
                }}>

                Your Universe
              </h1>
              <p className="text-white/50 text-xs md:text-sm">
                5 trending topics + your feed
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            {user?.role === 'admin' &&
            <Button
              onClick={() => setEditMode(!editMode)}
              variant="outline"
              style={{
                borderColor: editMode ? userColorScheme.primary : `${userColorScheme.primary}33`,
                backgroundColor: editMode ? `${userColorScheme.primary}20` : 'transparent',
                color: userColorScheme.primary
              }}
              className="hover:bg-white/5 transition-colors mr-4">

                {editMode ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                {editMode ? 'Lock Layout' : 'Edit Layout'}
              </Button>
            }
            
            <HeaderIconDrawer user={user} onUpdate={handleUserUpdate} />

            <Tooltip>
              <TooltipTrigger asChild>
                <Link to={createPageUrl("Profile")}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative header-icon-btn rounded-full w-9 h-9"
                    aria-label="View Profile">

                    <div
                      className="w-full h-full rounded-full flex items-center justify-center"
                      style={getAvatarBackgroundStyle(user?.avatar_url)}>
                      {user?.avatar_url ?
                      <img
                        src={user.avatar_url}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover" /> :
                      <UserIcon className="w-5 h-5 text-white" />
                      }
                    </div>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="bg-black/80 border-white/10 text-white">
                <p>View Profile</p>
              </TooltipContent>
            </Tooltip>

            <MessageButton />

            <NotificationBell user={user} isMobile={false} />
          </div>
        </div>
      </motion.div>

      {/* Main Content - Orbital Feed + Widgets */}
      {isMobile ? (
        // Mobile Layout - Vertical Stack
        <div className="px-4 py-6 space-y-6">
          {/* Broadcast Button - Mobile */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-6 text-lg font-semibold rounded-2xl transition-all duration-300 shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`,
                boxShadow: `0 0 30px ${userColorScheme.primary}60`
              }}>
              <Send className="w-5 h-5 mr-3" />
              Broadcast an Echo
            </Button>
          </motion.div>

          {/* Trending Topics - Mobile */}
          {(!layoutLoaded || isLoading) ? (
            <div className="text-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 rounded-full mx-auto mb-4"
                style={{
                  borderColor: `${userColorScheme.primary}30`,
                  borderTopColor: userColorScheme.primary
                }} />
              <p className="text-white/50">Gathering signals...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trendingTopics.map((topic, index) => (
                <motion.div
                  key={topic.tag}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleTopicClick(topic)}
                  className="cursor-pointer">
                  <MobileTopicCard topic={topic} userColorScheme={userColorScheme} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Desktop Layout - Orbital
        <div className="flex gap-8 py-8 pr-8">
          {/* Orbital Feed Container - Left Side */}
          <div className="flex-shrink-0" style={{ width: '850px', paddingLeft: '40px' }}>
            <div className="relative flex items-center justify-center" style={{ minHeight: '100vh' }}>
              <div
                ref={containerRef}
                className="relative"
                style={{
                  width: '850px',
                  height: '850px'
                }}>

                {/* Center Hub - You */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
                  style={{
                    width: '140px',
                    height: '140px',
                    pointerEvents: 'none'
                  }}>

                  <div className="relative w-full h-full">
                    <div
                      className="absolute inset-0 rounded-full animate-spin-slow"
                      style={{
                        background: `linear-gradient(to bottom right, ${userColorScheme.primary}, ${userColorScheme.secondary}, ${userColorScheme.accent})`
                      }}>
                    </div>
                    <div className="absolute inset-2 rounded-full bg-black flex items-center justify-center backdrop-blur-xl">
                      <div className="text-center">
                        <div
                          className="w-14 h-14 mx-auto rounded-full mb-2"
                          style={{
                            background: `linear-gradient(to bottom right, ${userColorScheme.primary}, ${userColorScheme.secondary})`
                          }}>
                        </div>
                        <p className="text-sm font-medium text-white/70">You</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {layoutLoaded && (
                  <>
                    {/* Broadcast Echo Button Orb */}
                    <BroadcastButtonOrb
                      position={savedPositions['broadcast_button'] || defaultPositions[6]}
                      onClick={() => setShowCreateModal(true)}
                      userColorScheme={userColorScheme}
                      editMode={editMode}
                      onPositionChange={handlePositionChange}
                    />

                    {/* Trending Topics as Orbs */}
                    <AnimatePresence>
                      {!isLoading && trendingTopics.map((topic, index) => {
                        const position = calculateOrbitPosition(topic, index);

                        return (
                          <TrendingTopicOrb
                            key={topic.tag}
                            topic={topic}
                            position={position}
                            index={index}
                            onClick={() => handleTopicClick(topic)}
                            userColorScheme={userColorScheme}
                            editMode={editMode}
                            onPositionChange={handlePositionChange} />);
                      })}
                    </AnimatePresence>
                  </>
                )}

                {(!layoutLoaded || isLoading) &&
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 rounded-full mx-auto mb-4"
                      style={{
                        borderColor: `${userColorScheme.primary}30`,
                        borderTopColor: userColorScheme.primary
                      }} />
                    <p className="text-white/50">Gathering signals...</p>
                  </div>
                }
              </div>
            </div>
          </div>

          {/* Trending Widgets - Far Right Side */}
          <div className="flex-1 flex justify-end">
            <div className="w-80">
              <TrendingWidgets />
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePostModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={async (postData) => {
              await base44.entities.Post.create(postData);
              setShowCreateModal(false);
              window.location.reload();
            }}
            user={user}
          />
        )}
      </AnimatePresence>

      {/* Topic Posts Modal */}
      <AnimatePresence>
        {selectedTopic &&
        <TopicPostsModal
          topic={selectedTopic}
          onClose={() => setSelectedTopic(null)}
          userColorScheme={userColorScheme} />

        }
      </AnimatePresence>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>);

}

// Broadcast Button Orb Component
function BroadcastButtonOrb({ position, onClick, userColorScheme, editMode, onPositionChange }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        delay: 0.1,
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.3
      }}
      whileHover={{ scale: editMode ? 1 : 1.05 }}
      drag={editMode}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(event, info) => {
        if (editMode && onPositionChange) {
          onPositionChange('broadcast_button', {
            x: position.x + info.offset.x,
            y: position.y + info.offset.y
          });
        }
      }}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: editMode ? 'move' : 'pointer',
        zIndex: 10,
        userSelect: 'none'
      }}
      onClick={editMode ? undefined : onClick}>

      <Button
        className="group relative px-8 py-6 text-lg font-semibold rounded-2xl transition-all duration-300 shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`,
          boxShadow: `0 0 40px ${userColorScheme.primary}60`,
          pointerEvents: editMode ? 'none' : 'auto'
        }}
        onMouseEnter={(e) => {
          if (!editMode) e.currentTarget.style.boxShadow = `0 0 60px ${userColorScheme.primary}90`;
        }}
        onMouseLeave={(e) => {
          if (!editMode) e.currentTarget.style.boxShadow = `0 0 40px ${userColorScheme.primary}60`;
        }}>
        <Send className="w-6 h-6 mr-3 group-hover:translate-x-1 transition-transform" />
        Broadcast an Echo
      </Button>
    </motion.div>
  );
}

// Mobile Topic Card Component
function MobileTopicCard({ topic, userColorScheme }) {
  const topPost = topic.topPost;

  return (
    <div
      className="relative w-full p-4 rounded-2xl"
      style={{
        background: topic.isMainFeed ?
          `linear-gradient(to bottom right, ${userColorScheme.secondary}20, ${userColorScheme.primary}20, ${userColorScheme.accent}20)` :
          `linear-gradient(to bottom right, ${userColorScheme.primary}20, ${userColorScheme.secondary}20, ${userColorScheme.accent}20)`,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderImage: topic.isMainFeed ?
          `linear-gradient(to bottom right, ${userColorScheme.secondary}, ${userColorScheme.primary}, ${userColorScheme.accent}) 1` :
          `linear-gradient(to bottom right, ${userColorScheme.primary}, ${userColorScheme.secondary}, ${userColorScheme.accent}) 1`
      }}>
      
      {topic.isMainFeed ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(to bottom right, ${userColorScheme.secondary}, ${userColorScheme.primary})`
              }}>
              <span className="text-white text-lg">🌊</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Your Feed</p>
              <p className="text-gray-400 text-xs">All Echoes</p>
            </div>
          </div>
          <p className="text-white text-sm line-clamp-3 mb-3">{topPost.content}</p>
          <div className="flex items-center justify-center text-xs text-gray-400">
            <span className="font-bold text-base" style={{ color: userColorScheme.primary }}>{topic.count}</span>
            <span className="ml-1">echoes in your feed</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <img
              src={topPost.author_avatar_url || 'https://via.placeholder.com/40'}
              alt={topPost.author_full_name}
              className="w-8 h-8 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{topPost.author_full_name || 'Anonymous'}</p>
              <p className="text-gray-400 text-xs">Questioning Frequency</p>
            </div>
          </div>
          <p className="text-white text-sm line-clamp-3 mb-3">{topPost.content}</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {topPost.tags?.slice(0, 3).map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-gray-800/50 text-gray-300 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <span>👁️</span>
              <span>{topPost.impressions_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>{topPost.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🔄</span>
              <span>{topPost.reposts_count || 0}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Trending Topic Orb Component
function TrendingTopicOrb({ topic, position, index, onClick, userColorScheme, editMode, onPositionChange }) {
  const topPost = topic.topPost;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.3
      }}
      whileHover={{ scale: 1.05 }}
      drag={editMode}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(event, info) => {
        if (editMode && onPositionChange) {
          onPositionChange(topic.tag, {
            x: position.x + info.offset.x,
            y: position.y + info.offset.y
          });
        }
      }}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: editMode ? 'move' : 'pointer',
        zIndex: 10,
        userSelect: 'none'
      }}
      onClick={editMode ? undefined : onClick}>

      <div className="relative w-64 h-64">
        {/* Glowing border */}
        <div
          className="absolute inset-0 rounded-3xl p-[2px]"
          style={{
            background: topic.isMainFeed ?
            `linear-gradient(to bottom right, ${userColorScheme.secondary}, ${userColorScheme.primary}, ${userColorScheme.accent})` :
            `linear-gradient(to bottom right, ${userColorScheme.primary}, ${userColorScheme.secondary}, ${userColorScheme.accent})`
          }}>

          <div className="w-full h-full rounded-3xl bg-[#0d1b2a] p-4 flex flex-col">
            {topic.isMainFeed ?
            <>
                {/* Main Feed Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(to bottom right, ${userColorScheme.secondary}, ${userColorScheme.primary})`
                  }}>

                    <span className="text-white text-lg">🌊</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      Your Feed
                    </p>
                    <p className="text-gray-400 text-xs">All Echoes</p>
                  </div>
                </div>

                {/* Top post preview */}
                <div className="flex-1 overflow-hidden mb-3">
                  <p className="text-white text-sm line-clamp-4">
                    {topPost.content}
                  </p>
                </div>

                {/* Feed count */}
                <div className="flex items-center justify-center text-xs text-gray-400">
                  <span className="font-bold text-lg" style={{ color: userColorScheme.primary }}>{topic.count}</span>
                  <span className="ml-1">echoes in your feed</span>
                </div>
              </> :

            <>
                {/* Author info */}
                <div className="flex items-center gap-2 mb-3">
                  <img
                  src={topPost.author_avatar_url || 'https://via.placeholder.com/40'}
                  alt={topPost.author_full_name}
                  className="w-8 h-8 rounded-full object-cover" />

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {topPost.author_full_name || 'Anonymous'}
                    </p>
                    <p className="text-gray-400 text-xs">Questioning Frequency</p>
                  </div>
                </div>

                {/* Post content */}
                <div className="flex-1 overflow-hidden mb-3">
                  <p className="text-white text-sm line-clamp-4">
                    {topPost.content}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {topPost.tags?.slice(0, 3).map((tag, i) =>
                <span
                  key={i}
                  className="px-2 py-1 bg-gray-800/50 text-gray-300 text-xs rounded-full">

                      {tag}
                    </span>
                )}
                </div>

                {/* Engagement stats */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <span>👁️</span>
                    <span>{topPost.impressions_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⚡</span>
                    <span>{topPost.likes_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🔄</span>
                    <span>{topPost.reposts_count || 0}</span>
                  </div>
                </div>
              </>
            }
          </div>
        </div>
      </div>
    </motion.div>);

}

// Topic Posts Modal Component
function TopicPostsModal({ topic, onClose, userColorScheme }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadTopicPosts = async () => {
      try {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const currentUser = await base44.auth.me().catch(() => null);
        setUser(currentUser);

        let fetchedPosts;

        if (topic.isMainFeed) {
          // Load all posts for main feed in chronological order (most recent first)
          fetchedPosts = await base44.entities.Post.filter(
            { moderation_status: 'approved' },
            '-created_date',
            50
          );
        } else {
          // Load posts for specific tag
          const allPosts = await base44.entities.Post.filter(
            { moderation_status: 'approved', tags: { $in: [topic.tag] } },
            '-created_date',
            50
          );

          // Sort posts by engagement (trending order)
          fetchedPosts = allPosts.sort((a, b) => {
            const aEngagement = (a.likes_count || 0) + (a.comments_count || 0) + (a.reposts_count || 0);
            const bEngagement = (b.likes_count || 0) + (b.comments_count || 0) + (b.reposts_count || 0);
            return bEngagement - aEngagement;
          });
        }

        setPosts(fetchedPosts);
      } catch (error) {
        console.warn("Could not load posts:", error);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadTopicPosts();
  }, [topic]);

  const handleLike = async (post) => {

    // Implement like functionality
  };
  const handleRepost = async (post) => {

    // Implement repost functionality
  };
  const handleCommentAdded = async (post, comment) => {

    // Implement comment functionality
  };
  const handleEdit = (post) => {

    // Not needed in modal view
  };
  const handleDelete = async (postId) => {
    // Remove from local state
    setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
  };

  const handleReactionChange = (updatedPost) => {
    setPosts((prevPosts) => prevPosts.map((p) => p.id === updatedPost.id ? updatedPost : p));
  };

  const handleFlag = async (post, reason) => {

    // Implement flag functionality
  };
  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-[#1a0b2e] to-[#0a0118] rounded-3xl border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div
          className="sticky top-0 z-10 backdrop-blur-xl border-b border-white/10 p-6"
          style={{
            background: `linear-gradient(to right, ${userColorScheme.accent}E6, ${userColorScheme.primary}E6)`
          }}>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {topic.isMainFeed ? 'Your Feed' : `#${topic.tag}`}
              </h2>
              <p className="text-white/60 text-sm">{posts.length} echoes</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">

              <span className="text-white text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-[#000000] p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {isLoading &&
          <div className="text-center py-12">
              <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 rounded-full mx-auto"
              style={{
                borderColor: `${userColorScheme.primary}30`,
                borderTopColor: userColorScheme.primary
              }} />

              <p className="text-white/50 mt-4">Loading echoes...</p>
            </div>
          }

          {!isLoading && posts.length === 0 &&
          <div className="text-center py-12">
              <p className="text-white/50">No echoes found for this topic</p>
            </div>
          }

          {!isLoading && posts.map((post, index) =>
          <PostCard
            key={post.id}
            post={post}
            currentUser={user}
            onUserUpdate={handleUserUpdate}
            author={post.author}
            onLike={handleLike}
            onRepost={handleRepost}
            onCommentAdded={handleCommentAdded}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReactionChange={handleReactionChange}
            onFlag={handleFlag}
            index={index} />

          )}
        </div>
      </motion.div>
    </motion.div>);

}