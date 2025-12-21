import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Users, Volume2, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CreateSpaceModal({ onClose, onSave }) {
  const [spaceData, setSpaceData] = useState({
    name: "",
    description: "",
    space_type: "hangout",
    environment: "space_station",
    max_participants: 10,
    is_public: true,
    password: "",
    tags: [],
    entry_fee: 0,
    space_settings: {
      voice_chat_enabled: true,
      text_chat_enabled: true,
      avatar_interactions: true,
      music_enabled: false,
      background_music_url: ""
    }
  });

  const [tagInput, setTagInput] = useState("");

  const spaceTypes = [
    { id: "hangout", name: "Hangout", desc: "Casual social space" },
    { id: "event", name: "Event", desc: "Organized event or presentation" },
    { id: "meeting", name: "Meeting", desc: "Business or team meeting" },
    { id: "party", name: "Party", desc: "Social party or celebration" },
    { id: "gallery", name: "Gallery", desc: "Art or NFT showcase" },
    { id: "conference", name: "Conference", desc: "Professional conference" },
    { id: "gaming", name: "Gaming", desc: "Gaming session" },
    { id: "other", name: "Other", desc: "Other type of space" }
  ];

  const environments = [
    { id: "space_station", name: "Space Station", color: "from-blue-600 to-purple-600" },
    { id: "forest", name: "Forest", color: "from-green-600 to-emerald-600" },
    { id: "beach", name: "Beach", color: "from-cyan-600 to-blue-600" },
    { id: "city", name: "City", color: "from-gray-600 to-blue-600" },
    { id: "abstract", name: "Abstract", color: "from-purple-600 to-pink-600" },
    { id: "neon_city", name: "Neon City", color: "from-pink-600 to-cyan-600" },
    { id: "underwater", name: "Underwater", color: "from-blue-600 to-teal-600" },
    { id: "mountains", name: "Mountains", color: "from-gray-600 to-green-600" }
  ];

  const handleAddTag = () => {
    if (tagInput.trim() && !spaceData.tags.includes(tagInput.trim())) {
      setSpaceData({
        ...spaceData,
        tags: [...spaceData.tags, tagInput.trim()]
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setSpaceData({
      ...spaceData,
      tags: spaceData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(spaceData);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Create Virtual Space</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400 mb-2 block">Space Name</label>
                    <Input
                      value={spaceData.name}
                      onChange={(e) => setSpaceData({ ...spaceData, name: e.target.value })}
                      className="bg-black/20 border-purple-500/20 text-white"
                      placeholder="Enter space name..."
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400 mb-2 block">Description</label>
                    <Textarea
                      value={spaceData.description}
                      onChange={(e) => setSpaceData({ ...spaceData, description: e.target.value })}
                      className="bg-black/20 border-purple-500/20 text-white"
                      placeholder="Describe your virtual space..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">Space Type</label>
                      <Select value={spaceData.space_type} onValueChange={(value) => setSpaceData({ ...spaceData, space_type: value })}>
                        <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-purple-500/20">
                          {spaceTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id} className="text-white hover:bg-purple-500/10">
                              <div>
                                <div className="font-medium">{type.name}</div>
                                <div className="text-xs text-gray-400">{type.desc}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">Max Participants</label>
                      <Input
                        type="number"
                        value={spaceData.max_participants}
                        onChange={(e) => setSpaceData({ ...spaceData, max_participants: parseInt(e.target.value) })}
                        className="bg-black/20 border-purple-500/20 text-white"
                        min="2"
                        max="50"
                      />
                    </div>
                  </div>
                </div>

                {/* Environment Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-3 block">Environment</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {environments.map((env) => (
                      <button
                        key={env.id}
                        type="button"
                        onClick={() => setSpaceData({ ...spaceData, environment: env.id })}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          spaceData.environment === env.id
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className={`w-full h-12 rounded-lg bg-gradient-to-r ${env.color} mb-2`}></div>
                        <div className="text-xs text-white font-medium">{env.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privacy & Access */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Public Space</p>
                      <p className="text-sm text-gray-400">Anyone can discover and join</p>
                    </div>
                    <Switch
                      checked={spaceData.is_public}
                      onCheckedChange={(checked) => setSpaceData({ ...spaceData, is_public: checked })}
                    />
                  </div>

                  {!spaceData.is_public && (
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">Password</label>
                      <Input
                        type="password"
                        value={spaceData.password}
                        onChange={(e) => setSpaceData({ ...spaceData, password: e.target.value })}
                        className="bg-black/20 border-purple-500/20 text-white"
                        placeholder="Enter password..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-400 mb-2 block">Entry Fee ($QFLOW)</label>
                    <Input
                      type="number"
                      value={spaceData.entry_fee}
                      onChange={(e) => setSpaceData({ ...spaceData, entry_fee: parseInt(e.target.value) || 0 })}
                      className="bg-black/20 border-purple-500/20 text-white"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Space Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium text-white">Space Settings</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-white">Voice Chat</span>
                      </div>
                      <Switch
                        checked={spaceData.space_settings.voice_chat_enabled}
                        onCheckedChange={(checked) => setSpaceData({
                          ...spaceData,
                          space_settings: { ...spaceData.space_settings, voice_chat_enabled: checked }
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-white">Avatar Interactions</span>
                      </div>
                      <Switch
                        checked={spaceData.space_settings.avatar_interactions}
                        onCheckedChange={(checked) => setSpaceData({
                          ...spaceData,
                          space_settings: { ...spaceData.space_settings, avatar_interactions: checked }
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-white">Background Music</span>
                    </div>
                    <Switch
                      checked={spaceData.space_settings.music_enabled}
                      onCheckedChange={(checked) => setSpaceData({
                        ...spaceData,
                        space_settings: { ...spaceData.space_settings, music_enabled: checked }
                      })}
                    />
                  </div>

                  {spaceData.space_settings.music_enabled && (
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">Background Music URL</label>
                      <Input
                        type="url"
                        value={spaceData.space_settings.background_music_url}
                        onChange={(e) => setSpaceData({
                          ...spaceData,
                          space_settings: { ...spaceData.space_settings, background_music_url: e.target.value }
                        })}
                        className="bg-black/20 border-purple-500/20 text-white"
                        placeholder="https://example.com/music.mp3"
                      />
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="bg-black/20 border-purple-500/20 text-white"
                      placeholder="Add tags..."
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline" className="border-purple-500/30">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {spaceData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-purple-500/30 text-purple-400 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        #{tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="border-purple-500/30 text-white">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Create Space
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}