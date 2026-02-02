import React, { useState, useEffect, useContext } from "react";
import { useLocation } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { UserContext } from '../components/contexts/UserContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User as UserIcon,
  Link as LinkIcon,
  MessageSquare,
  UserPlus,
  UserCheck,
  ExternalLink,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import PostCard from "../components/feed/PostCard";
import CrossPlatformBadges from '../components/identity/CrossPlatformBadges';
import ProfessionalBadge from '../components/identity/ProfessionalBadge';
import PioneerBadge from '../components/identity/PioneerBadge';
import CreatorBadge from '../components/identity/CreatorBadge';
import QuantumCreatorBadge from '../components/identity/QuantumCreatorBadge';
import QuantumProBadge from '../components/identity/QuantumProBadge';
import KYCVerifiedBadge from '../components/identity/KYCVerifiedBadge';
import EqoPlusLiteBadge from '../components/identity/EqoPlusLiteBadge';
import EqoPlusCreatorBadge from '../components/identity/EqoPlusCreatorBadge';
import EqoPlusProBadge from '../components/identity/EqoPlusProBadge';
import CoCEOBadge from '../components/identity/CoCEOBadge';
import CMOBadge from '../components/identity/CMOBadge';
import CoFounderBadge from '../components/identity/CoFounderBadge';
import CFOBadge from '../components/identity/CFOBadge';
import COOBadge from '../components/identity/COOBadge';
import CCOBadge from '../components/identity/CCOBadge';
import CustomBadges from '../components/identity/CustomBadges';
import { createPageUrl } from '@/utils';
import { trackProfileView } from '@/functions/trackProfileView';

export default function PublicProfile() {
  const location = useLocation();
  const { user: currentUser } = useContext(UserContext);
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const username = params.get('username');
    if (username) {
      loadUserProfile(username);
    }
  }, [location.search]);

  const loadUserProfile = async (username) => {
    try {
      setIsLoading(true);
      
      if (!username || username.trim() === '') {
        console.error('Invalid username provided');
        setProfileUser(null);
        return;
      }
      
      const users = await base44.entities.PublicUserDirectory.filter({ username: username.trim() });
      
      if (users.length === 0) {
        console.log('No user found with username:', username);
        setProfileUser(null);
        return;
      }

      const foundUser = users[0];
      
      setProfileUser(foundUser);

      // Track profile view (using original email for backend tracking)
      if (currentUser && foundUser.user_email !== currentUser.email) {
        try {
          await trackProfileView({ profileOwnerEmail: foundUser.user_email });
        } catch (error) {
          console.log('Profile view tracking failed:', error);
        }
      }

      // Load posts
      const userPosts = await base44.entities.Post.filter(
        { created_by: foundUser.user_email },
        "-created_date",
        20
      );
      setPosts(userPosts);

      // Check if following
      if (currentUser) {
        const follows = await base44.entities.Follow.filter({
          follower_email: currentUser.email,
          following_email: foundUser.user_email
        });
        setIsFollowing(follows.length > 0);
      }

      // Get follower/following counts
      const [followers, following] = await Promise.all([
        base44.entities.Follow.filter({ following_email: foundUser.user_email }),
        base44.entities.Follow.filter({ follower_email: foundUser.user_email })
      ]);
      
      setFollowerCount(followers.length);
      setFollowingCount(following.length);

    } catch (error) {
      console.error("Error loading profile:", error);
      setProfileUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;

    try {
      if (isFollowing) {
        const follows = await base44.entities.Follow.filter({
          follower_email: currentUser.email,
          following_email: profileUser.user_email
        });
        if (follows.length > 0) {
          await base44.entities.Follow.delete(follows[0].id);
        }
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
      } else {
        await base44.entities.Follow.create({
          follower_email: currentUser.email,
          following_email: profileUser.user_email
        });
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const handleMessage = () => {
    if (!currentUser || !profileUser) return;
    const conversationId = [currentUser.email, profileUser.user_email].sort().join('_');
    window.location.href = createPageUrl('Messages') + `?conversation=${conversationId}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <UserIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">User not found</h2>
          <p className="text-gray-400">This profile doesn't exist or has been made private</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="dark-card overflow-hidden">
        {/* Banner */}
        <div
          className="w-full h-48 bg-gradient-to-r from-purple-600/20 to-pink-600/20"
          style={{
            backgroundImage: profileUser.banner_url ? `url(${profileUser.banner_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        <CardContent className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 -mt-16">
            <div className="flex items-end gap-4">
              <div className="w-32 h-32 rounded-full border-4 border-slate-900 bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center overflow-hidden">
                {profileUser.avatar_url ? (
                  <img src={profileUser.avatar_url} alt={profileUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-16 h-16 text-white" />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {currentUser && currentUser.email !== profileUser.user_email && (
              <div className="flex gap-2">
                <Button
                  onClick={handleFollow}
                  className={isFollowing 
                    ? "bg-gray-700 hover:bg-gray-600" 
                    : "bg-gradient-to-r from-purple-600 to-pink-500"
                  }
                >
                  {isFollowing ? <UserCheck className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button
                  onClick={handleMessage}
                  variant="outline"
                  className="border-purple-500/30 text-white hover:bg-purple-500/10"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-3xl font-bold text-white">{profileUser.full_name}</h1>
                <KYCVerifiedBadge user={profileUser} />
                <CrossPlatformBadges cross_platform_identity={profileUser.cross_platform_identity} size="lg" userEmail={profileUser.user_email} />
                <PioneerBadge userEmail={profileUser.user_email} />
                <CreatorBadge userEmail={profileUser.user_email} />
                <QuantumCreatorBadge user={profileUser} size="lg" />
                <QuantumProBadge user={profileUser} size="lg" />
                <EqoPlusLiteBadge user={profileUser} />
                <EqoPlusCreatorBadge user={profileUser} />
                <EqoPlusProBadge user={profileUser} />
                <ProfessionalBadge user={profileUser} />
                <CoCEOBadge userEmail={profileUser.user_email} />
                <CMOBadge userEmail={profileUser.user_email} />
                <CFOBadge userEmail={profileUser.user_email} />
                <COOBadge userEmail={profileUser.user_email} />
                <CCOBadge userEmail={profileUser.user_email} />
                <CoFounderBadge userEmail={profileUser.user_email} />
                <CustomBadges userEmail={profileUser.user_email} />
              </div>
              <p className="text-gray-400">@{profileUser.username}</p>
            </div>

            {profileUser.bio && (
              <p className="text-gray-300 leading-relaxed">{profileUser.bio}</p>
            )}

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <UserIcon className="w-4 h-4" />
                <span>{followerCount} followers</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <UserIcon className="w-4 h-4" />
                <span>{followingCount} following</span>
              </div>
              {profileUser.join_date && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {format(new Date(profileUser.join_date), "MMM yyyy")}</span>
                </div>
              )}
            </div>

            {profileUser.website && (
              <a
                href={profileUser.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300"
              >
                <LinkIcon className="w-4 h-4" />
                {profileUser.website}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {profileUser.skills && profileUser.skills.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profileUser.skills.map((skill, index) => (
                    <Badge key={index} className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profileUser.interests && profileUser.interests.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profileUser.interests.map((interest, index) => (
                    <Badge key={index} className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Posts</h2>
        {posts.length === 0 ? (
          <Card className="dark-card">
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No posts yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onUpdate={() => loadUserProfile(profileUser.username)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}