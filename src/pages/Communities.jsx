import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Users, Info } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import CreateCommunityModal from "../components/communities/CreateCommunityModal";
import CommunityCard from "../components/communities/CommunityCard";
import PayoutNotice from '../components/layout/PayoutNotice';
import CommunityInfoModal from '../components/communities/CommunityInfoModal';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([]);
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch user data first as it's often needed independently and for create functionality.
      const userData = await base44.auth.me();
      setUser(userData);

      // Fetch ALL communities (including private ones)
      const fetchedCommunities = await base44.entities.Community.list("-created_date", 50);
      
      let processedCommunities = [];

      if (fetchedCommunities.length > 0) {
        // OPTIMIZED: Batch fetch all creator data for communities
        // Extract unique creator emails, filtering out any falsy values (null, undefined, empty string)
        const creatorEmailsToFetch = [...new Set(fetchedCommunities.map(community => community.created_by).filter(Boolean))]; 
        
        let creators = [];
        if (creatorEmailsToFetch.length > 0) {
            // Batch fetch creator information, handle potential errors in this specific fetch
            creators = await base44.entities.User.filter({ email: { $in: creatorEmailsToFetch } }).catch((err) => {
                console.error("Error fetching creators for communities:", err);
                return []; // Return an empty array on error to prevent breaking
            });
        }
        
        // Create a map for efficient creator lookup by email
        const creatorsMap = creators.reduce((acc, creator) => {
          acc[creator.email] = creator;
          return acc;
        }, {});

        // Enrich communities with creator data and member count
        const enrichedCommunities = fetchedCommunities.map(community => ({
          ...community,
          creator: creatorsMap[community.created_by] || null, // Attach creator object or null if not found
          member_count: community.member_emails ? community.member_emails.length : 0 // Calculate member count
        }));

        // Define creator emails (founding team) for specific sorting
        const foundingCreatorEmails = [
          'trevorhenry20@gmail.com',
          'sirp.block.chain@gmail.com', 
          'keith@quantum3.tech',
          'stokes1127@gmail.com'
        ];
        
        // Sort communities: pinned first, then founding creators, then others (by creation date)
        const sortedCommunities = [...enrichedCommunities].sort((a, b) => {
          // First sort by pinned status (pinned communities go to top)
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          
          // If both have same pinned status, then sort by founding creators
          const aIsFoundingCreator = foundingCreatorEmails.includes(a.created_by?.toLowerCase());
          const bIsFoundingCreator = foundingCreatorEmails.includes(b.created_by?.toLowerCase());
          
          // If both are founding creators or both are not founding creators, sort by creation date (newest first)
          if (aIsFoundingCreator === bIsFoundingCreator) {
            return new Date(b.created_date) - new Date(a.created_date);
          }
          
          // Founding creators go first (within their pin group)
          return aIsFoundingCreator ? -1 : 1; 
        });
        
        processedCommunities = sortedCommunities;

      } 
      
      setCommunities(processedCommunities);

    } catch (error) {
      console.error("Error loading communities data:", error);
    } finally {
      // Ensure isLoading is set to false regardless of success or error
      setIsLoading(false);
    }
  };

  const handleCreateCommunity = async (communityData) => {
    try {
      // 1. Create the community
      const newCommunity = await base44.entities.Community.create({
        ...communityData,
        member_emails: [user.email]
      });
      
      // 2. Update the creator's token balance
      const existingBalances = user.community_token_balances || {};
      const newBalances = {
        ...existingBalances,
        [newCommunity.id]: communityData.token_total_supply
      };
      // Update user data on backend and locally
      const updatedUser = await base44.auth.updateMe({ community_token_balances: newBalances });
      setUser(updatedUser);

      // 3. Close modal and reload data
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error("Error creating community:", error);
    }
  };

  // Pull-to-Refresh implementation
  useEffect(() => {
    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (window.scrollY === 0 && !isPullRefreshing) {
        currentY = e.touches[0].clientY;
        const distance = Math.max(0, currentY - startY);
        
        if (distance > 0 && distance < 100) {
          setPullDistance(distance);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > 60 && !isPullRefreshing) {
        setIsPullRefreshing(true);
        setPullDistance(0);
        await loadData();
        setIsPullRefreshing(false);
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPullRefreshing, pullDistance]);

  return (
    <div className="p-3 md:p-6">
      {/* Pull-to-Refresh Indicator */}
      <AnimatePresence>
        {pullDistance > 0 && (
          <div
            className="fixed top-0 left-0 right-0 flex justify-center pt-4 z-50 pointer-events-none md:hidden"
            style={{ 
              paddingTop: 'max(1rem, env(safe-area-inset-top))',
              opacity: pullDistance / 60
            }}
          >
            <div className="bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 py-2 flex items-center gap-2">
              <svg 
                className="w-4 h-4 text-purple-400" 
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ 
                  transform: `rotate(${pullDistance * 3}deg)`,
                  animation: isPullRefreshing ? 'spin 1s linear infinite' : 'none'
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm text-purple-300">
                {isPullRefreshing ? 'Refreshing...' : pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div>
            {/* Modified Header Section: Added Info Button */}
            <div className="flex items-center gap-4">
              <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--neon-primary), var(--neon-secondary))' }}>
                EqoChambers
              </h1>
              <Button
                variant="outline"
                className="border-purple-500/30 text-white hover:bg-purple-500/10 min-h-[44px] px-3"
                onClick={() => setShowInfoModal(true)}
              >
                <Info className="w-5 h-5 mr-2" />
                How it works
              </Button>
            </div>
            <p className="text-sm md:text-base text-gray-400 mt-2">
              Create and explore tokenized micro-economies with flexible payment options - crypto or fiat.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 neon-glow min-h-[44px]"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Community
          </Button>
        </div>

        <PayoutNotice />

        {/* Show content immediately with skeleton if loading */}
        {isLoading && communities.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {/* Skeleton community cards */}
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="dark-card rounded-2xl p-4 md:p-6 animate-pulse">
                <div className="h-24 md:h-32 bg-gray-700 rounded-t-2xl mb-4"></div>
                <div className="h-4 md:h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 md:h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-4 md:h-6 bg-gray-700 rounded w-16"></div>
                  <div className="h-4 md:h-6 bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {communities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                <AnimatePresence>
                  {communities.map((community, index) => (
                    <CommunityCard key={community.id} community={community} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="dark-card rounded-2xl p-8 md:p-12 text-center neon-glow mt-6 md:mt-10">
                <Users className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-purple-400" />
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No Communities Yet</h3>
                <p className="text-sm md:text-base text-gray-500 mb-4">Be the first to create a new micro-economy!</p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 min-h-[44px]"
                >
                  Create Your Community
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      <AnimatePresence>
        {showCreateModal && (
          <CreateCommunityModal
            user={user}
            onSubmit={handleCreateCommunity}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Added CommunityInfoModal */}
      <AnimatePresence>
        {showInfoModal && (
          <CommunityInfoModal onClose={() => setShowInfoModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}