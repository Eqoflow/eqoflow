import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User as UserIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RecentlyActiveMembersWidget({ members }) {
  const displayMembers = members.slice(0, 12);

  return (
    <Card className="dark-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm font-semibold">
            RECENTLY ACTIVE MEMBERS
          </CardTitle>
          <ArrowRight className="w-4 h-4 text-purple-400 cursor-pointer hover:text-purple-300" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-2">
          {displayMembers.map((member) => (
            <Link 
              key={member.email} 
              to={`${createPageUrl("PublicProfile")}?email=${member.email}`}
              className="group"
            >
              <div className="aspect-square rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-purple-400 transition-all">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-white" />
                )}
              </div>
            </Link>
          ))}
        </div>
        <Link to={createPageUrl("Communities")} className="block mt-3">
          <p className="text-purple-400 text-xs text-center hover:text-purple-300 cursor-pointer">
            MORE →
          </p>
        </Link>
      </CardContent>
    </Card>
  );
}