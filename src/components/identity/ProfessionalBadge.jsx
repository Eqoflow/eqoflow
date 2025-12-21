import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';

export default function ProfessionalBadge({ user }) {
  const credentials = user?.professional_credentials;
  
  if (!credentials?.is_verified || credentials?.verification_status !== 'verified') {
    return null;
  }

  return (
    <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-500/50 shadow-[0_0_10px_rgba(37,99,235,0.5)]">
      <Award className="w-3 h-3 mr-1" />
      Verified Professional
    </Badge>
  );
}