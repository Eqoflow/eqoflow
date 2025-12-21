
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { EngagementPoint } from "@/entities/EngagementPoint";
import { EPMilestone } from "@/entities/EPMilestone";
import { EPSeason } from "@/entities/EPSeason";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input"; // Import Input
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Zap,
  TrendingUp,
  Target,
  Calendar,
  Award,
  Coins,
  Star,
  Crown,
  Flame,
  Gift,
  Users,
  Info,
  Vote,
  RefreshCw // Import RefreshCw for swap icon
} from "lucide-react";
import { motion } from "framer-motion";
import { format, isBefore, add, intervalToDuration } from "date-fns";

const SWAP_RATE = 100; // 100 EP = 1 $QFLOW

export default function EngagementRewards() {
  const [user, setUser] = useState(null);
  const [userEP, setUserEP] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // State for swapping
  const [swapAmount, setSwapAmount] = useState("");
  const [canSwap, setCanSwap] = useState(false);
  const [timeUntilNextSwap, setTimeUntilNextSwap] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Timer for swap availability
  useEffect(() => {
    if (user && user.last_ep_swap_at) {
      const nextSwapTime = add(new Date(user.last_ep_swap_at), { days: 1 });
      
      const updateTimer = () => {
        const now = new Date();
        if (isBefore(now, nextSwapTime)) {
          setCanSwap(false);
          const duration = intervalToDuration({ start: now, end: nextSwapTime });
          const hours = duration.hours || 0;
          const minutes = duration.minutes || 0;
          const seconds = duration.seconds || 0;
          setTimeUntilNextSwap(
            `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
          );
        } else {
          setCanSwap(true);
          setTimeUntilNextSwap("Available now!");
          clearInterval(interval);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setCanSwap(true);
      setTimeUntilNextSwap("Available now!");
    }
  }, [user]);


  const loadData = async () => {
    try {
      const [userData, epData, milestoneData, seasonData] = await Promise.all([
        User.me(),
        EngagementPoint.filter({}, "-created_date", 200), // Fetch more EP to ensure enough for potential swaps
        EPMilestone.list("-ep_threshold"),
        EPSeason.filter({ is_active: true })
      ]);

      // Ensure epData has `is_swapped` property for consistent filtering
      const processedEpData = epData.map(ep => ({ ...ep, is_swapped: ep.is_swapped || false }));

      setUser(userData);
      setUserEP(processedEpData);
      setMilestones(milestoneData);
      setCurrentSeason(seasonData[0] || null);
    } catch (error) {
      console.error("Error loading EP data:", error);
    }
    setIsLoading(false);
  };

  const calculateTotalEP = () => {
    return userEP.reduce((sum, ep) => sum + (ep.final_points || 0), 0);
  };
  
  const calculateSwappableEP = () => {
    if (!currentSeason) return 0;
    return userEP
      .filter(ep => ep.season === currentSeason.season_id && !ep.is_swapped)
      .reduce((sum, ep) => sum + (ep.final_points || 0), 0);
  };

  const calculateSeasonEP = () => {
    if (!currentSeason) return 0;
    return userEP
      .filter(ep => ep.season === currentSeason.season_id)
      .reduce((sum, ep) => sum + (ep.final_points || 0), 0);
  };

  const calculateStreakDays = () => {
    // Calculate current login streak
    const recentLogins = userEP
      .filter(ep => ep.action_type === "daily_login")
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    
    if (recentLogins.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day
    
    for (let i = 0; i < recentLogins.length; i++) {
      const loginDate = new Date(recentLogins[i].created_date);
      loginDate.setHours(0, 0, 0, 0); // Normalize login date to start of day

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - streak);

      if (loginDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        if (i > 0 && new Date(recentLogins[i-1].created_date).toDateString() === loginDate.toDateString()) {
          // Do nothing, already counted for this day (multiple logins on same day)
        } else {
          break; // Streak broken
        }
      }
    }
    
    return streak;
  };

  const getNextMilestone = () => {
    const totalEP = calculateTotalEP();
    // Sort milestones ascending by threshold to find the next one
    const sortedMilestones = [...milestones].sort((a, b) => a.ep_threshold - b.ep_threshold);
    return sortedMilestones.find(m => m.ep_threshold > totalEP);
  };

  const getRecentAchievements = () => {
    return milestones
      .filter(m => m.is_achieved && m.achieved_at)
      .sort((a, b) => new Date(b.achieved_at) - new Date(a.achieved_at))
      .slice(0, 3);
  };

  const getEPBreakdown = () => {
    const breakdown = {};
    userEP.forEach(ep => {
      if (!breakdown[ep.action_type]) {
        breakdown[ep.action_type] = { count: 0, total: 0 };
      }
      breakdown[ep.action_type].count++;
      breakdown[ep.action_type].total += ep.final_points;
    });
    return breakdown;
  };

  const getRankSuffix = (rank) => {
    if (rank % 100 >= 11 && rank % 100 <= 13) return "th";
    switch (rank % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  const handleSwap = async () => {
    const amountToSwap = parseInt(swapAmount);
    const swappableEP = calculateSwappableEP();

    if (isNaN(amountToSwap) || amountToSwap <= 0 || amountToSwap > swappableEP) {
        alert(`Invalid swap amount. Please enter a positive number up to ${swappableEP} EP.`);
        return;
    }
    if (!canSwap) {
        alert("You can only swap once every 24 hours. Please wait for the cooldown to end.");
        return;
    }

    setIsSwapping(true);
    try {
        const tokensToReceive = amountToSwap / SWAP_RATE;
        
        let pointsToMark = [];
        let accumulatedPoints = 0;
        const unswappedSeasonalPoints = userEP
            .filter(ep => ep.season === currentSeason?.season_id && !ep.is_swapped)
            .sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());

        for (const ep of unswappedSeasonalPoints) {
            if (accumulatedPoints < amountToSwap) {
                pointsToMark.push(ep.id);
                accumulatedPoints += ep.final_points;
            } else {
                break;
            }
        }

        // Mark EPs as swapped
        // This assumes EngagementPoint.update supports updating multiple records or a batch operation.
        // For individual updates:
        await Promise.all(pointsToMark.map(id => EngagementPoint.update(id, { is_swapped: true })));

        // Update user's token balance and swap timestamp
        await User.updateMyUserData({
            token_balance: (user?.token_balance || 0) + tokensToReceive,
            last_ep_swap_at: new Date().toISOString()
        });
        
        alert(`Successfully swapped ${amountToSwap} EP for ${tokensToReceive.toFixed(2)} $QFLOW!`);
        setSwapAmount("");
        await loadData(); // Reload all data to reflect changes
    } catch (error) {
        console.error("Error during EP swap:", error);
        alert("An error occurred during the swap. Please try again.");
    } finally {
        setIsSwapping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="flex items-center gap-3 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
          <span className="text-lg">Loading your rewards...</span>
        </div>
      </div>
    );
  }

  const totalEP = calculateTotalEP();
  const seasonEP = calculateSeasonEP();
  const swappableEP = calculateSwappableEP();
  const streakDays = calculateStreakDays();
  const nextMilestone = getNextMilestone();
  const recentAchievements = getRecentAchievements();
  const epBreakdown = getEPBreakdown();

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--neon-primary), var(--neon-secondary))' }}>
            Engagement Rewards
          </h1>
          <p className="text-gray-400">
            Earn Engagement Points (EP) for participating in the community and unlock exclusive rewards
          </p>
        </div>

        {/* How It Works Section */}
        <div className="mb-8">
          <Card className="dark-card neon-glow">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                How Engagement Points Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Earning EP</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Daily Activities</p>
                        <p className="text-white text-sm">Login daily (+10 EP), create posts (+25 EP), comment (+5 EP), like content (+2 EP)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Community Engagement</p>
                        <p className="text-white text-sm">Join communities (+20 EP), complete skills (+50 EP), stream content (+40 EP)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Vote className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Governance Participation</p>
                        <p className="text-white text-sm">Vote on proposals (+30 EP), create proposals (+100 EP), refer users (+75 EP)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Streak Bonuses & Multipliers</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Flame className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Daily Login Streaks</p>
                        <p className="text-white text-sm">7 days: +1.2x multiplier, 30 days: +1.5x multiplier, 90 days: +2x multiplier</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Seasonal Events</p>
                        <p className="text-white text-sm">Special multiplier events during holidays and platform milestones</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award className="w-4 h-4 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Quality Bonuses</p>
                        <p className="text-white text-sm">High-engagement posts and helpful comments receive bonus EP</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* New Swapping for Tokens Section */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Swapping for Tokens</h3>
                  <div className="space-y-3">
                     <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <RefreshCw className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Daily Token Swap</p>
                        <p className="text-white text-sm">Swap your seasonal EP for $QFLOW tokens once every 24 hours. The current rate is {SWAP_RATE} EP for 1 $QFLOW.</p>
                      </div>
                    </div>
                     <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Star className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Seasonal Points</p>
                        <p className="text-white text-sm">Only EP earned in the current season are eligible for swapping. All-time EP contributes to lifetime milestones.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <h4 className="font-semibold text-purple-400 mb-2">Reward Types</h4>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-white font-medium">$QFLOW Tokens</p>
                    <p className="text-white text-xs">Tradeable platform currency</p>
                  </div>
                  <div className="text-center">
                    <Trophy className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                    <p className="text-white font-medium">NFT Badges</p>
                    <p className="text-white text-xs">Exclusive collectible achievements</p>
                  </div>
                  <div className="text-center">
                    <Star className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <p className="text-white font-medium">Multipliers</p>
                    <p className="text-white text-xs">Temporary EP earning boosts</p>
                  </div>
                  <div className="text-center">
                    <Crown className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-white font-medium">VIP Access</p>
                    <p className="text-white text-xs">Premium features & events</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-black/40 border border-purple-500/20">
            <TabsTrigger value="overview" className="text-white">Overview</TabsTrigger>
            <TabsTrigger value="milestones" className="text-white">Milestones</TabsTrigger>
            <TabsTrigger value="swap" className="text-white">Swap EP</TabsTrigger> {/* New Tab */}
            <TabsTrigger value="leaderboard" className="text-white">Leaderboard</TabsTrigger>
            <TabsTrigger value="history" className="text-white">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="dark-card">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">{totalEP.toLocaleString()}</div>
                  <div className="text-sm text-white">Total EP</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-purple-400">All Time</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">{seasonEP.toLocaleString()}</div>
                  <div className="text-sm text-white">Season EP</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-cyan-400">{currentSeason?.title || "No Active Season"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">{streakDays}</div>
                  <div className="text-sm text-white">Day Streak</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-orange-400">Keep it up!</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">#{Math.floor(Math.random() * 1000) + 1}</div>
                  <div className="text-sm text-white">Global Rank</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-yellow-400">Season Ranking</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Next Milestone Progress */}
            {nextMilestone && (
              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Next Milestone: {nextMilestone.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white">Progress</span>
                      <span className="text-white font-medium">
                        {totalEP.toLocaleString()} / {nextMilestone.ep_threshold.toLocaleString()} EP
                      </span>
                    </div>
                    <Progress 
                      value={(totalEP / nextMilestone.ep_threshold) * 100} 
                      className="h-3"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-white">Reward:</span>
                        <span className="text-sm text-white">{nextMilestone.reward_description}</span>
                      </div>
                      <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                        {(nextMilestone.ep_threshold - totalEP).toLocaleString()} EP to go
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {recentAchievements.map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 bg-black/30 rounded-xl border border-yellow-500/20"
                      >
                        <div className="w-12 h-12 bg-gradient-to-r from-yellow-600 to-orange-500 rounded-full flex items-center justify-center">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{achievement.title}</h4>
                          <p className="text-sm text-white">{achievement.description}</p>
                          <p className="text-xs text-yellow-400 mt-1">
                            Achieved {format(new Date(achievement.achieved_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge className={`${
                          achievement.rarity === 'legendary' ? 'bg-yellow-600/20 text-yellow-400' :
                          achievement.rarity === 'epic' ? 'bg-purple-600/20 text-purple-400' :
                          achievement.rarity === 'rare' ? 'bg-blue-600/20 text-blue-400' :
                          'bg-gray-600/20 text-gray-400'
                        }`}>
                          {achievement.rarity}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* EP Breakdown */}
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  EP Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {Object.entries(epBreakdown)
                    .sort(([,a], [,b]) => b.total - a.total)
                    .slice(0, 8)
                    .map(([actionType, data]) => (
                      <div key={actionType} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                        <div>
                          <span className="text-white font-medium capitalize">
                            {actionType.replace('_', ' ')}
                          </span>
                          <p className="text-xs text-white">{data.count} actions</p>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold">+{data.total}</div>
                          <div className="text-xs text-white">EP</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-6">
            {/* Milestones Grid */}
            <div className="grid gap-4">
              {milestones.map((milestone, index) => {
                const isAchieved = milestone.is_achieved;
                const canAchieve = totalEP >= milestone.ep_threshold && !isAchieved;
                
                return (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`dark-card ${isAchieved ? 'border-yellow-500/30' : canAchieve ? 'border-green-500/30' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            isAchieved ? 'bg-gradient-to-r from-yellow-600 to-orange-500' :
                            canAchieve ? 'bg-gradient-to-r from-green-600 to-emerald-500' :
                            'bg-gray-600/20'
                          }`}>
                            {isAchieved ? (
                              <Crown className="w-8 h-8 text-white" />
                            ) : canAchieve ? (
                              <Star className="w-8 h-8 text-white" />
                            ) : (
                              <Target className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-white">{milestone.title}</h3>
                              <Badge className={`${
                                milestone.rarity === 'legendary' ? 'bg-yellow-600/20 text-yellow-400' :
                                milestone.rarity === 'epic' ? 'bg-purple-600/20 text-purple-400' :
                                milestone.rarity === 'rare' ? 'bg-blue-600/20 text-blue-400' :
                                'bg-gray-600/20 text-gray-400'
                              }`}>
                                {milestone.rarity}
                              </Badge>
                            </div>
                            <p className="text-white text-sm mb-2">{milestone.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="text-sm">
                                  <span className="text-white">Required: </span>
                                  <span className="text-white font-medium">{milestone.ep_threshold.toLocaleString()} EP</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-white">Reward: </span>
                                  <span className="text-purple-400">{milestone.reward_description}</span>
                                </div>
                              </div>
                              {isAchieved && (
                                <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">
                                  <Trophy className="w-3 h-3 mr-1" />
                                  Achieved
                                </Badge>
                              )}
                              {canAchieve && (
                                <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-500">
                                  Claim Reward
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="swap" className="space-y-6">
            <Card className="dark-card neon-glow">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-green-400" />
                        Swap Engagement Points for Tokens
                    </CardTitle>
                    <p className="text-white text-sm">Convert your hard-earned seasonal EP into $QFLOW tokens.</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6 p-6 bg-black/20 rounded-xl border border-purple-500/20">
                        <div>
                            <p className="text-white text-sm mb-1">Your Swappable EP Balance</p>
                            <p className="text-3xl font-bold text-purple-400">{swappableEP.toLocaleString()}</p>
                            <p className="text-white text-xs">(From this season, unswapped)</p>
                        </div>
                        <div className="text-right">
                             <p className="text-white text-sm mb-1">Current Swap Rate</p>
                            <p className="text-3xl font-bold text-white">
                                {SWAP_RATE} EP = 1 <span className="text-yellow-400">$QFLOW</span>
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="swap-amount" className="text-sm font-medium text-white mb-2 block">EP to Swap</label>
                            <div className="relative">
                                <Input
                                    id="swap-amount"
                                    type="number"
                                    placeholder="Enter amount of EP to swap"
                                    value={swapAmount}
                                    onChange={(e) => setSwapAmount(e.target.value)}
                                    className="bg-black/20 border-purple-500/20 text-white text-lg p-4 pr-32"
                                    max={swappableEP}
                                    min="0"
                                />
                                <div className="absolute inset-y-0 right-4 flex items-center text-white">
                                    <span className="text-purple-400">EP</span>
                                </div>
                            </div>
                            {swapAmount && parseInt(swapAmount) > 0 && !isNaN(parseInt(swapAmount)) && (
                                <p className="text-sm text-green-400 mt-2">
                                    You will receive: {(parseInt(swapAmount) / SWAP_RATE).toFixed(2)} $QFLOW
                                </p>
                            )}
                             {swapAmount && parseInt(swapAmount) > swappableEP && (
                                <p className="text-sm text-red-400 mt-2">
                                    Amount exceeds your swappable EP balance.
                                </p>
                            )}
                        </div>
                        
                        <Button 
                            onClick={handleSwap} 
                            disabled={!canSwap || isSwapping || !swapAmount || parseInt(swapAmount) <= 0 || parseInt(swapAmount) > swappableEP}
                            className="w-full text-lg p-6 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 disabled:opacity-50"
                        >
                            {isSwapping ? (
                                <>
                                 <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                  Swapping...
                                </>
                            ) : canSwap ? (
                                "Swap Now"
                            ) : (
                                <>
                                    Next swap in {timeUntilNextSwap}
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            {/* Season Leaderboard */}
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Season Leaderboard
                  {currentSeason && (
                    <Badge className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">
                      {currentSeason.title}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentSeason?.leaderboard?.length > 0 ? (
                  <div className="space-y-3">
                    {currentSeason.leaderboard.slice(0, 10).map((entry, index) => (
                      <div key={entry.user_email} className={`flex items-center gap-4 p-4 rounded-xl ${
                        entry.user_email === user?.email 
                          ? 'bg-purple-600/20 border border-purple-500/30' 
                          : 'bg-black/20'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {entry.rank}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{entry.user_name}</div>
                          <div className="text-sm text-white">{entry.total_ep.toLocaleString()} EP</div>
                        </div>
                        {entry.user_email === user?.email && (
                          <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                            You
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500">No season data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* EP History */}
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  EP History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userEP.length > 0 ? (
                  <div className="space-y-3">
                    {userEP.slice(0, 20).map((ep, index) => (
                      <motion.div
                        key={ep.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
                      >
                        <div>
                          <p className="text-white font-medium">{ep.description}</p>
                          <p className="text-xs text-white">
                            {format(new Date(ep.created_date), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold">+{ep.final_points}</div>
                          {ep.multiplier > 1 && (
                            <div className="text-xs text-yellow-400">
                              {ep.multiplier}x multiplier
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Zap className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500">No EP history yet</p>
                    <p className="text-sm text-white mt-2">Start engaging with the community to earn points!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
