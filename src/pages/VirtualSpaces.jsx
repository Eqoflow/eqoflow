
import React, { useState, useEffect } from "react";
import { VirtualSpace } from "@/entities/VirtualSpace";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe,
  Users,
  Calendar,
  Plus,
  Eye,
  Lock,
  Play,
  Clock,
  Star,
  Zap,
  Volume2,
  Headphones,
  MapPin,
  Info,
  DollarSign
} from
"lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import CreateSpaceModal from "../components/virtual/CreateSpaceModal";
import VirtualRoom from "../components/virtual/VirtualRoom";
import QuantumFlowLoader from "../components/layout/QuantumFlowLoader";

export default function VirtualSpaces() {
  const [spaces, setSpaces] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showVirtualRoom, setShowVirtualRoom] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [spacesData, userData] = await Promise.all([
      VirtualSpace.list("-created_date", 50),
      User.me().catch(() => null)]
      );

      setSpaces(spacesData);
      setCurrentUser(userData);
    } catch (error) {
      console.error("Error loading virtual spaces:", error);
    }
    setIsLoading(false);
  };

  const handleCreateSpace = async (spaceData) => {
    try {
      await VirtualSpace.create(spaceData);
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error("Error creating space:", error);
    }
  };

  const handleJoinSpace = async (space) => {
    if (!currentUser) return;

    try {
      // Add user to participants
      const updatedParticipants = [
      ...(space.current_participants || []),
      {
        email: currentUser.email,
        avatar_url: currentUser.avatar_url,
        full_name: currentUser.full_name,
        position: { x: 0, y: 0, z: 0 },
        joined_at: new Date().toISOString()
      }];


      await VirtualSpace.update(space.id, {
        current_participants: updatedParticipants,
        total_visits: (space.total_visits || 0) + 1
      });

      setSelectedSpace({ ...space, current_participants: updatedParticipants });
      setShowVirtualRoom(true);
    } catch (error) {
      console.error("Error joining space:", error);
    }
  };

  const getSpaceIcon = (spaceType) => {
    const icons = {
      hangout: Users,
      event: Calendar,
      meeting: Users,
      party: Star,
      gallery: Eye,
      conference: Headphones,
      gaming: Play,
      other: Globe
    };
    return icons[spaceType] || Globe;
  };

  const getEnvironmentColor = (environment) => {
    const colors = {
      space_station: "from-blue-600 to-purple-600",
      forest: "from-green-600 to-emerald-600",
      beach: "from-cyan-600 to-blue-600",
      city: "from-gray-600 to-blue-600",
      abstract: "from-purple-600 to-pink-600",
      neon_city: "from-pink-600 to-cyan-600",
      underwater: "from-blue-600 to-teal-600",
      mountains: "from-gray-600 to-green-600"
    };
    return colors[environment] || "from-purple-600 to-pink-600";
  };

  const activeSpaces = spaces.filter((s) => s.status === "active");
  const scheduledSpaces = spaces.filter((s) => s.status === "scheduled");
  const mySpaces = spaces.filter((s) => s.created_by === currentUser?.email);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Development Notice */}
        <div className="mb-6 p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            This feature is under development and will be released during Phase 3 of our roadmap.
          </p>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Virtual Spaces
          </h1>
          <p className="text-gray-400">
            Join immersive 3D social spaces and virtual events
          </p>
        </div>

        {/* How it Works Section */}
        <Card className="dark-card mb-8 neon-glow">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              How QuantumFlow Virtual Spaces Work
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                Immersive Social Hubs
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Create, explore, and socialize in 3D virtual environments. Host events, showcase NFTs, hold meetings, or just hang out with friends in a shared digital space.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-300">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Live voice and text chat</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span>Display your NFT collection</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <Users className="w-4 h-4 text-green-400" />
                  <span>Host public or private events</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Hybrid Monetization & Fees
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Creators can monetize their spaces through entry fees or premium features, accepting both crypto and traditional fiat payments.
              </p>
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
                  Platform Fee: 15%
                </h4>
                <p className="text-gray-400 text-xs mb-3">
                  A 15% fee applies to all paid transactions within Virtual Spaces, such as entry fees or in-space purchases.
                </p>
                <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg mb-2">
                  <span className="text-blue-300 text-sm">Platform Operations (9%)</span>
                  <div className="text-blue-400 font-bold">60%</div>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-500/10 rounded-lg">
                  <span className="text-purple-300 text-sm">DAO Treasury (6%)</span>
                  <div className="text-purple-400 font-bold">40%</div>
                </div>
              </div>
              <div className="p-3 bg-black/20 rounded-lg text-center mt-3">
                  <p className="text-sm text-gray-300">
                      Example: On a <span className="text-white font-medium">$5 Entry Fee</span>, the creator receives <span className="text-green-400 font-bold">$4.25</span>.
                  </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ?
        <div className="flex items-center justify-center pt-20">
          <QuantumFlowLoader message="Loading virtual spaces..." size="lg" />
        </div> :

        <>
            {/* Action Bar */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                  <Zap className="w-3 h-3 mr-1" />
                  {activeSpaces.length} Active Spaces
                </Badge>
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                  <Calendar className="w-3 h-3 mr-1" />
                  {scheduledSpaces.length} Scheduled Events
                </Badge>
              </div>
              <Button
              disabled
              className="bg-gray-600/20 text-gray-400 cursor-not-allowed">

                <Plus className="w-4 h-4 mr-2" />
                Create Space
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 dark-card p-1.5 rounded-2xl">
                <TabsTrigger value="discover" className="rounded-xl">
                  <Globe className="w-4 h-4 mr-2" />
                  Discover
                </TabsTrigger>
                <TabsTrigger value="active" className="rounded-xl">
                  <Zap className="w-4 h-4 mr-2" />
                  Active Now
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="rounded-xl">
                  <Calendar className="w-4 h-4 mr-2" />
                  Scheduled
                </TabsTrigger>
                <TabsTrigger value="my-spaces" className="rounded-xl">
                  <Users className="w-4 h-4 mr-2" />
                  My Spaces
                </TabsTrigger>
              </TabsList>

              <TabsContent value="discover">
                <div className="bg-slate-950 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {spaces.map((space, index) => {
                    const SpaceIcon = getSpaceIcon(space.space_type);
                    return (
                      <motion.div
                        key={space.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}>

                          <Card className="dark-card hover-lift h-full">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getEnvironmentColor(space.environment)} flex items-center justify-center`}>
                                    <SpaceIcon className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-white text-lg">{space.name}</CardTitle>
                                    <p className="text-sm text-gray-400">{space.environment.replace('_', ' ')}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {space.is_public ?
                                <Globe className="w-4 h-4 text-green-400" /> :

                                <Lock className="w-4 h-4 text-yellow-400" />
                                }
                                  <Badge className={`${space.status === 'active' ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>
                                    {space.status}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <p className="text-gray-300 text-sm">{space.description}</p>
                              
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <Users className="w-3 h-3" />
                                    {space.current_participants?.length || 0}/{space.max_participants}
                                  </div>
                                  {space.space_settings?.voice_chat_enabled &&
                                <div className="flex items-center gap-1 text-purple-400">
                                      <Volume2 className="w-3 h-3" />
                                      Voice
                                    </div>
                                }
                                  {space.entry_fee > 0 &&
                                <div className="flex items-center gap-1 text-yellow-400">
                                      <Star className="w-3 h-3" />
                                      {space.entry_fee} $QFLOW
                                    </div>
                                }
                                </div>
                              </div>

                              {space.tags && space.tags.length > 0 &&
                            <div className="flex flex-wrap gap-1">
                                  {space.tags.slice(0, 3).map((tag, idx) =>
                              <Badge key={idx} variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                                      #{tag}
                                    </Badge>
                              )}
                                </div>
                            }

                              <Button
                              onClick={() => handleJoinSpace(space)}
                              disabled={space.current_participants?.length >= space.max_participants}
                              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">

                                <MapPin className="w-4 h-4 mr-2" />
                                {space.current_participants?.length >= space.max_participants ? 'Full' : 'Join Space'}
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>);

                  })}
                  </AnimatePresence>
                </div>
              </TabsContent>

              <TabsContent value="active">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeSpaces.length > 0 ?
                activeSpaces.map((space, index) =>
                <motion.div
                  key={space.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}>

                        {/* Same card structure as discover */}
                        <Card className="dark-card hover-lift h-full border-green-500/30">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getEnvironmentColor(space.environment)} flex items-center justify-center`}>
                                  <Zap className="w-6 h-6 text-white animate-pulse" />
                                </div>
                                <div>
                                  <CardTitle className="text-white text-lg">{space.name}</CardTitle>
                                  <p className="text-sm text-green-400">● Live Now</p>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-gray-300 text-sm">{space.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-gray-400">
                                <Users className="w-3 h-3" />
                                {space.current_participants?.length || 0}/{space.max_participants}
                              </div>
                            </div>
                            <Button
                        onClick={() => handleJoinSpace(space)}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">

                              <Play className="w-4 h-4 mr-2" />
                              Join Now
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                ) :

                <div className="col-span-full text-center py-12">
                      <Zap className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <h3 className="text-lg font-semibold text-white mb-2">No Active Spaces</h3>
                      <p className="text-gray-500">Create the first active space and invite others!</p>
                    </div>
                }
                </div>
              </TabsContent>

              <TabsContent value="scheduled">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {scheduledSpaces.length > 0 ?
                scheduledSpaces.map((space, index) =>
                <motion.div
                  key={space.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}>

                        <Card className="dark-card hover-lift h-full border-blue-500/30">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getEnvironmentColor(space.environment)} flex items-center justify-center`}>
                                  <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <CardTitle className="text-white text-lg">{space.name}</CardTitle>
                                  <p className="text-sm text-blue-400">
                                    {space.scheduled_start && format(new Date(space.scheduled_start), "MMM d, h:mm a")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-gray-300 text-sm">{space.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-gray-400">
                                <Clock className="w-3 h-3" />
                                Scheduled Event
                              </div>
                            </div>
                            <Button
                        disabled
                        className="w-full bg-gray-600/20 text-gray-400 cursor-not-allowed">

                              <Calendar className="w-4 h-4 mr-2" />
                              Scheduled
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                ) :

                <div className="col-span-full text-center py-12">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <h3 className="text-lg font-semibold text-white mb-2">No Scheduled Events</h3>
                      <p className="text-gray-500">Schedule your first virtual event!</p>
                    </div>
                }
                </div>
              </TabsContent>

              <TabsContent value="my-spaces">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mySpaces.length > 0 ?
                mySpaces.map((space, index) =>
                <motion.div
                  key={space.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}>

                        <Card className="dark-card hover-lift h-full border-purple-500/30">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getEnvironmentColor(space.environment)} flex items-center justify-center`}>
                                  <Users className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <CardTitle className="text-white text-lg">{space.name}</CardTitle>
                                  <p className="text-sm text-purple-400">Your Space</p>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-gray-300 text-sm">{space.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-gray-400">
                                <Users className="w-3 h-3" />
                                {space.current_participants?.length || 0}/{space.max_participants}
                              </div>
                              <div className="flex items-center gap-1 text-gray-400">
                                <Eye className="w-3 h-3" />
                                {space.total_visits || 0} visits
                              </div>
                            </div>
                            <Button
                        onClick={() => handleJoinSpace(space)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">

                              <MapPin className="w-4 h-4 mr-2" />
                              Enter Space
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                ) :

                <div className="col-span-full text-center py-12">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <h3 className="text-lg font-semibold text-white mb-2">No Spaces Created</h3>
                      <p className="text-gray-500 mb-4">Create your first virtual space!</p>
                      <Button
                        disabled
                        className="bg-gray-600/20 text-gray-400 cursor-not-allowed">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Space
                      </Button>
                    </div>
                }
                </div>
              </TabsContent>
            </Tabs>
          </>
        }
      </div>

      {/* Create Space Modal */}
      {showCreateModal &&
      <CreateSpaceModal
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateSpace} />

      }

      {/* Virtual Room */}
      {showVirtualRoom && selectedSpace &&
      <VirtualRoom
        space={selectedSpace}
        currentUser={currentUser}
        onClose={() => {
          setShowVirtualRoom(false);
          setSelectedSpace(null);
          loadData(); // Refresh data when leaving room
        }} />

      }
    </div>);

}
