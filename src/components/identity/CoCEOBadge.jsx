import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

const coCEOEmails = [
  'sirp.block.chain@gmail.com',
  'trevorhenry20@gmail.com'
];

export default function CoCEOBadge({ userEmail }) {
  if (!coCEOEmails.includes(userEmail?.toLowerCase())) {
    return null;
  }

  return (
    <Badge 
      className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-red-400/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
    >
      <Crown className="w-3 h-3 mr-1" />
      Co-CEO
    </Badge>
  );
}