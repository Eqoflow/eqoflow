
import React, { useState, useEffect } from "react";
import { Stream } from "@/entities/Stream";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Share2,
  Settings,
  Play,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import StreamPlayer from "../components/streaming/StreamPlayer";
import StreamChat from "../components/streaming/StreamChat";
import StreamInfo from "../components/streaming/StreamInfo";
import StreamActions from "../components/streaming/StreamActions";

export default function StreamView() {
  const [stream, setStream] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStreamData();
  }, []);

  const loadStreamData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get stream ID from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const streamId = urlParams.get('id');
      
      if (!streamId) {
        setError("No stream ID provided in URL");
        setIsLoading(false);
        return;
      }

      // Try to get current user (allow it to fail for non-logged in users)
      let currentUser = null;
      try {
        currentUser = await User.me();
      } catch (userError) {
        console.log("User not logged in, continuing as guest");
      }

      // Get stream data
      const streamData = await Stream.filter({ id: streamId });
      
      if (!streamData || streamData.length === 0) {
        setError("Stream not found");
        setIsLoading(false);
        return;
      }

      setStream(streamData[0]);
      setUser(currentUser);
      
    } catch (error) {
      console.error("[pages/StreamView.js] Error loading stream data:", error);
      setError("Failed to load stream data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!stream || !user || user.email !== stream.created_by) {
      console.error("Unauthorized to change stream status");
      return;
    }

    try {
      await Stream.update(stream.id, { status: newStatus });
      setStream(prev => ({ ...prev, status: newStatus }));
      
      // Optionally reload stream data to get fresh info
      setTimeout(loadStreamData, 1000);
    } catch (error) {
      console.error("Error updating stream status:", error);
    }
  };

  const isStreamOwner = user?.email === stream?.created_by;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
          <span className="text-lg">Loading stream...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="dark-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Stream Error</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex gap-3">
              <Button asChild variant="outline" className="flex-1">
                <Link to={createPageUrl("Streaming")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Streams
                </Link>
              </Button>
              <Button onClick={loadStreamData} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="dark-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Stream Not Found</h2>
            <p className="text-gray-400 mb-6">This stream may have been deleted or is not available.</p>
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link to={createPageUrl("Streaming")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Streams
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link to={createPageUrl("Streaming")}>
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">{stream.title}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>{stream.created_by?.split("@")[0] || "Anonymous"}</span>
                <span>•</span>
                <span>{format(new Date(stream.created_date), "MMM d, yyyy")}</span>
                {stream.status === 'live' && (
                  <>
                    <span>•</span>
                    <Badge className="bg-red-600 text-white animate-pulse">🔴 LIVE</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
            {isStreamOwner && (
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3 space-y-6">
            <StreamPlayer stream={stream} />
            <StreamInfo stream={stream} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <StreamActions 
              stream={stream} 
              user={user} 
              onStatusChange={handleStatusChange}
            />
            {stream.status === 'live' && (
              <StreamChat streamId={stream.id} user={user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
