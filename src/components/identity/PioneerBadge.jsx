import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Rocket } from 'lucide-react';

// Exclude users who have special management badges
const excludedEmails = [
  'sirp.block.chain@gmail.com',
  'stokes1127@gmail.com',
  'trevorhenry20@gmail.com',
  'keith@quantum3.tech'
];

export default function PioneerBadge({ user, userEmail }) {
  // Get the email from either user object or userEmail prop
  const email = user?.email || user?.user_email || userEmail;
  
  if (!email) {
    return null;
  }

  // Don't show pioneer badge for users with special management badges
  if (excludedEmails.includes(email.toLowerCase())) {
    return null;
  }

  // Check if user is marked as pioneer in the data
  const isPioneer = user?.is_pioneer === true;

  if (!isPioneer) {
    return null;
  }

  return (
    <Badge 
      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
    >
      <Rocket className="w-3 h-3 mr-1" />
      Pioneer
    </Badge>
  );
}