
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, Crown, Users, Award, Check, Rocket, DollarSign, View, ChevronDown, ChevronUp } from "lucide-react";

export default function BadgeTrophyCabinet({ user, onViewVRRoom }) {
  const [showAllBadges, setShowAllBadges] = useState(false);

  // Get icon component by name
  const getIconComponent = (iconName) => {
    const icons = {
      'Sparkles': Sparkles,
      'Crown': Crown,
      'Users': Users,
      'Award': Award,
      'Check': Check,
      'Rocket': Rocket,
      'DollarSign': DollarSign
    };
    return icons[iconName] || Sparkles;
  };

  // Gather all badges from the user
  const getAllBadges = () => {
    const badges = [];

    // Subscription tier badges
    if (user?.subscription_tier === 'pro') {
      badges.push({
        name: 'Eqo+ Pro',
        icon: 'Sparkles',
        bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
        textColor: 'text-white',
        color: 'from-amber-500 to-orange-500',
        type: 'subscription'
      });
    }
    if (user?.subscription_tier === 'creator') {
      badges.push({
        name: 'Eqo+ Creator',
        icon: 'Sparkles',
        bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
        textColor: 'text-white',
        color: 'from-purple-500 to-pink-500',
        type: 'subscription'
      });
    }
    if (user?.subscription_tier === 'lite') {
      badges.push({
        name: 'Eqo+ Lite',
        icon: 'Sparkles',
        bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        textColor: 'text-white',
        color: 'from-blue-500 to-cyan-500',
        type: 'subscription'
      });
    }

    // Custom badges
    if (user?.custom_badges && user.custom_badges.length > 0) {
      user.custom_badges.forEach(badge => {
        badges.push({
          name: badge.name,
          icon: badge.icon,
          bgColor: `bg-gradient-to-r ${badge.color}`,
          textColor: badge.textColor,
          color: badge.color,
          type: 'custom'
        });
      });
    }

    // Creator badge
    const creatorEmails = ['trevorhenry20@gmail.com', 'sirp.block.chain@gmail.com', 'keith@quantum3.tech'];
    if (creatorEmails.includes(user?.email?.toLowerCase())) {
      badges.push({
        name: 'Creator',
        icon: 'Crown',
        bgColor: 'bg-gradient-to-r from-yellow-400 to-orange-500',
        textColor: 'text-black',
        color: 'from-yellow-400 to-orange-500',
        type: 'role'
      });
    }

    // Co-CEO badge
    const coCEOEmails = ['sirp.block.chain@gmail.com', 'trevorhenry20@gmail.com'];
    if (coCEOEmails.includes(user?.email?.toLowerCase())) {
      badges.push({
        name: 'Co-CEO',
        icon: 'Crown',
        bgColor: 'bg-gradient-to-r from-red-500 to-orange-500',
        textColor: 'text-white',
        color: 'from-red-500 to-orange-500',
        type: 'role'
      });
    }

    // Co-Founder badge
    const coFounderEmails = ['sirp.block.chain@gmail.com', 'trevorhenry20@gmail.com', 'keith@quantum3.tech'];
    if (coFounderEmails.includes(user?.email?.toLowerCase())) {
      badges.push({
        name: 'Co-Founder',
        icon: 'Users',
        bgColor: 'bg-gradient-to-r from-purple-500 to-indigo-500',
        textColor: 'text-white',
        color: 'from-purple-500 to-indigo-500',
        type: 'role'
      });
    }

    // Pioneer badge
    const excludedEmails = ['sirp.block.chain@gmail.com', 'stokes1127@gmail.com', 'trevorhenry20@gmail.com', 'keith@quantum3.tech'];
    if (user?.is_pioneer === true && !excludedEmails.includes(user?.email?.toLowerCase())) {
      badges.push({
        name: 'Pioneer',
        icon: 'Rocket',
        bgColor: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        textColor: 'text-white',
        color: 'from-emerald-500 to-teal-500',
        type: 'achievement'
      });
    }

    // Professional badge
    if (user?.professional_credentials?.is_verified && user?.professional_credentials?.verification_status === 'verified') {
      badges.push({
        name: 'Verified Professional',
        icon: 'Award',
        bgColor: 'bg-gradient-to-r from-blue-600 to-cyan-600',
        textColor: 'text-white',
        color: 'from-blue-600 to-cyan-600',
        type: 'verification'
      });
    }

    // Cross-platform badges
    const identity = user?.cross_platform_identity;
    if (identity) {
      const verifiedPlatforms = identity.web2_verifications?.filter(v => v.verified) || [];
      if (verifiedPlatforms.length > 0) {
        badges.push({
          name: `${verifiedPlatforms.length} Verified`,
          icon: 'Check',
          bgColor: 'bg-gradient-to-r from-blue-400 to-blue-600',
          textColor: 'text-white',
          color: 'from-blue-400 to-blue-600',
          type: 'social'
        });
      }

      const hasWeb3 = (identity.web3_connections?.length || 0) > 0;
      if (hasWeb3) {
        badges.push({
          name: 'Web3 Connected',
          icon: 'Sparkles',
          bgColor: 'bg-gradient-to-r from-purple-400 to-purple-600',
          textColor: 'text-white',
          color: 'from-purple-400 to-purple-600',
          type: 'social'
        });
      }
    }

    return badges;
  };

  const badges = getAllBadges();
  const displayedBadges = showAllBadges ? badges : badges.slice(0, 4);

  return (
    <Card className="dark-card">
      <CardHeader className="bg-slate-950 p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Badge Collection
          </CardTitle>
          {badges.length > 0 && onViewVRRoom && (
            <Button
              size="sm"
              onClick={onViewVRRoom}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              <View className="w-4 h-4 mr-2" />
              View 3D
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="bg-slate-950 p-4">
        {badges.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {displayedBadges.map((badge, index) => {
                const IconComponent = getIconComponent(badge.icon);
                return (
                  <div
                    key={index}
                    className={`${badge.bgColor} px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold ${badge.textColor}`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{badge.name}</span>
                  </div>
                );
              })}
            </div>

            {badges.length > 4 && (
              <div className="text-center pt-2 border-t border-gray-800">
                <button
                  onClick={() => setShowAllBadges(!showAllBadges)}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  {showAllBadges ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>Show less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>+{badges.length - 4} more badge{badges.length - 4 !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Total Badges</span>
                <span className="font-semibold text-purple-400">{badges.length}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">No Badges Yet</h3>
            <p className="text-xs text-gray-400">
              {user?.full_name || "This user"} hasn't earned any badges yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
