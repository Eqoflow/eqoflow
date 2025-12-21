import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

const cmoEmails = [
  'jeremy@prestigepublicrelations.com'
];

export default function CMOBadge({ userEmail }) {
  if (!userEmail || !cmoEmails.includes(userEmail.toLowerCase())) {
    return null;
  }

  return (
    <Badge 
      className="text-xs font-semibold px-2 py-0.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white border-orange-400/30 shadow-lg shadow-orange-500/20"
      style={{
        background: 'linear-gradient(to right, #ea580c, #f59e0b)',
        borderColor: 'rgba(251, 146, 60, 0.3)'
      }}
    >
      <TrendingUp className="w-3 h-3 mr-1" />
      CMO
    </Badge>
  );
}