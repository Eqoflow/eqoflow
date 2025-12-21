import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';

const cfoEmails = [];

export default function CFOBadge({ userEmail }) {
  if (!cfoEmails.includes(userEmail?.toLowerCase())) {
    return null;
  }

  return (
    <Badge 
      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400/50 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
    >
      <DollarSign className="w-3 h-3 mr-1" />
      CFO
    </Badge>
  );
}