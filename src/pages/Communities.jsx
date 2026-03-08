import React, { useState, useEffect, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UserContext } from "@/components/contexts/UserContext";
import UserChambersSidebar from "@/components/chambers/UserChambersSidebar";
import GlobalCategorySidebar from "@/components/chambers/GlobalCategorySidebar";
import DiscoveryContentArea from "@/components/chambers/DiscoveryContentArea";
import TopCommentsPanel from "@/components/chambers/TopCommentsPanel";

export default function Communities() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [communitiesData, commentsData] = await Promise.all([
      base44.entities.Community.list("-created_date", 100),
      base44.entities.Comment.list("-likes_count", 20),
    ]);
    setCommunities(communitiesData);
    setComments(commentsData);
    setIsLoading(false);
  };

  const joinedCommunities = communities.filter(c =>
    user?.email && c.member_emails?.includes(user.email)
  );

  const filteredCommunities = communities.filter(c => {
    const matchesCategory = selectedCategory === "general" || c.category === selectedCategory;
    const matchesSearch = !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-[calc(100vh-80px)] md:h-screen overflow-hidden bg-black -m-3 md:-m-6">
      {/* Left: User's chambers sidebar */}
      <UserChambersSidebar
        joinedCommunities={joinedCommunities}
        onHomeClick={() => navigate(createPageUrl("Feed"))}
      />

      {/* Center-left: Global category sidebar */}
      <GlobalCategorySidebar
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Center: Discovery content */}
      <DiscoveryContentArea
        communities={filteredCommunities}
        isLoading={isLoading}
      />

      {/* Right: Top comments panel (hidden on smaller screens) */}
      <div className="hidden xl:flex">
        <TopCommentsPanel comments={comments} />
      </div>
    </div>
  );
}