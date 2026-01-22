import React, { useState, useEffect, useCallback } from "react";
import { Post } from "@/entities/Post";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { ModerationLog } from "@/entities/ModerationLog";
import { EngagementPoint } from "@/entities/EngagementPoint";
import { Follow } from "@/entities/Follow";
import { UserProfileData } from "@/entities/UserProfileData";
import { Reaction } from "@/entities/Reaction";
import { Comment } from "@/entities/Comment";
import { PublicUserDirectory } from "@/entities/PublicUserDirectory";
import { Poll } from "@/entities/Poll";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  TrendingUp,
  Zap,
  Settings,
  Filter,
  Sparkles,
  Map,
  ArrowUp,
  X,
  Users,
  Plus } from
"lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";


import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getFromCache, setInCache, invalidateCache, CACHE_CONFIG } from '../components/contexts/UserContext';

import PostCard from "../components/feed/PostCard";
import PollCard from "../components/feed/PollCard";
import EditPostModal from "../components/feed/EditPostModal";
import RepostModal from "../components/feed/RepostModal";
import TrendingTopics from "../components/feed/TrendingTopics";
import AlgorithmSelector from "../components/feed/AlgorithmSelector";
import { awardEP } from "@/functions/awardEP";
import { getCurrentWelcomeBonus } from "@/functions/getCurrentWelcomeBonus";
import { postToX } from "@/functions/postToX";
import { getSharedPost } from "@/functions/getSharedPost";
import { base44 } from "@/api/base44Client";
import QuantumFlowLoader from "../components/layout/QuantumFlowLoader";
import WelcomeModal from "../components/onboarding/WelcomeModal";
import RoadmapModal from "../components/roadmap/RoadmapModal";
import TermsOfServiceModal from '../components/onboarding/TermsOfServiceModal';
import PrivacyPolicyModal from '../components/onboarding/PrivacyPolicyModal';
import EqoFlowDeclarationModal from '../components/onboarding/EqoFlowDeclarationModal';
import TrendingCommunitiesSlider from '../components/communities/TrendingCommunitiesSlider';
import CreatePostModal from '../components/feed/CreatePostModal';

const parseAndValidateDate = (dateString) => {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

// Color schemes for dynamic theming
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

const getColorScheme = (schemeName) => {
  return colorSchemes[schemeName] || colorSchemes.purple;
};

export default function Feed() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [followingList, setFollowingList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAlgorithmSettings, setShowAlgorithmSettings] = useState(false);
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [epHistory, setEpHistory] = useState([]);
  const [epStats, setEpStats] = useState({
    today: 0,
    week: 0,
    month: 0
  });
  const [lastPostCheckTime, setLastPostCheckTime] = useState(0);
  const [rateLimitBackoff, setRateLimitBackoff] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [welcomeBonusAmount, setWelcomeBonusAmount] = useState(1000);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [feedType, setFeedType] = useState('main');
  const [sortOrder, setSortOrder] = useState('-created_date');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showTrendingCommunities, setShowTrendingCommunities] = useState(() => {
    const saved = localStorage.getItem('showTrendingCommunities');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);

  const [highlightPostId, setHighlightPostId] = useState(null);
  const [highlightCommentId, setHighlightCommentId] = useState(null);
  const [repostingPost, setRepostingPost] = useState(null);
  const [showRepostModal, setShowRepostModal] = useState(false);

  const showErrorMessage = useCallback((error, context = '') => {
    console.error(`${context} error:`, error);

    const nonCriticalErrors = [
    'EP award',
    'Cache',
    'Notification',
    'Profile analytics',
    'refresh'];


    if (nonCriticalErrors.some((ncError) => context.toLowerCase().includes(ncError.toLowerCase()))) {
      console.warn(`Non-critical error in ${context}, not showing to user:`, error);
      return;
    }

    if (error?.message?.includes('timeout') && context.includes('Loading')) {
      console.warn('Background loading timeout, not showing to user');
      return;
    }

    let message = "We're experiencing technical difficulties. EqoFlow is still in beta and we're working to resolve these issues. Please wait a moment before refreshing the page.";

    if (error?.response?.status === 429 || error?.message?.includes('Rate limit') || error?.message?.includes('rate limit')) {
      message = "Too many requests right now. EqoFlow is in beta and we're optimizing our systems. Please wait a moment before trying again.";
    } else if (error?.response?.status >= 500) {
      message = "Our servers are temporarily unavailable. We're in beta and actively improving stability. Please try refreshing the page in a moment.";
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      message = "Network connection issue detected. EqoFlow is in beta - please check your connection and try again.";
    }

    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 8000);
  }, []);

  const updateUserProfileData = useCallback(async (dataToUpdate) => {
    if (!user || !user.email) {
      showErrorMessage(new Error("User not logged in"), "Updating profile data");
      return;
    }

    try {
      const existingProfile = await UserProfileData.filter({ user_email: user.email });
      let profileId = null;
      if (existingProfile.length > 0) {
        profileId = existingProfile[0].id;
        await UserProfileData.update(profileId, { ...dataToUpdate.updateData, user_email: user.email });
      } else {
        const newProfile = await UserProfileData.create({ ...dataToUpdate.updateData, user_email: user.email });
        profileId = newProfile.id;
      }
      const updatedProfileData = { ...existingProfile[0], ...dataToUpdate.updateData, user_email: user.email, id: profileId };
      setInCache(CACHE_CONFIG.USER_PROFILE_DATA, updatedProfileData);
    } catch (error) {
      showErrorMessage(error, 'Error updating user profile data');
      throw error;
    }
  }, [user, showErrorMessage]);

  const handleUserUpdate = useCallback((updatedUser) => {
    setUser(updatedUser);
    setInCache(CACHE_CONFIG.USER_DATA, updatedUser);

    if (
    updatedUser.interests !== undefined ||
    updatedUser.has_completed_onboarding !== undefined ||
    updatedUser.algorithm_preferences !== undefined ||
    updatedUser.bio !== undefined ||
    updatedUser.professional_credentials !== undefined ||
    updatedUser.cross_platform_identity !== undefined ||
    updatedUser.communication_preferences !== undefined ||
    updatedUser.privacy_settings !== undefined ||
    updatedUser.theme_preference !== undefined ||
    updatedUser.notification_settings !== undefined ||
    updatedUser.has_agreed_terms_of_service !== undefined ||
    updatedUser.has_agreed_privacy_policy !== undefined ||
    updatedUser.has_agreed_eqoflow_declaration !== undefined ||
    updatedUser.allow_data_sharing !== undefined ||
    updatedUser.allow_personalized_ads !== undefined ||
    updatedUser.custom_badges !== undefined ||
    updatedUser.kyc_status !== undefined)
    {
      const userProfileDataToCache = {
        id: updatedUser.id,
        user_email: updatedUser.email,
        interests: updatedUser.interests,
        bio: updatedUser.bio,
        professional_credentials: updatedUser.professional_credentials,
        cross_platform_identity: updatedUser.cross_platform_identity,
        communication_preferences: updatedUser.communication_preferences,
        privacy_settings: updatedUser.privacy_settings,
        theme_preference: updatedUser.theme_preference,
        notification_settings: updatedUser.notification_settings,
        has_completed_onboarding: updatedUser.has_completed_onboarding,
        has_agreed_terms_of_service: updatedUser.has_agreed_terms_of_service,
        has_agreed_privacy_policy: updatedUser.has_agreed_privacy_policy,
        has_agreed_eqoflow_declaration: updatedUser.has_agreed_eqoflow_declaration,
        allow_data_sharing: updatedUser.allow_data_sharing,
        allow_personalized_ads: updatedUser.allow_personalized_ads,
        custom_badges: updatedUser.custom_badges,
        kyc_status: updatedUser.kyc_status
      };

      const filteredProfileData = Object.fromEntries(
        Object.entries(userProfileDataToCache).filter(([, value]) => value !== undefined)
      );

      setInCache(CACHE_CONFIG.USER_PROFILE_DATA, filteredProfileData);
    }
  }, []);

  const loadEPData = useCallback(async (currentUser) => {
    if (!currentUser || !currentUser.email) return;

    try {
      const cacheKey = { key: `ep_data_${currentUser.email}` };
      const cachedEPData = getFromCache(cacheKey);

      if (cachedEPData) {
        setEpHistory(cachedEPData.epHistory);
        setEpStats(cachedEPData.epStats);
        return;
      }

      const epData = await EngagementPoint.filter({ created_by: currentUser.email }, "-created_date", 50);
      setEpHistory(epData);

      const todayEP = (currentUser.general_daily_ep_earned || 0) + (currentUser.creator_daily_ep_earned || 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const weekEP = epData.filter((ep) => {
        const epDate = parseAndValidateDate(ep.created_date);
        return epDate && epDate >= weekAgo && ep.final_points > 0;
      }).reduce((sum, ep) => sum + (ep.final_points || 0), 0);

      const monthEP = epData.filter((ep) => {
        const epDate = parseAndValidateDate(ep.created_date);
        return epDate && epDate >= monthAgo && ep.final_points > 0;
      }).reduce((sum, ep) => sum + (ep.final_points || 0), 0);

      const calculatedStats = {
        today: todayEP,
        week: weekEP,
        month: monthEP
      };

      setEpStats(calculatedStats);

      setInCache(cacheKey, {
        epHistory: epData,
        epStats: calculatedStats
      });

    } catch (error) {
      showErrorMessage(error, 'Loading EP data');
    }
  }, [showErrorMessage]);

  const getRecommendationReason = useCallback((item, components) => {
    if (components.isFollowed) {
      return `From a creator you follow, ${item.author_full_name}`;
    }
    if (components.matchingInterests && components.matchingInterests.length > 0) {
      return `Because you're interested in #${components.matchingInterests[0]}`;
    }
    if (components.engagementScore > 0.7) {
      return "Trending in your network";
    }
    if (components.isCommunity) {
      return "Popular in your communities";
    }
    return null;
  }, []);

  const calculatePostScore = useCallback((item, params) => {
    const {
      weight_recency,
      weight_engagement,
      weight_creator_reputation,
      weight_personal_interest,
      boost_followed_creators,
      boost_community_content,
      user,
      followingList
    } = params;

    let recencyScore = 0;
    const itemDate = parseAndValidateDate(item.created_date);
    if (itemDate) {
      const timeDiff = Date.now() - itemDate.getTime();
      const oneWeekInMs = 1000 * 60 * 60 * 24 * 7;
      recencyScore = Math.max(0, 1 - timeDiff / oneWeekInMs);
    }

    let engagementScore = 0;
    if (item.isPoll || !!item.question) {
      engagementScore = Math.min(1, (item.total_votes || 0) / 100);
    } else {
      engagementScore = Math.min(1, ((item.likes_count || 0) + (item.comments_count || 0) + (item.reposts_count || 0)) / 100);
    }

    const authorReputation = item.author?.reputation_score || 100;
    const reputationScore = Math.min(1, authorReputation / 1000);

    let interestScore = 0;
    let matchingInterests = [];
    if (user && user.interests && item.tags) {
      const userInterests = new Set(user.interests.map((i) => i.toLowerCase()));
      const itemTags = new Set(item.tags.map((t) => t.toLowerCase()));

      itemTags.forEach((tag) => {
        if (userInterests.has(tag)) {
          matchingInterests.push(tag);
        }
      });

      if (userInterests.size > 0) {
        interestScore = Math.min(1, matchingInterests.length / userInterests.size);
      }
    }

    let score =
    recencyScore * weight_recency +
    engagementScore * weight_engagement +
    reputationScore * weight_creator_reputation +
    interestScore * weight_personal_interest;

    const isFollowed = boost_followed_creators && followingList?.includes(item.created_by);
    const isCommunity = boost_community_content && item.community_id;

    if (isFollowed) {
      score *= 1.5;
    }
    if (isCommunity) {
      score *= 1.3;
    }

    return {
      score,
      components: {
        recencyScore,
        engagementScore,
        reputationScore,
        interestScore,
        isFollowed,
        isCommunity,
        matchingInterests
      }
    };
  }, []);

  const applySortingAlgorithm = useCallback((items, preferences, currentUser, localFollowingList = []) => {
    if (!items.length) return [];

    if (!preferences || Object.keys(preferences).length === 0) {
      return [...items].sort((a, b) => {
        const dateA = parseAndValidateDate(a.created_date);
        const dateB = parseAndValidateDate(b.created_date);

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateB.getTime() - dateA.getTime();
      });
    }

    const {
      primary_algorithm = 'personalized',
      weight_recency = 0.3,
      weight_engagement = 0.4,
      weight_creator_reputation = 0.2,
      weight_personal_interest = 0.1,
      boost_followed_creators = true,
      boost_community_content = true,
      filter_controversial = false,
      minimum_quality_threshold = 0.3,
      diversity_factor = 0.5,
      custom_filters = []
    } = preferences;

    let processedItems = [...items];

    const focusFilters = custom_filters.filter((f) => f.action === 'focus');
    if (focusFilters.length > 0) {
      processedItems = processedItems.filter((item) => {
        return focusFilters.some((filter) => {
          switch (filter.type) {
            case 'keyword':
              const textToSearchFocus = item.content || item.question || '';
              return textToSearchFocus.toLowerCase().includes(filter.value.toLowerCase());
            case 'tag':
              return item.tags?.some((tag) => tag.toLowerCase() === filter.value.toLowerCase());
            case 'creator':
              return item.created_by === filter.value;
            default:
              return false;
          }
        });
      });
    }

    const hideFilters = custom_filters.filter((f) => f.action === 'hide');
    hideFilters.forEach((filter) => {
      processedItems = processedItems.filter((item) => {
        switch (filter.type) {
          case 'keyword':
            const textToSearchHide = item.content || item.question || '';
            return !textToSearchHide.toLowerCase().includes(filter.value.toLowerCase());
          case 'tag':
            return !item.tags?.some((tag) => tag.toLowerCase() === filter.value.toLowerCase());
          case 'creator':
            return item.created_by !== filter.value;
          default:
            return true;
        }
      });
    });

    switch (primary_algorithm) {
      case 'chronological':
        processedItems.sort((a, b) => {
          const dateA = parseAndValidateDate(a.created_date);
          const dateB = parseAndValidateDate(b.created_date);

          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;

          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'engagement':
        processedItems.sort((a, b) => {
          const aScore = a.isPoll || !!a.question ? a.total_votes || 0 : (a.likes_count || 0) + (a.comments_count || 0) + (a.reposts_count || 0);
          const bScore = b.isPoll || !!b.question ? b.total_votes || 0 : (b.likes_count || 0) + (b.comments_count || 0) + (b.reposts_count || 0);
          return bScore - aScore;
        });
        break;
      case 'personalized':
      default:
        let scoredItems = processedItems.map((item) => {
          const { score, components } = calculatePostScore(item, {
            weight_recency,
            weight_engagement,
            weight_creator_reputation,
            weight_personal_interest,
            boost_followed_creators,
            boost_community_content,
            user: currentUser,
            followingList: localFollowingList
          });
          const recommendationReason = getRecommendationReason(item, components);
          return { ...item, score, recommendationReason };
        });

        scoredItems.sort((a, b) => (b.score || 0) - (a.score || 0));
        processedItems = scoredItems;
        break;
    }

    const boostFilters = custom_filters.filter((f) => f.action === 'boost');
    boostFilters.forEach((filter) => {
      const tempBoosted = [];
      const tempRegular = [];

      processedItems.forEach((item) => {
        let shouldBoost = false;
        switch (filter.type) {
          case 'keyword':
            const textToSearchBoost = item.content || item.question || '';
            shouldBoost = textToSearchBoost.toLowerCase().includes(filter.value.toLowerCase());
            break;
          case 'tag':
            shouldBoost = item.tags?.some((tag) => tag.toLowerCase() === filter.value.toLowerCase());
            break;
          case 'creator':
            shouldBoost = item.created_by === filter.value;
            break;
          default:
            return false;
        }

        if (shouldBoost) {
          tempBoosted.push(item);
        } else {
          tempRegular.push(item);
        }
      });
      processedItems = [...tempBoosted, ...tempRegular];
    });

    return processedItems;
  }, [calculatePostScore, getRecommendationReason]);

  const fetchAndProcessPosts = useCallback(async (currentFeedType, currentSortOrder, currentUser, currentFollowingList) => {
    try {
      let fetchedPosts = [];
      let fetchedPolls = [];

      if (currentFeedType === 'following') {
        if (currentFollowingList.length > 0) {
          const postsPromise = Post.filter(
            { created_by: { $in: currentFollowingList }, moderation_status: 'approved' },
            currentSortOrder,
            50
          );
          const pollsPromise = Poll.filter(
            { created_by: { $in: currentFollowingList } },
            currentSortOrder,
            50
          );
          [fetchedPosts, fetchedPolls] = await Promise.all([postsPromise, pollsPromise]);
        } else {
          fetchedPosts = [];
          fetchedPolls = [];
        }
      } else {
        const generalPostsPromise = Post.filter(
          { moderation_status: 'approved', community_id: null },
          currentSortOrder,
          50
        );

        const sharedCommunityPostsPromise = Post.filter(
          { moderation_status: 'approved', share_to_main_feed: true },
          currentSortOrder,
          50
        );
        const generalPollsPromise = Poll.filter({}, currentSortOrder, 50);

        const [generalPosts, sharedCommunityPosts, polls] = await Promise.all([
        generalPostsPromise,
        sharedCommunityPostsPromise,
        generalPollsPromise]
        );

        console.log('[Feed.js] Raw polls from database:', polls);
        console.log('[Feed.js] Number of polls fetched:', polls.length);
        if (polls.length > 0) {
          console.log('[Feed.js] First poll structure:', polls[0]);
        }

        let allPosts = [...generalPosts, ...sharedCommunityPosts];
        allPosts.sort((a, b) => {
          const dateA = parseAndValidateDate(a.created_date);
          const dateB = parseAndValidateDate(b.created_date);

          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;

          return dateB.getTime() - dateA.getTime();
        });

        fetchedPosts = allPosts.slice(0, 50);
        fetchedPolls = polls;
      }

      let allContent = [
      ...fetchedPosts,
      ...fetchedPolls.map((poll) => {
        console.log('[Feed.js] Adding isPoll flag to poll:', poll.id, 'question:', poll.question);
        return { ...poll, isPoll: true };
      })];


      console.log('[Feed.js] Combined content before sort:', allContent.length, 'items');
      console.log('[Feed.js] Items with isPoll flag:', allContent.filter((i) => i.isPoll === true).length);

      allContent.sort((a, b) => {
        const dateA = parseAndValidateDate(a.created_date);
        const dateB = parseAndValidateDate(b.created_date);

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateB.getTime() - dateA.getTime();
      });

      const contentIds = allContent.map((item) => item.id).filter(Boolean);
      const authorEmails = [...new Set(allContent.map((item) => item.created_by).filter(Boolean))];

      await new Promise((resolve) => setTimeout(resolve, 400));

      const allAuthorFollowsPromise = authorEmails.length > 0 ? Follow.filter({ following_email: { $in: authorEmails } }).catch((err) => {
        showErrorMessage(err, 'Error fetching author follow data');
        return [];
      }) : Promise.resolve([]);

      const [allReactions, authors, comments, allAuthorFollows] = await Promise.all([
      contentIds.length > 0 ? Reaction.filter({ post_id: { $in: contentIds } }).catch((err) => {
        showErrorMessage(err, 'Error fetching reactions');
        return [];
      }) : Promise.resolve([]),
      authorEmails.length > 0 ? PublicUserDirectory.filter({ user_email: { $in: authorEmails } }).catch((err) => {
        showErrorMessage(err, 'Error fetching authors');
        return [];
      }) : Promise.resolve([]),
      contentIds.length > 0 ? Comment.filter({ post_id: { $in: contentIds } }, "-created_date", 100).catch((err) => {
        showErrorMessage(err, 'Error fetching comments');
        return [];
      }) : Promise.resolve([]),
      allAuthorFollowsPromise]
      );

      const followerCountsMap = allAuthorFollows.reduce((acc, follow) => {
        if (follow && follow.following_email) {
          acc[follow.following_email] = (acc[follow.following_email] || 0) + 1;
        }
        return acc;
      }, {});

      const authorsMap = authors.reduce((acc, author) => {
        if (author && author.user_email) {
          acc[author.user_email] = {
            email: author.user_email,
            user_email: author.user_email,
            full_name: author.full_name || author.user_email.split('@')[0],
            username: author.username,
            avatar_url: author.avatar_url,
            banner_url: author.banner_url,
            bio: author.bio,
            professional_credentials: author.professional_credentials,
            cross_platform_identity: author.cross_platform_identity,
            custom_badges: author.custom_badges || [],
            subscription_tier: author.subscription_tier || 'free',
            follower_count: followerCountsMap[author.user_email] || 0,
            kyc_status: author.kyc_status
          };
        }
        return acc;
      }, {});

      const reactionsByPostId = allReactions.reduce((acc, reaction) => {
        const postId = reaction.post_id;
        if (postId) {
          if (!acc[postId]) {
            acc[postId] = [];
          }
          acc[postId].push(reaction);
        }
        return acc;
      }, {});

      const commentsByPostId = comments.reduce((acc, comment) => {
        const postId = comment.post_id;
        if (postId) {
          if (!acc[postId]) {
            acc[postId] = [];
          }
          acc[postId].push(comment);
        }
        return acc;
      }, {});

      let finalProcessedContent = allContent.map((item) => {
        const commonAuthorData = authorsMap[item.created_by] || {};
        const authorFollowerCount = commonAuthorData.follower_count || 0;

        const isPollItem = item.isPoll === true || !!item.question;

        if (isPollItem) {
          return {
            ...item,
            author: { ...commonAuthorData },
            author_full_name: commonAuthorData.full_name || item.author_full_name,
            author_username: commonAuthorData.username || item.author_username,
            author_avatar_url: commonAuthorData.avatar_url || item.author_avatar_url,
            author_follower_count: authorFollowerCount,
            author_professional_credentials: commonAuthorData.professional_credentials || item.author_professional_credentials,
            author_cross_platform_identity: commonAuthorData.cross_platform_identity || item.author_cross_platform_identity,
            reactions: reactionsByPostId[item.id] || [], // Added reactions to poll items
            isPoll: true
          };
        } else {
          return {
            ...item,
            author: { ...commonAuthorData },
            author_full_name: commonAuthorData.full_name || item.author_full_name,
            author_username: commonAuthorData.username || item.author_username,
            author_avatar_url: commonAuthorData.avatar_url || item.author_avatar_url,
            author_banner_url: commonAuthorData.banner_url || item.author_banner_url,
            author_follower_count: authorFollowerCount,
            author_professional_credentials: commonAuthorData.professional_credentials || item.author_professional_credentials,
            author_cross_platform_identity: commonAuthorData.cross_platform_identity || item.author_cross_platform_identity,
            reactions: reactionsByPostId[item.id] || [],
            recent_comments: commentsByPostId[item.id] || [],
            liked_by: item.liked_by || [],
            likes_count: item.likes_count || 0,
          };
        }
      });

      setInCache(CACHE_CONFIG.FEED_POSTS, finalProcessedContent);
      return finalProcessedContent;

    } catch (error) {
      showErrorMessage(error, 'Error fetching and processing posts and polls');
      throw error;
    }
  }, [showErrorMessage]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check if this is a shared post view (non-logged in user viewing a single post)
      const urlParams = new URLSearchParams(window.location.search);
      const sharedPostId = urlParams.get('postId');

      // If this is a shared post link, try to load it publicly FIRST (before any auth checks)
      if (sharedPostId) {
        try {
          const { data } = await getSharedPost({ postId: sharedPostId });
          if (data && data.post) {
            setPosts([data.post]);
            setUser(null);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error loading shared post:', error);
          // Continue to normal flow if shared post fails
        }
      }

      const cachedUser = getFromCache(CACHE_CONFIG.USER_DATA);
      const cachedUserProfile = getFromCache(CACHE_CONFIG.USER_PROFILE_DATA);

      let currentUser = null;
      let currentFollowingList = [];

      if (cachedUser) {
        currentUser = cachedUser;
        if (cachedUserProfile) {
          currentUser = { ...currentUser, ...cachedUserProfile };
        }
        setUser(currentUser);
      }

      const [userRes, bonusRes] = await Promise.all([
      cachedUser ? Promise.resolve(cachedUser) : User.me().catch(() => null),
      getCurrentWelcomeBonus().catch(() => ({ data: { bonusAmount: 1000 } }))]
      );

      if (bonusRes && bonusRes.data && bonusRes.data.bonusAmount) {
        setWelcomeBonusAmount(bonusRes.data.bonusAmount);
      }

      if (userRes) {
        try {
          const freshUser = await User.me();
          if (freshUser) {
            setInCache(CACHE_CONFIG.USER_DATA, freshUser);
            currentUser = freshUser;
          } else {
            currentUser = userRes;
          }
        } catch (freshUserError) {
          console.warn("Failed to fetch fresh user data, falling back:", freshUserError);
          currentUser = userRes;
        }
      } else {
        currentUser = null;
      }

      if (currentUser && currentUser.email) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));

          const [profileDataRecords, follows] = await Promise.all([
          cachedUserProfile ?
          Promise.resolve([cachedUserProfile]) :
          UserProfileData.filter({ user_email: currentUser.email }).catch((err) => {
            showErrorMessage(err, 'Error fetching user profile data');
            return [];
          }),
          Follow.filter({ follower_email: currentUser.email }).catch((err) => {
            showErrorMessage(err, 'Error fetching user follows');
            return [];
          })]
          );

          if (profileDataRecords.length > 0 && !cachedUserProfile) {
            setInCache(CACHE_CONFIG.USER_PROFILE_DATA, profileDataRecords[0]);
            currentUser = { ...currentUser, ...profileDataRecords[0] };
          } else if (cachedUserProfile) {
            currentUser = { ...currentUser, ...cachedUserProfile };
          }

          currentUser.has_agreed_terms_of_service = currentUser.has_agreed_terms_of_service ?? false;
          currentUser.has_agreed_privacy_policy = currentUser.has_agreed_privacy_policy ?? false;
          currentUser.has_agreed_eqoflow_declaration = currentUser.has_agreed_eqoflow_declaration ?? false;
          currentUser.has_completed_onboarding = currentUser.has_completed_onboarding ?? false;

          const followedEmails = follows.map((f) => f.following_email);
          setFollowingList(followedEmails);
          currentFollowingList = followedEmails;

          currentUser.following_list = followedEmails;

        } catch (profileError) {
          showErrorMessage(profileError, 'Could not load profile data or follows');
        }
      }

      setUser(currentUser);

      if (currentUser) {
        const needsTerms = !currentUser.has_agreed_terms_of_service;
        const needsPrivacy = !currentUser.has_agreed_privacy_policy;
        const needsDeclaration = !currentUser.has_agreed_eqoflow_declaration;
        const needsOnboarding = !currentUser.has_completed_onboarding;

        if (needsTerms) {
          setShowTermsModal(true);
        } else if (needsPrivacy) {
          setShowPrivacyModal(true);
        } else if (needsDeclaration) {
          setShowDeclarationModal(true);
        } else if (needsOnboarding) {
          setShowWelcomeModal(true);
        }
      }

      let freshContent = [];
      const cachedContent = getFromCache(CACHE_CONFIG.FEED_POSTS);
      if (cachedContent && cachedContent.length > 0) {
        console.log('[Feed.js] Setting cached content:', cachedContent.length, 'items');
        console.log('[Feed.js] Cached content includes polls:', cachedContent.filter((i) => !!i.question).length);
        setPosts(cachedContent);
      }

      freshContent = await fetchAndProcessPosts(feedType, sortOrder, currentUser, currentFollowingList);

      console.log('[Feed.js] Fresh content from fetchAndProcessPosts:', freshContent.length, 'items');
      console.log('[Feed.js] Fresh content includes polls:', freshContent.filter((i) => !!i.question).length);

      const pinnedItems = freshContent.filter((item) => item.is_pinned === true);
      const regularItems = freshContent.filter((item) => item.is_pinned !== true);

      console.log('[Feed.js] Before sorting - Regular items:', regularItems.length, 'Polls:', regularItems.filter((i) => !!i.question).length);

      const sortedRegularItems = applySortingAlgorithm(regularItems, currentUser?.algorithm_preferences, currentUser, currentFollowingList);

      console.log('[Feed.js] After sorting - Sorted items:', sortedRegularItems.length, 'Polls:', sortedRegularItems.filter((i) => !!i.question).length);

      const finalSortedItems = [...pinnedItems, ...sortedRegularItems];

      console.log('[Feed.js] Final sorted items:', finalSortedItems.length, 'Polls:', finalSortedItems.filter((i) => !!i.question).length);

      setPosts(finalSortedItems);
      setLastRefreshTime(new Date());
      setHasNewPosts(false);
      setRateLimitBackoff(0);

      if (currentUser) {
        await loadEPData(currentUser);
      }

    } catch (error) {
      showErrorMessage(error, 'Loading feed data');
      if (error.response?.status === 429 || error.message?.includes('Rate limit')) {
        const backoffTime = Date.now() + 60000;
        setRateLimitBackoff(backoffTime);
        console.warn(`Feed rate limited, backing off until ${new Date(backoffTime).toLocaleTimeString()}`);
      }
      setPosts([]);
    }
    setIsLoading(false);
  }, [applySortingAlgorithm, loadEPData, showErrorMessage, fetchAndProcessPosts, feedType, sortOrder]);

  const checkForNewPosts = useCallback(async () => {
    const now = Date.now();
    setLastPostCheckTime(now);
    try {
      const lastRefreshISO = lastRefreshTime instanceof Date ? lastRefreshTime.toISOString() : new Date().toISOString();

      const recentPosts = await Post.filter(
        { created_date: { $gt: lastRefreshISO } },
        "-created_date",
        5
      );
      const recentPolls = await Poll.filter(
        { created_date: { $gt: lastRefreshISO } },
        "-created_date",
        5
      );

      if (recentPosts.length > 0 || recentPolls.length > 0) {
        setHasNewPosts(true);
      }
      setRateLimitBackoff(0);
    } catch (error) {
      showErrorMessage(error, 'Checking for new posts');

      if (error.response?.status === 429 || error.message?.includes('Rate limit')) {
        const backoffTime = Date.now() + 300000;
        setRateLimitBackoff(backoffTime);
        console.warn(`New post check rate limited, backing off until ${new Date(backoffTime).toLocaleTimeString()}`);
      }
    }
  }, [lastRefreshTime, showErrorMessage]);

  const refreshFeed = useCallback(async () => {
    try {
      invalidateCache(CACHE_CONFIG.FEED_POSTS);
      invalidateCache(CACHE_CONFIG.USER_DATA);
      invalidateCache(CACHE_CONFIG.USER_PROFILE_DATA);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      showErrorMessage(error, 'Refreshing feed');
    }
  }, [showErrorMessage]);

  const createNotification = useCallback(async (type, recipientEmail, actorName, actorAvatar, message, relatedContentId = null, actionUrl = null) => {
    if (!user || recipientEmail === user.email) return;

    try {
      console.log('Creating notification:', { type, recipientEmail, message, actor: user.full_name });

      const notificationData = {
        recipient_email: recipientEmail,
        type,
        message,
        actor_email: user.email,
        actor_name: actorName,
        actor_avatar: actorAvatar,
        related_content_id: relatedContentId,
        related_content_type: "post",
        action_url: actionUrl || createPageUrl('Feed'),
        is_read: false
      };

      const notification = await Notification.create(notificationData);
      console.log('Notification created successfully:', notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      showErrorMessage(error, 'Creating notification');
    }
  }, [user, showErrorMessage]);

  useEffect(() => {
    localStorage.setItem('showTrendingCommunities', JSON.stringify(showTrendingCommunities));
  }, [showTrendingCommunities]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= rateLimitBackoff &&
      now - lastPostCheckTime >= 300000 &&
      isTabVisible) {
        checkForNewPosts();
      }
    }, 300000);

    return () => clearInterval(interval);
  }, [lastRefreshTime, lastPostCheckTime, rateLimitBackoff, isTabVisible, checkForNewPosts]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');
    const commentId = urlParams.get('commentId');

    if (postId) {
      setHighlightPostId(postId);

      if (commentId) {
        setHighlightCommentId(commentId);
      }

      setTimeout(() => {
        const postElement = document.getElementById(`post-${postId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

          postElement.classList.add('highlight-flash');
          setTimeout(() => {
            postElement.classList.remove('highlight-flash');
          }, 2000);
        }
      }, 500);
    }
  }, [posts]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleUpdateAlgorithm = useCallback(async (newPreferences) => {
    try {
      await User.updateMyUserData({ algorithm_preferences: newPreferences });
      setUser((prev) => ({ ...prev, algorithm_preferences: newPreferences }));
      setInCache(CACHE_CONFIG.USER_DATA, { ...user, algorithm_preferences: newPreferences });

      const pinnedItems = posts.filter((item) => item.is_pinned === true);
      const regularItems = posts.filter((item) => item.is_pinned !== true);

      const sortedRegularItems = applySortingAlgorithm(regularItems, newPreferences, user, followingList);
      const finalSortedItems = [...pinnedItems, ...sortedRegularItems];

      setPosts(finalSortedItems);
      setInCache(CACHE_CONFIG.FEED_POSTS, finalSortedItems);
    } catch (error) {
      showErrorMessage(error, 'Error updating algorithm preferences');
    }
  }, [user, followingList, applySortingAlgorithm, posts, showErrorMessage]);

  const handleNewPost = useCallback(async (postData) => {
    const tempId = `temp-${Date.now()}`;

    const isPoll = postData.isPoll === true || (postData.question && postData.options);

    console.log('[Feed.js] handleNewPost - isPoll:', isPoll, 'postData:', postData);

    let latestUser = user;
    try {
      const freshUserData = await User.me();
      if (freshUserData) {
        const cachedUserProfile = getFromCache(CACHE_CONFIG.USER_PROFILE_DATA);
        if (cachedUserProfile) {
          latestUser = { ...freshUserData, ...cachedUserProfile };
        } else {
          const profileDataRecords = await UserProfileData.filter({ user_email: freshUserData.email });
          if (profileDataRecords.length > 0) {
            setInCache(CACHE_CONFIG.USER_PROFILE_DATA, profileDataRecords[0]);
            latestUser = { ...freshUserData, ...profileDataRecords[0] };
          } else {
            latestUser = freshUserData;
          }
        }
        setUser(latestUser);
        setInCache(CACHE_CONFIG.USER_DATA, latestUser);
      }
    } catch (error) {
      console.warn('Could not fetch fresh user data, using cached:', error);
      latestUser = user;
    }

    if (!latestUser) {
      showErrorMessage(new Error("User not logged in or data unavailable."), "Creating post/poll");
      return;
    }

    if (isPoll) {
      const pollDataToSave = { ...postData };
      delete pollDataToSave.isPoll;

      console.log('[Feed.js] Creating poll with data:', pollDataToSave);

      const optimisticPoll = {
        ...pollDataToSave,
        id: tempId,
        created_by: latestUser.email,
        created_date: new Date().toISOString(),
        author_full_name: latestUser.full_name,
        author_avatar_url: latestUser.avatar_url,
        author_follower_count: latestUser.followers?.length || 0,
        author_cross_platform_identity: latestUser.cross_platform_identity,
        author_professional_credentials: latestUser.professional_credentials,
        author: {
          ...latestUser,
          subscription_tier: latestUser.subscription_tier || 'free',
          follower_count: latestUser.followers?.length || 0,
          kyc_status: latestUser.kyc_status
        },
        isPoll: true,
        total_votes: 0
      };

      const updatedPosts = [optimisticPoll, ...posts];
      setPosts(updatedPosts);
      setInCache(CACHE_CONFIG.FEED_POSTS, updatedPosts);

      try {
        const newPoll = await Poll.create(pollDataToSave);
        console.log('[Feed.js] Poll created successfully:', newPoll);

        const authorFollows = await Follow.filter({ following_email: latestUser.email });
        const currentFollowerCount = authorFollows.length;

        const finalUpdatedPosts = updatedPosts.map((p) => p.id === tempId ? {
          ...newPoll,
          isPoll: true,
          author: {
            ...latestUser,
            subscription_tier: latestUser.subscription_tier || 'free',
            follower_count: currentFollowerCount,
            kyc_status: latestUser.kyc_status
          },
          author_full_name: latestUser.full_name,
          author_username: latestUser.username,
          author_avatar_url: latestUser.avatar_url,
          author_follower_count: currentFollowerCount,
          author_cross_platform_identity: latestUser.cross_platform_identity,
          author_professional_credentials: latestUser.professional_credentials
        } : p);
        setPosts(finalUpdatedPosts);
        setInCache(CACHE_CONFIG.FEED_POSTS, finalUpdatedPosts);

        try {
          const questionPreview = (newPoll.question || postData.question || 'Untitled poll').substring(0, 30);
          await awardEP({
            actionType: "post_create",
            relatedContentId: newPoll.id,
            relatedContentType: "poll",
            description: `Created a poll: "${questionPreview}..."`
          });

          invalidateCache(CACHE_CONFIG.USER_DATA);
          invalidateCache({ key: `ep_data_${latestUser.email}` });

          await new Promise((resolve) => setTimeout(resolve, 1000));

          const freshUser = await User.me();
          if (freshUser) {
            setUser(freshUser);
            setInCache(CACHE_CONFIG.USER_DATA, freshUser);
            await loadEPData(freshUser);
          }
        } catch (epError) {
          console.error('EP award for poll failed:', epError);
          showErrorMessage(epError, 'EP award failed');
        }
        setShowCreatePostModal(false);
        return newPoll;
      } catch (error) {
        showErrorMessage(error, 'Creating poll');
        const revertedPosts = posts.filter((p) => p.id !== tempId);
        setPosts(revertedPosts);
        setInCache(CACHE_CONFIG.FEED_POSTS, revertedPosts);
        throw new Error('Failed to create poll. Please check your connection and try again.');
      }
    } else {
      const optimisticPost = {
        ...postData,
        id: tempId,
        created_by: latestUser.email,
        created_date: new Date().toISOString(),
        author_full_name: latestUser.full_name,
        author_avatar_url: latestUser.avatar_url,
        author_follower_count: latestUser.followers?.length || 0,
        author_cross_platform_identity: latestUser.cross_platform_identity,
        author_professional_credentials: latestUser.professional_credentials,
        author: {
          ...latestUser,
          subscription_tier: latestUser.subscription_tier || 'free',
          follower_count: latestUser.followers?.length || 0,
          kyc_status: latestUser.kyc_status
        },
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0,
        ep_rewards_earned: 20,
        liked_by: [],
        moderation_status: 'approved',
        recommendationReason: "Your new echo",
        content: postData.content || "",
        media_urls: postData.media_urls || [],
        youtube_video_id: postData.youtube_video_id,
        youtube_thumbnail_url: postData.youtube_thumbnail_url,
        youtube_video_title: postData.youtube_video_title
      };

      const updatedPosts = [optimisticPost, ...posts];
      setPosts(updatedPosts);
      setInCache(CACHE_CONFIG.FEED_POSTS, updatedPosts);

      try {
        console.log('[Feed.js] About to create post with media_urls:', postData.media_urls);
        console.log('[Feed.js] Full postData being sent to Post.create:', postData);
        
        const dataToSave = {
          ...postData,
          content: postData.content || "",
          media_urls: postData.media_urls || [],
          tags: postData.tags || [],
          privacy_level: "public",
          is_repost: false,
          original_post_id: postData.original_post_id,
          original_author: postData.original_author,
          repost_comment: postData.repost_comment,
          author_full_name: latestUser.full_name,
          author_avatar_url: latestUser.avatar_url,
          author_follower_count: latestUser.followers?.length || 0,
          author_cross_platform_identity: latestUser.cross_platform_identity,
          author_professional_credentials: latestUser.professional_credentials,
          moderation_status: 'approved',
          youtube_video_id: postData.youtube_video_id,
          youtube_thumbnail_url: postData.youtube_thumbnail_url,
          youtube_video_title: postData.youtube_video_title
        };
        
        console.log('[Feed.js] Data being saved to DB:', dataToSave);
        console.log('[Feed.js] media_urls in dataToSave:', dataToSave.media_urls);
        
        const newPost = await Post.create(dataToSave);
        
        console.log('[Feed.js] Post created successfully. newPost.media_urls:', newPost.media_urls);
        console.log('[Feed.js] Full newPost object:', newPost);

        // Process content provenance (hashing and optional blockchain timestamping)
        console.log('[Feed.js] Post created. postData.enable_blockchain_timestamp:', postData.enable_blockchain_timestamp, 'postData.license_id:', postData.license_id);

        if (postData.enable_blockchain_timestamp || postData.license_id) {
          try {
            console.log('[Feed.js] Invoking processPostCreation with post_id:', newPost.id);

            const provenanceResponse = await base44.functions.invoke('processPostCreation', {
              post_id: newPost.id,
              enable_blockchain_timestamp: postData.enable_blockchain_timestamp || false
            });

            console.log('[Feed.js] processPostCreation response:', provenanceResponse);

            if (provenanceResponse?.data?.content_hash) {
              console.log('[Feed.js] Content provenance processed:', provenanceResponse.data);

              // Update the newPost object with provenance data
              newPost.content_hash = provenanceResponse.data.content_hash;
              if (provenanceResponse.data.blockchain_tx_id) {
                newPost.blockchain_tx_id = provenanceResponse.data.blockchain_tx_id;
              }

              // Show success message if blockchain timestamped
              if (provenanceResponse.data.blockchain_tx_id) {
                setErrorMessage("✓ Post created and timestamped on blockchain! 3 $eqoflo deducted.");
                setTimeout(() => setErrorMessage(null), 5000);
              } else {
                setErrorMessage("✓ Post created with content hash!");
                setTimeout(() => setErrorMessage(null), 3000);
              }
            }

            if (provenanceResponse?.data?.timestamp_error) {
              console.error('[Feed.js] Blockchain timestamp error:', provenanceResponse.data.timestamp_error);
              setErrorMessage('⚠️ ' + provenanceResponse.data.timestamp_error);
              setTimeout(() => setErrorMessage(null), 6000);
            }
          } catch (provenanceError) {
            console.error('[Feed.js] Failed to process content provenance:', provenanceError);
            console.error('[Feed.js] Error details:', provenanceError.response || provenanceError.message);
            setErrorMessage('⚠️ Content created but provenance processing failed: ' + (provenanceError.message || 'Unknown error'));
            setTimeout(() => setErrorMessage(null), 6000);
          }
        }

        // Post to X if toggle was enabled
        if (postData.post_to_x && newPost.id) {
          try {
            const tweetText = newPost.content.length > 280 
              ? newPost.content.substring(0, 277) + '...'
              : newPost.content;
            
            const xResult = await postToX({ text: tweetText });
            console.log('X posting result:', xResult);
            
            if (xResult?.data?.success && xResult?.data?.tweetId) {
              await Post.update(newPost.id, {
                x_tweet_id: xResult.data.tweetId,
                x_posted_at: new Date().toISOString()
              });
              console.log('Successfully posted to X with tweet ID:', xResult.data.tweetId);
            } else {
              console.warn('X posting did not return success or tweetId:', xResult);
            }
          } catch (xError) {
            console.error('Failed to post to X:', xError);
            console.error('X error details:', xError?.response?.data || xError.message);
            // Don't block the post creation if X posting fails
          }
        }

        const authorFollows = await Follow.filter({ following_email: latestUser.email });
        const currentFollowerCount = authorFollows.length;

        const finalUpdatedPosts = updatedPosts.map((p) => p.id === tempId ? {
          ...newPost,
          author: {
            ...latestUser,
            subscription_tier: latestUser.subscription_tier || 'free',
            follower_count: currentFollowerCount,
            kyc_status: latestUser.kyc_status
          },
          recommendationReason: "Your new echo",
          content: newPost.content || "",
          media_urls: newPost.media_urls || [],
          youtube_video_id: newPost.youtube_video_id,
          youtube_thumbnail_url: newPost.youtube_thumbnail_url,
          youtube_video_title: newPost.youtube_video_title
        } : p);
        setPosts(finalUpdatedPosts);
        setInCache(CACHE_CONFIG.FEED_POSTS, finalUpdatedPosts);

        try {
          const contentPreview = (newPost.content || postData.content || 'New post').substring(0, 30);
          const epResult = await awardEP({
            actionType: "post_create",
            relatedContentId: newPost.id,
            relatedContentType: "post",
            description: `Created an echo: "${contentPreview}..."`
          });

          const updatedWithEp = finalUpdatedPosts.map((p) => p.id === newPost.id ? { ...p, ep_rewards_earned: 20 } : p);
          setPosts(updatedWithEp);
          setInCache(CACHE_CONFIG.FEED_POSTS, updatedWithEp);

          invalidateCache(CACHE_CONFIG.USER_DATA);
          invalidateCache({ key: `ep_data_${latestUser.email}` });

          await new Promise((resolve) => setTimeout(resolve, 1000));

          try {
            const freshUser = await User.me();

            if (freshUser) {
              setUser(freshUser);
              setInCache(CACHE_CONFIG.USER_DATA, freshUser);
              await loadEPData(freshUser);
            }
          } catch (freshUserError) {
            console.error('Error fetching fresh user data:', freshUserError);

            invalidateCache({ key: `ep_data_${latestUser.email}` });

            let retries = 3;
            while (retries > 0) {
              try {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const retryUser = await User.me();
                if (retryUser) {
                  setUser(retryUser);
                  setInCache(CACHE_CONFIG.USER_DATA, retryUser);
                  await loadEPData(retryUser);
                  break;
                }
              } catch (retryError) {
                console.error(`Retry ${4 - retries} failed:`, retryError);
                retries--;
              }
            }

            if (retries === 0) {
              showErrorMessage(new Error('Could not refresh EP data'), 'EP data refresh failed');
            }
          }
        } catch (epError) {
          console.error('EP award failed:', epError);
          showErrorMessage(epError, 'EP award failed');
        }

        setShowCreatePostModal(false);

        return newPost;
      } catch (error) {
        showErrorMessage(error, 'Creating post');
        const revertedPosts = posts.filter((p) => p.id !== tempId);
        setPosts(revertedPosts);
        setInCache(CACHE_CONFIG.FEED_POSTS, revertedPosts);
        throw new Error('Failed to create post. Please check your connection and try again.');
      }
    }
  }, [user, posts, showErrorMessage, loadEPData]);

  const handleLike = useCallback(async (postFromCard) => {
    if (!user) return;

    const post = posts.find((p) => p.id === postFromCard.id);
    if (!post) {
      console.error("Could not find post in feed state to like.");
      return;
    }

    const originalLikedBy = post.liked_by || [];
    const isCurrentlyLiked = originalLikedBy.includes(user.email);

    const newLikedBy = isCurrentlyLiked ?
    originalLikedBy.filter((email) => email !== user.email) :
    [...originalLikedBy, user.email];

    const newLikesCount = newLikedBy.length;

    const updatedPostOptimistic = {
      ...post,
      liked_by: newLikedBy,
      likes_count: newLikesCount
    };

    setPosts((prevPosts) => {
      const updated = prevPosts.map((p) => p.id === post.id ? updatedPostOptimistic : p);
      setInCache(CACHE_CONFIG.FEED_POSTS, updated);
      return updated;
    });

    try {
      await Post.update(post.id, {
        liked_by: newLikedBy,
        likes_count: newLikesCount
      });

      if (!isCurrentlyLiked) {
        try {
          await awardEP({
            actionType: 'post_like',
            relatedContentId: post.id,
            relatedContentType: 'post',
            description: `Liked a post by ${post.author_full_name || 'another user'}`
          });
        } catch (epError) {
          console.warn('EP award failed for like, but like was successful:', epError);
        }

        if (post.created_by !== user.email) {
          try {
            await awardEP({
              actionType: 'post_like',
              relatedContentId: post.id,
              relatedContentType: 'post',
              description: `Your post received a like from ${user.full_name}`,
              recipientEmail: post.created_by
            });

            const updatedPostWithEP = {
              ...updatedPostOptimistic,
              ep_rewards_earned: (post.ep_rewards_earned || 0) + 1
            };
            await Post.update(post.id, { ep_rewards_earned: updatedPostWithEP.ep_rewards_earned });

            setPosts((prevPosts) => {
              const updated = prevPosts.map((p) => p.id === post.id ? updatedPostWithEP : p);
              setInCache(CACHE_CONFIG.FEED_POSTS, updated);
              return updated;
            });
          } catch (epError) {
            console.warn('EP award failed for like to author, but like was successful:', epError);
          }

          try {
            await createNotification(
              "like",
              post.created_by,
              user.full_name,
              user.avatar_url,
              `${user.full_name} liked your echo`,
              post.id,
              `${createPageUrl('Feed')}?postId=${post.id}`
            );
          } catch (notifError) {
            console.warn('Notification creation failed for like, but like was successful:', notifError);
          }
        }

        invalidateCache(CACHE_CONFIG.USER_DATA);
        invalidateCache({ key: `ep_data_${user.email}` });
        await new Promise((resolve) => setTimeout(resolve, 500));
        const freshUser = await User.me();
        if (freshUser) {
          setUser(freshUser);
          setInCache(CACHE_CONFIG.USER_DATA, freshUser);
          await loadEPData(freshUser);
        }
      }
    } catch (error) {
      showErrorMessage(error, 'Liking post');
      setPosts((prevPosts) => {
        const reverted = prevPosts.map((p) => p.id === post.id ? post : p);
        setInCache(CACHE_CONFIG.FEED_POSTS, reverted);
        return reverted;
      });
    }
  }, [user, posts, showErrorMessage, createNotification, loadEPData]);

  const handleRepost = useCallback(async (post, repostComment = "") => {
    if (!user) return;

    const hasComment = repostComment && repostComment.trim().length > 0;

    try {
      const epEarned = hasComment ? 14 : 5;
      
      const repostData = {
        content: post.content,
        media_urls: post.media_urls || [],
        tags: post.tags || [],
        privacy_level: "public",
        is_repost: true,
        original_post_id: post.id,
        original_author: post.author_full_name || post.created_by,
        repost_comment: hasComment ? repostComment.trim() : "",
        author_full_name: user.full_name,
        author_avatar_url: user.avatar_url,
        youtube_video_id: post.youtube_video_id,
        youtube_thumbnail_url: post.youtube_thumbnail_url,
        youtube_video_title: post.youtube_video_title,
        moderation_status: 'approved',
        ep_rewards_earned: epEarned
      };

      const newRepost = await Post.create(repostData);

      // Add the repost to the feed immediately
      const repostWithAuthor = {
        ...newRepost,
        author: {
          ...user,
          subscription_tier: user.subscription_tier || 'free',
          follower_count: user.followers?.length || 0,
          kyc_status: user.kyc_status
        },
        author_full_name: user.full_name,
        author_username: user.username,
        author_avatar_url: user.avatar_url,
        author_follower_count: user.followers?.length || 0,
        author_cross_platform_identity: user.cross_platform_identity,
        author_professional_credentials: user.professional_credentials,
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0,
        liked_by: [],
        ep_rewards_earned: epEarned,
        recommendationReason: "Your repost"
      };

      const updatedOriginalPost = {
        ...post,
        reposts_count: (post.reposts_count || 0) + 1
      };

      const updatedPosts = [
        repostWithAuthor,
        ...posts.map((p) => p.id === post.id ? updatedOriginalPost : p)
      ];
      
      setPosts(updatedPosts);
      setInCache(CACHE_CONFIG.FEED_POSTS, updatedPosts);

      await Post.update(post.id, { reposts_count: updatedOriginalPost.reposts_count });

      try {
        // Award 14 EP if reposted with comment, 5 EP if without
        const actionType = hasComment ? "repost_with_comment" : "repost";
        await awardEP({
          actionType: actionType,
          relatedContentId: post.id,
          relatedContentType: "post",
          description: hasComment 
            ? `Shared an echo by ${post.author_full_name} with your thoughts`
            : `Shared an echo by ${post.author_full_name}`,
          recipientEmail: post.created_by
        });
        
        // Refresh user data and EP stats
        invalidateCache(CACHE_CONFIG.USER_DATA);
        invalidateCache({ key: `ep_data_${user.email}` });
        
        const freshUser = await User.me();
        if (freshUser) {
          setUser(freshUser);
          setInCache(CACHE_CONFIG.USER_DATA, freshUser);
          await loadEPData(freshUser);
        }
      } catch (epError) {
        console.warn('EP award failed for repost, but repost was successful:', epError);
      }

      try {
        await createNotification(
          "repost",
          post.created_by,
          user.full_name,
          user.avatar_url,
          hasComment 
            ? `${user.full_name} shared your echo with a comment`
            : `${user.full_name} shared your echo`,
          post.id,
          `${createPageUrl('Feed')}?postId=${post.id}`
        );
      } catch (notifError) {
        console.warn('Notification creation failed for repost, but repost was successful:', notifError);
      }

      setShowRepostModal(false);
      setRepostingPost(null);

    } catch (error) {
      showErrorMessage(error, 'Creating repost');
    }
  }, [user, posts, showErrorMessage, createNotification, loadEPData]);

  const handleOpenRepostModal = useCallback((post) => {
    setRepostingPost(post);
    setShowRepostModal(true);
  }, []);

  const handleCommentAdded = useCallback(async (post, newComment) => {
    if (!user) return;

    const updatedPost = {
      ...post,
      comments_count: (post.comments_count || 0) + 1
    };
    const updatedPosts = posts.map((p) => p.id === post.id ? updatedPost : p);
    setPosts(updatedPosts);
    setInCache(CACHE_CONFIG.FEED_POSTS, updatedPosts);

    try {
      await Post.update(post.id, { comments_count: updatedPost.comments_count });

      try {
        await awardEP({
          actionType: "comment_create",
          relatedContentId: post.id,
          relatedContentType: "post",
          description: `Replied to an echo by ${post.author_full_name}`,
          recipientEmail: post.created_by
        });

        if (user) {
          invalidateCache({ key: `ep_data_${user.email}` });
          loadEPData(user);
        }
      } catch (epError) {
        console.warn('EP award failed for comment, but comment was created:', epError);
      }

      if (post.created_by !== user.email) {
        try {
          console.log('About to create comment notification for:', post.created_by);
          console.log('New comment object:', newComment);

          let actionUrl = `${createPageUrl('Feed')}?postId=${post.id}`;
          if (newComment && newComment.id) {
            actionUrl += `&commentId=${newComment.id}`;
          }

          await createNotification(
            "comment",
            post.created_by,
            user.full_name,
            user.avatar_url,
            `${user.full_name} replied to your echo`,
            post.id,
            actionUrl
          );
          console.log('Comment notification created successfully');
        } catch (notifError) {
          console.error('CRITICAL: Notification creation failed for comment:', notifError);
          console.error('Notification details:', {
            type: 'comment',
            recipient: post.created_by,
            actor: user.full_name,
            postId: post.id,
            commentId: newComment?.id || 'undefined'
          });
        }
      }

    } catch (error) {
      showErrorMessage(error, 'Adding comment');
      const revertedPosts = posts.map((p) => p.id === post.id ? post : p);
      setPosts(revertedPosts);
      setInCache(CACHE_CONFIG.FEED_POSTS, revertedPosts);
    }
  }, [user, posts, showErrorMessage, createNotification, loadEPData]);

  const handleWelcomeComplete = useCallback(async () => {
    try {
      await updateUserProfileData({
        updateData: { has_completed_onboarding: true }
      });
      setUser((prev) => ({ ...prev, has_completed_onboarding: true }));
      setShowWelcomeModal(false);
    } catch (error) {
      showErrorMessage(error, 'Error completing onboarding');
      setShowWelcomeModal(false);
    }
  }, [updateUserProfileData, setUser, setShowWelcomeModal, showErrorMessage]);

  const handleWelcomeClose = useCallback(() => {
    setShowWelcomeModal(false);
  }, [setShowWelcomeModal]);

  const handleTermsAgree = async () => {
    try {
      await updateUserProfileData({ updateData: { has_agreed_terms_of_service: true } });
      setUser((prevUser) => ({ ...prevUser, has_agreed_terms_of_service: true }));
      setShowTermsModal(false);

      if (user && !user.has_agreed_privacy_policy) {
        setShowPrivacyModal(true);
      } else if (user && !user.has_agreed_eqoflow_declaration) {
        setShowDeclarationModal(true);
      } else if (user && !user.has_completed_onboarding) {
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error('Failed to save terms agreement:', error);
      showErrorMessage(error, 'Failed to save terms agreement');
      alert('Could not save your agreement. Please try again.');
    }
  };

  const handlePrivacyAgree = async () => {
    try {
      await updateUserProfileData({ updateData: { has_agreed_privacy_policy: true } });
      setUser((prevUser) => ({ ...prevUser, has_agreed_privacy_policy: true }));
      setShowPrivacyModal(false);

      if (user && !user.has_agreed_eqoflow_declaration) {
        setShowDeclarationModal(true);
      } else if (user && !user.has_completed_onboarding) {
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error('Failed to save privacy agreement:', error);
      showErrorMessage(error, 'Failed to save privacy agreement');
      alert('Could not save your agreement. Please try again.');
    }
  };

  const handleDeclarationAgree = async (optionalConsents) => {
    try {
      const updateData = {
        has_agreed_eqoflow_declaration: true,
        ...optionalConsents
      };

      await updateUserProfileData({ updateData });
      setUser((prevUser) => ({ ...prevUser, ...updateData }));
      setShowDeclarationModal(false);

      if (user && !user.has_completed_onboarding) {
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error('Failed to save declaration agreement:', error);
      showErrorMessage(error, 'Failed to save declaration agreement');
      alert('Could not save your agreement. Please try again.');
    }
  };

  const handleEditPost = useCallback((post) => {
    setEditingPost(post);
    setShowEditModal(true);
  }, [setEditingPost, setShowEditModal]);

  const handleDeletePost = useCallback(async (itemId) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    const itemToDelete = posts.find((item) => item.id === itemId);

    if (!itemToDelete) {
      showErrorMessage(new Error("Item not found in feed state."), "Deleting item");
      return;
    }

    const isPoll = itemToDelete.isPoll === true || !!itemToDelete.question;
    const itemType = isPoll ? 'poll' : 'echo';

    try {
      if (isPoll) {
        await Poll.delete(itemId);
      } else {
        await Post.delete(itemId);
      }

      const updatedPosts = posts.filter((p) => p.id !== itemId);
      setPosts(updatedPosts);
      setInCache(CACHE_CONFIG.FEED_POSTS, updatedPosts);

    } catch (error) {
      showErrorMessage(error, `Error deleting ${itemType}`);
      alert(`Failed to delete ${itemType}. Please try again.`);
    }
  }, [posts, showErrorMessage]);

  const handleSaveEditedPost = useCallback(async (postId, updatedData) => {
    try {
      await Post.update(postId, updatedData);

      const updatedPosts = posts.map((p) =>
      p.id === postId ? { ...p, ...updatedData } : p
      );
      setPosts(updatedPosts);
      setInCache(CACHE_CONFIG.FEED_POSTS, updatedPosts);

      setShowEditModal(false);
      setEditingPost(null);
    } catch (error) {
      showErrorMessage(error, 'Error updating post');
      alert('Failed to update echo. Please try again.');
    }
  }, [posts, showErrorMessage]);

  const handleReactionChange = useCallback((updatedPost) => {
    const updatedPosts = posts.map((p) => p.id === updatedPost.id ? updatedPost : p);
    setPosts(updatedPosts);
    setInCache(CACHE_CONFIG.FEED_POSTS, updatedPosts);
  }, [posts]);

  const handlePollUpdate = useCallback((updatedPoll) => {
    const updatedPollWithFlag = { ...updatedPoll, isPoll: true };
    const updatedPosts = posts.map((p) => p.id === updatedPollWithFlag.id ? updatedPollWithFlag : p);
    setPosts(updatedPosts);
    setInCache(CACHE_CONFIG.FEED_POSTS, updatedPosts);
  }, [posts]);

  const handleFlagPost = useCallback(async (post, reason) => {
    if (!user || user.role !== 'admin') {
      showErrorMessage({ message: "You don't have permission to perform this action." }, 'Flagging post');
      return;
    }

    const originalPosts = posts;

    try {
      const updatedPosts = posts.map((p) =>
      p.id === post.id ? { ...p, moderation_status: 'flagged' } : p
      );
      setPosts(updatedPosts);
      setInCache(CACHE_CONFIG.FEED_POSTS, updatedPosts);

      await Post.update(post.id, {
        moderation_status: 'flagged',
        moderation_details: {
          reason: 'Admin Flag',
          notes: reason
        }
      });

      await ModerationLog.create({
        content_id: post.id,
        content_type: 'post',
        content_snapshot: post.content.substring(0, 500),
        moderation_result: 'flagged',
        moderation_reason: 'admin_review',
        moderator_email: user.email,
        moderator_notes: reason,
        status: 'final'
      });

      if (post.created_by !== user.email) {
        try {
          await createNotification(
            'flag',
            post.created_by,
            "EqoFlow Moderation",
            "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/5c056ed12_eqoflow-removebg-preview.png",
            `Your post has been flagged by a moderator. Reason: "${reason}". You can review this action in the Transparency Hub.`,
            post.id,
            `${createPageUrl('TransparencyHub')}?postId=${post.id}`
          );
        } catch (notifError) {
          console.warn('Notification creation failed for post flag:', notifError);
        }
      }

    } catch (error) {
      showErrorMessage(error, 'Flagging post');
      setPosts(originalPosts);
      setInCache(CACHE_CONFIG.FEED_POSTS, originalPosts);
      throw error;
    }
  }, [user, posts, showErrorMessage, createNotification]);

  const handleFlagPoll = useCallback(async (poll, reason) => {
    if (!user || user.role !== 'admin') {
      showErrorMessage({ message: "You don't have permission to perform this action." }, 'Flagging poll');
      return;
    }

    const originalPosts = posts;

    try {
      const updatedPosts = posts.map((p) =>
      p.id === poll.id ? { ...p, moderation_status: 'flagged' } : p
      );
      setPosts(updatedPosts);
      setInCache(CACHE_CONFIG.FEED_POSTS, updatedPosts);

      await Poll.update(poll.id, {
        moderation_status: 'flagged',
        moderation_details: {
          reason: 'Admin Flag',
          notes: reason
        }
      });

      await ModerationLog.create({
        content_id: poll.id,
        content_type: 'poll',
        content_snapshot: poll.question.substring(0, 500),
        moderation_result: 'flagged',
        moderation_reason: 'admin_review',
        moderator_email: user.email,
        moderator_notes: reason,
        status: 'final'
      });

      if (poll.created_by !== user.email) {
        try {
          await createNotification(
            'flag',
            poll.created_by,
            "EqoFlow Moderation",
            "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/5c056ed12_eqoflow-removebg-preview.png",
            `Your poll has been flagged by a moderator. Reason: "${reason}". You can review this action in the Transparency Hub.`,
            poll.id,
            `${createPageUrl('TransparencyHub')}?pollId=${poll.id}`
          );
        } catch (notifError) {
          console.warn('Notification creation failed for poll flag:', notifError);
        }
      }

    } catch (error) {
      showErrorMessage(error, 'Flagging poll');
      setPosts(originalPosts);
      setInCache(CACHE_CONFIG.FEED_POSTS, originalPosts);
      throw error;
    }
  }, [user, posts, showErrorMessage, createNotification]);

  const handleTogglePollPin = useCallback(async (poll) => {
    console.log('[Feed.js] handleTogglePollPin received poll:', poll);
    console.log('[Feed.js] poll.id:', poll?.id);

    if (!user || user.role !== 'admin') {
      showErrorMessage({ message: "You don't have permission to perform this action." }, 'Toggling poll pin status');
      return;
    }

    if (!poll) {
      console.error('[Feed.js] Poll is null or undefined');
      showErrorMessage({ message: "Poll data is missing." }, 'Toggling poll pin status');
      return;
    }

    if (!poll.id) {
      console.error('[Feed.js] Poll ID is missing. Full poll object:', poll);
      showErrorMessage({ message: "Poll ID is missing." }, 'Toggling poll pin status');
      return;
    }

    const originalPosts = posts;

    try {
      const newPinnedState = !poll.is_pinned;

      console.log('[Feed.js] Updating poll', poll.id, 'to pinned state:', newPinnedState);

      const updatedPoll = { ...poll, is_pinned: newPinnedState };
      const updatedPosts = posts.map((p) => p.id === poll.id ? updatedPoll : p);
      setPosts(updatedPosts);
      setInCache(CACHE_CONFIG.FEED_POSTS, updatedPosts);

      await Poll.update(poll.id, { is_pinned: newPinnedState });

      setErrorMessage(newPinnedState ? "Poll pinned to top of feed!" : "Poll unpinned from feed!");
      setTimeout(() => setErrorMessage(null), 3000);

    } catch (error) {
      console.error('[Feed.js] Error toggling poll pin:', error);
      showErrorMessage(error, 'Toggling poll pin status');
      setPosts(originalPosts);
      setInCache(CACHE_CONFIG.FEED_POSTS, originalPosts);
    }
  }, [user, posts, showErrorMessage]);

  const filteredPosts = posts;

  const userColorScheme = getColorScheme(user?.color_scheme);

  // Check if this is a public shared post view
  const urlParams = new URLSearchParams(window.location.search);
  const isSharedPostView = urlParams.get('postId') && !user;

  return (
    <div className="min-h-screen bg-black text-white p-3 md:p-6">
      <style>{`
        @keyframes highlight-flash {
          0%, 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
          50% { box-shadow: 0 0 20px 5px rgba(168, 85, 247, 0.6); }
        }

        .highlight-flash {
          animation: highlight-flash 2s ease-in-out;
        }
      `}</style>



      <AnimatePresence>
        {errorMessage &&
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-2xl">
            <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
                <Button
                onClick={() => setErrorMessage(null)}
                variant="ghost"
                size="sm"
                className="text-red-300 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {showTermsModal &&
      <TermsOfServiceModal
        onClose={() => setShowTermsModal(false)}
        onAgree={handleTermsAgree} />

      }

      {showPrivacyModal &&
      <PrivacyPolicyModal
        onClose={() => setShowPrivacyModal(false)}
        onAgree={handlePrivacyAgree} />

      }

      {showDeclarationModal &&
      <EqoFlowDeclarationModal
        onClose={() => setShowDeclarationModal(false)}
        onAgree={handleDeclarationAgree} />

      }

      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        onSubmit={handleNewPost}
        user={user} />


      {showWelcomeModal && user && user.has_completed_onboarding === false &&
      <WelcomeModal
        user={user}
        onClose={handleWelcomeClose}
        onComplete={handleWelcomeComplete}
        bonusAmount={welcomeBonusAmount} />

      }

      {showEditModal && editingPost &&
      <EditPostModal
        post={editingPost}
        user={user}
        onSave={handleSaveEditedPost}
        onClose={() => {
          setShowEditModal(false);
          setEditingPost(null);
        }} />

      }

      <RoadmapModal
        isOpen={showRoadmapModal}
        onClose={() => setShowRoadmapModal(false)} />

      {showRepostModal && repostingPost &&
      <RepostModal
        post={repostingPost}
        onRepost={handleRepost}
        onClose={() => {
          setShowRepostModal(false);
          setRepostingPost(null);
        }} />
      }


      {isLoading && posts.length === 0 ?
      <div className="flex items-center justify-center min-h-[calc(10vh)]">
          <QuantumFlowLoader />
        </div> :

      <div className="max-w-7xl mx-auto">
          <div className="bg-[#000000] pt-3 pb-6 sticky top-0 z-10 backdrop-blur-sm -mx-3 md:-mx-6 md:pt-6 md:pb-8 flex flex-col md:flex-row md:justify-between md:items-start">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center justify-between mb-2">
                <h1
                  className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${userColorScheme.primary}, ${userColorScheme.secondary})`
                  }}
                >
                  Activity Feed
                </h1>

                {user &&
              <div className="flex items-center gap-2">
                    <Button
                      onClick={() => navigate(createPageUrl('OrbitalFeed'))}
                      variant="outline"
                      className="border-purple-500/30 text-white hover:bg-purple-500/10 px-3 py-2"
                      size="sm"
                    >
                      <Map className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Orbital View</span>
                    </Button>
                    <Button
                  onClick={() => setShowAlgorithmSettings(!showAlgorithmSettings)}
                  variant="outline"
                  className="lg:hidden border-purple-500/30 text-white hover:bg-purple-500/10 p-2"
                  size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
              }
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <p className="text-gray-400 text-sm md:text-base">
                  Stay updated with the latest from your network
                </p>

                <div className="hidden md:block h-4 w-px bg-gray-700"></div>

                <a href="https://discord.gg/EjxuUhJKWE" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm cursor-pointer hover:opacity-80 transition-opacity" style={{ color: userColorScheme.primary }}>
                  <Users className="w-4 h-4" />
                  <span>Join our Discord</span>
                </a>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {hasNewPosts &&
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 md:mb-6 p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">New posts available</span>
                </div>
                <Button
              onClick={refreshFeed}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-4 py-2 rounded-lg w-full md:w-auto">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Refresh Feed
                </Button>
              </motion.div>
          }
          </AnimatePresence>

          <AnimatePresence>
            {showAlgorithmSettings &&
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 md:mb-8">
                <AlgorithmSelector
              preferences={user?.algorithm_preferences}
              onUpdate={handleUpdateAlgorithm}
              onApply={() => setShowAlgorithmSettings(false)} />

              </motion.div>
          }
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
            <div className="lg:col-span-3 space-y-4 md:space-y-6 order-1">
              {user &&
            <TrendingCommunitiesSlider
              user={user}
              onUserUpdate={handleUserUpdate}
              showSlider={showTrendingCommunities}
              setShowSlider={setShowTrendingCommunities} />

            }

              {user &&
            <div className="flex justify-center my-4">
                  <Button
                onClick={() => setShowCreatePostModal(true)} className="bg-slate-950 text-white px-6 py-3 text-sm font-medium rounded-lg inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10 from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 shadow-lg hover:shadow-blue-500/50 transition-shadow duration-300">

                    <Plus className="w-5 h-5 mr-2" />
                    Broadcast an Echo
                  </Button>
                </div>
            }

              {user?.algorithm_preferences && Object.keys(user.algorithm_preferences).length > 0 ?
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-black/20 rounded-xl border border-purple-500/20 gap-3">
                  <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="text-white text-sm">
                      Sorted by: <span className="font-medium text-purple-400">
                        {user.algorithm_preferences.primary_algorithm?.replace('_', ' ') || 'Personalized'}
                      </span>
                    </span>
                  </div>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs w-fit">
                    Custom Algorithm Active
                  </Badge>
                </div> :

            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-black/20 rounded-xl border border-purple-500/20 gap-3">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="text-white text-sm">
                      Sorted by: <span className="font-medium text-purple-400">Latest</span>
                    </span>
                  </div>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs w-fit">
                    Default Algorithm Active
                  </Badge>
                </div>
            }

              <AnimatePresence>
                {filteredPosts.map((item, index) => {
                const isPollItem = !!item.question;

                console.log('Rendering item:', item.id, 'has question:', !!item.question, 'has content:', !!item.content);

                return isPollItem ?
                <PollCard
                  key={item.id}
                  poll={item}
                  user={user}
                  onUserUpdate={handleUserUpdate}
                  index={index}
                  onPollUpdate={handlePollUpdate}
                  onDelete={handleDeletePost}
                  onFlag={handleFlagPoll}
                  onTogglePin={handleTogglePollPin} /> :


                <PostCard
                  key={item.id}
                  post={item}
                  currentUser={user}
                  onUserUpdate={handleUserUpdate}
                  author={item.author}
                  onLike={handleLike}
                  onRepost={handleOpenRepostModal}
                  onCommentAdded={handleCommentAdded}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                  onReactionChange={handleReactionChange}
                  onFlag={handleFlagPost}
                  index={index}
                  recommendationReason={item.recommendationReason}
                  highlightCommentId={highlightPostId === item.id ? highlightCommentId : null} />;


              })}
              </AnimatePresence>

              {filteredPosts.length === 0 && !isLoading &&
            <div className="dark-card rounded-2xl p-8 md:p-12 text-center neon-glow">
                  <Zap className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-purple-400" />
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No echoes or polls yet</h3>
                  <p className="text-gray-500">Be the first to broadcast an echo or create a poll!</p>
                </div>
            }
            </div>

            <div className="lg:col-span-1 order-2">
              <div className="lg:sticky lg:top-6 space-y-4 md:space-y-6">
                {user &&
              <>
                    <Button
                  onClick={() => setShowAlgorithmSettings(!showAlgorithmSettings)}
                  variant="outline" className="bg-slate-950 text-white px-4 py-4 text-sm font-medium rounded-md justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 hidden lg:flex w-full border-purple-500/30 hover:bg-purple-500/10 md:py-6 md:text-base items-center">

                      <Settings className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
                      Customize Feed
                    </Button>

                    <Card className="dark-card">
                      <CardHeader className="bg-[#000000] pb-3 p-6 flex flex-col space-y-1.5 md:pb-4">
                        <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                          <Zap className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                          Your EP Stats
                        </h3>
                      </CardHeader>
                      <CardContent className="bg-[#000000] pt-0 p-6 space-y-3 md:space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm md:text-base">Today's EP</span>
                          <span className="text-cyan-400 font-bold text-sm md:text-base">+{epStats.today} EP</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm md:text-base">This Week</span>
                          <span className="text-purple-400 font-bold text-sm md:text-base">+{epStats.week} EP</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm md:text-base">Token Balance</span>
                          <span className="text-yellow-400 font-bold text-sm md:text-base">{((user.token_balance || 0) + (user.tokens_on_hold || 0)).toLocaleString()} $EQOFLO</span>
                        </div>
                      </CardContent>
                    </Card>

                    <TrendingTopics />
                  </>
              }
              </div>
            </div>
          </div>
        </div>
      }

      {showScrollToTop &&
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
          <Button
          onClick={scrollToTop}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg"
          size="icon">
            <ArrowUp className="w-5 h-5" />
          </Button>
        </div>
      }
    </div>);

}