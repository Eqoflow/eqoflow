import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function QuantumCreatorBadge({ user, size = "sm" }) {
  // Check if user has paid Creator subscription
  const hasCreatorSubscription = user?.subscription_tier === 'Creator' || user?.subscription_tier === 'Pro';
  
  if (!hasCreatorSubscription) return null;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className={`bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold ${sizeClasses[size]} shadow-[0_0_8px_rgba(168,85,247,0.4)] animate-pulse cursor-help`}>
          <Zap className={`${iconSizes[size]} mr-1`} />
          QC
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="bg-black/90 border border-purple-500/30 text-white p-3 rounded-lg max-w-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-purple-300">Quantum Creator</span>
          </div>
          <p className="text-sm text-gray-300">
            This user is a verified Quantum+ Creator subscriber with enhanced platform privileges.
          </p>
          <div className="text-xs text-purple-200 space-y-1">
            <p>• 1.5x EP earning rate</p>
            <p>• Advanced analytics access</p>
            <p>• Special creator NFT holder</p>
            <p>• Reduced marketplace fees</p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}