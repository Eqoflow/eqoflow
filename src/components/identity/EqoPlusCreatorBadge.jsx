import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

export default function EqoPlusCreatorBadge({ user, size = "md" }) {
  if (user?.subscription_tier !== 'creator') {
    return null;
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1"
  };

  const iconSizes = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3"
  };

  return (
    <Badge className={`bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400/50 shadow-[0_0_10px_rgba(168,85,247,0.5)] ${sizeClasses[size]}`}>
      <Sparkles className={`${iconSizes[size]} mr-1`} />
      Eqo+ Creator
    </Badge>
  );
}