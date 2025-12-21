
import React, { useState, useEffect } from "react";
import { Stream } from "@/entities/Stream";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Eye, Star, Zap, Settings, Video, Radio, Calendar, Clock, VideoOff, Info, MessageCircle, Percent, Search, X, Trophy, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import CreateStreamModal from "../components/streaming/CreateStreamModal";
import StreamCard from "../components/streaming/StreamCard";
import StreamFilters from "../components/streaming/StreamFilters";
import StreamSettingsModal from "../components/streaming/StreamSettingsModal";
import QuantumFlowLoader from "../components/layout/QuantumFlowLoader";

export default function Streaming() {
  const [streams, setStreams] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("live");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    language: "all",
    status: "live"
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, streamsData] = await Promise.all([
        User.me().catch(() => null),
        Stream.list("-created_date", 50)
      ]);
      setUser(userData);
      setStreams(streamsData);
      setFilters((prev) => ({ ...prev, status: activeTab === "live" ? "live" : "all" }));
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleCreateStream = async (streamData) => {
    await Stream.create(streamData);
    loadData();
    setShowCreateModal(false);
  };

  const applyCategoryLanguageFilters = (stream) => {
    const categoryMatch = filters.category === "all" || stream.category === filters.category;
    const languageMatch = filters.language === "all" || stream.language === filters.language;

    const lowerCaseSearchQuery = searchQuery.toLowerCase();
    const searchMatch = searchQuery === "" ||
      stream.title.toLowerCase().includes(lowerCaseSearchQuery) ||
      stream.description?.toLowerCase().includes(lowerCaseSearchQuery) ||
      stream.created_by.toLowerCase().includes(lowerCaseSearchQuery) ||
      stream.tags && stream.tags.some((tag) => tag.toLowerCase().includes(lowerCaseSearchQuery));

    return categoryMatch && languageMatch && searchMatch;
  };

  const liveStreams = streams.filter((stream) => stream.status === "live" && applyCategoryLanguageFilters(stream));
  const pastStreams = streams.filter((stream) => stream.status === "finished" && applyCategoryLanguageFilters(stream));
  const myStreams = streams.filter((stream) => stream.created_by === user?.email && applyCategoryLanguageFilters(stream));

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "live") {
      setFilters((prev) => ({ ...prev, status: "live" }));
    } else if (value === "past") {
      setFilters((prev) => ({ ...prev, status: "finished" }));
    } else if (value === "my-streams") {
      setFilters((prev) => ({ ...prev, status: "all" }));
    }
  };

  return (
    <div className="p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Development Notice */}
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 text-xs md:text-sm flex items-center gap-2">
            <Info className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            This feature is under development and will be released during Phase 3 of our roadmap.
          </p>
        </div>

        {/* Header - Mobile Optimized */}
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--neon-primary), var(--neon-secondary))' }}>
              QuantumFlow Streams
            </h1>
            <p className="text-sm md:text-base text-gray-400">
              Watch live streams, interact with creators, and earn rewards
            </p>
          </div>
          
          {/* Action Buttons - Mobile Layout */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button
              onClick={() => window.open('/MuxKeyTester', '_blank')}
              variant="outline"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-sm">
              🔧 Test Mux Keys
            </Button>
            {user && (
              <Button
                onClick={() => setShowSettingsModal(true)}
                variant="outline"
                className="border-purple-500/30 text-white hover:bg-purple-500/10 text-sm">
                <Settings className="w-4 h-4 mr-2" />
                Stream Settings
              </Button>
            )}
            <Button
              disabled
              className="bg-gray-600/20 text-gray-400 cursor-not-allowed text-sm">
              <Video className="w-4 h-4 mr-2" />
              Go Live
            </Button>
          </div>
        </div>

        {/* How it Works Section - Mobile Optimized */}
        <Card className="dark-card mb-6 md:mb-8 neon-glow">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
              <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
              How QuantumFlow Streaming Works
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-white mb-2 md:mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                Earn Engagement Points (EP)
              </h3>
              <p className="text-gray-400 text-sm mb-3 md:mb-4">
                As a viewer, you earn EP for actively participating in streams. Your engagement helps creators grow and makes the community more vibrant.
              </p>
              <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                <li className="flex items-center gap-2 text-gray-300">
                  <Eye className="w-3 h-3 md:w-4 md:h-4 text-purple-400 flex-shrink-0" />
                  <span>Watching streams</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <MessageCircle className="w-3 h-3 md:w-4 md:h-4 text-cyan-400 flex-shrink-0" />
                  <span>Chatting and interacting</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 flex-shrink-0" />
                  <span>Following new creators</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-semibold text-white mb-2 md:mb-3 flex items-center gap-2">
                <Percent className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                Our Fair & Transparent Fee Structure
              </h3>
              <p className="text-gray-400 text-sm mb-3 md:mb-4">
                We support creators with an ultra-low fee structure, accepting both crypto ($QFLOW) and traditional fiat payments (credit cards).
              </p>
              <div className="space-y-2 md:space-y-3">
                <div className="p-3 md:p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <h4 className="font-semibold text-green-300 mb-2 flex items-center gap-2 text-sm md:text-base">
                    <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                    Flat 5% Fee on All Streaming Revenue
                  </h4>
                  <p className="text-gray-400 text-xs mb-2 md:mb-3">
                    A single, low fee applies to subscriptions, tips, and gated content sales, whether paid in crypto or fiat.
                  </p>
                  <div className="space-y-1 md:space-y-2">
                    <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg">
                      <span className="text-blue-300 text-xs md:text-sm">Platform Operations (2.5%)</span>
                      <div className="text-blue-400 font-bold text-xs md:text-sm">50%</div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-purple-500/10 rounded-lg">
                      <span className="text-purple-300 text-xs md:text-sm">DAO Treasury (2.5%)</span>
                      <div className="text-purple-400 font-bold text-xs md:text-sm">50%</div>
                    </div>
                  </div>
                </div>
                <div className="p-2 md:p-3 bg-black/20 rounded-lg text-center">
                  <p className="text-xs md:text-sm text-gray-300">
                    Example: On a <span className="text-white font-medium">$10 Tip</span>, the creator receives <span className="text-green-400 font-bold">$9.50</span>.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          
          {/* EP Rewards Table - Mobile Optimized */}
          <CardContent className="border-t border-gray-700/50 pt-4 md:pt-6">
            <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
              EP Rewards System
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-2 md:py-3 px-2 md:px-4 font-medium text-gray-300">Action</th>
                    <th className="text-left py-2 md:py-3 px-2 md:px-4 font-medium text-gray-300">Viewer EP</th>
                    <th className="text-left py-2 md:py-3 px-2 md:px-4 font-medium text-gray-300">Creator EP</th>
                    <th className="text-left py-2 md:py-3 px-2 md:px-4 font-medium text-gray-300">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  <tr className="hover:bg-gray-800/30">
                    <td className="py-2 md:py-3 px-2 md:px-4 text-white">Following a Creator</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-green-400 font-medium">+10 EP</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-green-400 font-medium">+15 EP</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-gray-400">One-time reward per follow</td>
                  </tr>
                  <tr className="hover:bg-gray-800/30">
                    <td className="py-2 md:py-3 px-2 md:px-4 text-white">Watching Stream</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-green-400 font-medium">+5 EP</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-green-400 font-medium">+10 EP</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-gray-400">Per hour watched</td>
                  </tr>
                  <tr className="hover:bg-gray-800/30">
                    <td className="py-2 md:py-3 px-2 md:px-4 text-white">Chat Interaction</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-green-400 font-medium">+3 EP</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-green-400 font-medium">+2 EP</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-gray-400">Per meaningful chat message</td>
                  </tr>
                  <tr className="hover:bg-gray-800/30">
                    <td className="py-2 md:py-3 px-2 md:px-4 text-white">Subscribing ($5/month)</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-yellow-400 font-medium">+25 EP</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-yellow-400 font-medium">+50 EP</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 text-gray-400">Monthly subscription bonus</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 md:mt-4 p-2 md:p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-xs md:text-sm">
                <Info className="w-3 h-3 md:w-4 md:h-4 inline mr-2" />
                <strong>Daily EP Cap:</strong> 200 EP per day. Excess EP automatically goes to the DAO treasury for quarterly distribution to all token holders.
              </p>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center pt-20">
            <QuantumFlowLoader message="Loading streams..." size="lg" />
          </div>
        ) : (
          <>
            {/* Tab Navigation and Content */}
            <div className="space-y-4 md:space-y-6">
              {/* Tab Buttons - Mobile Optimized */}
              <div className="grid w-full grid-cols-2 lg:grid-cols-3 gap-1 md:gap-2 dark-card p-1 md:p-1.5 rounded-2xl">
                <button
                  onClick={() => handleTabChange('live')}
                  className={`rounded-xl p-2 md:p-3 text-xs md:text-sm transition-all ${
                    activeTab === 'live'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg neon-glow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 md:gap-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="hidden sm:inline">Live ({liveStreams.length})</span>
                    <span className="sm:hidden">Live</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('past')}
                  className={`rounded-xl p-2 md:p-3 text-xs md:text-sm transition-all ${
                    activeTab === 'past'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg neon-glow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 inline" />
                  <span className="hidden sm:inline">Past ({pastStreams.length})</span>
                  <span className="sm:hidden">Past</span>
                </button>
                <button
                  onClick={() => handleTabChange('my-streams')}
                  className={`col-span-2 lg:col-span-1 rounded-xl p-2 md:p-3 text-xs md:text-sm transition-all ${
                    activeTab === 'my-streams'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg neon-glow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Settings className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 inline" />
                  <span className="hidden sm:inline">My Streams ({myStreams.length})</span>
                  <span className="sm:hidden">Mine ({myStreams.length})</span>
                </button>
              </div>

              {/* Search Bar - Mobile Optimized */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search streamers, titles, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/20 border-purple-500/20 text-white placeholder:text-gray-500 pl-10 h-10 md:h-12 text-sm md:text-base rounded-xl"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <StreamFilters filters={filters} onFiltersChange={setFilters} />

              {searchQuery && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                  <Search className="w-3 h-3 md:w-4 md:h-4" />
                  <span>
                    Showing results for "{searchQuery}" • {
                      activeTab === "live" ? liveStreams.length :
                      activeTab === "past" ? pastStreams.length :
                      myStreams.length
                    } found
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="text-purple-400 hover:text-purple-300 h-auto p-1 text-xs"
                  >
                    Clear search
                  </Button>
                </div>
              )}

              {/* Tab Content */}
              <div className="mt-4">
                {activeTab === 'live' && (
                  liveStreams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                      <AnimatePresence>
                        {liveStreams.map((stream) => (
                          <motion.div
                            key={stream.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <StreamCard stream={stream} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center p-8 md:p-10 dark-card rounded-lg flex flex-col items-center justify-center gap-3 md:gap-4">
                      {searchQuery ? (
                        <>
                          <Search className="w-8 h-8 md:w-12 md:h-12 text-gray-500" />
                          <p className="text-lg md:text-xl text-gray-400 font-semibold">No streams found</p>
                          <p className="text-sm md:text-base text-gray-500">Try adjusting your search or check other tabs.</p>
                        </>
                      ) : (
                        <>
                          <VideoOff className="w-8 h-8 md:w-12 md:h-12 text-gray-500" />
                          <p className="text-lg md:text-xl text-gray-400 font-semibold">No live streams available right now.</p>
                          <p className="text-sm md:text-base text-gray-500">Check back later or explore past streams!</p>
                        </>
                      )}
                    </div>
                  )
                )}

                {activeTab === 'past' && (
                  pastStreams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                      <AnimatePresence>
                        {pastStreams.map((stream) => (
                          <motion.div
                            key={stream.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <StreamCard stream={stream} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center p-8 md:p-10 dark-card rounded-lg flex flex-col items-center justify-center gap-3 md:gap-4">
                      {searchQuery ? (
                        <>
                          <Search className="w-8 h-8 md:w-12 md:h-12 text-gray-500" />
                          <p className="text-lg md:text-xl text-gray-400 font-semibold">No past streams found</p>
                          <p className="text-sm md:text-base text-gray-500">Try adjusting your search or filters.</p>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-8 h-8 md:w-12 md:h-12 text-gray-500" />
                          <p className="text-lg md:text-xl text-gray-400 font-semibold">No past streams found matching your criteria.</p>
                          <p className="text-sm md:text-base text-gray-500">Try adjusting your filters or check the live section.</p>
                        </>
                      )}
                    </div>
                  )
                )}

                {activeTab === 'my-streams' && (
                  user ? (
                    myStreams.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                        <AnimatePresence>
                          {myStreams.map((stream) => (
                            <motion.div
                              key={stream.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                            >
                              <StreamCard stream={stream} />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="text-center p-8 md:p-10 dark-card rounded-lg flex flex-col items-center justify-center gap-3 md:gap-4">
                        {searchQuery ? (
                          <>
                            <Search className="w-8 h-8 md:w-12 md:h-12 text-gray-500" />
                            <p className="text-lg md:text-xl text-gray-400 font-semibold">No matching streams found</p>
                            <p className="text-sm md:text-base text-gray-500">Try clearing your search to see all your streams.</p>
                          </>
                        ) : (
                          <>
                            <Radio className="w-8 h-8 md:w-12 md:h-12 text-gray-500" />
                            <p className="text-lg md:text-xl text-gray-400 font-semibold">You haven't created any streams yet.</p>
                            <p className="text-sm md:text-base text-gray-500">Click "Go Live" to start your first broadcast!</p>
                          </>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-center p-8 md:p-10 dark-card rounded-lg flex flex-col items-center justify-center gap-3 md:gap-4">
                      <Users className="w-8 h-8 md:w-12 md:h-12 text-gray-500" />
                      <p className="text-lg md:text-xl text-gray-400 font-semibold">Log in to view your streams.</p>
                      <p className="text-sm md:text-base text-gray-500">Sign in to manage and see your past broadcasts.</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {showCreateModal && (
              <CreateStreamModal
                onSubmit={handleCreateStream}
                onClose={() => setShowCreateModal(false)}
              />
            )}

            {showSettingsModal && (
              <StreamSettingsModal
                onClose={() => setShowSettingsModal(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
