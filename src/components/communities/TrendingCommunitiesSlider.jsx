import React, { useState, useEffect, useCallback } from 'react';
import { getTrendingCommunities } from '@/functions/getTrendingCommunities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Zap, Users, Settings, Flame, Heart, Plus } from 'lucide-react';
import ManageInterestsModal from './ManageInterestsModal';
import { UserProfileData } from '@/entities/UserProfileData';
import { invalidateCache, CACHE_CONFIG } from '../contexts/UserContext';

const CommunityCard = ({ community, index }) => (
  <Link to={`${createPageUrl("CommunityProfile")}?id=${community.id}`} className="block">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="w-48 h-56 group flex-shrink-0"
    >
      <Card className="h-full bg-slate-900/50 border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 overflow-hidden">
        <div className="p-4 h-full flex flex-col items-center justify-center text-center relative">
          
          {/* Featured Badge */}
          {community.is_featured && (
            <Badge variant="outline" className="absolute top-2 right-2 border-yellow-400 text-yellow-300 bg-yellow-900/50 backdrop-blur-sm text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}

          {/* Community Logo - No background */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
            {community.logo_url ? (
              <img
                src={community.logo_url}
                alt={`${community.name} logo`}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {community.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>

          {/* Community Name - Smaller text to fit better */}
          <h3 className="font-bold text-white text-base mb-2 w-full group-hover:text-purple-300 transition-colors leading-tight">
            {community.name}
          </h3>

          {/* Member Count */}
          <div className="flex items-center gap-1 text-sm text-gray-400 mb-3">
            <Users className="w-4 h-4" />
            <span>{community.member_emails?.length || 0} Members</span>
          </div>

          {/* Tags Preview (if available) */}
          {community.tags && community.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mt-auto">
              {community.tags.slice(0, 2).map((tag, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-xs px-2 py-0.5"
                >
                  {tag}
                </Badge>
              ))}
              {community.tags.length > 2 && (
                <Badge
                  variant="secondary"
                  className="bg-gray-600/20 text-gray-400 border-gray-500/30 text-xs px-2 py-0.5"
                >
                  +{community.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  </Link>
);

const SkeletonCard = () => (
  <div className="w-48 h-56 flex-shrink-0">
    <Card className="h-full bg-slate-900/50 border-purple-500/20">
      <div className="p-4 h-full flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-gray-700 animate-pulse mb-4"></div>
        <div className="h-4 bg-gray-700 rounded animate-pulse mb-2 w-24"></div>
        <div className="h-3 bg-gray-700 rounded animate-pulse w-16 mb-3"></div>
        <div className="flex gap-1">
          <div className="h-5 bg-gray-700 rounded animate-pulse w-12"></div>
          <div className="h-5 bg-gray-700 rounded animate-pulse w-12"></div>
        </div>
      </div>
    </Card>
  </div>
);

const UpdateInterestsPrompt = ({ onUpdateInterests }) => (
  <div className="w-full">
    <Card className="bg-slate-900/50 border-purple-500/20 p-6">
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
        <div className="w-14 h-14 bg-purple-600/20 rounded-full flex-shrink-0 flex items-center justify-center">
          <Heart className="w-7 h-7 text-purple-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Discover Your Communities</h3>
          <p className="text-gray-400 text-sm mt-1 leading-relaxed">
            Add your interests to see trending communities tailored just for you.
          </p>
        </div>

        <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
          <Button 
            onClick={onUpdateInterests}
            className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Interests
          </Button>
        </div>
      </div>
    </Card>
  </div>
);

export default function TrendingCommunitiesSlider({ user, onUserUpdate, showSlider, setShowSlider }) {
  const [communities, setCommunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [shouldShowUpdateMessage, setShouldShowUpdateMessage] = useState(false);
  const [userHasInterests, setUserHasInterests] = useState(false);

  const fetchCommunities = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getTrendingCommunities({ interests: user?.interests || [] });
      if (response.data) {
        setCommunities(response.data.communities || []);
        setShouldShowUpdateMessage(response.data.shouldShowUpdateMessage || false);
        setUserHasInterests(response.data.userHasInterests || false);
      }
    } catch (error) {
      console.error("Failed to fetch trending communities:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.interests]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities, refreshTrigger]);

  const handleModalClose = async (refreshed) => {
    setShowInterestsModal(false);
    if (refreshed && user) {
      try {
        // Invalidate cache and fetch fresh profile data
        invalidateCache(CACHE_CONFIG.USER_PROFILE_DATA);
        const profiles = await UserProfileData.filter({ user_email: user.email });
        
        if (profiles.length > 0) {
          const updatedProfile = profiles[0];
          
          // Update the parent component's user data
          if (onUserUpdate) {
            onUserUpdate({ ...user, ...updatedProfile });
          }
          
          // Trigger immediate communities refetch with new interests
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure state updates
          setRefreshTrigger(prev => prev + 1);
        }
      } catch (error) {
        console.error("Failed to refresh user interests:", error);
        // Fallback to trigger refresh anyway
        setRefreshTrigger(prev => prev + 1);
      }
    }
  };

  return (
    <div className="mb-8">
      {showInterestsModal && (
        <ManageInterestsModal 
          user={user} 
          onClose={handleModalClose} 
        />
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-purple-400" />
            Trending Communities
          </h2>
          <div className="flex items-center gap-2">
            <Switch
              id="toggle-communities"
              checked={showSlider}
              onCheckedChange={setShowSlider}
            />
            <Label htmlFor="toggle-communities" className="text-xs text-gray-400 cursor-pointer">
              {showSlider ? 'Hide' : 'Show'}
            </Label>
          </div>
        </div>
        {!isLoading && !shouldShowUpdateMessage && showSlider && (
          <Button
            variant="outline"
            className="border-purple-500/30 text-white hover:bg-purple-500/10"
            onClick={() => setShowInterestsModal(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Interests
          </Button>
        )}
      </div>

      {/* Show content based on showSlider prop */}
      {showSlider && (
        <>
          {/* Show loading state */}
          {isLoading && (
            <div className="flex overflow-x-auto space-x-4 pb-4 -mx-6 px-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Show update interests prompt */}
          {!isLoading && shouldShowUpdateMessage && (
            <UpdateInterestsPrompt onUpdateInterests={() => setShowInterestsModal(true)} />
          )}

          {/* Show communities */}
          {!isLoading && !shouldShowUpdateMessage && (
            <div className="flex overflow-x-auto space-x-4 pb-4 -mx-6 px-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {communities.length > 0 ? (
                communities.map((community, index) => (
                  <CommunityCard key={community.id} community={community} index={index} />
                ))
              ) : (
                <div className="w-full text-center py-10">
                  <p className="text-gray-500">No communities found. Explore and join some!</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}