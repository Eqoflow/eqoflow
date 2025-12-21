import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

const coFounderEmails = [
  'sirp.block.chain@gmail.com',
  'trevorhenry20@gmail.com',
  'keith@quantum3.tech',
  'stokes1127@gmail.com'
];

export default function CoFounderBadge({ userEmail }) {
  if (!coFounderEmails.includes(userEmail?.toLowerCase())) {
    return null;
  }

  return (
    <Badge 
      className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-400/50 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
    >
      <Users className="w-3 h-3 mr-1" />
      Co-Founder
    </Badge>
  );
}