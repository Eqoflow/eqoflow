import React from "react";
import { motion } from "framer-motion";
import { Coins, TrendingUp } from "lucide-react";

export default function RewardsPanel({ currentSubs = 0, userColorScheme }) {
  const rewardTiers = [
    { subs: 100, reward: 10 },
    { subs: 500, reward: 50 },
    { subs: 1000, reward: 100 },
    { subs: 5000, reward: 500 },
    { subs: 10000, reward: 1000 },
    { subs: 50000, reward: 5000 },
    { subs: 100000, reward: 10000 }
  ];

  const getProgressToNextTier = () => {
    const nextTier = rewardTiers.find(tier => currentSubs < tier.subs);
    if (!nextTier) return { progress: 100, nextTier: rewardTiers[rewardTiers.length - 1], current: currentSubs };
    
    const previousTier = rewardTiers[rewardTiers.indexOf(nextTier) - 1] || { subs: 0 };
    const progress = ((currentSubs - previousTier.subs) / (nextTier.subs - previousTier.subs)) * 100;
    
    return { progress, nextTier, current: currentSubs };
  };

  const { progress, nextTier } = getProgressToNextTier();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
      
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`
          }}>
          <Coins className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-white font-semibold text-sm">EqoFlow's Rewards</h3>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-white/60 text-xs">Current Subscribers</span>
          <span className="text-white font-bold">{currentSubs}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/60 text-xs">Next Milestone</span>
          <span className="text-white font-bold">{nextTier.subs} subs</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`
            }}
          />
        </div>
        <p className="text-xs text-white/60 mt-1">{Math.round(progress)}% to next reward</p>
      </div>

      {/* Reward Tiers */}
      <div className="space-y-2">
        <p className="text-white/60 text-xs mb-2">Reward Tiers:</p>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {rewardTiers.map((tier) => (
            <div 
              key={tier.subs}
              className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                currentSubs >= tier.subs 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : 'bg-black/40 border border-white/10'
              }`}>
              <div className="flex items-center gap-2">
                <TrendingUp 
                  className="w-3 h-3"
                  style={{ color: currentSubs >= tier.subs ? '#10b981' : userColorScheme.primary }}
                />
                <span className="text-xs text-white">{tier.subs.toLocaleString()} subs</span>
              </div>
              <div className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span className="text-xs font-bold text-white">${tier.reward}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}