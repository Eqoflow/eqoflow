import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StreamPlayer({ stream }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  // Construct Mux player URL if stream has playback ID
  const getStreamUrl = () => {
    if (stream?.mux_playback_id) {
      return `https://stream.mux.com/${stream.mux_playback_id}.m3u8`;
    }
    return null;
  };

  const streamUrl = getStreamUrl();

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  // If stream is not live, show appropriate message
  if (stream?.status !== 'live') {
    return (
      <Card className="dark-card">
        <CardContent className="aspect-video flex items-center justify-center bg-black/40">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {stream?.status === 'ended' ? 'Stream Ended' : 'Stream Offline'}
            </h3>
            <p className="text-gray-400">
              {stream?.status === 'ended' 
                ? 'This stream has ended. Check back later for new streams!' 
                : 'This stream is not currently live.'}
            </p>
            {stream?.status === 'ended' && stream?.duration_minutes && (
              <Badge className="mt-3 bg-gray-600 text-white">
                Duration: {Math.floor(stream.duration_minutes / 60)}h {stream.duration_minutes % 60}m
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no playback ID available yet
  if (!streamUrl) {
    return (
      <Card className="dark-card">
        <CardContent className="aspect-video flex items-center justify-center bg-black/40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4" />
            <p className="text-white">Preparing stream...</p>
            <p className="text-gray-400 text-sm mt-2">
              The stream is starting up. This may take a few moments.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark-card overflow-hidden">
      <CardContent className="p-0 relative">
        <div className="aspect-video bg-black relative group">
          {/* Video Element */}
          <video
            className="w-full h-full object-cover"
            controls
            autoPlay
            muted={isMuted}
            onError={(e) => {
              console.error("Video playback error:", e);
              setPlayerError("Failed to load stream. Please refresh the page.");
            }}
            onLoadStart={() => setPlayerError(null)}
          >
            <source src={streamUrl} type="application/x-mpegURL" />
            Your browser does not support the video tag.
          </video>

          {/* Stream Status Overlay */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-red-600 text-white animate-pulse">
              🔴 LIVE
            </Badge>
          </div>

          {/* Viewer Count */}
          <div className="absolute top-4 right-4">
            <Badge className="bg-black/60 text-white">
              {stream.viewer_count || 0} viewers
            </Badge>
          </div>

          {/* Error Message */}
          {playerError && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="text-center p-6">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">Playback Error</p>
                <p className="text-gray-400 text-sm">{playerError}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}