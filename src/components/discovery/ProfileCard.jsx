import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, UserPlus, UserCheck, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CrossPlatformBadges from '../identity/CrossPlatformBadges';
import ProfessionalBadge from '../identity/ProfessionalBadge';
import PioneerBadge from '../identity/PioneerBadge';
import CreatorBadge from '../identity/CreatorBadge';
import QuantumCreatorBadge from '../identity/QuantumCreatorBadge';
import QuantumProBadge from '../identity/QuantumProBadge';

export default function ProfileCard({ user: discoveryUser, currentUser }) {
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    checkFollowStatus();
  }, [currentUser, discoveryUser]);

  const checkFollowStatus = async () => {
    if (!currentUser || !discoveryUser) return;
    
    try {
      const follows = await base44.entities.Follow.filter({
        follower_email: currentUser.email,
        following_email: discoveryUser.user_email
      });
      setIsFollowing(follows.length > 0);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return;

    // Optimistic UI update
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);

    try {
      if (wasFollowing) {
        const follows = await base44.entities.Follow.filter({
          follower_email: currentUser.email,
          following_email: discoveryUser.user_email
        });
        if (follows.length > 0) {
          await base44.entities.Follow.delete(follows[0].id);
        }
      } else {
        await base44.entities.Follow.create({
          follower_email: currentUser.email,
          following_email: discoveryUser.user_email
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      // Revert on error
      setIsFollowing(wasFollowing);
    }
  };

  const handleMessage = () => {
    if (!currentUser) return;
    const conversationId = [currentUser.email, discoveryUser.user_email].sort().join('_');
    window.location.href = createPageUrl('Messages') + `?conversation=${conversationId}`;
  };

  // Email is already masked from Discovery.js parent component
  const displayEmail = discoveryUser.user_email;

  return (
    <Card className="dark-card hover:border-purple-500/40 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar */}
          <Link to={createPageUrl('PublicProfile') + `?username=${discoveryUser.username}`}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center overflow-hidden hover:scale-105 transition-transform cursor-pointer">
              {discoveryUser.avatar_url ? (
                <img src={discoveryUser.avatar_url} alt={discoveryUser.full_name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10 text-white" />
              )}
            </div>
          </Link>

          {/* User Info */}
          <div className="w-full">
            <Link to={createPageUrl('PublicProfile') + `?username=${discoveryUser.username}`}>
              <h3 className="text-lg font-bold text-white hover:text-purple-400 transition-colors">
                {discoveryUser.full_name}
              </h3>
            </Link>
            <p className="text-gray-400 text-sm">@{discoveryUser.username}</p>
            
            {/* Display email (already masked from parent) - only show if not current user */}
            {currentUser?.email !== discoveryUser.user_email && displayEmail && (
              <p className="text-gray-500 text-xs mt-1">{displayEmail}</p>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1 justify-center">
            <CrossPlatformBadges 
              cross_platform_identity={discoveryUser.cross_platform_identity} 
              size="sm" 
              userEmail={discoveryUser.user_email}
            />
            <PioneerBadge userEmail={discoveryUser.user_email} />
            <CreatorBadge userEmail={discoveryUser.user_email} />
            <QuantumCreatorBadge user={discoveryUser} size="sm" />
            <QuantumProBadge user={discoveryUser} size="sm" />
            <ProfessionalBadge user={discoveryUser} />
          </div>

          {/* Bio */}
          {discoveryUser.bio && (
            <p className="text-gray-400 text-sm line-clamp-3">{discoveryUser.bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="text-center">
              <div className="font-bold text-white">{discoveryUser.total_follower_count || 0}</div>
              <div className="text-gray-500">Followers</div>
            </div>
            <div className="w-px h-8 bg-gray-700"></div>
            <div className="text-center">
              <div className="font-bold text-white">{discoveryUser.reputation_score || 100}</div>
              <div className="text-gray-500">Reputation</div>
            </div>
          </div>

          {/* Skills */}
          {discoveryUser.skills && discoveryUser.skills.length > 0 && (
            <div className="w-full">
              <div className="flex flex-wrap gap-1 justify-center">
                {discoveryUser.skills.slice(0, 3).map((skill, index) => (
                  <Badge key={index} className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-xs">
                    {skill}
                  </Badge>
                ))}
                {discoveryUser.skills.length > 3 && (
                  <Badge className="bg-gray-600/20 text-gray-400 border-gray-500/30 text-xs">
                    +{discoveryUser.skills.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {currentUser && currentUser.email !== discoveryUser.user_email && (
            <div className="flex gap-2 w-full">
              <Button
                onClick={handleFollow}
                className={`flex-1 ${
                  isFollowing 
                    ? "bg-gray-700 hover:bg-gray-600" 
                    : "bg-gradient-to-r from-purple-600 to-pink-500"
                }`}
              >
                {isFollowing ? <UserCheck className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button
                onClick={handleMessage}
                variant="outline"
                className="border-purple-500/30 text-white hover:bg-purple-500/10"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          )}

          {currentUser && currentUser.email === discoveryUser.user_email && (
            <Link to={createPageUrl('Profile')} className="w-full">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-500">
                View My Profile
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}