import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Users, 
  Eye, 
  Clock,
  Calendar,
  Edit,
  Heart,
  Crown
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { handleFollow } from "@/functions/handleFollow";
import { handleSubscription } from "@/functions/handleSubscription";

export default function StreamCard({ stream, user, onFollowUpdate }) {
  const [isFollowing, setIsFollowing] = useState(
    user?.following?.includes(stream.created_by) || false
  );
  const [isSubscribed, setIsSubscribed] = useState(false); // This would be checked against Subscription entity
  const [isProcessing, setIsProcessing] = useState(false);

  const getCategoryColor = (category) => {
    const colors = {
      gaming: "text-purple-400 border-purple-500/30",
      just_chatting: "text-blue-400 border-blue-500/30", 
      music: "text-pink-400 border-pink-500/30",
      art: "text-green-400 border-green-500/30",
      coding: "text-cyan-400 border-cyan-500/30",
      fitness: "text-orange-400 border-orange-500/30",
      cooking: "text-yellow-400 border-yellow-500/30",
      education: "text-indigo-400 border-indigo-500/30",
      irl: "text-red-400 border-red-500/30",
      other: "text-gray-400 border-gray-500/30"
    };
    return colors[category] || colors.other;
  };

  const handleFollowClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert("Please log in to follow streamers.");
      return;
    }

    // Prevent rapid clicking
    if (isProcessing) return;

    setIsProcessing(true);
    const currentlyFollowing = isFollowing;
    
    // Optimistic UI update
    setIsFollowing(!currentlyFollowing);
    
    try {
      const response = await handleFollow({ targetUserEmail: stream.created_by });
      
      if (response.data && response.data.success) {
        setIsFollowing(response.data.isFollowing);
        if (onFollowUpdate) onFollowUpdate();
      } else {
        throw new Error(response.data?.error || 'Follow operation failed');
      }
    } catch (error) {
      console.error("Error following streamer:", error);
      
      // Revert optimistic update
      setIsFollowing(currentlyFollowing);
      
      if (error.message.includes('Rate limit')) {
        alert("Please wait a moment before following/unfollowing again.");
      } else {
        alert("Failed to update follow status.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscribeClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert("Please log in to subscribe.");
      return;
    }

    setIsProcessing(true);
    try {
      const action = isSubscribed ? 'unsubscribe' : 'subscribe';
      const response = await handleSubscription({ creator_email: stream.created_by, action });
      
      if (response.data.success) {
        setIsSubscribed(!isSubscribed);
        alert(response.data.message);
      } else {
        alert(response.data.error || "Failed to update subscription.");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      alert("Failed to update subscription.");
    } finally {
      setIsProcessing(false);
    }
  };

  const streamUrl = createPageUrl(`StreamView?id=${stream.id}`);
  const isOwner = user?.email === stream.created_by;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="dark-card hover-lift transition-all duration-300 overflow-hidden flex flex-col h-full">
        <Link to={streamUrl} className="block">
          <div className="relative">
            <div className="aspect-video bg-black/40 flex items-center justify-center border-b border-gray-700/50">
              {stream.thumbnail_url ? (
                <img 
                  src={stream.thumbnail_url} 
                  alt={stream.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Play className="w-16 h-16 text-gray-600" />
              )}
            </div>
            
            {stream.status === 'live' && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-red-600 text-white animate-pulse">
                  🔴 LIVE
                </Badge>
              </div>
            )}
            
            <div className="absolute top-3 right-3">
              <Badge className="bg-black/60 text-white">
                <Eye className="w-3 h-3 mr-1" />
                {stream.status === 'live' ? stream.viewer_count || 0 : stream.total_views || 0}
              </Badge>
            </div>
            
            {stream.status === 'ended' && stream.duration_minutes > 0 && (
              <div className="absolute bottom-3 right-3">
                <Badge className="bg-black/60 text-white text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {Math.floor(stream.duration_minutes / 60)}h {stream.duration_minutes % 60}m
                </Badge>
              </div>
            )}
          </div>
        </Link>
        
        <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-lg mb-1 line-clamp-2">
              <Link to={streamUrl} className="hover:text-purple-400 transition-colors">{stream.title}</Link>
            </h3>
            <p className="text-gray-400 text-sm line-clamp-2">
              {stream.description || "No description available"}
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant="outline" 
                className={`capitalize ${getCategoryColor(stream.category)} bg-black/20`}
              >
                {stream.category.replace('_', ' ')}
              </Badge>
              {stream.is_mature && (
                <Badge className="bg-red-600/20 text-red-400 border-red-500/30">18+</Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{stream.created_by?.split("@")[0] || "Anonymous"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(stream.created_date), "MMM d")}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            {/* Follow and Subscribe buttons (only show for non-owners) */}
            {!isOwner && user && (
              <div className="flex gap-2">
                <Button
                  onClick={handleFollowClick}
                  disabled={isProcessing}
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className={`flex-1 ${isFollowing ? 'border-purple-500/30 text-purple-400' : 'bg-gradient-to-r from-purple-600 to-pink-500'}`}
                >
                  <Heart className={`w-4 h-4 mr-1 ${isFollowing ? 'fill-current' : ''}`} />
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                
                <Button
                  onClick={handleSubscribeClick}
                  disabled={isProcessing}
                  variant={isSubscribed ? "outline" : "default"}
                  size="sm"
                  className={`flex-1 ${isSubscribed ? 'border-yellow-500/30 text-yellow-400' : 'bg-gradient-to-r from-yellow-600 to-orange-500'}`}
                >
                  <Crown className={`w-4 h-4 mr-1 ${isSubscribed ? 'fill-current' : ''}`} />
                  {isSubscribed ? 'Subscribed' : 'Subscribe $5'}
                </Button>
              </div>
            )}
            
            {/* Watch/Manage button */}
            <Button asChild className="w-full neon-glow bg-gradient-to-r from-purple-600 to-pink-500">
              <Link to={streamUrl}>
                {isOwner ? (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Manage Stream
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {stream.status === 'live' ? "Watch Live" : "View Stream"}
                  </>
                )}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}