import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';

const cooEmails = [
  'bbancale@hotmail.com'
];

export default function COOBadge({ userEmail }) {
  if (!userEmail || !cooEmails.includes(userEmail.toLowerCase())) {
    return null;
  }

  return (
    <Badge 
      className="text-xs font-semibold px-2 py-0.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white border-green-400/30 shadow-lg shadow-green-500/20"
      style={{
        background: 'linear-gradient(to right, #059669, #10b981)',
        borderColor: 'rgba(74, 222, 128, 0.3)'
      }}
    >
      <Settings className="w-3 h-3 mr-1" />
      COO
    </Badge>
  );
}