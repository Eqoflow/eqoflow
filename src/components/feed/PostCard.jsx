import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Share2,
  MessageCircle,
  User,
  Globe,
  Users,
  Lock,
  Repeat,
  Shield,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  Sparkles,
  FileText,
  Zap,
  Pin,
  PinOff,
  Flag,
  X,
  UserPlus,
  UserCheck,
  BrainCircuit,
  RefreshCw } from
"lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import CommentSection from "./CommentSection";
import NFTAccessChecker from "../nft/NFTAccessChecker";
import NFTBadge from "./NFTBadge";
import CrossPlatformBadges from "../identity/CrossPlatformBadges";
import CreatorBadge from "../identity/CreatorBadge";
import PioneerBadge from "../identity/PioneerBadge";
import ProfessionalBadge from "../identity/ProfessionalBadge";
import CoCEOBadge from '../identity/CoCEOBadge';
import CMOBadge from '../identity/CMOBadge';
import CoFounderBadge from '../identity/CoFounderBadge';
import CFOBadge from '../identity/CFOBadge';
import EqoPlusLiteBadge from '../identity/EqoPlusLiteBadge';
import EqoPlusCreatorBadge from '../identity/EqoPlusCreatorBadge';
import EqoPlusProBadge from '../identity/EqoPlusProBadge';
import CCOBadge from '../identity/CCOBadge';
import KYCVerifiedBadge from '../identity/KYCVerifiedBadge';
import ReactionBar from './ReactionBar';
import { Post } from "@/entities/Post";
import { Comment } from "@/entities/Comment";
import { awardEP } from "@/functions/awardEP";
import { togglePostPin } from "@/functions/togglePostPin";
import { Community } from '@/entities/Community';
import FlagPostModal from './FlagPostModal';
import VideoPlayerModal from './VideoPlayerModal';
import { recordPostImpression } from '@/functions/recordPostImpression';
import { filterProfanity } from '@/components/utils/profanityFilter';
import { base44 } from "@/api/base44Client";
import ImageSlideshow from './ImageSlideshow';
import { maskEmail } from '../utils/maskData';

// This function finds URLs in a string and wraps them in an anchor tag.
const linkify = (text) => {
  if (!text) return '';
  const urlRegex = /(\b(https?|ftp|file):\/\/\S*)|(\bwww\.\S*)/gi;
  return text.replace(urlRegex, (url) => {
    let fullUrl = url;
    if (!fullUrl.match(/^[a-zA-Z]+:\/\//)) {
      fullUrl = 'http://' + fullUrl;
    }
    return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="text-purple-400 hover:underline">${url}</a>`;
  });
};

const ADMIN_EMAILS = [
"admin@example.com",
"moderator@example.com"];


const renderMedia = (url) => {
  const extension = url.split('.').pop().toLowerCase().split('?')[0];

  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) {
    return <img src={url} alt="Post media" className="rounded-lg object-cover w-full h-full" />;
  }
  if (['mp4', 'webm'].includes(extension)) {
    return <video src={url} controls className="rounded-lg w-full bg-black" />;
  }
  if (['mp3', 'wav', 'ogg'].includes(extension)) {
    return (
      <div className="p-4 bg-black/20 rounded-lg">
        <audio src={url} controls className="w-full" />
      </div>);

  }
  if (extension === 'pdf') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-black/30 rounded-lg border border-purple-500/20 hover:bg-black/50 transition-colors">
        <FileText className="w-8 h-8 text-purple-400 flex-shrink-0" />
        <div>
          <p className="text-white font-medium">PDF Document</p>
          <p className="text-xs text-gray-400 truncate">Click to view</p>
        </div>
      </a>);

  }
  return null;
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

export default function PostCard({ post, currentUser, onUserUpdate, author, onRepost, onCommentAdded, onDelete, onEdit, index, recommendationReason, onReactionChange, onLike, showCommunityContext = true, onFlag, highlightCommentId }) {
  const [showComments, setShowComments] = useState(false);
  const [showNFTUnlock, setShowNFTUnlock] = useState(false);
  const [hasNFTAccess, setHasNFTAccess] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [localPost, setLocalPost] = useState(post);
  const [communityInfo, setCommunityInfo] = useState(null);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef(null);
  const commentsContainerRef = useRef(null);
  const impressionRecorded = useRef(false);
  const [isSupercharging, setIsSupercharging] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [localFollowerCount, setLocalFollowerCount] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentContent, setCommentContent] = useState("");

  // NEW: Add state for masked author email
  const [maskedAuthorEmail, setMaskedAuthorEmail] = useState('');

  // Auto-expand comments if there's a highlighted comment
  useEffect(() => {
    if (highlightCommentId) {
      setShowComments(true);
      const timer = setTimeout(() => {
        if (commentsContainerRef.current) {
          commentsContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlightCommentId]);

  // Impression tracking logic
  useEffect(() => {
    if (!post.id || post.id.startsWith('temp-') || post.isPoll) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !impressionRecorded.current) {
          impressionRecorded.current = true;
          recordPostImpression({ postId: post.id }).catch((err) => {
            console.warn(`Failed to record impression for post ${post.id}:`, err.message);
          });
          observer.disconnect();
        }
      },
      {
        threshold: 0.5
      }
    );

    const currentCardRef = cardRef.current;

    if (currentCardRef) {
      observer.observe(currentCardRef);
    }

    return () => {
      if (currentCardRef) {
        observer.unobserve(currentCardRef);
      }
      observer.disconnect();
    };
  }, [post.id, post.isPoll]);

  const showErrorMessage = (error, action) => {
    console.error(`${action} error:`, error);

    let message = `Failed to ${action.toLowerCase()}. EqoFlow is in beta - please try again in a moment.`;

    if (error?.response?.status === 429) {
      message = `Too many requests. We're in beta and improving performance. Please wait before trying to ${action.toLowerCase()} again.`;
    }

    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const calculateTotalFollowers = (authorData) => {
    if (!authorData) return 0;

    const eqoflowFollowers = authorData.follower_count || 0;

    const identity = authorData.cross_platform_identity;
    const web2Followers = identity?.web2_verifications?.reduce((sum, conn) => sum + (conn.follower_count || 0), 0) || 0;
    const web3Followers = identity?.web3_connections?.reduce((sum, conn) => sum + (conn.follower_count || 0), 0) || 0;

    return eqoflowFollowers + web2Followers + web3Followers;
  };

  const handleTogglePin = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;

    try {
      const newPinnedState = !localPost.is_pinned;
      await togglePostPin({ postId: localPost.id, isPinned: newPinnedState });

      const updatedPost = { ...localPost, is_pinned: newPinnedState };
      setLocalPost(updatedPost);

      if (onReactionChange) onReactionChange(updatedPost);

      setErrorMessage(newPinnedState ? "Post pinned to top of feed!" : "Post unpinned from feed!");
      setTimeout(() => setErrorMessage(null), 3000);

    } catch (error) {
      showErrorMessage(error, 'Toggling pin status');
    }
  };

  useEffect(() => {
    let timer;
    if (post.moderation_status === 'flagged' && currentUser && post.created_by === currentUser.email) {
      const flaggedTime = new Date(post.updated_date || post.created_date).getTime();
      const now = Date.now();
      const elapsed = now - flaggedTime;
      const totalRemovalTime = 30000;
      const remaining = Math.max(0, totalRemovalTime - elapsed);

      if (remaining > 0) {
        setCountdown(Math.ceil(remaining / 1000));

        timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setCountdown(0);
      }
    } else {
      setCountdown(null);
    }

    return () => clearInterval(timer);
  }, [post.moderation_status, post.created_date, post.updated_date, currentUser, post.created_by]);

  useEffect(() => {
    setLocalPost(post);
    impressionRecorded.current = false;
    setLocalFollowerCount(null);
  }, [post]);

  // Mask author email for display
  useEffect(() => {
    const maskAuthorEmail = async () => {
      if (post?.created_by && post.created_by !== currentUser?.email) {
        const masked = await maskEmail(post.created_by);
        setMaskedAuthorEmail(masked);
      } else {
        setMaskedAuthorEmail(post?.created_by || '');
      }
    };
    maskAuthorEmail();
  }, [post?.created_by, currentUser?.email]);

  useEffect(() => {
    const loadCommunityInfo = async () => {
      if (post.community_id && showCommunityContext) {
        try {
          const community = await Community.get(post.community_id);
          setCommunityInfo(community);
        } catch (error) {
          console.error('Error loading community info:', error);
          setCommunityInfo(null);
        }
      } else {
        setCommunityInfo(null);
      }
    };

    loadCommunityInfo();
  }, [post.community_id, showCommunityContext]);

  const handleReactionChange = (updatedPost) => {
    setLocalPost(updatedPost);
    if (onReactionChange) {
      onReactionChange(updatedPost);
    }
  };

  const handleLike = async (postToLike) => {
    if (!currentUser) return;

    const originalPost = localPost || postToLike;
    const isLiked = originalPost.liked_by && originalPost.liked_by.includes(currentUser.email);

    let optimisticPost;
    if (isLiked) {
      optimisticPost = {
        ...originalPost,
        liked_by: originalPost.liked_by.filter((email) => email !== currentUser.email),
        likes_count: Math.max(0, (originalPost.likes_count || 0) - 1)
      };
    } else {
      optimisticPost = {
        ...originalPost,
        liked_by: [...(originalPost.liked_by || []), currentUser.email],
        likes_count: (originalPost.likes_count || 0) + 1
      };
    }

    setLocalPost(optimisticPost);

    if (onLike && typeof onLike === 'function') onLike(optimisticPost);
    if (onReactionChange) onReactionChange(optimisticPost);

    try {
      await Post.update(originalPost.id, {
        liked_by: optimisticPost.liked_by,
        likes_count: optimisticPost.likes_count
      });

      if (!isLiked) {
        try {
          await awardEP({
            actionType: 'post_like',
            relatedContentId: originalPost.id,
            relatedContentType: 'post',
            description: `Liked a post by ${originalPost.author_full_name || 'another user'}`
          });
        } catch (epError) {
          console.warn('Failed to award EP for like:', epError);
        }
      }
    } catch (error) {
      showErrorMessage(error, 'Liking post');
      setLocalPost(originalPost);
      if (onLike && typeof onLike === 'function') onLike(originalPost);
      if (onReactionChange) onReactionChange(originalPost);
    }
  };

  const handleRepost = async (postToRepost) => {
    if (!currentUser) return;

    const originalPost = localPost || postToRepost;
    
    // Call the parent handler to open repost modal
    if (onRepost && typeof onRepost === 'function') {
      onRepost(originalPost);
    }
  };

  const handleQuickFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser || !currentAuthor || currentAuthor.email === currentUser.email || isFollowLoading) return;

    setIsFollowLoading(true);

    const authorEmail = currentAuthor.email || post.created_by;
    const isCurrentlyFollowing = currentUser.following_list?.includes(authorEmail) || false;

    const newFollowerCount = (localFollowerCount ?? totalFollowers) + (isCurrentlyFollowing ? -1 : 1);
    setLocalFollowerCount(newFollowerCount);

    const newFollowingList = isCurrentlyFollowing ?
    currentUser.following_list.filter((email) => email !== authorEmail) :
    [...(currentUser.following_list || []), authorEmail];

    const optimisticUser = { ...currentUser, following_list: newFollowingList };

    if (onUserUpdate) {
      onUserUpdate(optimisticUser);
    }

    try {
      await base44.functions.invoke('handleFollow', {
        targetUserEmail: authorEmail,
        action: isCurrentlyFollowing ? 'unfollow' : 'follow'
      });
    } catch (error) {
      console.error('Follow action failed:', error);
      setLocalFollowerCount(null);
      if (onUserUpdate) {
        onUserUpdate(currentUser);
      }
    } finally {
      setIsFollowLoading(false);
    }
  };

  const getAuthorData = () => {
    if (author) return author;
    if (post.author) return post.author;
    return {
      full_name: post.author_full_name,
      username: post.author_username,
      avatar_url: post.author_avatar_url,
      user_email: post.created_by,
      email: post.created_by,
      professional_credentials: post.author_professional_credentials,
      cross_platform_identity: post.author_cross_platform_identity,
      custom_badges: post.author_custom_badges,
      subscription_tier: post.author?.subscription_tier || author?.subscription_tier || 'free',
      follower_count: post.author_follower_count || post.author?.follower_count || 0,
      kyc_status: post.author?.kyc_status || author?.kyc_status
    };
  };
  const currentAuthor = getAuthorData();

  const authorEmail = currentAuthor?.user_email || currentAuthor?.email || post.created_by;

  const avatarToShow = currentAuthor?.avatar_url;

  const totalFollowers = calculateTotalFollowers(currentAuthor);
  const displayFollowerCount = localFollowerCount ?? totalFollowers;

  const isFollowingAuthor = currentUser && currentUser.following_list?.includes(authorEmail);
  const canFollow = currentUser && authorEmail !== currentUser.email;

  const getPrivacyIcon = () => {
    switch (post.privacy_level) {
      case "public":return <Globe className="w-3 h-3" />;
      case "friends":return <Users className="w-3 h-3" />;
      case "private":return <Lock className="w-3 h-3" />;
      default:return <Globe className="w-3 h-3" />;
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${createPageUrl('SharedEcho')}?postId=${displayPost.id}`;

    // Try native share first, fallback to clipboard
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Echo by ${post.author_full_name || post.created_by?.split("@")[0] || "Anonymous"}`,
          text: post.content,
          url: shareUrl
        });
        return;
      } catch (shareError) {
        // If share fails or is cancelled, fallback to clipboard
        console.log('Share failed, falling back to clipboard:', shareError);
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setErrorMessage("Share link copied to clipboard!");
      setTimeout(() => setErrorMessage(null), 3000);
    } catch (clipboardError) {
      console.error('Clipboard copy failed:', clipboardError);
      setErrorMessage("Could not copy link. Please try again.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleSupercharge = async () => {
    if (!currentUser || currentUser.super_boost_token_count <= 0) {
      setErrorMessage("You don't have any Super Boost tokens!");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    if (post.is_super_charged) {
      setErrorMessage("This echo is already supercharged!");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setIsSupercharging(true);

    try {
      const response = await base44.functions.invoke('superchargePost', {
        postId: post.id
      });

      if (response.data.success) {
        const updatedPost = {
          ...post,
          is_super_charged: true,
          super_charged_at: new Date().toISOString()
        };

        setLocalPost(updatedPost);
        if (onReactionChange) onReactionChange(updatedPost);

        setErrorMessage("🌟 Echo Supercharged! It's now glowing with power!");
        setTimeout(() => setErrorMessage(null), 3000);

        const freshUser = await base44.auth.me();
        if (freshUser && onUserUpdate) {
          onUserUpdate(freshUser);
        }
      }
    } catch (error) {
      console.error('Supercharge error:', error);
    } finally {
      setIsSupercharging(false);
    }
  };

  const handleRemoveSupercharge = async () => {
    if (!currentUser || displayPost.created_by !== currentUser.email) return;

    try {
      await base44.entities.Post.update(displayPost.id, {
        is_super_charged: false,
        super_charged_at: null
      });

      await base44.auth.updateMe({
        super_boost_token_count: (currentUser.super_boost_token_count || 0) + 1
      });

      const updatedPost = {
        ...displayPost,
        is_super_charged: false,
        super_charged_at: null
      };

      setLocalPost(updatedPost);
      if (onReactionChange) onReactionChange(updatedPost);

      setErrorMessage("Super Echo removed for testing!");
      setTimeout(() => setErrorMessage(null), 3000);

      const freshUser = await base44.auth.me();
      if (freshUser && onUserUpdate) {
        onUserUpdate(freshUser);
      }
    } catch (error) {
      showErrorMessage(error, 'Removing supercharge');
    }
  };

  const getCollectionName = (address) => {
    const collections = {
      "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D": "Bored Ape Yacht Club",
      "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB": "CryptoPunks",
      "0x60E4d786628Fea6478F785A6d7e704777c86a7c6": "Mutant Ape Yacht Club",
      "0xED5AF388653567Af2F388E6224dC7C4b3241C544": "Azuki"
    };
    return collections[address] || `NFT Collection`;
  };

  const handleUnlockClick = () => {
    setShowNFTUnlock(true);
  };

  const handleNFTAccessGranted = () => {
    setHasNFTAccess(true);
    setShowNFTUnlock(false);
  };

  const handleNFTUnlockClose = () => {
    setShowNFTUnlock(false);
  };

  const AuthorProfileLink = ({ children, post }) => {
    const params = new URLSearchParams();
    const usernameToUse = currentAuthor?.username;

    if (usernameToUse && usernameToUse.trim() !== '') {
      params.set('username', usernameToUse);
      const profileUrl = `${createPageUrl("PublicProfile")}?${params.toString()}`;

      return (
        <Link
          to={profileUrl}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {children}
        </Link>);

    }

    return <div className="flex items-center gap-3">{children}</div>;
  };

  const AuthorInfo = ({ post, currentUser }) => {
    const getDisplayName = () => {
      // PRIORITY 1: Check currentAuthor full_name from directory (most reliable)
      if (currentAuthor?.full_name &&
      currentAuthor.full_name.trim() !== '' &&
      currentAuthor.full_name !== currentAuthor.email &&
      currentAuthor.full_name !== post.created_by &&
      !currentAuthor.full_name.includes('@')) {
        return currentAuthor.full_name;
      }

      // PRIORITY 2: Check currentAuthor username from directory
      if (currentAuthor?.username &&
      currentAuthor.username.trim() !== '' &&
      currentAuthor.username !== currentAuthor.email &&
      currentAuthor.username !== post.created_by &&
      !currentAuthor.username.includes('@')) {
        return currentAuthor.username;
      }

      // PRIORITY 3: Fallback to post snapshot full_name (for old posts)
      if (post.author_full_name &&
      post.author_full_name.trim() !== '' &&
      post.author_full_name !== post.created_by &&
      !post.author_full_name.includes('@')) {
        return post.author_full_name;
      }

      // PRIORITY 4: Fallback to post snapshot username
      if (post.author_username &&
      post.author_username.trim() !== '' &&
      post.author_username !== post.created_by &&
      !post.author_username.includes('@')) {
        return post.author_username;
      }

      // LAST RESORT: Extract from email only if nothing else works
      if (post.created_by && post.created_by.includes('@')) {
        return post.created_by.split('@')[0];
      }

      return "Anonymous User";
    };

    return (
      <>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={getAvatarBackgroundStyle(avatarToShow)}>

          {avatarToShow ?
          <img src={avatarToShow} alt="Author Avatar" className="w-full h-full object-cover rounded-full" /> :

          <User className="w-5 h-5 text-white" />
          }
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white hover:text-purple-400 transition-colors">
              {getDisplayName()}
            </span>
            <KYCVerifiedBadge user={currentAuthor} size="sm" />
            <div className="flex items-center gap-1">
              {displayFollowerCount > 0 && (
                <div className="flex items-center gap-1 text-green-400 text-xs font-medium" title={`${displayFollowerCount.toLocaleString()} followers across all platforms`}>
                  <Users className="w-3 h-3" />
                  <span>{displayFollowerCount.toLocaleString()}</span>
                </div>
              )}
              {canFollow &&
                <button
                  onClick={handleQuickFollow}
                  disabled={isFollowLoading}
                  className={`p-1 rounded-full transition-colors ${
                  isFollowingAuthor ?
                  'text-green-400 hover:text-green-300 hover:bg-green-400/10' :
                  'text-gray-400 hover:text-green-400 hover:bg-green-400/10'} ${
                  isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isFollowingAuthor ? 'Unfollow' : 'Follow'}>

                    {isFollowingAuthor ?
                  <UserCheck className="w-3 h-3" /> :

                  <UserPlus className="w-3 h-3" />
                  }
                </button>
              }
            </div>
            <EqoPlusProBadge user={currentAuthor} />
            <EqoPlusCreatorBadge user={currentAuthor} />
            <EqoPlusLiteBadge user={currentAuthor} />
            <CreatorBadge userEmail={authorEmail} />
            <CoCEOBadge userEmail={authorEmail} />
            <CMOBadge userEmail={authorEmail} />
            <CCOBadge userEmail={authorEmail} />
            <CoFounderBadge userEmail={authorEmail} />
            <CFOBadge userEmail={authorEmail} />
            <PioneerBadge userEmail={authorEmail} />
            <ProfessionalBadge user={{ professional_credentials: currentAuthor?.professional_credentials }} />
            <NFTBadge user={currentUser} />
            <CrossPlatformBadges cross_platform_identity={currentAuthor?.cross_platform_identity} userEmail={authorEmail} />
            <Badge variant="secondary" className="bg-black/30 text-gray-400 text-xs border border-purple-500/20">
              {getPrivacyIcon()}
              <span className="ml-1">{post.privacy_level}</span>
            </Badge>
          </div>
          <p className="text-sm text-gray-300">
            {format(new Date(post.created_date), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </>);

  };

  const displayPost = localPost || post;

  const hasTextContent = displayPost.content && displayPost.content.trim().length > 0;
  const hasMedia = displayPost.media_urls && displayPost.media_urls.length > 0;
  const hasYouTubeVideo = displayPost.youtube_video_id && displayPost.youtube_thumbnail_url;

  const isSupercharged = displayPost.is_super_charged;
  const canSupercharge = currentUser && displayPost.created_by === currentUser.email && !displayPost.is_super_charged && currentUser.super_boost_token_count > 0;

  const getContentWithoutYoutubeUrl = (text, videoId) => {
    if (!text || !videoId) return text;
    const youtubeRegex = new RegExp(`(?:https?://)?(?:www\\.?)?(?:youtube\\.com/watch\\?v=|youtu\\.be/)${videoId}[^\\s]*`, 'g');
    return text.replace(youtubeRegex, '').trim();
  };

  const contentToDisplay = displayPost.youtube_thumbnail_url ?
  getContentWithoutYoutubeUrl(displayPost.content, displayPost.youtube_video_id) :
  displayPost.content;

  const truncateContent = (text, limit = 200) => {
    if (!text || text.length <= limit) return text;
    return text.substring(0, limit).trim() + '...';
  };

  const needsTruncation = (text) => {
    return text && text.length > 200;
  };

  const getDisplayContent = () => {
    if (!contentToDisplay) return '';
    const baseContent = !needsTruncation(contentToDisplay) || isExpanded ?
    contentToDisplay :
    truncateContent(contentToDisplay);

    return filterProfanity(baseContent, currentUser?.privacy_settings?.profanity_filter_enabled);
  };

  const handleCommentSubmit = async (commentData) => {
    if (!currentUser) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await Comment.create({
        content: commentData.content,
        post_id: displayPost.id,
        parent_comment_id: null,
        author_full_name: currentUser.full_name || currentUser.username || currentUser.email?.split('@')[0] || 'Anonymous',
        author_avatar_url: currentUser.avatar_url,
        author_username: currentUser.username,
        liked_by: [],
        disliked_by: [],
        likes_count: 0,
        dislikes_count: 0,
        reply_count: 0
      });

      setLocalPost((prev) => ({
        ...prev,
        comments_count: (prev.comments_count || 0) + 1
      }));

      if (onCommentAdded) {
        await onCommentAdded(displayPost, newComment);
      }

      setShowComments(true);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error?.response?.status !== 200) {
        throw error;
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };


  if (!post.nft_gate_settings) {
    return (
      <motion.div
        ref={cardRef}
        id={`post-${post.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="relative">

        {showFlagModal &&
        <FlagPostModal
          post={displayPost}
          onConfirm={onFlag}
          onClose={() => setShowFlagModal(false)} />

        }

        {showVideoPlayer && displayPost.youtube_video_id &&
        <VideoPlayerModal
          videoId={displayPost.youtube_video_id}
          onClose={() => setShowVideoPlayer(false)} />

        }

        <Card className={`hover-lift transition-all duration-300 ${isSupercharged ? 'super-charged-card' : 'dark-card'}`}>
          {isSupercharged &&
          <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-amber-500/20 to-orange-400/20 animate-pulse"></div>
              <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 pointer-events-auto">
                <span>⭐ SUPER ECHO</span>
                {currentUser && displayPost.created_by === currentUser.email &&
              <button
                onClick={handleRemoveSupercharge}
                className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                title="Remove Super Echo (Testing)">

                    <X className="w-3 h-3" />
                  </button>
              }
              </div>
            </div>
          }

          {displayPost.is_pinned &&
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/30 px-4 py-2">
              <div className="flex items-center gap-2 text-xs text-purple-400">
                <Pin className="w-3 h-3" />
                <span>Pinned Post</span>
              </div>
            </div>
          }

          {displayPost.is_repost &&
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-green-500/30 px-4 py-2">
              <div className="flex items-center gap-2 text-xs text-green-400">
                <Repeat className="w-3 h-3" />
                <span>
                  {currentUser && displayPost.created_by === currentUser.email 
                    ? `You reposted this from ${displayPost.original_author}`
                    : `${currentAuthor?.full_name || displayPost.author_full_name} reposted this from ${displayPost.original_author}`
                  }
                </span>
              </div>
              {displayPost.repost_comment && displayPost.repost_comment.trim().length > 0 && (
                <div className="mt-2 px-4 py-2 bg-black/20 rounded-lg border border-green-500/20">
                  <p className="text-sm text-white">{displayPost.repost_comment}</p>
                </div>
              )}
            </div>
          }

          <AnimatePresence>
            {errorMessage &&
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 mt-4">

                <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-2">
                  <p className="text-yellow-300 text-xs">{errorMessage}</p>
                </div>
              </motion.div>
            }
          </AnimatePresence>

          <CardContent className="bg-[#000000] p-4 md:p-6">
            {communityInfo && showCommunityContext &&
            <div className="mb-4">
                <Link to={`${createPageUrl("CommunityProfile")}?id=${communityInfo.id}`}>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-full text-sm text-purple-300 hover:bg-purple-600/30 transition-colors">
                    <Users className="w-3 h-3" />
                    <span>From {communityInfo.name}</span>
                  </div>
                </Link>
              </div>
            }

            {displayPost.moderation_status === 'flagged' && currentUser && displayPost.created_by === currentUser.email &&
            <div className="flex flex-col md:flex-row md::items-center gap-2 p-3 mb-4 bg-yellow-600/10 border border-yellow-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-yellow-300">This content has been flagged by our AI for review.</span>
                  {countdown !== null && countdown > 0 &&
                <div className="text-xs text-yellow-400 mt-1">
                      Auto-removing in {countdown} second{countdown !== 1 ? 's' : ''}
                    </div>
                }
                </div>
              </div>
            }
            {recommendationReason &&
            <div className="mb-4 flex items-start md:items-center gap-2 text-xs text-purple-400 p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 md:mt-0" />
                <span className="leading-tight">{recommendationReason}</span>
              </div>
            }

            <div className="flex items-start justify-between gap-3 mb-4">
              <AuthorProfileLink post={post}>
                <AuthorInfo post={post} currentUser={currentUser} />
              </AuthorProfileLink>
              {(onEdit && onDelete && currentUser?.email === post.created_by || currentUser?.role === 'admin') &&
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white flex-shrink-0">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-black border-purple-500/20">
                    {currentUser?.role === 'admin' &&
                  <>
                        <DropdownMenuItem onClick={handleTogglePin} className="text-purple-400 hover:bg-purple-500/10 cursor-pointer">
                          {displayPost.is_pinned ?
                      <>
                              <PinOff className="w-4 h-4 mr-2" />
                              Unpin Post
                            </> :

                      <>
                              <Pin className="w-4 h-4 mr-2" />
                              Pin to Top
                            </>
                      }
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowFlagModal(true)} className="text-yellow-400 hover:!text-yellow-400 hover:!bg-yellow-500/10 cursor-pointer">
                          <Flag className="w-4 h-4 mr-2" />
                          Flag Post
                        </DropdownMenuItem>
                      </>
                  }
                    {onEdit && onDelete && currentUser?.email === post.created_by &&
                    <>
                        <DropdownMenuItem onClick={() => onEdit(post)} className="text-white hover:bg-purple-500/10 cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Echo
                        </DropdownMenuItem>
                        {currentUser?.x_access_token && !displayPost.x_tweet_id && (
                          <DropdownMenuItem 
                            onClick={async () => {
                              try {
                                const tweetText = displayPost.content.length > 280 
                                  ? displayPost.content.substring(0, 277) + '...'
                                  : displayPost.content;

                                const xResult = await base44.functions.invoke('postToX', { text: tweetText });

                                if (xResult?.data?.success && xResult?.data?.tweetId) {
                                  await Post.update(displayPost.id, {
                                    x_tweet_id: xResult.data.tweetId,
                                    x_posted_at: new Date().toISOString()
                                  });

                                  const updated = { ...displayPost, x_tweet_id: xResult.data.tweetId, x_posted_at: new Date().toISOString() };
                                  setLocalPost(updated);
                                  if (onReactionChange) onReactionChange(updated);

                                  setErrorMessage("Successfully posted to X!");
                                  setTimeout(() => setErrorMessage(null), 3000);
                                }
                              } catch (error) {
                                console.error('Failed to post to X:', error);
                                setErrorMessage("Failed to post to X. Please try again.");
                                setTimeout(() => setErrorMessage(null), 3000);
                              }
                            }} 
                            className="text-white hover:bg-purple-500/10 cursor-pointer">
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            Post to X
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-red-400 hover:!text-red-400 hover:!bg-red-500/10 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Echo
                        </DropdownMenuItem>
                      </>
                    }
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            </div>

            <div className="mb-4">
              {hasTextContent &&
              <div>
                  <p
                  className="text-gray-200 whitespace-pre-wrap leading-relaxed text-sm md:text-base"
                  dangerouslySetInnerHTML={{ __html: linkify(getDisplayContent()) }} />


                  {needsTruncation(contentToDisplay) &&
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium mt-2 focus:outline-none">

                      {isExpanded ? 'Show Less' : 'Read More'}
                    </button>
                }
                </div>
              }

              {hasYouTubeVideo &&
              <div
                className={`${hasTextContent ? 'mt-4' : ''} group cursor-pointer rounded-lg overflow-hidden border border-purple-500/20 aspect-video grid place-items-center`}
                onClick={() => setShowVideoPlayer(true)}>

                    <img
                  src={displayPost.youtube_thumbnail_url}
                  alt={displayPost.youtube_video_title || "YouTube video"}
                  className="w-full h-full object-cover col-start-1 row-start-1" />


                    <div className="col-start-1 row-start-1 w-full h-full bg-black/30 group-hover:bg-black/10 transition-all duration-300"></div>

                    <div className="col-start-1 row-start-1 w-12 h-12 md:w-16 md:h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-5 h-5 md:w-8 md:h-8 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>

                    {displayPost.youtube_video_title &&
                <div className="col-start-1 row-start-1 w-full self-end p-2 md:p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                        <p className="text-white font-semibold text-sm md:text-base leading-tight line-clamp-2">
                          {displayPost.youtube_video_title}
                        </p>
                      </div>
                }
                </div>
              }

              {hasMedia &&
              <div className={`${hasTextContent || hasYouTubeVideo ? 'mt-4' : ''}`}>
                  {displayPost.media_urls.length > 2 ?
                <ImageSlideshow images={displayPost.media_urls} /> :

                <div className={`grid gap-2 ${displayPost.media_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {displayPost.media_urls.map((url, idx) =>
                  <div key={idx} className="relative rounded-lg overflow-hidden first:col-span-1 last:col-span-1 only:col-span-full">
                          {renderMedia(url)}
                        </div>
                  )}
                    </div>
                }
                </div>
              }

              {displayPost.tags && displayPost.tags.length > 0 &&
              <div className="flex flex-wrap gap-1 mt-3">
                  {displayPost.tags.map((tag, idx) =>
                <Link key={idx} to={createPageUrl(`TagPage?tag=${encodeURIComponent(tag)}`)}>
                      <Badge
                    variant="outline"
                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 cursor-pointer bg-black/20 text-xs">
                        #{tag}
                      </Badge>
                    </Link>
                )}
                </div>
              }
            </div>

            {/* X Post Status Badge */}
            {displayPost.x_tweet_id && (
              <div className="mb-4 flex items-center gap-2 p-2 bg-black/20 border border-purple-500/20 rounded-lg">
                <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="text-xs text-purple-400">Also posted to X</span>
                {displayPost.x_posted_at && (
                  <span className="text-xs text-gray-500">
                    • {format(new Date(displayPost.x_posted_at), "MMM d 'at' h:mm a")}
                  </span>
                )}
              </div>
            )}

            <div className={`flex flex-col md:flex-row md:items-center justify-between py-3 border-t border-gray-700/50 gap-3 ${isSupercharged ? 'relative z-10' : ''}`}>
              <div className="flex items-center gap-2 md:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(displayPost)}
                  className={`flex items-center gap-1 md:gap-2 transition-colors p-2 h-auto ${currentUser && displayPost.liked_by && displayPost.liked_by.includes(currentUser.email) ?
                  'text-red-400 hover:text-red-300' :
                  'text-gray-400 hover:text-red-400'}`}>

                  <Heart className={`w-4 h-4 ${currentUser && displayPost.liked_by && displayPost.liked_by.includes(currentUser.email) ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{displayPost.likes_count || 0}</span>
                </Button>

                <ReactionBar
                  post={displayPost}
                  currentUser={currentUser}
                  onReactionChange={handleReactionChange} />


                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-1 md:gap-2 text-gray-400 hover:text-blue-400 transition-colors p-2 h-auto">

                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{displayPost.comments_count || 0}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRepost(displayPost)}
                    className="flex items-center gap-1 md:gap-2 text-gray-400 hover:text-green-400 transition-colors p-2 h-auto">

                    <RefreshCw className="w-4 h-4" />
                    <span className="text-sm font-medium">{displayPost.reposts_count || 0}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="flex items-center gap-1 md:gap-2 text-gray-400 hover:text-purple-400 transition-colors p-2 h-auto"
                    title="Share this echo">
                    <Share2 className="w-4 h-4" />
                  </Button>

                  {canSupercharge &&
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSupercharge}
                    disabled={isSupercharging}
                    className="flex items-center gap-1 md:gap-2 text-yellow-400 hover:text-yellow-300 transition-colors p-2 h-auto hover:bg-yellow-400/10"
                    title="Supercharge this echo with a Super Boost token!">

                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-medium hidden md:inline">Supercharge</span>
                    </Button>
                  }
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                {displayPost.impressions_count > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-600/10 border border-cyan-500/20 rounded-lg">
                    <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-cyan-400 text-xs font-medium">{displayPost.impressions_count.toLocaleString()}</span>
                  </div>
                )}
                
                {displayPost.ep_rewards_earned > 0 &&
                <div className="flex items-center gap-1 text-purple-400 text-sm">
                    <Zap className="w-4 h-4" />
                    <span>+{displayPost.ep_rewards_earned} EP</span>
                  </div>
                }
              </div>
            </div>

            <AnimatePresence>
              {showComments &&
              <motion.div
                ref={commentsContainerRef}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden">

                  <CommentSection
                  post={displayPost}
                  onCommentAdded={() => onCommentAdded(displayPost)}
                  currentUser={currentUser}
                  highlightCommentId={highlightCommentId} />

                </motion.div>
              }
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>);

  }

  // NFT-gated post content
  return (
    <motion.div
      ref={cardRef}
      id={`post-${post.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative">

      {showFlagModal &&
      <FlagPostModal
        post={displayPost}
        onConfirm={onFlag}
        onClose={() => setShowFlagModal(false)} />

      }

      {showVideoPlayer && displayPost.youtube_video_id &&
      <VideoPlayerModal
        videoId={displayPost.youtube_video_id}
        onClose={() => setShowVideoPlayer(false)} />

      }

      <Card className={`hover-lift transition-all duration-300 ${isSupercharged ? 'super-charged-card' : 'dark-card'}`}>
        {isSupercharged &&
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-amber-500/20 to-orange-400/20 animate-pulse"></div>
            <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 pointer-events-auto">
              <span>⭐ SUPER ECHO</span>
              {currentUser && displayPost.created_by === currentUser.email &&
            <button
              onClick={handleRemoveSupercharge}
              className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
              title="Remove Super Echo (Testing)">

                  <X className="w-3 h-3" />
                </button>
            }
            </div>
          </div>
        }

        {displayPost.is_pinned &&
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/30 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-purple-400">
              <Pin className="w-3 h-3" />
              <span>Pinned Post</span>
            </div>
          </div>
        }

        <AnimatePresence>
          {errorMessage &&
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-4">

              <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-2">
                <p className="text-yellow-300 text-xs">{errorMessage}</p>
              </div>
            </motion.div>
          }
        </AnimatePresence>

        <CardContent className="p-4 md:p-6">
          {communityInfo && showCommunityContext &&
          <div className="mb-4">
              <Link to={`${createPageUrl("CommunityProfile")}?id=${communityInfo.id}`}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-full text-sm text-purple-300 hover:bg-purple-600/30 transition-colors">
                  <Users className="w-3 h-3" />
                  <span>From {communityInfo.name}</span>
                </div>
              </Link>
            </div>
          }

          {displayPost.moderation_status === 'flagged' && currentUser && displayPost.created_by === currentUser.email &&
          <div className="flex flex-col md:flex-row md:items-center gap-2 p-3 mb-4 bg-yellow-600/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-yellow-300">This content has been flagged by our AI for review.</span>
                {countdown !== null && countdown > 0 &&
              <div className="text-xs text-yellow-400 mt-1">
                    Auto-removing in {countdown} second{countdown !== 1 ? 's' : ''}
                  </div>
              }
              </div>
            </div>
          }
          {recommendationReason &&
          <div className="mb-4 flex items-start md:items-center gap-2 text-xs text-purple-400 p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 md:mt-0" />
              <span className="leading-tight">{recommendationReason}</span>
            </div>
          }

          <div className="flex items-start justify-between gap-3 mb-4">
            <AuthorProfileLink post={displayPost}>
              <AuthorInfo post={displayPost} currentUser={currentUser} />
            </AuthorProfileLink>
            {(onEdit && onDelete && currentUser?.email === displayPost.created_by || currentUser?.role === 'admin') &&
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white flex-shrink-0">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black border-purple-500/20">
                  {currentUser?.role === 'admin' &&
                <>
                      <DropdownMenuItem onClick={handleTogglePin} className="text-purple-400 hover:bg-purple-500/10 cursor-pointer">
                        {displayPost.is_pinned ?
                    <>
                            <PinOff className="w-4 h-4 mr-2" />
                            Unpin Post
                          </> :
                    <>
                            <Pin className="w-4 h-4 mr-2" />
                            Pin to Top
                          </>
                    }
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowFlagModal(true)} className="text-yellow-400 hover:!text-yellow-400 hover:!bg-yellow-500/10 cursor-pointer">
                        <Flag className="w-4 h-4 mr-2" />
                        Flag Post
                      </DropdownMenuItem>
                    </>
                }
                  {onEdit && onDelete && currentUser?.email === displayPost.created_by &&
                <>
                      <DropdownMenuItem onClick={() => onEdit(displayPost)} className="text-white hover:bg-purple-500/10 cursor-pointer">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Echo
                      </DropdownMenuItem>
                      {currentUser?.x_access_token && !displayPost.x_tweet_id && (
                        <DropdownMenuItem 
                          onClick={async () => {
                            try {
                              const tweetText = displayPost.content.length > 280 
                                ? displayPost.content.substring(0, 277) + '...'
                                : displayPost.content;
                              
                              const xResult = await base44.functions.invoke('postToX', { text: tweetText });
                              
                              if (xResult?.data?.success && xResult?.data?.tweetId) {
                                await Post.update(displayPost.id, {
                                  x_tweet_id: xResult.data.tweetId,
                                  x_posted_at: new Date().toISOString()
                                });
                                
                                const updated = { ...displayPost, x_tweet_id: xResult.data.tweetId, x_posted_at: new Date().toISOString() };
                                setLocalPost(updated);
                                if (onReactionChange) onReactionChange(updated);
                                
                                setErrorMessage("Successfully posted to X!");
                                setTimeout(() => setErrorMessage(null), 3000);
                              }
                            } catch (error) {
                              console.error('Failed to post to X:', error);
                              setErrorMessage("Failed to post to X. Please try again.");
                              setTimeout(() => setErrorMessage(null), 3000);
                            }
                          }} 
                          className="text-white hover:bg-purple-500/10 cursor-pointer">
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                          Post to X
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onDelete(displayPost.id)} className="text-red-400 hover:!text-red-400 hover:!bg-red-500/10 cursor-pointer">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Echo
                      </DropdownMenuItem>
                    </>
                }
                </DropdownMenuContent>
              </DropdownMenu>
            }
          </div>

          <div className="mb-4 p-3 md:p-4 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 md:w-5 md:h-5 text-purple-400 flex-shrink-0" />
                <span className="font-semibold text-purple-400 text-sm md:text-base">NFT-Gated Content</span>
              </div>
              <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30 text-xs w-fit">
                {getCollectionName(displayPost.nft_gate_settings.collection)}
              </Badge>
            </div>
            <p className="text-sm text-white">
              This echo contains exclusive content for holders of{" "}
              <span className="font-medium text-purple-400">
                {getCollectionName(displayPost.nft_gate_settings.collection)}
              </span>{" "}
              NFTs. {displayPost.nft_gate_settings.amount > 1 && `(Minimum ${displayPost.nft_gate_settings.amount} NFTs required)`}
            </p>
          </div>

          {hasNFTAccess ?
          <>
              <div className="mb-4">
                <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Exclusive Content (Unlocked)
                </h4>
                {hasTextContent &&
              <div>
                    <p
                  className="text-white whitespace-pre-wrap leading-relaxed text-sm md:text-base"
                  dangerouslySetInnerHTML={{ __html: linkify(getDisplayContent()) }} />


                    {needsTruncation(contentToDisplay) &&
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium mt-2 focus:outline-none">

                        {isExpanded ? 'Show Less' : 'Read More'}
                      </button>
                }
                  </div>
              }

                {hasYouTubeVideo &&
              <div
                className={`${hasTextContent ? 'mt-4' : ''} group cursor-pointer rounded-lg overflow-hidden border border-purple-500/20 aspect-video grid place-items-center`}
                onClick={() => setShowVideoPlayer(true)}>

                      <img
                  src={displayPost.youtube_thumbnail_url}
                  alt={displayPost.youtube_video_title || "YouTube video"}
                  className="w-full h-full object-cover col-start-1 row-start-1" />


                      <div className="col-start-1 row-start-1 w-full h-full bg-black/30 group-hover:bg-black/10 transition-all duration-300"></div>

                      <div className="col-start-1 row-start-1 w-12 h-12 md:w-16 md:h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-5 h-5 md:w-8 md:h-8 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>

                      {displayPost.youtube_video_title &&
                <div className="col-start-1 row-start-1 w-full self-end p-2 md:p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                          <p className="text-white font-semibold text-sm md:text-base leading-tight line-clamp-2">
                            {displayPost.youtube_video_title}
                          </p>
                        </div>
                }
                  </div>
              }

                {hasMedia &&
              <div className={`${hasTextContent || hasYouTubeVideo ? 'mt-4' : ''}`}>
                    {displayPost.media_urls.length > 2 ?
                <ImageSlideshow images={displayPost.media_urls} /> :

                <div className={`grid gap-2 ${displayPost.media_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {displayPost.media_urls.map((url, idx) =>
                  <div key={idx} className="relative rounded-lg overflow-hidden">
                            {renderMedia(url)}
                          </div>
                  )}
                      </div>
                }
                  </div>
              }

                {displayPost.tags && displayPost.tags.length > 0 &&
              <div className="flex flex-wrap gap-1 mt-3">
                    {displayPost.tags.map((tag, idx) =>
                <Link key={idx} to={createPageUrl(`TagPage?tag=${encodeURIComponent(tag)}`)}>
                        <Badge variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 cursor-pointer bg-black/20 text-xs">
                          #{tag}
                        </Badge>
                      </Link>
                )}
                  </div>
              }
              </div>
            </> :
          <>
              <div className="relative p-6 rounded-xl bg-black/30 text-center border border-dashed border-purple-500/30 mb-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="xl font-semibold text-white mb-2">Exclusive Content Locked</h3>
                    <p className="text-white mb-4 text-sm md:text-base">
                      This echo contains premium content, exclusive media, and insights available only to{" "}
                      <span className="font-medium text-purple-400">
                        {getCollectionName(displayPost.nft_gate_settings.collection)}
                      </span>{" "}
                      NFTs.
                    </p>
                    <Button
                    onClick={handleUnlockClick}
                    className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 neon-glow text-white font-semibold px-6 py-3">

                      <Shield className="w-5 h-5 mr-2" />
                      Unlock to View
                    </Button>
                  </div>
                </div>
              </div>
            </>
          }

          <div className={`flex flex-col md:flex-row md:items-center justify-between py-3 border-t border-gray-700/50 gap-3 ${isSupercharged ? 'relative z-10' : ''}`}>
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(displayPost)}
                className={`flex items-center gap-1 md:gap-2 transition-colors p-2 h-auto ${currentUser && displayPost.liked_by && displayPost.liked_by.includes(currentUser.email) ?
                'text-red-400 hover:text-red-300' :
                'text-gray-400 hover:text-red-400'}`
                }>

                <Heart className={`w-4 h-4 ${currentUser && displayPost.liked_by && displayPost.liked_by.includes(currentUser.email) ? 'fill-current' : ''}`
                } />
                <span className="text-sm font-medium">{displayPost.likes_count || 0}</span>
              </Button>

              <ReactionBar
                post={displayPost}
                currentUser={currentUser}
                onReactionChange={handleReactionChange} />

              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-1 md:gap-2 text-gray-400 hover:text-blue-400 transition-colors p-2 h-auto">

                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{displayPost.comments_count || 0}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRepost(displayPost)}
                  className="flex items-center gap-1 md:gap-2 text-gray-400 hover:text-green-400 transition-colors p-2 h-auto">

                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm font-medium">{displayPost.reposts_count || 0}</span>
                </Button>

                {canSupercharge &&
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSupercharge}
                  disabled={isSupercharging}
                  className="flex items-center gap-1 md:gap-2 text-yellow-400 hover:text-yellow-300 transition-colors p-2 h-auto hover:bg-yellow-400/10"
                  title="Supercharge this echo with a Super Boost token!">

                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-medium hidden md:inline">Supercharge</span>
                  </Button>
                }
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {displayPost.impressions_count > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-600/10 border border-cyan-500/20 rounded-lg">
                  <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-400 text-xs font-medium">{displayPost.impressions_count.toLocaleString()}</span>
                </div>
              )}

              {displayPost.ep_rewards_earned > 0 &&
              <div className="flex items-center gap-1 text-purple-400 text-sm">
                  <Zap className="w-4 h-4" />
                  <span>+{displayPost.ep_rewards_earned} EP</span>
                </div>
              }
            </div>
          </div>

          <AnimatePresence>
            {showComments &&
            <motion.div
              ref={commentsContainerRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden">

                <CommentSection
                post={displayPost}
                onCommentAdded={() => onCommentAdded(displayPost)}
                currentUser={currentUser}
                highlightCommentId={highlightCommentId} />

              </motion.div>
            }
          </AnimatePresence>
        </CardContent>
      </Card>

      <AnimatePresence>
        {showNFTUnlock &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 z-50"
          onClick={handleNFTUnlockClose}>

            <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md">

              <NFTAccessChecker
              nftGateSettings={displayPost.nft_gate_settings}
              contentType="post"
              onAccessGranted={handleNFTAccessGranted}
              onClose={handleNFTUnlockClose} />

            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </motion.div>);

}