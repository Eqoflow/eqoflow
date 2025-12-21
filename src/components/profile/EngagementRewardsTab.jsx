
import React, { useState, useEffect, useCallback } from "react";
import { EngagementPoint } from "@/entities/EngagementPoint";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Button might be removed if no other buttons are left
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  TrendingUp,
  Trophy,
  Star,
  Calendar, // This icon might be removed if no other buttons use it
  Crown,
  Sparkles,
  Clock, // This icon might be removed if no other buttons use it
  Info,
  Vote,
  Heart,
  MessageCircle, // This icon might be removed if no other buttons use it
  Shield,
  Gem,
  MessageSquare,
  Share2,
  User as UserIcon,
  Flame,
  Sunrise } from
"lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

// Removed: import { swapEPToTokens } from "@/functions/swapEPToTokens";
import { resetDailyEPIfNeeded } from "@/functions/resetDailyEPIfNeeded";

// Utility function to safely parse and validate a date
const parseAndValidateDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string:", dateString);
      return null;
    }
    return date;
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return null;
  }
};

const CREATOR_TIER_CONFIG = {
  spark: { name: "Spark", threshold: 0, daily_cap: 1000, icon: Flame, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
  catalyst: { name: "Catalyst", threshold: 5000, daily_cap: 3000, icon: Sunrise, color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/20" },
  luminary: { name: "Luminary", threshold: 25000, daily_cap: 10000, icon: Star, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
  supernova: { name: "Supernova", threshold: 100000, daily_cap: 25000, icon: Sparkles, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" }
};

const creatorTiersInOrder = ["spark", "catalyst", "luminary", "supernova"];

export default function EngagementRewardsTab({ user }) {
  const [epHistory, setEpHistory] = useState([]);
  const [epStats, setEpStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  // Removed: const [isSwapping, setIsSwapping] = useState(false);
  const [displayMessage, setDisplayMessage] = useState('');
  const [messageType, setMessageType] = useState(null);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  // Removed: const [trueSwappableEP, setTrueSwappableEP] = useState(0);
  // Removed: const [isCalculatingEP, setIsCalculatingEP] = useState(true);
  // Removed: const [epCalculationError, setEpCalculationError] = useState(false);
  // Removed: const [epBreakdown, setEpBreakdown] = useState({ earned: 0, purchased: 0 });

  // The user.total_ep_earned field potentially includes purchased EP.
  // For tier calculation, we consider all EP, including potentially purchased.
  const totalLifetimeEP = (user?.total_ep_earned || 0) + (user?.swapped_ep_total || 0);

  const totalCreatorEP = user?.total_creator_ep_earned || 0;
  const currentCreatorTierKey = creatorTiersInOrder.slice().reverse().find((tier) => totalCreatorEP >= CREATOR_TIER_CONFIG[tier].threshold) || "spark";
  const currentCreatorTier = CREATOR_TIER_CONFIG[currentCreatorTierKey];
  const nextCreatorTierKey = creatorTiersInOrder[creatorTiersInOrder.indexOf(currentCreatorTierKey) + 1];
  const nextCreatorTier = nextCreatorTierKey ? CREATOR_TIER_CONFIG[nextCreatorTierKey] : null;

  const creatorMultiplier = user?.subscription_tier === 'Pro' ? 2 : user?.subscription_tier === 'Creator' ? 1.5 : 1;

  // Calculations for creator progress bar
  const previousCreatorTierThreshold = currentCreatorTier.threshold;
  const progressToNextCreatorTier = Math.max(0, totalCreatorEP - previousCreatorTierThreshold);
  const epNeededForNextCreatorTier = nextCreatorTier ? nextCreatorTier.threshold - previousCreatorTierThreshold : 0;
  const creatorProgressPercentage = currentCreatorTierKey === 'supernova' ?
  100 :
  epNeededForNextCreatorTier > 0 ?
  Math.min(progressToNextCreatorTier / epNeededForNextCreatorTier * 100, 100) :
  0;

  // New tier calculation and related functions
  const calculateTier = (userData) => {
    // Calculate total lifetime EP: current spendable + already swapped
    // This assumes total_ep_earned includes purchased for tier calculation.
    const lifetimeEP = (userData?.total_ep_earned || 0) + (userData?.swapped_ep_total || 0);

    if (lifetimeEP >= 100000) return 'diamond';
    if (lifetimeEP >= 25000) return 'platinum';
    if (lifetimeEP >= 5000) return 'gold';
    if (lifetimeEP >= 1000) return 'silver';
    return 'bronze';
  };

  const getTierThresholds = () => [
  { name: 'Bronze', threshold: 0, dailyCap: 200, icon: Shield, color: 'text-amber-600', bgColor: 'bg-amber-600/10', borderColor: 'border-amber-600/20' },
  { name: 'Silver', threshold: 1000, dailyCap: 300, icon: Star, color: 'text-gray-400', bgColor: 'bg-gray-400/10', borderColor: 'border-gray-400/20' },
  { name: 'Gold', threshold: 5000, dailyCap: 500, icon: Trophy, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', borderColor: 'border-yellow-400/20' },
  { name: 'Platinum', threshold: 25000, dailyCap: 1000, icon: Crown, color: 'text-purple-400', bgColor: 'bg-purple-400/10', borderColor: 'border-purple-400/20' },
  { name: 'Diamond', threshold: 100000, dailyCap: 2000, icon: Gem, color: 'text-cyan-400', bgColor: 'bg-cyan-400/10', borderColor: 'border-cyan-400/20' }];


  const getTierIndex = (tierName) => {
    const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    return tiers.indexOf(tierName);
  };

  const getCurrentTier = () => {
    const calculatedTierSlug = calculateTier(user);
    const tiers = getTierThresholds();
    return tiers.find((tier) => tier.name.toLowerCase() === calculatedTierSlug) || tiers[0];
  };

  const getNextTier = () => {
    const currentTier = getCurrentTier();
    const tiers = getTierThresholds();
    const currentIndex = tiers.findIndex((tier) => tier.name === currentTier.name);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  };

  const getProgressToNextTier = () => {
    const nextTier = getNextTier();
    if (!nextTier) return { current: totalLifetimeEP, needed: totalLifetimeEP, percentage: 100 };

    const currentTier = getCurrentTier();
    const progress = totalLifetimeEP - currentTier.threshold;
    const needed = nextTier.threshold - currentTier.threshold;
    const percentage = Math.min(progress / needed * 100, 100);

    return { current: totalLifetimeEP, needed: nextTier.threshold, percentage };
  };

  // Main tier variables derived from new functions
  const progress = getProgressToNextTier();
  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  const loadEPData = useCallback(async () => {
    if (!user || !user.email) {
      setEpHistory([]);
      setEpStats({ today: 0, week: 0, month: 0, total: 0 });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch EP records for the current user
      const epData = await EngagementPoint.filter({ created_by: user.email }, "-created_date", 50); // Limit to 50 records

      setEpHistory(epData); // Set history for display

      // Calculate EP stats
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const todayEP = epData.filter((ep) => {
        const epDate = parseAndValidateDate(ep.created_date);
        return epDate && epDate.toDateString() === today.toDateString();
      }).reduce((sum, ep) => sum + (ep.final_points || 0), 0);

      const weekEP = epData.filter((ep) => {
        const epDate = parseAndValidateDate(ep.created_date);
        return epDate && epDate >= weekAgo;
      }).reduce((sum, ep) => sum + (ep.final_points || 0), 0);

      const monthEP = epData.filter((ep) => {
        const epDate = parseAndValidateDate(ep.created_date);
        return epDate && epDate >= monthAgo;
      }).reduce((sum, ep) => sum + (ep.final_points || 0), 0);

      // The `total` for epStats can be total earned + purchased EP for display purposes.
      // The `totalLifetimeEP` calculated earlier should be used for tiers.
      const totalEP = epData.reduce((sum, ep) => sum + (ep.final_points || 0), 0);

      setEpStats({
        today: todayEP,
        week: weekEP,
        month: monthEP,
        total: totalEP
      });
    } catch (error) {
      console.error("Error loading EP data:", error);
      setEpHistory([]);
      setEpStats({ today: 0, week: 0, month: 0, total: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Removed: New useEffect to calculate the true swappable EP, excluding purchased points
  // Removed: useEffect(() => { ... calculateTrueSwappable ... }, [user]);

  // NEW: Lazy loading effect - only load data when component mounts
  useEffect(() => {
    if (!hasLoadedData && user) {
      loadEPData();
      setHasLoadedData(true);
    }
  }, [hasLoadedData, user, loadEPData]);

  useEffect(() => {
    // This effect handles the daily EP reset check
    const checkReset = async () => {
      if (user) {
        try {
          const response = await resetDailyEPIfNeeded();
          if (response && response.data && response.data.message === 'Daily EP reset completed') {
            // No direct onUpdate call, parent component should handle user refresh
            console.log('Daily EP reset completed, user data refresh might be needed from parent.');
          }
        } catch (error) {
          console.error('Error checking daily EP reset:', error);
        }
      }
    };
    checkReset();
  }, [user]);

  // New useEffect for tier update
  useEffect(() => {
    const updateTierIfNeeded = async () => {
      if (!user) return;

      const calculatedTier = calculateTier(user);
      const currentPersistedTier = user.ep_tier || 'bronze';

      // Update tier if it has changed
      if (calculatedTier !== currentPersistedTier) {
        try {
          await User.updateMyUserData({ ep_tier: calculatedTier });
          // No direct onUpdate call, parent component should handle user refresh
          console.log('Tier updated, user data refresh might be needed from parent.');

          // Show congratulations for tier upgrade
          if (getTierIndex(calculatedTier) > getTierIndex(currentPersistedTier)) {
            setShowCongratulations(true);
            setTimeout(() => setShowCongratulations(false), 5000);
          }
        } catch (error) {
          console.error('Error updating tier:', error);
        }
      }
    };

    if (hasLoadedData) {// Only run this effect after initial data load
      updateTierIfNeeded();
    }
  }, [user, totalLifetimeEP, hasLoadedData]); // Add totalLifetimeEP and hasLoadedData to dependency array

  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      let nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 22, 0, 0));

      if (now.getTime() > nextReset.getTime()) {
        nextReset.setUTCDate(nextReset.getUTCDate() + 1);
      }

      const diff = nextReset.getTime() - now.getTime();

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff % (1000 * 60 * 60) / (1000 * 60));
        const seconds = Math.floor(diff % (1000 * 60) / 1000);

        setCountdown(
          `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
        );
      } else {
        setCountdown("Refreshing...");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Removed: handleSwapToTokens function
  /*
  const handleSwapToTokens = async () => {
    const minSwapAmount = 1000; // Changed from 100 to 1000
     if (isCalculatingEP) {
      setDisplayMessage('Still calculating your swappable EP. Please wait...');
      setMessageType('error');
      setTimeout(() => { setDisplayMessage(''); setMessageType(null); }, 3000);
      return;
    }
     if (epCalculationError) { // This now only triggers for actual calculation errors
      setDisplayMessage('Unable to calculate your swappable EP. Please refresh the page and try again.');
      setMessageType('error');
      setTimeout(() => { setDisplayMessage(''); setMessageType(null); }, 5000);
      return;
    }
     if (trueSwappableEP < minSwapAmount) {
      setDisplayMessage(`Not enough earned EP to perform the swap. You have ${trueSwappableEP} earned EP, minimum is ${minSwapAmount} EP.`);
      setMessageType('error');
      setTimeout(() => { setDisplayMessage(''); setMessageType(null); }, 5000);
      return;
    }
     const actualSwapAmount = Math.floor(trueSwappableEP / 1000) * 1000; // Changed from 100 to 1000
    if (actualSwapAmount < minSwapAmount) {
      setDisplayMessage(`Not enough earned EP to perform the swap. You have ${trueSwappableEP} earned EP, need at least ${minSwapAmount} earned EP.`);
      setMessageType('error');
      setTimeout(() => { setDisplayMessage(''); setMessageType(null); }, 5000);
      return;
    }
     setIsSwapping(true);
    try {
      const { data, error: apiError } = await swapEPToTokens({ epToSwap: actualSwapAmount });
       if (apiError || !data?.success) {
        const errorMessage = data?.error || apiError?.message || 'Failed to swap EP for tokens';
        
        // Handle specific backend errors
        if (errorMessage.includes('Insufficient earned EP balance')) {
          throw new Error('Backend rejected the swap due to insufficient earned EP. This may be due to purchased EP in your account. Please contact support if you believe this is an error.');
        }
        
        throw new Error(errorMessage);
      }
       setDisplayMessage(`Successfully swapped ${actualSwapAmount} earned EP for ${data.tokensAwarded} $EQOFLO tokens!`);
      setMessageType('success');
      setTimeout(() => { setDisplayMessage(''); setMessageType(null); }, 5000);
       // Refresh the EP calculation after successful swap
      if (user?.email) {
        const calculateTrueSwappableInternal = async () => {
          try {
            const allEPRecords = await EngagementPoint.filter({ created_by: user.email });
            const purchasedEPRecords = allEPRecords.filter(ep => ep.source === 'purchased');
            const earnedEPRecords = allEPRecords.filter(ep => ep.source === 'earned'); // Changed line
            const totalPurchasedEPInternal = purchasedEPRecords.reduce((sum, ep) => sum + (ep.final_points || 0), 0);
            const totalEarnedEPInternal = earnedEPRecords.reduce((sum, ep) => sum + (ep.final_points || 0), 0);
            
            setEpBreakdown({ earned: totalEarnedEPInternal, purchased: totalPurchasedEPInternal });
            setTrueSwappableEP(Math.max(0, totalEarnedEPInternal));
            setEpCalculationError(false); // Reset error state after successful recalculation
           } catch (error) {
            console.error("Error recalculating EP after swap:", error);
            setEpCalculationError(true); // Set error if recalculation fails
            setTrueSwappableEP(0); // Reset EP on error
            setEpBreakdown({ earned: 0, purchased: 0 });
          }
        };
        calculateTrueSwappableInternal();
      }
       console.log('EP swapped, user data refresh might be needed from parent.');
     } catch (error) {
      console.error("Error swapping EP:", error);
      setDisplayMessage(error.message || "Failed to swap EP. Please try again.");
      setMessageType('error');
      setTimeout(() => { setDisplayMessage(''); setMessageType(null); }, 5000);
    }
    setIsSwapping(false);
  };
  */












  // Get user's color scheme for styling
  const userColorSchemeName = user?.color_scheme || 'purple';
  const colorSchemeStyles = {
    purple: {
      gradient: 'from-purple-600 to-pink-500',
      primary: 'rgb(147, 51, 234)',
      secondary: 'rgb(236, 72, 153)',
      glow: 'shadow-purple-500/50'
    },
    blue: {
      gradient: 'from-blue-600 to-cyan-500',
      primary: 'rgb(37, 99, 235)',
      secondary: 'rgb(6, 182, 212)',
      glow: 'shadow-blue-500/50'
    },
    green: {
      gradient: 'from-green-600 to-emerald-500',
      primary: 'rgb(22, 163, 74)',
      secondary: 'rgb(16, 185, 129)',
      glow: 'shadow-green-500/50'
    },
    orange: {
      gradient: 'from-orange-600 to-yellow-500',
      primary: 'rgb(234, 88, 12)',
      secondary: 'rgb(234, 179, 8)',
      glow: 'shadow-orange-500/50'
    },
    red: {
      gradient: 'from-red-600 to-pink-500',
      primary: 'rgb(220, 38, 38)',
      secondary: 'rgb(236, 72, 153)',
      glow: 'shadow-red-500/50'
    },
    pink: {
      gradient: 'from-pink-600 to-rose-500',
      primary: 'rgb(236, 72, 153)',
      secondary: 'rgb(244, 63, 94)',
      glow: 'shadow-pink-500/50'
    },
    cyan: {
      gradient: 'from-cyan-600 to-blue-500',
      primary: 'rgb(8, 145, 178)',
      secondary: 'rgb(59, 130, 246)',
      glow: 'shadow-cyan-500/50'
    },
    yellow: {
      gradient: 'from-yellow-600 to-orange-500',
      primary: 'rgb(234, 179, 8)',
      secondary: 'rgb(249, 115, 22)',
      glow: 'shadow-yellow-500/50'
    },
    indigo: {
      gradient: 'from-indigo-600 to-purple-500',
      primary: 'rgb(79, 70, 229)',
      secondary: 'rgb(168, 85, 247)',
      glow: 'shadow-indigo-500/50'
    },
    emerald: {
      gradient: 'from-emerald-600 to-green-500',
      primary: 'rgb(5, 150, 105)',
      secondary: 'rgb(34, 197, 94)',
      glow: 'shadow-emerald-500/50'
    }
  };

  const currentColorScheme = colorSchemeStyles[userColorSchemeName] || colorSchemeStyles.purple;

  // Show loading state while data is being fetched
  if (!hasLoadedData || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          <span className="ml-3 text-gray-400">Loading engagement data...</span>
        </div>
      </div>);

  }

  return (
    <div className="bg-[#000000] space-y-6">
      <style>{`
        @keyframes progressPulse {
          0%, 100% {
            opacity: 0.9;
            box-shadow: 0 0 10px ${currentColorScheme.primary}60, 0 0 20px ${currentColorScheme.primary}30;
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 15px ${currentColorScheme.primary}80, 0 0 30px ${currentColorScheme.primary}40;
          }
        }

        .animated-daily-progress .progress-fill {
          background: linear-gradient(90deg, ${currentColorScheme.primary}, ${currentColorScheme.secondary}) !important;
          animation: progressPulse 2s ease-in-out infinite;
        }

        .animated-creator-progress .progress-fill {
          background: linear-gradient(90deg, rgb(234, 179, 8), rgb(249, 115, 22)) !important;
          animation: creatorProgressPulse 2s ease-in-out infinite;
        }

        @keyframes creatorProgressPulse {
          0%, 100% {
            opacity: 0.9;
            box-shadow: 0 0 10px rgb(234, 179, 8, 0.6), 0 0 20px rgb(234, 179, 8, 0.3);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 15px rgb(234, 179, 8, 0.8), 0 0 30px rgb(234, 179, 8, 0.4);
          }
        }
      `}</style>

      <AnimatePresence>
        {showCongratulations &&
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-1/2 -translate-x-1/2 z-50 p-4 rounded-b-xl shadow-lg bg-gradient-to-r from-green-500 to-teal-500 text-white flex items-center space-x-3">

            <Trophy className="w-6 h-6" />
            <p className="font-semibold text-lg">Congratulations! You've reached a new tier!</p>
          </motion.div>
        }
      </AnimatePresence>

      {/* Engagement Tier Card */}
      <Card className={`dark-card border-2 ${currentTier.borderColor}`}>
        <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5">
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Engagement Tier & Benefits
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-[#000000] pt-0 p-6">
          <div className={`mb-6 p-4 rounded-xl ${currentTier.bgColor} border ${currentTier.borderColor}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {React.createElement(currentTier?.icon || Shield, { className: `w-6 h-6 ${currentTier?.color || 'text-amber-600'}` })}
                <h3 className="font-bold text-lg text-white">
                  Current Tier: {currentTier?.name || 'Bronze'}
                </h3>
              </div>
              <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                General Daily Cap: {currentTier?.dailyCap.toLocaleString()} EP
              </Badge>
            </div>
            {currentTier.name.toLowerCase() !== 'diamond' ?
            <>
                <p className="text-sm text-gray-400 mb-2">
                  Progress to {nextTier?.name || 'Next Tier'}: {(totalLifetimeEP || 0).toLocaleString()} / {(nextTier?.threshold || 0).toLocaleString()} EP
                </p>
                <div className="w-full bg-black/30 rounded-full h-3">
                  <div
                  className={`h-3 rounded-full bg-gradient-to-r ${currentTier.color.replace('text-', 'from-')} to-white transition-all duration-500`}
                  style={{ width: `${progress.percentage}%` }} />

                </div>
              </> :

            <p className="text-sm text-cyan-400 font-semibold">You've reached the highest tier!</p>
            }
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {getTierThresholds().map((tier) => {
              const isCurrent = currentTier.name === tier.name;
              const isAchieved = totalLifetimeEP >= tier.threshold;

              return (
                <div key={tier.name} className={`p-3 rounded-lg border text-center transition-all duration-300 ${
                isCurrent ? `${tier.borderColor} ${tier.bgColor} neon-glow scale-105` :
                isAchieved ? `${tier.borderColor} ${tier.bgColor}` :
                'bg-black/20 border-gray-700 opacity-60'}`
                }>
                  {React.createElement(tier.icon, { className: `w-6 h-6 mx-auto mb-2 ${tier.color}` })}
                  <p className="font-semibold text-sm text-white">{tier.name}</p>
                  <p className="text-xs text-white">{tier.threshold.toLocaleString()} EP</p>
                  <Badge variant="outline" className="mt-2 text-xs text-white border-white/20">
                    {tier.dailyCap} EP/day
                  </Badge>
                </div>);

            })}
          </div>
        </CardContent>
      </Card>

      {/* Creator Rewards Program */}
      <Card className="dark-card">
        <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Creator Rewards Program
            </CardTitle>
            <Badge className="bg-yellow-400/10 text-yellow-300 border-yellow-400/20 text-sm">
              Current Tier: {currentCreatorTier.name}
            </Badge>
          </div>
          <p className="text-gray-400 pt-2">Earn special rewards for creating engaging content. As you gain more Creator EP, you'll unlock higher tiers with increased daily earning caps.</p>
        </CardHeader>
        <CardContent className="bg-[#000000] pt-0 p-6 space-y-4">
          <div className="p-4 rounded-xl bg-black/20 border border-yellow-500/20">
            {currentCreatorTierKey !== 'supernova' && nextCreatorTier ?
            <>
                <p className="text-sm text-gray-400 mb-2">
                  Progress to {nextCreatorTier.name}: {totalCreatorEP.toLocaleString()} / {nextCreatorTier.threshold.toLocaleString()} Creator EP
                </p>
                <Progress value={creatorProgressPercentage} className="h-2 [&>*]:bg-yellow-500" />
              </> :

            <p className="text-sm text-purple-400 font-semibold text-center">You've reached the highest creator tier!</p>
            }
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {creatorTiersInOrder.map((tierKey) => {
              const tier = CREATOR_TIER_CONFIG[tierKey];
              const isCurrent = currentCreatorTierKey === tierKey;
              const isAchieved = totalCreatorEP >= tier.threshold;

              return (
                <div key={tierKey} className={`p-4 rounded-xl border-2 text-center transition-all ${
                isCurrent ? `${tier.border} ${tier.bg} neon-glow scale-105 shadow-lg shadow-yellow-500/10` :
                isAchieved ? `${tier.border} ${tier.bg}` :
                'border-gray-700/50'}`
                }>
                  {React.createElement(tier.icon, { className: "w-6 h-6 mx-auto mb-2 " + tier.color })}
                  <p className="font-semibold text-sm text-white">{tier.name}</p>
                  <p className="text-xs text-gray-400">{tier.threshold.toLocaleString()}+ EP</p>
                  <Badge variant="outline" className="mt-2 text-xs text-white border-white/20">
                    {tier.daily_cap.toLocaleString()} EP/day
                  </Badge>
                </div>);

            })}
          </div>
        </CardContent>
      </Card>

      {/* Anti-Fraud Warning */}
      <Card className="dark-card border-red-500/50 bg-red-900/10">
        <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5">
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Creator Program Integrity Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-[#000000] pt-0 p-6">
          <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-xl">
            <p className="text-red-200 text-sm font-medium mb-2">
              ⚠️ <strong>Zero Tolerance Policy for Fraudulent Activity</strong>
            </p>
            <p className="text-red-200 text-sm leading-relaxed">
              Any creator found to be manipulating engagement through artificial means including but not limited to:
              <strong> bot networks, fake followers, purchased likes/comments, coordinated inauthentic behavior, or any other fraudulent activity</strong>
              will face <strong>immediate and permanent removal</strong> from the Creator Rewards Program and potential
              <strong> account termination</strong>. We employ advanced detection systems and manual reviews to maintain program integrity.
            </p>
            <p className="text-red-300 text-xs mt-3 font-medium">
              Our community thrives on authentic engagement. Help us keep it that way.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Daily Caps */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* General Daily Cap */}
        <Card className="dark-card">
          <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5">
            <CardTitle className="text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-400" />
              Your Daily Activity EP
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-[#000000] pt-0 p-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Today's Progress</span>
              <span className="font-medium text-blue-400">
                {user?.general_daily_ep_earned || 0} / {currentTier.dailyCap} EP
              </span>
            </div>
            <div className="animated-daily-progress">
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="progress-fill h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.min(100, (user?.general_daily_ep_earned || 0) / currentTier.dailyCap * 100)}%`,
                    background: `linear-gradient(90deg, ${currentColorScheme.primary}, ${currentColorScheme.secondary})`
                  }} />

              </div>
            </div>
            {(user?.general_daily_ep_earned || 0) >= currentTier.dailyCap &&
            <Badge className="bg-orange-600/20 text-orange-400 border-orange-500/30 text-xs">
                Daily cap reached - excess goes to DAO Treasury
              </Badge>
            }
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Resets in: {countdown}
            </div>
          </CardContent>
        </Card>

        {/* Creator Daily Cap */}
        <Card className="bg-[#000000] text-card-foreground rounded-lg border shadow-sm dark-card">
          <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5">
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Creator Daily Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-[#000000] pt-0 p-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Today's Progress</span>
              <span className="font-medium text-yellow-400">
                {user?.creator_daily_ep_earned || 0} / {currentCreatorTier.daily_cap} EP
              </span>
            </div>
            <div className="animated-creator-progress">
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="progress-fill h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.min(100, (user?.creator_daily_ep_earned || 0) / currentCreatorTier.daily_cap * 100)}%`,
                    background: 'linear-gradient(90deg, rgb(234, 179, 8), rgb(249, 115, 22)'
                  }} />

              </div>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Resets in: {countdown}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How to Earn EP */}
      <Card className="dark-card">
        <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5">
          <CardTitle className="text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-purple-400" />
            How to Earn EP
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-[#000000] pt-0 p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-400" />
                Personal Actions
              </h4>
              <div className="space-y-3">
                {[
                { action: 'Create a post', reward: '+20 EP', icon: MessageSquare },
                { action: 'Like someone\'s content', reward: '+1 EP', icon: Heart },
                { action: 'Comment on posts', reward: '+10 EP', icon: MessageCircle },
                { action: 'Repost content', reward: '+5 EP', icon: Share2 },
                { action: 'Repost with comment', reward: '+14 EP', icon: MessageSquare },
                { action: 'Vote on DAO proposals', reward: '+20 EP', icon: Vote }].
                map((item, index) =>
                <div key={index} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      {React.createElement(item.icon, { className: "w-4 h-4 text-blue-400" })}
                      <span className="text-gray-300">{item.action}</span>
                    </div>
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                      {item.reward}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="mt-4 p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm">
                  <strong>Daily Cap:</strong> {currentTier.dailyCap} EP/day
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Content Creator Rewards
              </h4>
              <div className="space-y-3">
                {[
                { action: 'Someone reacts to your post', reward: '+1 EP', icon: Heart },
                { action: 'Someone comments on your post', reward: '+2 EP', icon: MessageCircle },
                { action: 'Someone reposts your content', reward: '+3 EP', icon: Share2 }].
                map((item, index) =>
                <div key={index} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      {React.createElement(item.icon, { className: "w-4 h-4 text-purple-400" })}
                      <span className="text-gray-300">{item.action}</span>
                    </div>
                    <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                      {item.reward}
                      {user?.subscription_tier !== 'Standard' &&
                    <span className="ml-1 text-yellow-400">
                          (x{creatorMultiplier})
                        </span>
                    }
                    </Badge>
                  </div>
                )}
              </div>
              <div className="mt-4 p-3 bg-purple-600/10 border border-purple-500/20 rounded-lg">
                <p className="text-purple-300 text-sm">
                  <strong>Daily Cap:</strong> {currentCreatorTier.daily_cap} EP/day
                </p>
                <p className="text-purple-300 text-xs mt-1">
                  Higher caps reward quality content creation!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EP Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark-card">
          <CardContent className="bg-[#000000] p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-cyan-400" />
              <div>
                <p className="text-2xl font-bold text-white">{epStats.today || 0}</p>
                <p className="text-gray-400 text-sm">Today's Total EP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark-card">
          <CardContent className="bg-[#000000] p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{epStats.week || 0}</p>
                <p className="text-gray-400 text-sm">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark-card">
          <CardContent className="bg-[#000000] p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{user?.total_creator_ep_earned || 0}</p>
                <p className="text-gray-400 text-sm">Creator EP Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark-card">
          <CardContent className="bg-[#000000] p-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">{totalLifetimeEP || 0}</p>
                <p className="text-gray-400 text-sm">Lifetime Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EP to Token Swap section removed */}

      {/* Recent Activity */}
      <Card className="dark-card">
        <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5">
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Recent EP Activity
            {isLoading && <span className="ml-2 text-gray-500 text-xs">Loading...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-[#000000] pt-0 p-6">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ?
            Array.from({ length: 5 }).map((_, idx) =>
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-black/20 border-gray-700 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
                    <div className="h-4 bg-gray-700 rounded w-48"></div>
                  </div>
                  <div className="h-4 bg-gray-700 rounded w-16"></div>
                </div>
            ) :
            epHistory && epHistory.length > 0 ?
            epHistory.slice(0, 20).map((ep, index) => {
              const isCreatorEp = ['creator_engagement_reaction', 'creator_engagement_comment', 'creator_engagement_repost'].includes(ep.action_type);

              return (
                <motion.div
                  key={ep.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                  isCreatorEp ?
                  'bg-purple-500/10 border-purple-500/20' :
                  'bg-black/20 border-gray-700'}`
                  }>

                    <div className="flex items-center gap-3">
                      {isCreatorEp ?
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" /> :

                    <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    }
                      <div>
                        <p className="text-white text-sm font-medium">{ep.description}</p>
                        <p className="text-gray-400 text-xs">
                          {format(parseAndValidateDate(ep.created_date), "MMM d, h:mm a")}
                          {isCreatorEp &&
                        <Badge className="ml-2 bg-purple-600/20 text-purple-400 border-purple-500/30 text-xs">
                              Creator
                            </Badge>
                        }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${isCreatorEp ? 'text-purple-400' : 'text-cyan-400'}`}>
                        +{ep.final_points} EP
                      </p>
                      {ep.points_to_treasury > 0 && typeof ep.points_to_treasury === 'number' &&
                    <p className="text-orange-400 text-xs">
                          {ep.points_to_treasury} to treasury
                        </p>
                    }
                    </div>
                  </motion.div>);

            }) :

            <div className="text-center text-gray-500 py-8">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No EP activity yet</p>
                <p className="text-sm">Start engaging to earn your first points!</p>
              </div>
            }
          </div>
        </CardContent>
      </Card>
    </div>);

}