import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Share2, Coins, Play, Square } from 'lucide-react';

export default function StreamActions({ stream, user, onStatusChange }) {
  const isOwner = user?.email === stream?.created_by;

  const handleStatusChange = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    } else {
      console.error("onStatusChange function not provided");
    }
  };

  if (isOwner) {
    return (
      <Card className="dark-card">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-bold text-white">Stream Controls</h3>
          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusChange('live')}
              disabled={stream?.status === 'live'}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" /> Start Stream
            </Button>
            <Button
              onClick={() => handleStatusChange('ended')}
              disabled={stream?.status !== 'live'}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Square className="w-4 h-4 mr-2" /> End Stream
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark-card">
      <CardContent className="p-4 flex gap-2">
        <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500">
          <Heart className="w-4 h-4 mr-2" /> Follow
        </Button>
        <Button variant="outline" className="border-purple-500/30 text-white hover:bg-purple-500/10">
          <Coins className="w-4 h-4 mr-2" /> Tip
        </Button>
        <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700/50">
          <Share2 className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}