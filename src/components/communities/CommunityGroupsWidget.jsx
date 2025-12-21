import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CommunityGroupsWidget({ relatedCommunities }) {
  const [filter, setFilter] = useState('popular');

  const sortedCommunities = [...relatedCommunities].sort((a, b) => {
    if (filter === 'newest') {
      return new Date(b.created_date) - new Date(a.created_date);
    } else if (filter === 'active') {
      return (b.member_emails?.length || 0) - (a.member_emails?.length || 0);
    } else {
      return (b.member_emails?.length || 0) - (a.member_emails?.length || 0);
    }
  }).slice(0, 3);

  return (
    <Card className="dark-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm font-semibold">GROUPS</CardTitle>
        <Tabs value={filter} onValueChange={setFilter} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-3 bg-black/30">
            <TabsTrigger value="newest" className="text-xs">Newest</TabsTrigger>
            <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
            <TabsTrigger value="popular" className="text-xs">Popular</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedCommunities.map((community) => (
          <Link 
            key={community.id} 
            to={`${createPageUrl("CommunityProfile")}?id=${community.id}`}
            className="block"
          >
            <div className="flex gap-3 p-2 rounded-lg hover:bg-black/20 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {community.logo_url ? (
                  <img src={community.logo_url} alt={community.name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{community.name}</p>
                <p className="text-gray-500 text-[10px]">{community.member_emails?.length || 0} members</p>
              </div>
            </div>
          </Link>
        ))}
        {sortedCommunities.length === 0 && (
          <p className="text-gray-500 text-xs text-center py-4">No communities yet</p>
        )}
      </CardContent>
    </Card>
  );
}