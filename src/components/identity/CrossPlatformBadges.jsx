import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

export default function CrossPlatformBadges({ cross_platform_identity, userEmail }) {
  if (!cross_platform_identity) return null;

  const { web2_verifications = [], web3_connections = [] } = cross_platform_identity;

  const verifiedPlatforms = web2_verifications.filter(v => v.verified);
  const hasWeb3 = web3_connections.length > 0;

  if (verifiedPlatforms.length === 0 && !hasWeb3) {
    return null;
  }

  return (
    <>
      {verifiedPlatforms.length > 0 && (
        <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/50">
          <Check className="w-3 h-3 mr-1" />
          {verifiedPlatforms.length} Verified
        </Badge>
      )}
      
      {hasWeb3 && (
        <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/50">
          Web3 Connected
        </Badge>
      )}
    </>
  );
}