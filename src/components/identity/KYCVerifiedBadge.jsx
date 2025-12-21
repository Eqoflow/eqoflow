import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function KYCVerifiedBadge({ user, size = 'md' }) {
  if (!user || user.kyc_status !== 'verified') {
    return null;
  }

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <img
            src="https://i.postimg.cc/ZBgTCgTL/image.png"
            alt="KYC Verified"
            className={`${sizeClasses[size]} inline-block flex-shrink-0`}
          />
        </TooltipTrigger>
        <TooltipContent className="bg-black/90 border-blue-500/30">
          <p className="text-white font-medium">Identity Verified</p>
          <p className="text-gray-400 text-xs">This user has completed KYC verification</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}