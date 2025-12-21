import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, Crown, Shield, Heart, Trophy, Zap, Award, Gem, Target } from 'lucide-react';

const iconMap = {
  Star,
  Crown,
  Shield,
  Heart,
  Trophy,
  Zap,
  Award,
  Gem,
  Target
};

export default function CustomBadges({ user, size = "md" }) {
  const customBadges = user?.custom_badges || [];
  
  if (customBadges.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  return (
    <>
      {customBadges.map((badge, index) => {
        const IconComponent = iconMap[badge.icon] || Star;
        
        return (
          <Badge
            key={index}
            className={`${badge.color} ${badge.textColor} ${badge.borderColor} ${sizeClasses[size]} shadow-md`}
          >
            <IconComponent className={`${iconSizes[size]} mr-1`} />
            {badge.name}
          </Badge>
        );
      })}
    </>
  );
}