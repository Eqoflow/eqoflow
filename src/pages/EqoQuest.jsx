import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  TrendingUp,
  Target,
  Zap,
  Medal,
  Crown,
  Award,
  Sparkles,
  Loader2,
  LayoutGrid,
  List,
  Star,
  Flame,
  Gem,
  Globe } from
"lucide-react";
import QuestCard from "../components/eqoquest/QuestCard";
import QuestTable from "../components/eqoquest/QuestTable";
import UserStrip from "../components/eqoquest/UserStrip";
import FullLeaderboardModal from "../components/eqoquest/FullLeaderboardModal";
import AvatarSelectionModal from "../components/eqoquest/AvatarSelectionModal";



export default function EqoQuest() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('quest-view-mode') || 'grid';
  });
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const queryClient = useQueryClient();

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

  const getPrimaryColor = () => {
    const schemeName = user?.color_scheme || userProfile?.color_theme || 'blue';
    return colorSchemes[schemeName]?.primary || colorSchemes['blue'].primary;
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const profiles = await base44.entities.Profile.filter({ user_id: currentUser.id });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  // Fetch current season
  const { data: seasons = [] } = useQuery({
    queryKey: ['seasons'],
    queryFn: async () => {
      const allSeasons = await base44.entities.Season.list('-created_date');
      const now = new Date().toISOString().split('T')[0];
      const active = allSeasons.find((s) => s.status === 'active' || s.start_date <= now && s.end_date >= now);
      if (active) setCurrentSeason(active);
      return allSeasons;
    }
  });

  // Check and Update Quest Progress (throttled via staleTime)
  useQuery({
    queryKey: ['checkProgress', user?.id, currentSeason?.season_id],
    queryFn: async () => {
      if (!user || !currentSeason) return null;
      try {
        await base44.functions.invoke('checkQuestProgress');
        queryClient.invalidateQueries(['completions']);
        return true;
      } catch (error) {
        console.error("Failed to check quest progress:", error);
        return false;
      }
    },
    enabled: !!user && !!currentSeason,
    staleTime: 60000, // Only run once every minute max
    refetchOnWindowFocus: false,
    refetchOnMount: false // Only refetch if stale
  });

  // Fetch user's seasonal score
  const { data: userScore } = useQuery({
    queryKey: ['userScore', currentSeason?.season_id, user?.id],
    queryFn: async () => {
      if (!currentSeason || !user) return null;

      const scores = await base44.entities.SeasonalScore.filter({
        season_id: currentSeason.season_id,
        user_id: user.id
      }, '-updated_date');

      if (scores.length === 0) {
        return { sp_total: 0, rank: 999 };
      }

      // Get the most recent record (in case of duplicates)
      const latestScore = scores[0];

      // Calculate rank
      const allScores = await base44.entities.SeasonalScore.filter({ season_id: currentSeason.season_id }, '-sp_total');
      const rank = allScores.findIndex((s) => s.user_id === user.id) + 1;

      return { ...latestScore, rank };
    },
    enabled: !!currentSeason && !!user,
    refetchInterval: 60000, // Reduced from 5s to 60s
    staleTime: 30000
  });

  // Fetch user's lifetime progression and real-time stats
  const { data: progression } = useQuery({
    queryKey: ['progression', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;

      // Fetch real-time stats from backend function to ensure accuracy
      try {
        const response = await base44.functions.invoke('getUserEngagementStats');
        const stats = response.data;

        // Fallback to LifetimeProgression if function fails or returns empty? 
        // No, function is source of truth for "all time" now.

        // We still need "level" calculation, which the function didn't do explicitly, 
        // but we can pass EP to the UI which calculates level from EP.
        // We construct a progression object compatible with existing UI.
        return {
          ep_total: stats.totalEP || 0,
          level: 0, // Will be calculated by UI based on ep_total
          posts: stats.posts,
          shares: stats.shares,
          comments: stats.comments,
          replies: stats.replies
        };
      } catch (error) {
        console.error("Failed to fetch user engagement stats:", error);
        // Fallback to old method if function fails
        const progs = await base44.entities.LifetimeProgression.filter({ user_id: user.id });
        if (progs.length === 0) return { ep_total: 0, level: 0 };
        return progs[0];
      }
    },
    enabled: !!user?.email,
    staleTime: 300000, // 5 minutes cache
    cacheTime: 600000 // 10 minutes
  });

  // Fetch user's top post by likes
  const { data: topPost } = useQuery({
    queryKey: ['topPost', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      // Use created_by (email) as it is the consistent identifier for ownership
      const posts = await base44.entities.Post.filter({ created_by: user.email }, '-likes_count', 1);
      return posts[0] || null;
    },
    enabled: !!user?.email
  });

  // Fetch all user's posts for metrics calculation
  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Use created_by (email) to ensure we get all posts created by the user
      return await base44.entities.Post.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  // Fetch all user's comments for metrics calculation
  const { data: userComments = [] } = useQuery({
    queryKey: ['userComments', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Comments usually linked via created_by (email) or sometimes author_email/user_id
      // Based on Comment schema in snapshot, it has created_by (built-in). 
      // It does not explicitly have user_id in properties list but typically created_by is reliable for "my comments".
      return await base44.entities.Comment.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  // Fetch quest completions (needed for metrics)
  const { data: completions = [] } = useQuery({
    queryKey: ['completions', currentSeason?.season_id, user?.id],
    queryFn: async () => {
      if (!currentSeason || !user) return [];
      return await base44.entities.QuestCompletion.filter({
        season_id: currentSeason.season_id,
        user_id: user.id
      });
    },
    enabled: !!currentSeason && !!user
  });

  // Calculate metrics
  const metrics = React.useMemo(() => {
    if (!user) {
      return { pace: 0, activity: 0, convoPercent: 0, posts: 0, replies: 0, quests: 0, comments: 0, shares: 0, reputation: 0 };
    }

    // Pace: SP earned per day since season started
    let pace = 0;
    if (currentSeason && userScore) {
      const seasonStart = new Date(currentSeason.start_date);
      const now = new Date();
      const daysInSeason = Math.max(1, Math.ceil((now - seasonStart) / (1000 * 60 * 60 * 24)));
      pace = (userScore.sp_total / daysInSeason).toFixed(2);
    }

    // Activity: Ratio of days with posts to days since account creation
    const now = new Date();
    const accountCreated = new Date(user.created_date);
    const daysSinceCreated = Math.max(1, Math.ceil((now - accountCreated) / (1000 * 60 * 60 * 24)));
    const uniquePostDays = new Set(
      userPosts.map((post) => new Date(post.created_date).toISOString().split('T')[0])
    ).size;
    const activity = userPosts.length > 0 ? (uniquePostDays / daysSinceCreated).toFixed(2) : 0;

    // Convo %: Percentage of posts with replies (Engagement received)
    const postsWithReplies = userPosts.filter((post) => post.reply_count > 0).length;
    const convoPercent = userPosts.length > 0 ?
    (postsWithReplies / userPosts.length * 100).toFixed(2) :
    0;

    // Use stats from progression if available (fetched from backend function), otherwise fallback to local calculation
    const posts = progression?.posts !== undefined ? progression.posts : userPosts.filter((post) => !post.is_repost).length;
    const shares = progression?.shares !== undefined ? progression.shares : userPosts.filter((post) => post.is_repost).length;
    const comments = progression?.comments !== undefined ? progression.comments : userComments.filter((c) => !c.parent_comment_id).length;
    const replies = progression?.replies !== undefined ? progression.replies : userComments.filter((c) => !!c.parent_comment_id).length;

    // Quests: Completed quests
    const quests = completions.filter((c) => c.completed).length;

    // Reputation: Lifetime EP in thousands
    const reputation = ((progression?.ep_total || 0) / 1000).toFixed(1);

    return { pace, activity, convoPercent, posts, replies, quests, comments, shares, reputation };
  }, [user, currentSeason, userScore, userPosts, userComments, completions, progression]);

  // Fetch full leaderboard (top 100)
  const { data: fullLeaderboardData = [] } = useQuery({
    queryKey: ['fullLeaderboard', currentSeason?.season_id],
    queryFn: async () => {
      if (!currentSeason) return [];

      const scores = await base44.entities.SeasonalScore.filter({ season_id: currentSeason.season_id }, '-sp_total', 100);
      const profiles = await base44.entities.Profile.list();

      // Filter out deleted records and deduplicate by user_id
      const validScores = scores.filter((score) => !score.is_deleted);
      const uniqueScores = [];
      const seenUsers = new Set();

      for (const score of validScores) {
        if (!seenUsers.has(score.user_id)) {
          seenUsers.add(score.user_id);
          uniqueScores.push(score);
        }
      }

      return uniqueScores.map((score, index) => {
        const profile = profiles.find((p) => p.user_id === score.user_id);
        return {
          ...score,
          rank: index + 1,
          display_name: profile?.display_name,
          handle: profile?.handle,
          avatar_url: profile?.avatar_url
        };
      });
    },
    enabled: !!currentSeason && showFullLeaderboard,
    refetchInterval: 120000, // Increased to 2 minutes
    staleTime: 60000
  });

  // Fetch top 3 leaderboard
  const { data: top3Users = [] } = useQuery({
    queryKey: ['top3', currentSeason?.season_id],
    queryFn: async () => {
      if (!currentSeason) return [];

      const scores = await base44.entities.SeasonalScore.filter({ season_id: currentSeason.season_id }, '-sp_total', 100);
      const profiles = await base44.entities.Profile.list();

      // Filter out deleted records and deduplicate by user_id (keep highest score)
      const validScores = scores.filter((score) => !score.is_deleted);
      const uniqueScores = [];
      const seenUsers = new Set();

      for (const score of validScores) {
        if (!seenUsers.has(score.user_id)) {
          seenUsers.add(score.user_id);
          uniqueScores.push(score);
        }
      }

      const top3 = uniqueScores.slice(0, 3);

      return top3.map((score, index) => {
        const profile = profiles.find((p) => p.user_id === score.user_id);
        return {
          ...score,
          rank: index + 1,
          display_name: profile?.display_name || 'User',
          avatar_url: profile?.avatar_url,
          dashboard_image_url: profile?.dashboard_image_url
        };
      });
    },
    enabled: !!currentSeason,
    refetchInterval: 60000, // Increased from 5s to 60s
    staleTime: 30000
  });

  // Fetch nearby competitors
  const { data: competitors = [] } = useQuery({
    queryKey: ['competitors', currentSeason?.season_id, userScore?.rank],
    queryFn: async () => {
      if (!currentSeason || !userScore?.rank) return [];

      const allScores = await base44.entities.SeasonalScore.filter({ season_id: currentSeason.season_id }, '-sp_total');
      const profiles = await base44.entities.Profile.list();

      // Get users ranked just above and below current user
      const competitors = [];
      if (userScore.rank > 1) {
        const above = allScores[userScore.rank - 2]; // One rank above
        if (above) {
          const profile = profiles.find((p) => p.user_id === above.user_id);
          competitors.push({
            ...above,
            rank: userScore.rank - 1,
            display_name: profile?.display_name || 'User',
            avatar_url: profile?.avatar_url
          });
        }
      }
      if (userScore.rank < allScores.length) {
        const below = allScores[userScore.rank]; // One rank below
        if (below) {
          const profile = profiles.find((p) => p.user_id === below.user_id);
          competitors.push({
            ...below,
            rank: userScore.rank + 1,
            display_name: profile?.display_name || 'User',
            avatar_url: profile?.avatar_url
          });
        }
      }

      return competitors;
    },
    enabled: !!currentSeason && !!userScore
  });

  // Fetch quests
  const { data: quests = [] } = useQuery({
    queryKey: ['quests', currentSeason?.season_id],
    queryFn: async () => {
      if (!currentSeason) return [];
      return await base44.entities.Quest.filter({ season_id: currentSeason.season_id, enabled: true });
    },
    enabled: !!currentSeason
  });

  // Fetch global EP
  const { data: globalEP = 0 } = useQuery({
    queryKey: ['globalEP'],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('getGlobalTotalEP');
        return response.data?.totalEP || 0;
      } catch (error) {
        console.error("Failed to fetch global EP:", error);
        return 0;
      }
    }
  });

  const handleAvatarSelect = async (url) => {
    if (!user) {
      alert("Please log in to update your avatar");
      return;
    }

    setUpdatingAvatar(true);
    try {
      if (userProfile) {
        await base44.entities.Profile.update(userProfile.id, { dashboard_image_url: url });
      } else {
        // Create profile if it doesn't exist
        await base44.entities.Profile.create({
          user_id: user.id,
          display_name: user.full_name || 'User',
          handle: user.email?.split('@')[0] || 'user',
          dashboard_image_url: url,
          color_theme: 'blue'
        });
      }
      await loadUser();
      setShowAvatarModal(false);
    } catch (error) {
      console.error('Failed to update avatar:', error);
      alert('Failed to update avatar');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const claimQuestMutation = useMutation({
    mutationFn: async (questId) => {
      const quest = quests.find((q) => q.quest_id === questId);
      const completion = completions.find((c) => c.quest_id === questId);

      if (!completion || !quest) throw new Error('Quest not found');

      // Update completion
      await base44.entities.QuestCompletion.update(completion.id, {
        completed: true,
        completed_at: new Date().toISOString(),
        sp_awarded: quest.sp_reward,
        claim_count: (completion.claim_count || 0) + 1
      });

      // Update user score
      const newSpTotal = (userScore?.sp_total || 0) + quest.sp_reward;
      if (userScore?.id) {
        await base44.entities.SeasonalScore.update(userScore.id, {
          sp_total: newSpTotal,
          last_sp_increase: new Date().toISOString()
        });
      }

      return { sp: quest.sp_reward };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userScore']);
      queryClient.invalidateQueries(['completions']);
      alert('🎉 Quest completed! SP added to your score.');
    }
  });



  if (!currentSeason) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading EqoQuest...</p>
        </div>
      </div>);

  }

  const primaryColor = getPrimaryColor();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 eqo-quest-page">
      <style>{`
        :root {
          --color-primary: ${primaryColor};
        }
        .eqo-quest-page {
          color: var(--color-primary);
        }
        .eqo-quest-page .text-gray-500,
        .eqo-quest-page .text-gray-600,
        .eqo-quest-page .text-gray-700,
        .eqo-quest-page .text-gray-900,
        .eqo-quest-page .dark\\:text-gray-400,
        .eqo-quest-page .dark\\:text-gray-300,
        .eqo-quest-page .dark\\:text-gray-100,
        .eqo-quest-page .dark\\:text-white {
          color: var(--color-primary) !important;
        }
      `}</style>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="bg-[#000000] mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>EqoQuest</h1>
        </div>
      </div>

      <div className="bg-[#000000] mx-auto p-4 max-w-7xl lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Ranking and Competitive Overview */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* User Ranking Card */}
            <Card className="bg-[#000000] text-card-foreground p-4 rounded-lg shadow-sm dark:bg-gray-800 border-2 border-gray-700 lg:p-6 lg:h-[380px]">
              <h3 className="text-lg font-bold mb-4 uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>Dashboard</h3>

              <div className="relative flex flex-col lg:flex-row gap-6">
                {/* Left Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-center mb-3 lg:mb-6">
                    <p className="text-yellow-500 mb-1 text-2xl font-black md:text-3xl lg:text-4xl xl:text-5xl lg:mb-2 break-words" style={{ color: 'var(--color-primary)' }}>
                      {userProfile?.display_name || 'USER'}
                    </p>
                    <p className="text-[10px] lg:text-sm text-gray-500 dark:text-gray-400">Position: #{userScore?.rank || '999'} of 250</p>
                    <Badge className="mt-1 lg:mt-2 text-[10px] lg:text-sm" style={{ backgroundColor: 'var(--color-primary)' }}>Tier {Math.ceil((userScore?.rank || 999) / 50)}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 mb-1">Next:</p>
                      <p className="text-base lg:text-2xl font-bold text-gray-900 dark:text-white">{progression?.level ? `L${progression.level + 1}` : 'L1'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 mb-1">REP:</p>
                      <p className="text-base lg:text-2xl font-bold text-gray-900 dark:text-white">{Math.round((progression?.ep_total || 0) / 1000)}K</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 mb-1 whitespace-nowrap">Seasonal EP:</p>
                      <p className="text-base lg:text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{userScore?.sp_total || 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 lg:gap-4 border-t border-gray-200 dark:border-gray-700 pt-3 lg:pt-4">
                    <div className="text-center">
                      <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 mb-1">Pace:</p>
                      <div className="flex items-center justify-center gap-0.5 lg:gap-1">
                        <TrendingUp className="w-3 lg:w-4 h-3 lg:h-4 text-green-500" />
                        <p className="text-xs lg:text-sm font-bold text-gray-900 dark:text-white">{metrics.pace}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 mb-1">Activity:</p>
                      <div className="flex items-center justify-center gap-0.5 lg:gap-1">
                        <Sparkles className="w-3 lg:w-4 h-3 lg:h-4 text-yellow-500" />
                        <p className="text-xs lg:text-sm font-bold text-gray-900 dark:text-white">{metrics.activity}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 mb-1 whitespace-nowrap">Convo %:</p>
                      <div className="flex items-center justify-center gap-0.5 lg:gap-1">
                        <Target className="w-3 lg:w-4 h-3 lg:h-4 text-blue-500" />
                        <p className="text-xs lg:text-sm font-bold text-gray-900 dark:text-white">{metrics.convoPercent}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Image */}
                <div className="absolute -top-8 right-0 w-24 h-24 lg:relative lg:w-72 xl:w-96 lg:h-[20rem] xl:h-[28rem] flex-shrink-0 lg:-ml-8 lg:-mt-24 lg:-mb-24 group">
                  <img
                    src={userProfile?.dashboard_image_url || userProfile?.avatar_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6910c180f805e33b8a418245/04b6ffa57_134-1342862_older-male-anime-characters.png"}
                    alt="User"
                    className="w-full h-full object-contain" />

                  <div
                    onClick={() => setShowAvatarModal(true)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">

                    <div className="text-white text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="font-semibold">Select Avatar</p>
                    </div>
                  </div>
                </div>
                </div>
                </Card>

            {/* Competitive Overview */}
            <Card className="bg-white dark:bg-gray-800 border-2 border-gray-700 p-6 lg:h-[380px]">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-lg font-bold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>Competitive Overview</h3>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Community Total:</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {(globalEP || 0).toLocaleString()} EP
                  </span>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-center gap-6 mb-6 lg:relative lg:h-36">
                                    <div className="text-center lg:absolute lg:left-20">
                                                                                <p className="text-xs text-gray-500 dark:text-gray-400">EP Earned</p>
                                                                                <p className="text-lg font-bold text-gray-900 dark:text-white">{progression?.ep_total?.toLocaleString() || '0'}</p>
                                                                              </div>
                                    <div className="relative w-36 h-36 flex-shrink-0 lg:mx-auto">
                                      {(() => {
                    const LEVEL_THRESHOLDS = [
                    { level: 0, ep: 0 }, { level: 1, ep: 1000 }, { level: 2, ep: 2000 }, { level: 3, ep: 3000 },
                    { level: 4, ep: 5000 }, { level: 5, ep: 8000 }, { level: 6, ep: 13000 }, { level: 7, ep: 21000 },
                    { level: 8, ep: 34000 }, { level: 9, ep: 55000 }, { level: 10, ep: 89000 }, { level: 11, ep: 144000 },
                    { level: 12, ep: 233000 }, { level: 13, ep: 377000 }, { level: 14, ep: 610000 }, { level: 15, ep: 987000 },
                    { level: 16, ep: 1597000 }, { level: 17, ep: 2584000 }, { level: 18, ep: 4181000 }, { level: 19, ep: 6765000 },
                    { level: 20, ep: 10946000 }, { level: 21, ep: 17711000 }, { level: 22, ep: 28657000 }, { level: 23, ep: 46368000 },
                    { level: 24, ep: 75025000 }, { level: 25, ep: 121393000 }, { level: 26, ep: 196418000 }, { level: 27, ep: 317811000 },
                    { level: 28, ep: 514229000 }, { level: 29, ep: 832040000 }, { level: 30, ep: 1346269000 }];

                    const currentLevel = progression?.level || 0;
                    const epTotal = progression?.ep_total || 0;
                    const currentThreshold = LEVEL_THRESHOLDS.find((t) => t.level === currentLevel) || LEVEL_THRESHOLDS[0];
                    const nextThreshold = LEVEL_THRESHOLDS.find((t) => t.level === currentLevel + 1);
                    const epForCurrentLevel = currentThreshold.ep;
                    const epForNextLevel = nextThreshold?.ep || currentThreshold.ep;
                    const epIntoLevel = epTotal - epForCurrentLevel;
                    const epNeeded = epForNextLevel - epForCurrentLevel;
                    const progressPercent = epNeeded > 0 ? Math.min(epIntoLevel / epNeeded * 100, 100) : 100;
                    const circumference = 2 * Math.PI * 64; // 402.12
                    const strokeDasharray = `${progressPercent / 100 * circumference} ${circumference}`;

                    return (
                      <>
                                            <svg className="w-36 h-36 transform -rotate-90" style={{ overflow: 'visible' }}>
                                              <defs>
                                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                                  <feMerge>
                                                    <feMergeNode in="coloredBlur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                  </feMerge>
                                                </filter>
                                              </defs>
                                              <circle cx="72" cy="72" r="64" stroke="currentColor" className="text-gray-300 dark:text-gray-700" strokeWidth="8" fill="none" />
                                              <circle
                            cx="72"
                            cy="72"
                            r="64"
                            stroke="var(--color-primary)"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={strokeDasharray}
                            filter="url(#glow)" />

                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                              <p className="text-xs text-gray-500 dark:text-gray-400">Next Level</p>
                                              <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>{Math.round(progressPercent)}%</p>
                                            </div>
                                          </>);

                  })()}
                                    </div>
                                    <div className="text-center lg:absolute lg:right-20">
                                                                                <p className="text-xs text-gray-500 dark:text-gray-400">Seasonal EP Earned</p>
                                                                                <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{userScore?.sp_total || 0}</p>
                                                                              </div>
                                  </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
                                      <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{metrics.posts}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Replies</p>
                                      <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{metrics.replies}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Quests</p>
                                      <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{metrics.quests}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Comments</p>
                                      <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{metrics.comments}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Shares</p>
                                      <p className="text-lg font-bold text-green-500">{metrics.shares}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Reputation</p>
                                      <p className="text-lg font-bold text-purple-500">{metrics.reputation}K</p>
                                    </div>
                                  </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Top Ranked Leaderboard */}
            <Card className="bg-transparent border-0 p-3 lg:h-[380px] overflow-hidden relative">
              <div className="absolute -top-1 left-3 z-10">
                <h3 className="text-base font-bold uppercase" style={{ color: 'var(--color-primary)' }}>Top Ranked</h3>
              </div>

              {top3Users.length === 0 ?
              <div className="flex items-center justify-center h-full text-gray-500">
                  No rankings yet
                </div> :

              <>
                  {/* Rank #1 */}
                  {top3Users[0] &&
                <div className="flex items-center justify-between pb-3 pt-6 lg:pt-0 relative">
                      <div className="flex items-center gap-5 pl-8">
                        <Crown className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 0 8px #FFD700) drop-shadow(0 0 12px #FFA500)' }} />
                        <div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{top3Users[0].display_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Rank #1</p>
                          <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">{top3Users[0].sp_total} Seasonal EP</p>
                        </div>
                      </div>
                      <div className="hidden lg:block w-24 h-28 flex-shrink-0 -my-1 mr-4">
                        <img
                      src={top3Users[0].dashboard_image_url || top3Users[0].avatar_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6910c180f805e33b8a418245/a345ac64e_Anime-Character-PNG-Cutout.png"}
                      alt="Rank 1"
                      className="w-full h-full object-contain" />

                      </div>
                    </div>
                }

                  {/* Rank #2 */}
                  {top3Users[1] &&
                <div className="flex items-center justify-between py-3 relative border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-5 pl-8">
                        <Medal className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 0 8px #C0C0C0) drop-shadow(0 0 12px #A8A8A8)' }} />
                        <div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{top3Users[1].display_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Rank #2</p>
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{top3Users[1].sp_total} Seasonal EP</p>
                        </div>
                      </div>
                      <div className="hidden lg:block w-24 h-28 flex-shrink-0 -my-1 mr-4">
                        <img
                      src={top3Users[1].dashboard_image_url || top3Users[1].avatar_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6910c180f805e33b8a418245/7b03aea8f_simple-anime-5.png"}
                      alt="Rank 2"
                      className="w-full h-full object-contain" />

                      </div>
                    </div>
                }

                  {/* Rank #3 */}
                  {top3Users[2] &&
                <div className="flex items-center justify-between pt-3 relative border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-5 pl-8">
                        <Award className="w-8 h-8 text-gray-300" style={{ filter: 'drop-shadow(0 0 8px #CD7F32) drop-shadow(0 0 12px #B87333)' }} />
                        <div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{top3Users[2].display_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Rank #3</p>
                          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">{top3Users[2].sp_total} Seasonal EP</p>
                        </div>
                      </div>
                      <div className="hidden lg:block w-24 h-28 flex-shrink-0 -my-1 mr-4">
                        <img
                      src={top3Users[2].dashboard_image_url || top3Users[2].avatar_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6910c180f805e33b8a418245/799785158_r2d2.png"}
                      alt="Rank 3"
                      className="w-full h-full object-contain" />

                      </div>
                    </div>
                }
                </>
              }
            </Card>

            {/* Your Rank */}
            <Card className="bg-white dark:bg-gray-800 border-2 border-gray-700 p-4 h-[177px] relative">
              <h3 className="bg-[#000000] absolute inset-0 flex items-center justify-center" style={{ color: 'var(--color-primary)' }}>Your Rank</h3>
              <div className="absolute inset-0 flex items-center justify-center">
                {(() => {
                  const currentLevel = progression?.level || 0;
                  const LEVEL_THRESHOLDS = [
                  { level: 0, ep: 0, title: null },
                  { level: 1, ep: 1000, title: "Breather" },
                  { level: 2, ep: 2000, title: "Whisperer" },
                  { level: 3, ep: 3000, title: "Rippler" },
                  { level: 4, ep: 5000, title: "Tuner" },
                  { level: 5, ep: 8000, title: "Channeler" },
                  { level: 6, ep: 13000, title: "Attenuator" },
                  { level: 7, ep: 21000, title: "Reflector" },
                  { level: 8, ep: 34000, title: "Equalizer" },
                  { level: 9, ep: 55000, title: "Harmonizer" },
                  { level: 10, ep: 89000, title: "Signaler" },
                  { level: 11, ep: 144000, title: "Oscillator" },
                  { level: 12, ep: 233000, title: "Resonator" },
                  { level: 13, ep: 377000, title: "Vocalizer" },
                  { level: 14, ep: 610000, title: "Modulator" },
                  { level: 15, ep: 987000, title: "Synthesizer" },
                  { level: 16, ep: 1597000, title: "Phaser" },
                  { level: 17, ep: 2584000, title: "Beaconer" },
                  { level: 18, ep: 4181000, title: "Projector" },
                  { level: 19, ep: 6765000, title: "Emitter" },
                  { level: 20, ep: 10946000, title: "Transmitter" },
                  { level: 21, ep: 17711000, title: "Broadcaster" },
                  { level: 22, ep: 28657000, title: "Pulsar" },
                  { level: 23, ep: 46368000, title: "Reverberator" },
                  { level: 24, ep: 75025000, title: "Expander" },
                  { level: 25, ep: 121393000, title: "Generator" },
                  { level: 26, ep: 196418000, title: "Conductor" },
                  { level: 27, ep: 317811000, title: "Orchestrator" },
                  { level: 28, ep: 514229000, title: "Radiator" },
                  { level: 29, ep: 832040000, title: "Thunderer" },
                  { level: 30, ep: 1346269000, title: "Blaster" }];

                  const currentThreshold = LEVEL_THRESHOLDS.find((t) => t.level === currentLevel) || LEVEL_THRESHOLDS[0];

                  const getBadgeIcon = () => {
                    if (currentLevel <= 4) return <Star className="w-20 h-20" style={{ color: 'var(--color-primary)' }} />;
                    if (currentLevel <= 9) return <Flame className="w-20 h-20" style={{ color: 'var(--color-primary)' }} />;
                    if (currentLevel <= 14) return <Gem className="w-20 h-20" style={{ color: 'var(--color-primary)' }} />;
                    if (currentLevel <= 19) return <Zap className="w-20 h-20" style={{ color: 'var(--color-primary)' }} />;
                    if (currentLevel <= 24) return <Crown className="w-20 h-20" style={{ color: 'var(--color-primary)' }} />;
                    return <Trophy className="w-20 h-20" style={{ color: 'var(--color-primary)' }} />;
                  };

                  return getBadgeIcon();
                })()}
              </div>
            </Card>

            {/* Top Post */}
            <Card className="bg-white dark:bg-gray-800 border-2 border-gray-700 p-4 flex flex-col lg:h-[177px]">
              <h3 className="bg-[#ff0000] p-3 rounded-lg dark:bg-gray-700 flex-1 overflow-hidden" style={{ color: 'var(--color-primary)' }}>Top Post</h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 flex-1 overflow-hidden">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Most liked post ({topPost?.like_count || 0} ❤️):</p>
                <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                  {topPost?.text || 'No posts yet. Start creating!'}
                </p>
              </div>
            </Card>
            </div>


        </div>

        {/* Full Leaderboard Modal */}
        <FullLeaderboardModal
          isOpen={showFullLeaderboard}
          onClose={() => setShowFullLeaderboard(false)}
          leaderboard={fullLeaderboardData}
          userScore={userScore}
          userId={user?.id} />

        {/* Avatar Selection Modal */}
        <AvatarSelectionModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          onSelect={handleAvatarSelect}
          isLoading={updatingAvatar} />


        {/* User Strip */}
        <div className="mt-8">
          {user &&
          <UserStrip
            userScore={userScore}
            gapToNextRank={competitors.find((c) => c.rank === (userScore?.rank || 999) - 1)?.sp_total - (userScore?.sp_total || 0) || null}
            pendingClaims={completions.filter((c) => c.progress >= 100 && !c.completed).length}
            onViewFullLeaderboard={() => setShowFullLeaderboard(true)}
            onClaimPending={() => {
              const pendingQuest = completions.find((c) => c.progress >= 100 && !c.completed);
              if (pendingQuest) claimQuestMutation.mutate(pendingQuest.quest_id);
            }} />

          }
        </div>

        {/* Quests Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quests</h2>
              <p className="text-gray-600 dark:text-gray-400">Complete quests to earn Seasonal EP</p>
            </div>
            <div className="hidden lg:flex gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewMode('grid');
                  localStorage.setItem('quest-view-mode', 'grid');
                }}
                className={`bg-transparent ${viewMode === 'grid' ? 'shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.6)]' : ''}`}
                style={viewMode === 'grid' ? { boxShadow: '0 0 20px color-mix(in srgb, var(--color-primary) 60%, transparent)' } : {}}>

                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewMode('list');
                  localStorage.setItem('quest-view-mode', 'list');
                }}
                className="bg-transparent"
                style={viewMode === 'list' ? { boxShadow: '0 0 20px color-mix(in srgb, var(--color-primary) 60%, transparent)' } : {}}>

                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {quests.length === 0 ?
          <div className="text-center py-16">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No quests available
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Check back when the season starts
              </p>
            </div> :
          viewMode === 'grid' ?
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quests.map((quest) => {
              const completion = completions.find((c) => c.quest_id === quest.quest_id);
              return (
                <QuestCard
                  key={quest.quest_id}
                  quest={quest}
                  completion={completion}
                  onClaim={(questId) => claimQuestMutation.mutate(questId)}
                  onTrack={(questId) => alert('Tracking feature coming soon!')}
                  isLoading={claimQuestMutation.isPending} />);


            })}
            </div> :

          <QuestTable
            quests={quests}
            completions={completions}
            onClaim={(questId) => claimQuestMutation.mutate(questId)}
            onTrack={(questId) => alert('Tracking feature coming soon!')}
            isLoading={claimQuestMutation.isPending} />

          }
        </div>
      </div>
    </div>);

}