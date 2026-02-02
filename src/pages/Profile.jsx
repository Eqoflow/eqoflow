import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import { Link, useLocation } from 'react-router-dom';
import { UserContext } from '../components/contexts/UserContext';
import { User } from "@/entities/User";
import { UserProfileData } from "@/entities/UserProfileData";
import { PublicUserDirectory } from "@/entities/PublicUserDirectory";
import { Post } from "@/entities/Post";
// ReferralCodeRequest and ReferralLog are no longer needed, removing their imports
// import { ReferralCodeRequest } from "@/entities/ReferralCodeRequest";
// import { ReferralLog } from "@/entities/ReferralLog";
import { UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  User as UserIcon,
  Edit,
  Save,
  X,
  Wallet,
  Link as LinkIcon,
  Shield,
  Coins,
  TrendingUp,
  ExternalLink,
  AlertTriangle,
  Briefcase,
  Zap,
  ImageIcon,
  Loader2,
  CheckCircle,
  Check,
  MessageSquare,
  UserCheck,
  CreditCard,
  Calendar } from
"lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import NFTTrophyCabinet from "../components/profile/NFTTrophyCabinet";
import VRTrophyRoom from "../components/profile/VRTrophyRoom";
import EditPostModal from "../components/feed/EditPostModal";
import IdentityHub from '../components/identity/IdentityHub';
import ProfessionalCredentialsManager from '../components/identity/ProfessionalCredentialsManager';

import CreatorBadge from '../components/identity/CreatorBadge';
import PioneerBadge from '../components/identity/PioneerBadge';
import QuantumCreatorBadge from '../components/identity/QuantumCreatorBadge';
import QuantumProBadge from '../components/identity/QuantumProBadge';
import ProfessionalBadge from '../components/identity/ProfessionalBadge';
import CrossPlatformBadges from '../components/identity/CrossPlatformBadges';


import { updatePublicDirectory } from "@/functions/updatePublicDirectory";
import { updatePostsAfterNameChange } from "@/functions/updatePostsAfterNameChange";
import { updatePostsAfterAvatarChange } from "@/functions/updatePostsAfterAvatarChange";
import { updateUserProfileData } from "@/functions/updateUserProfileData";

import ProfileHistory from "../components/profile/ProfileHistory";
import EngagementRewardsTab from "../components/profile/EngagementRewardsTab";
import PrivacyHubTab from "../components/profile/PrivacyHubTab";
import WalletManager from "../components/profile/WalletManager";
import FiatPaymentManager from "../components/profile/FiatPaymentManager";
import TokenBalanceCard from "../components/profile/TokenBalanceCard";
import PushNotificationManager from "../components/notifications/PushNotificationManager";
import ScheduledPostsTab from "../components/profile/ScheduledPostsTab";
import CoCEOBadge from '../components/identity/CoCEOBadge';
import CMOBadge from '../components/identity/CMOBadge';
import CoFounderBadge from '../components/identity/CoFounderBadge';
import CFOBadge from '../components/identity/CFOBadge';
import AdvancedAnalytics from "../components/profile/AdvancedAnalytics";
import PayoutNotice from '../components/layout/PayoutNotice';
import QFLOWStakingCard from '../components/wallet/QFLOWStakingCard';
import ManageSubscriptions from '../components/profile/ManageSubscriptions';

import { getFromCache, setInCache, invalidateCache, CACHE_CONFIG, UserCacheHelpers } from '../components/contexts/UserContext';
import { debounce } from 'lodash';


const getInitialActiveTab = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const section = urlParams.get('section');
  const knownTabs = ["overview", "posts", "scheduled", "identity", "professional", "engagement", "wallet", "analytics", "privacy", "subscriptions"];
  if (section && knownTabs.includes(section)) {
    return section;
  }
  return 'overview';
};

export default function Profile() {
  const location = useLocation();
  const { user, refreshUser, isLoading: isUserLoading } = useContext(UserContext);

  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [showVRRoom, setShowVRRoom] = useState(false);

  // Lazy loading states
  const [activeTab, setActiveTab] = useState(getInitialActiveTab());
  const [loadedTabs, setLoadedTabs] = useState(() => new Set([getInitialActiveTab()]));

  const [editingPost, setEditingPost] = useState(null);
  const [mockDataAdded, setMockDataAdded] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [upgradedPlan, setUpgradedPlan] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');

  // Referral Program States - Removed as per outline
  // const [referralLink, setReferralLink] = useState('');
  // const [copied, setCopied] = useState(false);
  // const [customCodeRequest, setCustomCodeRequest] = useState("");
  // const [isRequesting, setIsRequesting] = useState(false);
  // const [pendingRequest, setPendingRequest] = null);
  // const [referralStats, setReferralStats] = useState({
  //   totalReferred: 0,
  //   totalEarned: 0,
  //   pendingRewards: 0,
  //   recentReferrals: []
  // });

  const bannerInputRef = useRef(null);
  const kycHandledRef = useRef(false); // Ref to ensure KYC completion logic runs only once per URL change

  // NEW: State for username validation
  const [usernameError, setUsernameError] = useState(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);


  // MODIFIED: Added textColor property as per outline, but retained existing properties
  // (bg, cssPrimary, cssSecondary) to maintain functionality for getAvatarBackgroundStyle.
  const colorSchemes = [
  { name: "purple", label: "Purple Magic", gradient: "linear-gradient(to right, #8b5cf6, #ec4899)", bg: "bg-purple-600", cssPrimary: "#9333ea", cssSecondary: "#ec4899", textColor: "text-white" },
  { name: "blue", label: "Ocean Blue", gradient: "linear-gradient(to right, #3b82f6, #06b6d4)", bg: "bg-blue-600", cssPrimary: "#2563eb", cssSecondary: "#06b6d4", textColor: "text-white" },
  { name: "green", label: "Forest Green", gradient: "linear-gradient(to right, #16a34a, #10b981)", bg: "bg-green-600", cssPrimary: "#16a34a", cssSecondary: "#10b981", textColor: "text-white" },
  { name: "orange", label: "Sunset Orange", gradient: "linear-gradient(to right, #f97316, #eab308)", bg: "bg-orange-600", cssPrimary: "#ea580c", cssSecondary: "#eab308", textColor: "text-white" },
  { name: "red", label: "Fire Red", gradient: "linear-gradient(to right, #ef4444, #ec4899)", bg: "bg-red-600", cssPrimary: "#dc2626", cssSecondary: "#ec4899", textColor: "text-white" },
  { name: "pink", label: "Bubblegum Pink", gradient: "linear-gradient(to right, #ec4899, #f43f5e)", bg: "bg-rose-600", cssPrimary: "#ec4899", cssSecondary: "#f43f5e", textColor: "text-white" },
  { name: "cyan", label: "Electric Cyan", gradient: "linear-gradient(to right, #0891b2, #3b82f6)", bg: "bg-cyan-600", cssPrimary: "#0891b2", cssSecondary: "#3b82f6", textColor: "text-white" },
  { name: "yellow", label: "Golden Yellow", gradient: "linear-gradient(to right, #eab308, #f97316)", bg: "bg-yellow-600", cssPrimary: "#eab308", cssSecondary: "#f97316", textColor: "text-white" },
  { name: "indigo", label: "Deep Indigo", gradient: "linear-gradient(to right, #4f46e5, #a855f7)", bg: "bg-indigo-600", cssPrimary: "#4f46e5", cssSecondary: "#a855f7", textColor: "text-white" },
  { name: "emerald", label: "Emerald Green", gradient: "linear-gradient(to right, #059669, #22c55e)", bg: "bg-emerald-600", cssPrimary: "#059669", cssSecondary: "#22c55e", textColor: "text-white" }];


  const trackProfileView = React.useCallback(async () => {
    if (!user?.email) return;
    try {
      const { trackProfileView } = await import('@/functions/trackProfileView');
      await trackProfileView({ profileOwnerEmail: user.email });
    } catch (error) {
      console.log('Profile view tracking unavailable:', error);
    }
  }, [user?.email]);

  // useEffect(() => { // Removed referral link generation
  //   if (user) {
  //     const code = user.custom_referral_code || user.id;
  //     const link = `https://eqoflow.app${createPageUrl('Landing')}?ref=${code}`;
  //     setReferralLink(link);
  //   }
  // }, [user]);

  // loadReferralStats function removed
  // const loadReferralStats = React.useCallback(async () => {
  //   if (!user?.email) return;
  //   try {
  //     const logs = await ReferralLog.filter({ referrer_email: user.email });
  //     const totalEarned = logs.reduce((sum, log) => sum + (log.referrer_reward || 0), 0);
  //     const totalReferred = logs.filter(log => log.status === 'completed').length;
  //     const pendingRewards = logs.filter(log => log.status === 'pending_reward').reduce((sum, log) => sum + (log.referrer_reward || 0), 0);

  //     setReferralStats({
  //       totalReferred: totalReferred,
  //       totalEarned: totalEarned,
  //       pendingRewards: pendingRewards,
  //       recentReferrals: logs.slice(0, 5).map(log => ({
  //         name: log.referred_user_display_name || log.referred_user_email.split('@')[0],
  //         date: log.created_date,
  //         reward: log.referrer_reward,
  //         status: log.status === 'completed' ? 'Earned' : log.status === 'pending_reward' ? 'Pending' : 'Tracked'
  //       }))
  //     });
  //   } catch (error) {
  //     console.error("Error loading referral stats:", error);
  //     setReferralStats({
  //       totalReferred: 0,
  //       totalEarned: 0,
  //       pendingRewards: 0,
  //       recentReferrals: []
  //     });
  //   }
  // }, [user?.email]);

  // checkPendingRequest function removed
  // const checkPendingRequest = React.useCallback(async () => {
  //   if (!user?.email) return;
  //   try {
  //     const requests = await ReferralCodeRequest.filter({ created_by: user.email }, '-created_date', 1);
  //     if (requests.length > 0 && requests[0].status !== 'rejected') {
  //       setPendingRequest(requests[0]);
  //     } else {
  //       setPendingRequest(null);
  //     }
  //   } catch (error) {
  //     console.error("Error checking pending referral code request:", error);
  //     setPendingRequest(null);
  //   }
  // }, [user?.email]);


  useEffect(() => {
    if (user) {
      loadUserPosts(user);
      if (user.email) {




















        // Profile view tracking removed from here to prevent rate-limiting on own profile view.
        // Tracking is handled on PublicProfile.js when another user views the profile.
        // loadReferralStats(); // Removed
        // checkPendingRequest(); // Removed
      }setEditData({ full_name: user.full_name || "", username: user.username || "", bio: user.bio || "", website: user.website || "", square_connect_link: user.square_connect_link || "", stripe_connect_link: user.stripe_connect_link || "", skills: user.skills || [], interests: user.interests || [], color_scheme: user.color_scheme || "purple", nft_trophy_cabinet: user.nft_trophy_cabinet || { featured_nfts: [], is_public: true }, external_identities: user.external_identities || {}, privacy_settings: user.privacy_settings || { allow_stranger_messages: true, data_monetization_enabled: true, profile_visibility: 'public', show_activity: true, show_followers: true }, notification_preferences: user.notification_preferences || {
            dm_notifications: true
          },
          professional_credentials: user.professional_credentials || {
            is_verified: false,
            employment_history: [],
            education_history: [],
            certifications: [],
            is_public: true
          }
        });
    }
  }, [user]); // Removed checkPendingRequest, loadReferralStats from dependencies

  // FIX: Use useMemo for debounced function to fix hook error
  const checkUsernameAvailability = useMemo(
    () => debounce(async (newUsername, currentUserEmail, currentOriginalUsername) => {
      if (!newUsername || newUsername.length < 3) {
        setUsernameError(null); // Clear error if username is too short or empty
        setIsCheckingUsername(false);
        return;
      }

      // If the new username is the same as the user's current (original) username, it's valid
      if (newUsername.toLowerCase() === currentOriginalUsername?.toLowerCase()) {
        setUsernameError(null);
        setIsCheckingUsername(false);
        return;
      }

      setIsCheckingUsername(true);
      try {
        const foundUsers = await PublicUserDirectory.filter({ username: newUsername.toLowerCase() });
        // Check if any found user is not the current user (by email)
        if (foundUsers.length > 0 && foundUsers.some((u) => u.user_email !== currentUserEmail)) {
          setUsernameError("Username is already taken, please choose another.");
        } else {
          setUsernameError(null);
        }
      } catch (error) {
        console.error("Error checking username:", error);
        // In case of an error, we don't block the user from trying to save,
        // but we log it and keep the error state clear.
        setUsernameError(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500),
    [] // No dependencies needed here as the function is self-contained and gets all data via args
  );

  // NEW: useEffect to trigger username check when it changes
  useEffect(() => {
    // Only check if editing and user data is loaded and username in editData is different from current user.username
    if (isEditing && user && editData.username !== undefined) {
      checkUsernameAvailability(editData.username, user.email, user.username);
    } else {
      // Clear error and checking status if not editing or username is reset
      setUsernameError(null);
      setIsCheckingUsername(false);
    }
  }, [isEditing, editData.username, user, checkUsernameAvailability]);


  // Referral Program Functions - Removed as per outline
  // const getReferralLink = () => {
  //   return referralLink;
  // };

  // const copyReferralLink = () => {
  //   navigator.clipboard.writeText(getReferralLink());
  //   setCopied(true);
  //   setTimeout(() => setCopied(false), 2000);
  // };

  // const shareReferralLink = async () => {
  //   const shareData = {
  //     title: 'Join EqoFlow - The Decentralized Social Platform',
  //     text: 'I\'m using EqoFlow, a revolutionary decentralized social platform. Join me and we both get $EQOFLO tokens!',
  //     url: getReferralLink()
  //   };

  //   if (navigator.share) {
  //     try {
  //       await navigator.share(shareData);
  //     } catch (error) {
  //       console.error('Error sharing:', error);
  //       copyReferralLink();
  //     }
  //   } else {
  //     copyReferralLink();
  //   }
  // };

  // const handleRequestCode = async () => { // Renamed from handleRequestCustomCode
  //   if (!customCodeRequest.match(/^[a-zA-Z0-9_]{3,15}$/)) {
  //     alert("Custom code must be 3-15 characters long and contain only letters, numbers, and underscores.");
  //     return;
  //   }
  //   setIsRequesting(true);
  //   try {
  //     await ReferralCodeRequest.create({ requested_code: customCodeRequest, created_by: user.email });
  //     await checkPendingRequest();
  //     setCustomCodeRequest("");
  //     alert("Custom code request submitted successfully!");
  //   } catch (error) {
  //     console.error("Error requesting custom code:", error);
  //     alert("Failed to request custom code. It might already be taken or an error occurred.");
  //   } finally {
  //     setIsRequesting(false);
  //   }
  // };
  // End Referral Program Functions

  // NEW: Function to handle tab changes and track loaded tabs
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setLoadedTabs((prev) => new Set([...prev, tabName])); // Mark this tab as loaded
  };

  useEffect(() => {
    if (user && activeTab) {
      const urlParams = new URLSearchParams(window.location.search);
      const sectionParam = urlParams.get('section');
      const newKnownTabs = ["overview", "posts", "scheduled", "identity", "professional", "engagement", "wallet", "analytics", "privacy", "subscriptions"];
      if (sectionParam && activeTab === sectionParam && newKnownTabs.includes(sectionParam)) {
        setTimeout(() => {
          const element = document.getElementById(sectionParam);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight-section');
            setTimeout(() => {
              element.classList.remove('highlight-section');
            }, 2000);
          }
        }, 100);
      }
    }
  }, [user, activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      setPaymentSuccess(true);
      setUpgradedPlan(params.get('plan') || '');
      window.history.replaceState({}, document.title, location.pathname + location.hash);
      setTimeout(() => setPaymentSuccess(false), 6000);
    }

    // Check for X OAuth success/error
    if (params.get('x_success') === 'true') {
      setSuccessMessage("X account connected successfully! You can now post to X from EqoChambers.");
      window.history.replaceState({}, document.title, location.pathname);
      setTimeout(() => setSuccessMessage(""), 5000);
      refreshUser();
    }

    if (params.get('x_error')) {
      const errorCode = params.get('x_error');
      let errorMsg = "Failed to connect X account. Please try again.";
      if (errorCode === 'unauthorized') errorMsg = "Authentication failed. Please try connecting again.";
      if (errorCode === 'token_exchange_failed') errorMsg = "Failed to complete X connection. Please try again.";

      setErrorMessage(errorMsg);
      window.history.replaceState({}, document.title, location.pathname);
      setTimeout(() => setErrorMessage(""), 5000);
    }
  }, [location, refreshUser]);

  // Add effect to check for KYC completion callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const kycFlowComplete = urlParams.get('kyc_flow_complete');

    // Proceed only if KYC flow was completed, user data is available,
    // and this specific KYC completion event hasn't been handled yet for the current URL.
    if (kycFlowComplete === 'true' && user && !kycHandledRef.current) {
      kycHandledRef.current = true; // Mark as handled to prevent re-processing for this specific URL state

      const refreshUserDataAndSetMessage = async () => {
        try {
          const freshUser = await refreshUser(); // refreshUser returns the fresh user

          if (freshUser) {
            // Show a message based on KYC status
            if (freshUser.kyc_status === 'pending') {
              setSuccessMessage('Verification submitted! We\'ll review your documents and notify you of the result.');
            } else if (freshUser.kyc_status === 'verified') {
              setSuccessMessage('Identity verification complete! You can now participate in the ITO and receive payments.');
            }
          }
        } catch (error) {
          console.error('Error refreshing user data after KYC:', error);
          setErrorMessage('Failed to refresh KYC status. Please try again or contact support.');
        } finally {
          // Clean up URL parameter to ensure this effect doesn't re-run for the same param
          window.history.replaceState({}, document.title, window.location.pathname);
          // Automatically hide success/error messages after some time
          setTimeout(() => {
            setSuccessMessage("");
            setErrorMessage("");
          }, 5000);
        }
      };

      refreshUserDataAndSetMessage();
    } else if (kycFlowComplete !== 'true' && kycHandledRef.current) {
      // Reset ref if kyc_flow_complete is no longer in URL (e.g., navigated away and back, or manual removal)
      kycHandledRef.current = false;
    }
  }, [location.search, user, refreshUser, setSuccessMessage, setErrorMessage]);

  const handleWalletUpdate = async (walletData) => {
    await refreshUser();
  };

  const getTotalFollowers = (userData) => {
    const engageFollowers = userData?.followers?.length || 0;
    const web2Followers = userData?.cross_platform_identity?.web2_verifications?.reduce((sum, conn) => sum + (conn.follower_count || 0), 0) || 0;
    const web3Followers = userData?.cross_platform_identity?.web3_connections?.reduce((sum, conn) => sum + (conn.follower_count || 0), 0) || 0;
    return engageFollowers + web2Followers + web3Followers;
  };

  const loadUserPosts = async (currentUser) => {
    if (!currentUser) return;

    try {
      setIsLoadingPosts(true);

      const userSpecificCacheConfig = {
        ...CACHE_CONFIG.PROFILE_POSTS,
        key: `profile_posts_${currentUser.email}`
      };

      const cachedPosts = getFromCache(userSpecificCacheConfig);
      if (cachedPosts && cachedPosts.length > 0) {
        setPosts(cachedPosts);
        setIsLoadingPosts(false);
        return;
      }

      const fetchedPosts = await Post.filter({ created_by: currentUser.email }, "-created_date", 20);

      setPosts(fetchedPosts);

      setInCache(userSpecificCacheConfig, fetchedPosts);

    } catch (error) {
      console.error("Error loading user posts:", error);
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleAddMockData = async () => {
    try {
      const mockNFTs = [
      {
        "contract_address": "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
        "token_id": "1234",
        "name": "Bored Ape #1234",
        "image_url": "https://img.seadn.io/files/b2d5a57f035f2a1b9b0b645b6b15310e.png?auto=format&fit=fill&w=500",
        "collection_name": "Bored Ape Yacht Club",
        "rarity_rank": 1234,
        "floor_price": 45.6
      },
      {
        "contract_address": "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
        "token_id": "5678",
        "name": "Azuki #5678",
        "image_url": "https://img.seadn.io/files/c885392476563d7637562214372922f2.png?auto=format&fit=fill&w=500",
        "collection_name": "Azuki",
        "rarity_rank": 567,
        "floor_price": 10.2
      },
      {
        "contract_address": "0x60E4d786628Fea6478F785A6d7e704777c86a7c6",
        "token_id": "9101",
        "name": "Mutant Ape #9101",
        "image_url": "https://img.seadn.io/files/0f85369a3a6998b3c314051064571853.png?auto=format&fit=fill&w=500",
        "collection_name": "Mutant Ape Yacht Club",
        "rarity_rank": 987,
        "floor_price": 8.5
      }];


      const updatedCabinet = {
        is_public: true,
        vr_showcase_enabled: true,
        featured_nfts: mockNFTs
      };

      await User.updateMyUserData({ nft_trophy_cabinet: updatedCabinet });
      alert('Mock NFT data added successfully! The page will now refresh to show your new collection.');
      await refreshUser();
      setMockDataAdded(true);
    } catch (error) {
      console.error("Error adding mock NFT data:", error);
      alert('Failed to add mock data. Error: ' + error.message);
    }
  };

  const handleSetTestTokens = async () => {
    try {
      await User.updateMyUserData({
        token_balance: 20000,
        reputation_score: 150,
        tokens_on_hold: 500
      });
      alert('Test tokens added! The page will refresh to show your new balance.');
      await refreshUser();
    } catch (error) {
      console.error("Error setting test tokens:", error);
      alert('Failed to set test tokens. Error: ' + error.message);
    }
  };

  const handleResetOnboarding = async () => {
    if (!user) return;
    try {
      await UserProfileData.update(user.id, { has_completed_onboarding: false });
      await refreshUser();
      alert("Onboarding has been reset. Please navigate to the Feed page to see the welcome modal again.");
    } catch (error) {
      console.error("Error resetting onboarding:", error);
      alert("Failed to reset onboarding status.");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    // NEW: Check for username errors before saving
    if (usernameError || isCheckingUsername) {
      alert("Please resolve username issues before saving.");
      return;
    }

    setIsUploading(true);
    setSuccessMessage("");
    setErrorMessage("");
    setSubmitStatus("Saving...");

    try {
      const dataToSave = {
        full_name: editData.full_name || user.full_name, // Preserve existing name if not changed
        username: editData.username,
        bio: editData.bio,
        website: editData.website,
        square_connect_link: editData.square_connect_link,
        stripe_connect_link: editData.stripe_connect_link,
        skills: editData.skills,
        interests: editData.interests,
        color_scheme: editData.color_scheme,
        avatar_url: user.avatar_url,
        banner_url: user.banner_url
      };

      const nameChanged = dataToSave.full_name !== user.full_name;
      const avatarChanged = !!avatarFile;

      if (avatarChanged) {
        const { file_url } = await UploadFile({ file: avatarFile });
        dataToSave.avatar_url = file_url;
      }
      if (bannerFile) {
        const { file_url } = await UploadFile({ file: bannerFile });
        dataToSave.banner_url = file_url;
      }

      // Invalidate user cache since profile is being updated
      UserCacheHelpers.invalidateUserCache();

      // Also invalidate profile-specific posts cache
      const userSpecificCacheConfig = {
        ...CACHE_CONFIG.PROFILE_POSTS,
        key: `profile_posts_${user.email}`
      };
      invalidateCache(userSpecificCacheConfig);

      await updateUserProfileData({ user_email: user.email, updateData: dataToSave });

      if (nameChanged) {
        await updatePostsAfterNameChange({ newFullName: dataToSave.full_name });
      }
      if (avatarChanged) {
        await updatePostsAfterAvatarChange({ newAvatarUrl: dataToSave.avatar_url });
      }

      const publicDirectoryData = { ...user, ...dataToSave };
      await updatePublicDirectory({ updateData: publicDirectoryData });

      await refreshUser();

      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setAvatarFile(null);
      setBannerFile(null);

    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage(`Failed to update profile: ${error.message}`);
    } finally {
      setIsUploading(false);
      setSubmitStatus("");
      setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 5000);
    }
  };

  const handleNFTCabinetToggle = async (isPublic) => {
    try {
      const updatedCabinet = {
        ...user.nft_trophy_cabinet,
        is_public: isPublic
      };
      await UserProfileData.update(user.id, { nft_trophy_cabinet: updatedCabinet });
      await refreshUser();
    } catch (error) {
      console.error("Error toggling NFT cabinet visibility:", error);
    }
  };

  const handleNFTCabinetUpdate = (cabinetData) => {
    setEditData((prev) => ({ ...prev, nft_trophy_cabinet: { ...prev.nft_trophy_cabinet, ...cabinetData } }));
  };

  const handleSkillAdd = (skill) => {
    if (!skill.trim()) return;
    const currentSkills = editData.skills || [];
    if (currentSkills.length >= 5) return;
    if (!currentSkills.includes(skill.trim())) {
      setEditData({ ...editData, skills: [...currentSkills, skill.trim()] });
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    const currentSkills = editData.skills || [];
    setEditData({
      ...editData,
      skills: currentSkills.filter((skill) => skill !== skillToRemove)
    });
  };

  const handleInterestAdd = (interest) => {
    if (!interest.trim()) return;
    const currentInterests = editData.interests || [];
    if (currentInterests.length >= 5) return;
    if (!currentInterests.includes(interest.trim())) {
      setEditData({ ...editData, interests: [...currentInterests, interest.trim()] });
    }
  };

  const handleInterestRemove = (interestToRemove) => {
    const currentInterests = editData.interests || [];
    setEditData({
      ...editData,
      interests: currentInterests.filter((interest) => interest !== interestToRemove)
    });
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleBannerChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBannerFile(e.target.files[0]);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        await Post.delete(postId);
        // Invalidate posts cache after deletion
        if (user) {
          const userSpecificCacheConfig = {
            ...CACHE_CONFIG.PROFILE_POSTS,
            key: `profile_posts_${user.email}`
          };
          invalidateCache(userSpecificCacheConfig);
        }
        await loadUserPosts(user);
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("Failed to delete post. Please try again.");
      }
    }
  };

  const handleUpdatePost = async (postId, data) => {
    try {
      await Post.update(postId, data);
      setEditingPost(null);
      // Invalidate posts cache after update
      if (user) {
        const userSpecificCacheConfig = {
          ...CACHE_CONFIG.PROFILE_POSTS,
          key: `profile_posts_${user.email}`
        };
        invalidateCache(userSpecificCacheConfig);
      }
      await loadUserPosts(user);
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post. Please try again.");
    }
  };

  const userColorSchemeName = user?.color_scheme || 'purple';
  const currentColorScheme = colorSchemes.find((cs) => cs.name === userColorSchemeName) || colorSchemes[0];
  const activeTabGradient = currentColorScheme.gradient;

  const isPngImage = (url) => {
    if (!url) return false;
    return url.toLowerCase().includes('.png') || url.toLowerCase().includes('image/png');
  };

  const getAvatarBackgroundStyle = (avatarUrl) => {
    if (isPngImage(avatarUrl)) {
      return { background: 'linear-gradient(to right, #000000, #1a1a1a)' };
    }
    // Ensures existing functionality using cssPrimary and cssSecondary from colorScheme is preserved
    return { background: `linear-gradient(to right, ${currentColorScheme.cssPrimary}, ${currentColorScheme.cssSecondary})` };
  };

  // Calculate total balance for display (still keeping the variable, but it won't be displayed in overview stats)
  const totalBalance = (user?.token_balance || 0) + (user?.tokens_on_hold || 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`
        .highlight-section {
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.3);
          transition: box-shadow 0.5s ease-in-out;
          border-radius: 12px;
        }
        .glass-morphism {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      {isUserLoading ?
      <div className="flex items-center justify-center pt-20">
          <div className="flex items-center gap-3 text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
            <span className="text-lg">Loading your profile...</span>
          </div>
        </div> :

      user &&
      <div className="max-w-4xl mx-auto p-6">
            <AnimatePresence>
              {paymentSuccess &&
          <motion.div
            className="bg-green-500/10 border border-green-500/20 text-green-300 p-4 rounded-lg mb-6 flex items-center gap-3"
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.4 }}>

                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <h3 className="font-bold text-white">Payment Successful!</h3>
                    <p>Welcome to Quantum+ {upgradedPlan ? ` ${upgradedPlan}` : ''}! Your subscription is now active.</p>
                  </div>
                </motion.div>
          }
              {successMessage &&
          <motion.div
            className="bg-green-500/10 border border-green-500/20 text-green-300 p-4 rounded-lg mb-6 flex items-center gap-3"
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.4 }}>

                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <h3 className="font-bold text-white">Success!</h3>
                    <p>{successMessage}</p>
                  </div>
                </motion.div>
          }
              {errorMessage &&
          <motion.div
            className="bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-lg mb-6 flex items-center gap-3"
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.4 }}>

                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <div>
                    <h3 className="font-bold text-white">Error!</h3>
                    <p>{errorMessage}</p>
                  </div>
                </motion.div>
          }
            </AnimatePresence>

            {/* Profile Header Section (from outline) */}
            <div className="relative rounded-xl overflow-hidden bg-black/50 backdrop-blur-sm border border-purple-500/20 mb-8">
              {/* Banner */}
              <div
            className="w-full h-48 bg-gradient-to-r from-purple-600/20 to-pink-600/20"
            style={{
              backgroundImage: user?.banner_url ? `url(${user.banner_url})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />


              {/* Profile Content */}
              <div className="relative px-6 pb-6">
                {/* Avatar */}
                <div className="flex items-end gap-4 -mt-16">
                  <div
                className="w-32 h-32 rounded-full border-4 border-slate-900 flex items-center justify-center overflow-hidden"
                style={getAvatarBackgroundStyle(user?.avatar_url)}>

                    {user?.avatar_url ?
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" /> :

                <UserIcon className="w-16 h-16 text-white" />
                }
                  </div>

                  {/* Edit Profile Button */}
                  <Button
                onClick={() => {
                  setIsEditing(true);
                  handleTabChange('overview');
                }}
                className="mb-4 bg-purple-600 hover:bg-purple-700">

                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>

                {/* User Info (merged from old !isEditing block and outline) */}
                <div className="mt-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-3xl font-bold">{user?.full_name || 'Your Name'}</h1>
                      {/* Badges - combined from outline and existing ones */}
                      {user.cross_platform_identity && <Badge className="bg-gray-700/20 text-gray-400 border-gray-500/30 flex items-center gap-1"><Shield className="w-3 h-3" /> Identity Connected</Badge>}
                      {user.professional_credentials?.is_verified && <Badge className="bg-blue-700/20 text-blue-400 border-blue-500/30 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Professional Verified</Badge>}

                      <CrossPlatformBadges cross_platform_identity={user.cross_platform_identity} size="lg" userEmail={user.email} />
                      <PioneerBadge userEmail={user.email} />
                      <CreatorBadge userEmail={user.email} />
                      <CoCEOBadge userEmail={user.email} />
                      <CMOBadge userEmail={user.email} />
                      <CoFounderBadge userEmail={user.email} />
                      <CFOBadge userEmail={user.email} />
                      <QuantumCreatorBadge user={user} size="lg" />
                      <QuantumProBadge user={user} size="lg" />
                      <ProfessionalBadge user={user} />
                      {/* CustomBadges removed as it is not defined */}
                    </div>
                    <p className="text-gray-500">@{user?.username || "username"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <UserIcon className="w-4 h-4" />
                      <span className="text-sm text-gray-400">
                        {getTotalFollowers(user)} followers
                      </span>
                      {getTotalFollowers(user) > (user?.followers?.length || 0) &&
                  <span className="text-xs text-purple-400">
                          (across all platforms)
                        </span>
                  }
                    </div>
                  </div>
                </div>
              </div>
            </div>

              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-1 mb-8 bg-black/20 p-2 rounded-xl">
                {[
          { key: "overview", label: "Overview", icon: UserIcon },
          { key: "posts", label: "My Posts", icon: MessageSquare },
          { key: "scheduled", label: "Scheduled Posts", icon: Calendar },
          { key: "identity", label: "Identity", icon: UserCheck },
          { key: "professional", label: "Professional", icon: Briefcase },
          { key: "engagement", label: "Engagement", icon: Zap },
          { key: "wallet", label: "Wallet", icon: Wallet },
          { key: "analytics", label: "Analytics", icon: TrendingUp },
          { key: "privacy", label: "Privacy Hub", icon: Shield },
          { key: "subscriptions", label: "Manage Subscriptions", icon: CreditCard }].
          map(({ key, label, icon: Icon }) =>
          <Button
            key={key}
            onClick={() => handleTabChange(key)}
            variant={activeTab === key ? "default" : "ghost"}
            className={`flex items-center gap-2 text-sm ${
            activeTab === key ?
            "bg-gradient-to-r from-purple-600 to-pink-500 text-white" :
            "text-gray-400 hover:text-white hover:bg-black/30"}`
            }>

                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
          )}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}>

                  {activeTab === "overview" &&
            <div id="overview" className="space-y-6 md:bg-black md:p-4 md:rounded-xl">
                      <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                          <Card className="dark-card">
                            <CardContent className="bg-[#000000] pt-6 p-4 space-y-6 sm:p-6">
                              {isEditing ?
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white">Editing Profile</h3>
                                    <div className="flex gap-2">
                                      <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditing(false);
                                setEditData({
                                  full_name: user.full_name || "",
                                  username: user.username || "",
                                  bio: user.bio || "",
                                  website: user.website || "",
                                  square_connect_link: user.square_connect_link || "",
                                  stripe_connect_link: user.stripe_connect_link || "",
                                  skills: user.skills || [],
                                  interests: user.interests || [],
                                  color_scheme: user.color_scheme || "purple",
                                  nft_trophy_cabinet: user.nft_trophy_cabinet || { featured_nfts: [], is_public: true },
                                  external_identities: user.external_identities || {},
                                  privacy_settings: user.privacy_settings || {},
                                  notification_preferences: user.notification_preferences || {},
                                  professional_credentials: user.professional_credentials || {}
                                });
                                setAvatarFile(null);
                                setBannerFile(null);
                                setSuccessMessage("");
                                setErrorMessage("");
                                setSubmitStatus("");
                                setUsernameError(null); // Clear username error on cancel
                                setIsCheckingUsername(false); // Clear checking status on cancel
                              }}
                              className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10">

                                        <X className="w-4 h-4" />
                                      </Button>
                                      <Button
                              onClick={handleSaveProfile}
                              disabled={isUploading || isCheckingUsername || !!usernameError}
                              size="sm"
                              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">

                                        {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save
                                      </Button>
                                    </div>
                                  </div>
                                  {submitStatus &&
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-purple-400 text-center text-sm">

                                      {submitStatus}
                                    </motion.p>
                        }
                                  <div className="space-y-2">
                                    <Label htmlFor="banner-upload" className="text-sm font-medium text-gray-400 block">Profile Banner</Label>
                                    <div className="flex items-center gap-4">
                                      <div className="w-40 h-24 bg-black/20 rounded-lg overflow-hidden flex-shrink-0 border border-gray-700">
                                        {bannerFile ?
                              <img src={URL.createObjectURL(bannerFile)} alt="Banner Preview" className="w-full h-full object-cover" /> :
                              editData.banner_url || user?.banner_url ?
                              <img src={editData.banner_url || user.banner_url} alt="Profile Banner" className="w-full h-full object-cover" /> :

                              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Banner</div>
                              }
                                      </div>
                                      <input
                              id="banner-upload"
                              type="file"
                              onChange={handleBannerChange}
                              className="hidden"
                              ref={bannerInputRef}
                              accept="image/png, image/jpeg, image/gif" />

                                      <Button type="button" onClick={() => bannerInputRef.current.click()} disabled={isUploadingBanner} className="border-purple-500/30 text-white hover:bg-purple-500/10">
                                        {isUploadingBanner ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />} Upload Banner
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="avatar-upload" className="text-sm font-medium text-gray-400 block">Profile Picture</Label>
                                    <div className="flex items-center gap-4">
                                      <div
                              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                              style={getAvatarBackgroundStyle(avatarFile ? URL.createObjectURL(avatarFile) : user?.avatar_url)}>

                                        {avatarFile ?
                              <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover rounded-2xl" /> :
                              user?.avatar_url ?
                              <img src={user.avatar_url} alt={user.full_name || "User Avatar"} className="w-full h-full object-cover rounded-2xl" /> :

                              <UserIcon className="w-8 h-8 text-white" />
                              }
                                      </div>
                                      <Input
                              id="avatar-upload"
                              type="file"
                              onChange={handleAvatarChange}
                              className="bg-black/20 border-purple-500/20 text-white file:text-purple-300 file:bg-purple-500/10 file:border-0"
                              accept="image/png, image/jpeg" />

                                    </div>
                                    <p className="text-xs text-gray-500">
                                      For PNG images with transparent backgrounds (like logos), we'll use a black background for better visibility.
                                    </p>
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium text-gray-400 mb-2 block">Full Name</Label>
                                    <Input
                            value={editData.full_name || ''}
                            onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                            className="bg-black/20 border-purple-500/20 text-white"
                            placeholder="Your full name" />

                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium text-gray-400 mb-2 block">Username</Label>
                                    <div className="relative">
                                      <Input
                              value={editData.username || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase(); // Sanitize and lowercase
                                setEditData({ ...editData, username: value });
                              }}
                              className={`bg-black/20 border-purple-500/20 text-white ${usernameError ? "border-red-500" : ""}`}
                              placeholder="Your username" />

                                      {isCheckingUsername && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
                                    </div>
                                    {usernameError && <p className="text-red-500 text-xs mt-1">{usernameError}</p>}
                                    {!usernameError && <p className="text-gray-500 text-xs mt-1">Username can only contain letters, numbers, and underscores.</p>}
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium text-gray-400 mb-2 block">Bio</Label>
                                    <Textarea
                            value={editData.bio || ''}
                            onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                            className="bg-black/20 border-purple-500/20 text-white"
                            placeholder="Tell us about yourself..."
                            rows={3} />

                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium text-gray-400 mb-2 block">Website / Shop Link</Label>
                                    <Input
                            value={editData.website || ''}
                            onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                            className="bg-black/20 border-purple-500/20 text-white"
                            placeholder="https://yourwebsite.com or https://yourshop.com"
                            type="url" />

                                    <p className="text-xs text-gray-500">
                                      Add your website, online store, portfolio, or any link you want to share with your followers
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-400 mb-3 block">Color Scheme</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                      {colorSchemes.map((scheme) =>
                            <button
                              key={scheme.name}
                              type="button"
                              onClick={() => setEditData({ ...editData, color_scheme: scheme.name })}
                              className={`relative flex items-center justify-center text-center p-2 h-14 rounded-xl border-2 transition-all hover:scale-105 ${
                              editData.color_scheme === scheme.name || !editData.color_scheme && user?.color_scheme === scheme.name ?
                              'border-white shadow-lg' :
                              'border-transparent'}`
                              }
                              style={{
                                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                background: scheme.gradient
                              }}>

                                          <span className={`text-xs font-bold ${scheme.textColor}`}>{scheme.label}</span>
                                          {(editData.color_scheme === scheme.name || !editData.color_scheme && user?.color_scheme === scheme.name) &&
                              <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                              <Check className="w-3 h-3 text-black" />
                                            </div>
                              }
                                        </button>
                            )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      Choose your favorite color scheme to personalize your experience
                                    </p>
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium text-gray-400 mb-2 block">
                                      Skills (up to 5)
                                    </Label>
                                    <div className="space-y-3">
                                      <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-black/20 border border-purple-500/20 rounded-lg">
                                        {(editData.skills || []).map((skill, index) =>
                              <Badge
                                key={index}
                                className="bg-purple-600/20 text-purple-400 border-purple-500/30 flex items-center gap-1 cursor-pointer hover:bg-purple-600/30"
                                onClick={() => handleSkillRemove(skill)}>

                                            {skill}
                                            <X className="w-3 h-3 hover:text-red-400" />
                                          </Badge>
                              )}
                                        {(editData.skills || []).length === 0 &&
                              <span className="text-gray-500 text-sm">No skills added yet</span>
                              }
                                      </div>
                                      {(editData.skills || []).length < 5 &&
                            <div className="flex gap-2">
                                          <Input
                                placeholder="Add a skill and press Enter"
                                className="bg-black/20 border-purple-500/20 text-white flex-1"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSkillAdd(e.target.value);
                                    e.target.value = '';
                                  }
                                }} />

                                        </div>
                            }
                                      <p className="text-xs text-gray-500">
                                        {editData.skills?.length || 0}/5 skills added. Press Enter to add each skill.
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium text-gray-400 mb-2 block">
                                      Interests (up to 5)
                                    </Label>
                                    <div className="space-y-3">
                                      <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-black/20 border border-purple-500/20 rounded-lg">
                                        {(editData.interests || []).map((interest, index) =>
                              <Badge
                                key={index}
                                className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30 flex items-center gap-1 cursor-pointer hover:bg-cyan-600/30"
                                onClick={() => handleInterestRemove(interest)}>

                                            {interest}
                                            <X className="w-3 h-3 hover:text-red-400" />
                                          </Badge>
                              )}
                                        {(editData.interests || []).length === 0 &&
                              <span className="text-gray-500 text-sm">No interests added yet</span>
                              }
                                      </div>
                                      {(editData.interests || []).length < 5 &&
                            <div className="flex gap-2">
                                          <Input
                                placeholder="Add an interest and press Enter"
                                className="bg-black/20 border-purple-500/20 text-white flex-1"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleInterestAdd(e.target.value);
                                    e.target.value = '';
                                  }
                                }} />

                                        </div>
                            }
                                      <p className="text-xs text-gray-500">
                                        {editData.interests?.length || 0}/5 interests added. Press Enter to add each interest.
                                      </p>
                                    </div>
                                  </div>

                                  {successMessage &&
                        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-green-400 text-center text-sm">{successMessage}</motion.p>
                        }
                                  {errorMessage &&
                        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-center text-sm">{errorMessage}</motion.p>
                        }
                                </motion.div> :

                      <div className="space-y-6">
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <h3 className="text-lg font-semibold text-white">About</h3>
                                      {/* This button functionality is now handled by the top header's button */}
                                    </div>
                                    <p className="text-gray-400 leading-relaxed">
                                      {user?.bio || "No bio added yet. Click edit to add your story!"}
                                    </p>
                                  </div>

                                  {user?.website &&
                        <div>
                                      <h3 className="text-lg font-semibold text-white mb-2">Website</h3>
                                      <a
                            href={user.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors">
                                        <LinkIcon className="w-4 h-4" />
                                        {user.website}
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                        }

                                  {/* Stats Grid - Remove $EQOFLO tokens card */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                                    {/* Posts Card */}
                                    <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}>

                                      <Card className="dark-card text-center">
                                        <CardContent className="pt-6">
                                          <div className="text-4xl font-bold text-cyan-400 mb-2">
                                            {posts.length}
                                          </div>
                                          <div className="text-gray-400">Posts</div>
                                        </CardContent>
                                      </Card>
                                    </motion.div>

                                    {/* Reputation Card */}
                                    <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}>

                                      <Card className="dark-card text-center">
                                        <CardContent className="pt-6">
                                          <div className="text-4xl font-bold text-purple-400 mb-2">
                                            {user.reputation_score || 0}
                                          </div>
                                          <div className="text-gray-400">Reputation</div>
                                        </CardContent>
                                      </Card>
                                    </motion.div>

                                    {/* Total Followers Card */}
                                    <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}>

                                      <Card className="dark-card text-center">
                                        <CardContent className="pt-6">
                                          <div className="text-4xl font-bold text-pink-400 mb-2">
                                            {getTotalFollowers(user)}
                                          </div>
                                          <div className="text-gray-400">Total Followers</div>
                                        </CardContent>
                                      </Card>
                                    </motion.div>
                                  </div>

                                  <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Theme</h3>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r`} style={{ background: colorSchemes.find((c) => c.name === (user?.color_scheme || 'purple'))?.gradient || 'from-purple-600 to-pink-500' }}></div>
                                      <div>
                                        <p className="font-medium text-white">
                                          {colorSchemes.find((c) => c.name === (user?.color_scheme || 'purple'))?.label || 'Purple Magic'}
                                        </p>
                                        <p className="text-sm text-gray-400">Current color scheme</p>
                                      </div>
                                    </div>
                                  </div>

                                  {user?.skills && user.skills.length > 0 &&
                        <div>
                                      <h3 className="text-lg font-semibold text-white mb-3">Skills</h3>
                                      <div className="flex flex-wrap gap-2">
                                        {user.skills.map((skill, index) =>
                            <Badge key={index} className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                                            {skill}
                                          </Badge>
                            )}
                                      </div>
                                    </div>
                        }

                                  {user?.interests && user.interests.length > 0 &&
                        <div>
                                      <h3 className="text-lg font-semibold text-white mb-3">Interests</h3>
                                      <div className="flex flex-wrap gap-2">
                                        {user.interests.map((interest, index) =>
                            <Badge key={index} className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">
                                            {interest}
                                          </Badge>
                            )}
                                      </div>
                                    </div>
                        }
                                </div>
                      }
                            </CardContent>
                          </Card>
                        </div>

                        <div className="space-y-6">
                          <Card className="dark-card">
                            <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5">
                              <CardTitle className="text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-400" />
                                Account Info
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="bg-[#000000] p-4 text-sm space-y-3 sm:p-6">
                              {/* Red Warning Box */}
                              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-red-300 text-xs font-semibold mb-1">Zero Tolerance Policy</p>
                                    <p className="text-red-200 text-xs leading-relaxed">
                                      Creating duplicate accounts to gamify the system will not be tolerated. Anyone found doing so will lose their tokens and have those accounts permanently removed.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Joined</span>
                                <span className="text-white">
                                  {user?.created_date ? format(new Date(user.created_date), "MMM yyyy") : "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Profile Visibility</span>
                                <Badge className={`${
                        user?.privacy_settings?.profile_visibility ?
                        "bg-blue-600/20 text-blue-400 border-blue-500/30" :
                        "bg-gray-600/20 text-gray-400 border-gray-500/30"}`
                        }>
                                  {user?.privacy_settings?.profile_visibility || "Public"}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Data Sales</span>
                                <Badge className={`${
                        user?.privacy_settings?.data_monetization_enabled ?
                        "bg-green-600/20 text-green-400 border-green-500/30" :
                        "bg-red-600/20 text-red-400 border-red-500/30"}`
                        }>
                                  {user?.privacy_settings?.data_monetization_enabled ? "Enabled" : "Disabled"}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">DM from Strangers</span>
                                <Badge className={`${
                        user?.privacy_settings?.allow_stranger_messages ?
                        "bg-green-600/20 text-green-400 border-green-500/30" :
                        "bg-red-600/20 text-red-400 border-red-500/30"}`
                        }>
                                  {user?.privacy_settings?.allow_stranger_messages ? "Enabled" : "Disabled"}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">DM Notifications</span>
                                <Badge className={`${
                        user?.notification_preferences?.dm_notifications ?
                        "bg-green-600/20 text-green-400 border-green-500/30" :
                        "bg-red-600/20 text-red-400 border-red-500/30"}`
                        }>
                                  {user?.notification_preferences?.dm_notifications ? "Enabled" : "Disabled"}
                                &nbsp;
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Show Activity</span>
                                <Badge className={`${
                        user?.privacy_settings?.show_activity ?
                        "bg-green-600/20 text-green-400 border-green-500/30" :
                        "bg-red-600/20 text-red-400 border-red-500/30"}`
                        }>
                                  {user?.privacy_settings?.show_activity ? "Enabled" : "Disabled"}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Show Followers</span>
                                <Badge className={`${
                        user?.privacy_settings?.show_followers ?
                        "bg-green-600/20 text-green-400 border-green-500/30" :
                        "bg-red-600/20 text-red-400 border-red-500/30"}`
                        }>
                                  {user?.privacy_settings?.show_followers ? "Enabled" : "Disabled"}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Push Notifications</span>
                                <PushNotificationManager user={user} />
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <NFTTrophyCabinet
                user={user}
                onUpdate={handleNFTCabinetUpdate}
                onTogglePublic={handleNFTCabinetToggle}
                isEditing={isEditing}
                onViewVRRoom={() => setShowVRRoom(true)} />

                      {showVRRoom &&
              <VRTrophyRoom
                nfts={user?.nft_trophy_cabinet?.featured_nfts || []}
                onClose={() => setShowVRRoom(true)} />
              }
                    </div>
            }

                  {activeTab === "posts" &&
            <div id="posts">
                      <ProfileHistory
                user={user}
                posts={posts}
                onEditPost={handleEditPost}
                onDeletePost={handleDeletePost} />
                    </div>
            }

                  {activeTab === "scheduled" && loadedTabs.has("scheduled") &&
            <div id="scheduled" className="bg-transparent md:bg-black md:p-4 md:rounded-xl">
                      <ScheduledPostsTab user={user} />
                    </div>
            }

                  {activeTab === 'identity' && loadedTabs.has('identity') &&
            <div id="identity" className="bg-transparent md:bg-black md:p-4 md:rounded-xl">
                      <IdentityHub
                user={user}
                onUpdate={async (data) => {
                  UserCacheHelpers.invalidateUserCache();
                  await User.updateMyUserData(data);
                  await refreshUser();
                }} />
                    </div>
            }

                  {activeTab === 'professional' && loadedTabs.has('professional') &&
            <div id="professional" className="bg-transparent md:bg-black md:p-4 md:rounded-xl">
                      <ProfessionalCredentialsManager
                user={user}
                onUpdate={async (data) => {
                  UserCacheHelpers.invalidateUserCache();
                  await User.updateMyUserData(data);
                  await refreshUser();
                }} />
                    </div>
            }

                  {activeTab === "engagement" && loadedTabs.has("engagement") &&
            <div id="engagement" className="bg-transparent md:bg-black md:p-4 md:rounded-xl">
                      <EngagementRewardsTab user={user} onUpdate={refreshUser} />
                    </div>
            }

                  {activeTab === "wallet" && loadedTabs.has("wallet") &&
            <div id="wallet" className="mx-auto space-y-6 bg-transparent md:bg-black md:p-4 md:rounded-xl">
                      <TokenBalanceCard user={user} />
                      <PayoutNotice />
                      <WalletManager user={user} onUpdate={handleWalletUpdate} />
                      <QFLOWStakingCard user={user} onUpdate={refreshUser} />
                      <FiatPaymentManager user={user} onUpdate={refreshUser} />
                      {/* EPSwapInterface temporarily removed */}
                      {/* <EPSwapInterface user={user} /> */}

                      <Card className="dark-card">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <Coins className="w-5 h-5 text-yellow-400" />
                            Square Payout Connection
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-400 mb-4">
                            Connect your Square account to receive payouts from your paid communities, content, or services.
                          </p>
                          <div>
                            <Label className="text-sm font-medium text-gray-400 mb-2 block">Your Square Connect Link</Label>
                            <Input
                      value={editData.square_connect_link || ''}
                      onChange={(e) => setEditData({ ...editData, square_connect_link: e.target.value })}
                      className="bg-black/20 border-yellow-500/20 text-white"
                      placeholder="Your Square account link (e.g., square.site/u/yourusername)"
                      type="url"
                      disabled={!isEditing} />

                            {!isEditing &&
                    <p className="text-xs text-gray-500 mt-1">
                                To edit this link, go to the <Link to="?section=overview" className="text-purple-400 hover:underline">Overview</Link> tab and click "Edit Profile".
                              </p>
                    }
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="dark-card">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <Coins className="w-5 h-5 text-blue-400" />
                            Stripe Payout Connection
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-400 mb-4">
                            Connect your Stripe account to receive payouts for your content, subscriptions, and other earnings.
                          </p>
                          <div>
                            <Label className="text-sm font-medium text-gray-400 mb-2 block">Your Stripe Connect Link</Label>
                            <Input
                      value={editData.stripe_connect_link || ''}
                      onChange={(e) => setEditData({ ...editData, stripe_connect_link: e.target.value })}
                      className="bg-black/20 border-blue-500/20 text-white"
                      placeholder="Your Stripe account link (e.g., connect.stripe.com/...)"
                      type="url"
                      disabled={!isEditing} />

                            {!isEditing &&
                    <p className="text-xs text-gray-500 mt-1">
                                To edit this link, go to the <Link to="?section=overview" className="text-purple-400 hover:underline">Overview</Link> tab and click "Edit Profile".
                              </p>
                    }
                          </div>
                        </CardContent>
                      </Card>
                    </div>
            }

                  {/* Referral Program tab content removed as per outline */}
                  {/* {activeTab === 'referral' && loadedTabs.has('referral') && (
              <div id="referral" className="space-y-6 bg-transparent md:bg-slate-950 md:p-4 md:rounded-xl">
              <Card className="dark-card neon-glow">
              <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-400" />
              Refer Friends & Earn $EQOFLO
              </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl">
              <h3 className="font-bold text-blue-300 mb-3">How It Works</h3>
              <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
              <div>
              <p className="text-blue-200 font-medium">Share your unique referral link</p>
              <p className="text-blue-300/70">Send it to friends, family, or social media</p>
              </div>
              </div>
              <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
              <div>
              <p className="text-blue-200 font-medium">Your friend signs up using your link</p>
              <p className="text-blue-300/70">They create an account and complete onboarding</p>
              </div>
              </div>
              <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
              <div>
              <p className="text-blue-200 font-medium">Both of you earn $EQOFLO tokens!</p>
              <p className="text-blue-300/70">You get <span className="font-bold">50 $EQOFLO</span>, they get <span className="font-bold">25 $EQOFLO</span></p>
              </div>
              </div>
              </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-black/20 rounded-xl">
              <div className="text-2xl font-bold text-purple-400">{referralStats.totalReferred}</div>
              <div className="text-sm text-gray-400">Friends Referred</div>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-xl">
              <div className="text-2xl font-bold text-green-400">{referralStats.totalEarned}</div>
              <div className="text-sm text-gray-400">$EQOFLO Earned</div>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-xl">
              <div className="text-2xl font-bold text-yellow-400">{referralStats.pendingRewards}</div>
              <div className="text-sm text-gray-400">Pending Rewards</div>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-xl">
              <div className="text-2xl font-bold text-cyan-400">∞</div>
              <div className="text-sm text-gray-400">No Limit</div>
              </div>
              </div>
              </CardContent>
              </Card>
              <Card className="dark-card">
              <CardHeader>
              <CardTitle className="text-white">Your Referral Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="flex gap-3">
              <Input
              value={getReferralLink()}
              readOnly
              className="bg-black/20 border-purple-500/20 text-white flex-1" />
              <Button
              onClick={copyReferralLink}
              variant="outline"
              className="border-purple-500/30 text-white hover:bg-purple-500/10">
              {copied ? "Copied!" : "Copy"}
              </Button>
              </div>
              <div className="flex gap-3">
              <Button
              onClick={shareReferralLink}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 flex-1">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Share Link
              </Button>
              <Button
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm using EqoFlow, a revolutionary decentralized social platform. Join me and we both get $EQOFLO tokens! ${getReferralLink()}`)}`)}
              variant="outline"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
              <MessageCircle className="w-4 h-4 mr-2" />
              Tweet
              </Button>
              </div>
              </CardContent>
              </Card>
              {!user?.custom_referral_code && (
              <Card className="dark-card">
              <CardHeader>
              <CardTitle className="text-white">Request a Custom Referral Link</CardTitle>
              </CardHeader>
              <CardContent>
              {pendingRequest ? (
              <div className={`p-4 rounded-lg border ${
              pendingRequest.status === 'pending' ? 'bg-yellow-600/10 border-yellow-500/20 text-yellow-300' :
              pendingRequest.status === 'approved' ? 'bg-green-600/10 border-green-500/20 text-green-300' : ''}`
              }>
              <p className="font-medium">Request Status: {pendingRequest.status.toUpperCase()}</p>
              <p>You requested the code: <span className="font-bold">{pendingRequest.requested_code}</span></p>
              {pendingRequest.status === 'pending' && <p>An admin will review it shortly.</p>}
              {pendingRequest.status === 'approved' && <p>Your custom code has been approved! It is now active.</p>}
              </div>
              ) : (
              <div className="space-y-3">
              <p className="text-sm text-gray-400">
              Make your referral link memorable! Request a custom code that's easy to share.
              </p>
              <div className="flex gap-3">
              <Input
              value={customCodeRequest}
              onChange={(e) => setCustomCodeRequest(e.target.value)}
              placeholder="e.g., YourCreatorName"
              className="bg-black/20 border-purple-500/20 text-white flex-1" />
              <Button
              onClick={handleRequestCode}
              disabled={isRequesting}
              className="bg-gradient-to-r from-blue-600 to-cyan-500">
              {isRequesting ? 'Requesting...' : 'Request Code'}
              </Button>
              </div>
              <p className="text-xs text-gray-500">
              3-15 characters, letters, numbers, and underscores only. All requests are subject to admin approval.
              </p>
              </div>
              )}
              </CardContent>
              </Card>
              )}
              <Card className="dark-card">
              <CardHeader>
              <CardTitle className="text-white">Recent Referrals</CardTitle>
              </CardHeader>
              <CardContent>
              {referralStats.recentReferrals.length > 0 ? (
              <div className="space-y-3">
              {referralStats.recentReferrals.map((referral, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
              <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
               <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div>
               <p className="font-medium text-white">{referral.name}</p>
               <p className="text-sm text-gray-400">{format(new Date(referral.date), "MMM d, yyyy")}</p>
              </div>
              </div>
              <div className="text-right">
              <p className="font-bold text-green-400">+{referral.reward} $EQOFLO</p>
              <Badge className="bg-green-600/20 text-green-400 border-green-500/30 text-xs">
               {referral.status}
              </Badge>
              </div>
              </div>
              ))}
              </div>
              ) : (
              <p className="text-gray-500 text-center py-8">
              No referrals yet. Start sharing your link to earn $EQOFLO!
              </p>
              )}
              </CardContent>
              </Card>
              <Card className="dark-card border-red-500/30 bg-red-900/10">
              <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Important Security Notice
              </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
              <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-xl">
              <h4 className="font-bold text-red-300 mb-2">Zero Tolerance for Fraud</h4>
              <p className="text-red-200 text-sm mb-3">
              Any attempts to abuse the referral system will result in <span className="font-bold">immediate and permanent account termination</span> with complete data deletion.
              </p>
              <p className="text-red-200 text-sm">
              This includes but is not limited to:
              </p>
              <ul className="text-red-200 text-sm mt-2 space-y-1 list-disc list-inside">
              <li>Creating multiple accounts to refer yourself</li>
              <li>Using fake identities or information</li>
              <li>Coordinating with others to game the system</li>
              <li>Any other fraudulent or deceptive practices</li>
              </ul>
              </div>
              <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl">
              <h4 className="font-bold text-blue-300 mb-2">KYC Verification Required</h4>
              <p className="text-blue-200 text-sm">
              To prevent abuse, all users must complete KYC (Know Your Customer) verification before referral rewards are distributed. This ensures one person = one account, maintaining fairness for the entire community.
              </p>
              </div>
              <div className="p-4 bg-green-600/10 border border-green-500/20 rounded-xl">
              <h4 className="font-bold text-green-300 mb-2">Fair Play Rewards</h4>
              <p className="text-green-200 text-sm">
              Users who follow the rules and genuinely help grow our community will be rewarded. Help us build a trustworthy, decentralized ecosystem where everyone benefits fairly.
              </p>
              </div>
              </CardContent>
              </Card>
              </div>
              )} */







            }

                  {activeTab === "analytics" && loadedTabs.has("analytics") &&
            <div id="analytics" className="bg-transparent md:bg-black md:p-4 md:rounded-xl">
                      <AdvancedAnalytics user={user} />
                    </div>
            }

                  {activeTab === "privacy" && loadedTabs.has("privacy") &&
            <div id="privacy" className="bg-transparent md:bg-black md:p-4 md:rounded-xl">
                      <PrivacyHubTab
                user={user}
                onUpdate={async (data) => {
                  UserCacheHelpers.invalidateUserCache();
                  await User.updateMyUserData(data);
                  await refreshUser();
                }} />
                    </div>
            }

                  {activeTab === "subscriptions" && loadedTabs.has("subscriptions") &&
            <div id="subscriptions" className="bg-transparent md:bg-black md:p-4 md:rounded-xl">
                      <ManageSubscriptions user={user} onUpdate={refreshUser} />
                    </div>
            }
                </motion.div>
              </AnimatePresence>
            </div>

      }
      <AnimatePresence>
        {editingPost &&
        <EditPostModal
          post={editingPost}
          onSave={handleUpdatePost}
          onClose={() => setEditingPost(null)} />
        }
      </AnimatePresence>
    </div>);

}