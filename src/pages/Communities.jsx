import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import CreateCommunityModal from "../components/communities/CreateCommunityModal";
import CommunityInfoModal from "../components/communities/CommunityInfoModal";
import UserChambersSidebar from "../components/chambers/UserChambersSidebar";
import GlobalCategorySidebar from "../components/chambers/GlobalCategorySidebar";
import DiscoveryContentArea from "../components/chambers/DiscoveryContentArea";
import TopCommentsPanel from "../components/chambers/TopCommentsPanel";

const CATEGORY_MAP = {
  general: 'general',
  gaming: 'gaming',
  support: 'support',
  voice_chats: null,
  trending: null,
};

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [topComments, setTopComments] = useState([]);
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Fetch all communities
      const allCommunities = await base44.entities.Community.list("-created_date", 100);

      // Enrich communities
      const enriched = allCommunities.map(c => ({
        ...c,
        member_count: c.member_emails?.length || 0
      }));

      setCommunities(enriched);

      // Joined communities for left sidebar
      const joined = enriched.filter(c =>
        c.member_emails?.includes(userData?.email)
      );
      setJoinedCommunities(joined);

      // Fetch top comments across platform
      const comments = await base44.entities.Comment.list("-likes_count", 20);
      setTopComments(comments);

    } catch (error) {
      console.error("Error loading EqoChambers data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCommunity = async (communityData) => {
    try {
      const newCommunity = await base44.entities.Community.create({
        ...communityData,
        member_emails: [user.email],
        channels: [
          { id: 'general-text', name: 'general', type: 'text', position: 0 },
          { id: 'general-voice', name: 'General Voice', type: 'voice', position: 1 }
        ]
      });

      const existingBalances = user.community_token_balances || {};
      const newBalances = {
        ...existingBalances,
        [newCommunity.id]: communityData.token_total_supply
      };
      await base44.auth.updateMe({ community_token_balances: newBalances });

      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error("Error creating community:", error);
    }
  };

  // Filter communities based on selected category and search
  const filteredCommunities = communities.filter(c => {
    const matchesSearch = !searchQuery ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedCategory === 'trending') return matchesSearch;
    if (selectedCategory === 'voice_chats') {
      // Communities that have voice channels
      return matchesSearch && c.channels?.some(ch => ch.type === 'voice');
    }
    const categoryFilter = CATEGORY_MAP[selectedCategory];
    if (categoryFilter) return matchesSearch && c.category === categoryFilter;
    return matchesSearch;
  }).sort((a, b) => {
    if (selectedCategory === 'trending') {
      return (b.member_emails?.length || 0) - (a.member_emails?.length || 0);
    }
    // Pinned first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_date) - new Date(a.created_date);
  });

  return (
    <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-40px)] overflow-hidden -m-3 md:-m-6">

      {/* Leftmost: User's joined chambers */}
      <UserChambersSidebar
        joinedCommunities={joinedCommunities}
        onHomeClick={() => setSelectedCategory('trending')}
      />

      {/* Middle: Global category navigation */}
      <GlobalCategorySidebar
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main content: Discovery area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-black/10 min-w-0">

        {/* Page Header */}
        <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-white/5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--neon-primary), var(--neon-secondary))' }}>
                EqoChambers
              </h1>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500/30 text-white hover:bg-purple-500/10 h-8 text-xs px-3"
                onClick={() => setShowInfoModal(true)}
              >
                <Info className="w-3.5 h-3.5 mr-1.5" />
                How it works
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Create and explore tokenized micro-economies with flexible payment options - crypto or fiat.
            </p>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-sm h-9"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Community
          </Button>
        </div>

        {/* Content row */}
        <div className="flex flex-1 overflow-hidden">
          <DiscoveryContentArea
            communities={filteredCommunities}
            isLoading={isLoading}
          />

          {/* Right: Top Comments */}
          <div className="hidden lg:flex">
            <TopCommentsPanel comments={topComments} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCommunityModal
            user={user}
            onSubmit={handleCreateCommunity}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInfoModal && (
          <CommunityInfoModal onClose={() => setShowInfoModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}