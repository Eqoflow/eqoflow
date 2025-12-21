import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Tag, Layers, Calendar, Info, ShoppingBag, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StreamInfo({ stream, creator }) {
  const creatorProfile = creator?.creator_profile || {};
  
  return (
    <Card className="dark-card">
      <CardHeader>
        <CardTitle className="text-white text-2xl font-bold">{stream.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3">
          {creator?.avatar_url ? (
            <img src={creator.avatar_url} alt={creator.full_name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <User className="w-6 h-6 text-purple-400" />
            </div>
          )}
          <div>
            <p className="text-white font-semibold">{creator?.full_name || "Anonymous"}</p>
            <p className="text-sm text-gray-400">@{creator?.username || "creator"}</p>
          </div>
        </div>

        {/* About Section */}
        <div className="p-4 bg-black/20 rounded-xl space-y-3">
          <h4 className="font-semibold text-white flex items-center gap-2"><Info className="w-5 h-5 text-purple-400" /> About</h4>
          <p className="text-gray-300 whitespace-pre-wrap">{creatorProfile.stream_about || stream.description || "No description provided."}</p>
        </div>
        
        {/* Schedule Section */}
        {creatorProfile.stream_schedule && (
            <div className="p-4 bg-black/20 rounded-xl space-y-3">
                <h4 className="font-semibold text-white flex items-center gap-2"><Calendar className="w-5 h-5 text-purple-400" /> Schedule</h4>
                <p className="text-gray-300 whitespace-pre-wrap">{creatorProfile.stream_schedule}</p>
            </div>
        )}

        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <Badge className="capitalize bg-purple-600/20 text-purple-300 border-purple-500/30">
            {stream.category.replace('_', ' ')}
          </Badge>
        </div>

        {stream.tags && stream.tags.length > 0 && (
          <div className="flex items-start gap-2">
            <Tag className="w-4 h-4 text-purple-400 mt-1" />
            <div className="flex flex-wrap gap-1.5">
              {stream.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-gray-400 border-gray-600/30 bg-black/20">#{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Merch and Donation Links */}
        <div className="flex gap-4 pt-2">
            {creatorProfile.merchandise_url && (
                <Button asChild className="bg-gradient-to-r from-cyan-600 to-blue-500 flex-1">
                    <a href={creatorProfile.merchandise_url} target="_blank" rel="noopener noreferrer">
                        <ShoppingBag className="w-4 h-4 mr-2"/> View Merch
                    </a>
                </Button>
            )}
            {creatorProfile.donation_url && (
                 <Button asChild className="bg-gradient-to-r from-green-600 to-emerald-500 flex-1">
                    <a href={creatorProfile.donation_url} target="_blank" rel="noopener noreferrer">
                        <HeartHandshake className="w-4 h-4 mr-2"/> Donate
                    </a>
                </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}