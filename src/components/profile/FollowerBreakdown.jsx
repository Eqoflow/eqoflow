import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Twitter, Github, Linkedin, Youtube, Facebook, Instagram, Globe, Zap, Shield, Star } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const platformIcons = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  youtube: Youtube
};

const web3Icons = {
  lens: Globe,
  farcaster: Zap,
  nostr: Shield,
  bluesky: Star,
  mastodon: Users
};

export default function FollowerBreakdown({ user }) {
  const [engageFollowers, setEngageFollowers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEngageFollowers = async () => {
      if (user?.followers?.length > 0) {
        try {
          const followersData = await User.filter({ email: { '$in': user.followers } }, '-created_date', 5);
          setEngageFollowers(followersData);
        } catch (error) {
          console.error("Error fetching follower details:", error);
        }
      }
      setIsLoading(false);
    };

    fetchEngageFollowers();
  }, [user]);

  const web2Connections = user?.cross_platform_identity?.web2_verifications || [];
  const web3Connections = user?.cross_platform_identity?.web3_connections || [];
  const totalWeb2Followers = web2Connections.reduce((sum, conn) => sum + (conn.follower_count || 0), 0);
  const totalWeb3Followers = web3Connections.reduce((sum, conn) => sum + (conn.follower_count || 0), 0);

  return (
    <div>
      <h4 className="font-medium leading-none mb-4 text-white">Follower Breakdown</h4>
      <div className="space-y-4">
        {/* Engage Followers */}
        <div>
          <h5 className="text-sm font-semibold mb-2 flex items-center gap-2 text-purple-400">
            <Users className="w-4 h-4" /> On Engage ({user?.followers?.length || 0})
          </h5>
          {isLoading ? (
            <p className="text-xs text-gray-500">Loading...</p>
          ) : engageFollowers.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
              {engageFollowers.map(follower => (
                <div key={follower.id} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 border-2 border-purple-500/50">
                    <AvatarImage src={follower.avatar_url} />
                    <AvatarFallback className="bg-gray-700 text-xs">{follower.full_name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-300">{follower.full_name}</span>
                </div>
              ))}
              {user.followers.length > 5 && (
                <p className="text-xs text-gray-500 mt-2">...and {user.followers.length - 5} more.</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No followers on Engage yet.</p>
          )}
        </div>

        <Separator className="bg-purple-500/20" />

        {/* Web2 Followers */}
        {web2Connections.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold mb-2 flex items-center gap-2 text-blue-400">Web2 Platforms ({totalWeb2Followers.toLocaleString()})</h5>
            <div className="space-y-2">
              {web2Connections.map(conn => {
                const Icon = platformIcons[conn.platform] || Users;
                return (
                  <div key={conn.platform} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                       <Icon className="w-4 h-4" />
                       <span>{conn.platform.charAt(0).toUpperCase() + conn.platform.slice(1)}</span>
                    </div>
                    <span className="font-medium text-white">{conn.follower_count.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Web3 Followers */}
        {web3Connections.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-400">Web3 Protocols ({totalWeb3Followers.toLocaleString()})</h5>
             <div className="space-y-2">
              {web3Connections.map(conn => {
                const Icon = web3Icons[conn.protocol] || Globe;
                return (
                  <div key={conn.protocol} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                       <Icon className="w-4 h-4" />
                       <span>{conn.protocol.charAt(0).toUpperCase() + conn.protocol.slice(1)}</span>
                    </div>
                    <span className="font-medium text-white">{conn.follower_count.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {!web2Connections.length && !web3Connections.length && (
            <p className="text-xs text-gray-500">No cross-platform accounts connected yet.</p>
        )}

      </div>
    </div>
  )
}