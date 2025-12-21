import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function QuantumProBadge({ user, size = "sm" }) {
  // Check if user has paid Pro subscription
  const hasProSubscription = user?.subscription_tier === 'Pro';
  
  if (!hasProSubscription) return null;

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
        <Badge className={`bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold ${sizeClasses[size]} shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse cursor-help`}>
          <Crown className={`${iconSizes[size]} mr-1`} />
          QPro
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="bg-black/90 border border-yellow-500/30 text-white p-3 rounded-lg max-w-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-yellow-300">Quantum Pro</span>
          </div>
          <p className="text-sm text-gray-300">
            This user is a verified Quantum+ Pro subscriber with maximum platform privileges.
          </p>
          <div className="text-xs text-yellow-200 space-y-1">
            <p>• 2x EP earning rate</p>
            <p>• Governance power boost</p>
            <p>• One-of-a-kind NFT holder</p>
            <p>• FlowAI access</p>
            <p>• Priority support</p>
            <p>• Free community creation</p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}