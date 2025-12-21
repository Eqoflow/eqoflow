import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

const creatorEmails = [
  'trevorhenry20@gmail.com'
];

export default function CreatorBadge({ userEmail }) {
  if (!creatorEmails.includes(userEmail?.toLowerCase())) {
    return null;
  }

  return (
    <Badge 
      className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-yellow-500/50 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
    >
      <Crown className="w-3 h-3 mr-1" />
      Creator
    </Badge>
  );
}