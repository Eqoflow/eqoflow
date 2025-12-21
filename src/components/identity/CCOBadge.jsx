import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

const ccoEmails = [
  'stokes1127@gmail.com'
];

export default function CCOBadge({ userEmail }) {
  if (!userEmail || !ccoEmails.includes(userEmail.toLowerCase())) {
    return null;
  }

  return (
    <Badge 
      className="text-xs font-semibold px-2 py-0.5 bg-gradient-to-r from-red-600 to-rose-500 text-white border-red-400/30 shadow-lg shadow-red-500/20"
      style={{
        background: 'linear-gradient(to right, #dc2626, #f43f5e)',
        borderColor: 'rgba(248, 113, 113, 0.3)'
      }}
    >
      <Shield className="w-3 h-3 mr-1" />
      CCO
    </Badge>
  );
}