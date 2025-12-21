
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Video, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadFile } from "@/integrations/Core";
import NFTGateSetup from "../nft/NFTGateSetup";
import { User } from "@/entities/User"; // Import User entity

export default function CreateStreamModal({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    language: "english",
    is_mature: false,
    tags: []
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [nftGateSettings, setNftGateSettings] = useState(null);
  const [showNFTGateSetup, setShowNFTGateSetup] = useState(false); // New state to control NFTGateSetup visibility
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let thumbnailUrl = "";
      if (thumbnailFile) {
        const { file_url } = await UploadFile({ file: thumbnailFile });
        thumbnailUrl = file_url;
      }
      
      const currentUser = await User.me(); // Fetch current user to get Mux stream ID

      if (!currentUser.mux_live_stream_id) {
          alert("Error: Your streaming keys are not set up. Please go to Stream Settings first to generate them.");
          setIsSubmitting(false);
          return;
      }

      const streamData = {
        ...formData,
        thumbnail_url: thumbnailUrl,
        nft_gate_settings: nftGateSettings,
        mux_live_stream_id: currentUser.mux_live_stream_id, // Add Mux live stream ID from current user
        status: "offline" // Set initial status to 'offline'
      };

      await onSubmit(streamData);
    } catch (error) {
      console.error("Error creating stream:", error);
      alert("An error occurred while creating the stream. Please check your stream settings and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagsChange = (value) => {
    const tags = value.split(",").map(tag => tag.trim()).filter(tag => tag);
    setFormData({ ...formData, tags });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="dark-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Video className="w-6 h-6 text-purple-400" />
              Create New Stream
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5 text-gray-400" />
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Stream Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What's your stream about?"
                  className="bg-black/20 border-purple-500/20 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your stream content..."
                  className="bg-black/20 border-purple-500/20 text-white h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Category
                  </label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-500/20">
                      <SelectItem value="gaming" className="text-white">Gaming</SelectItem>
                      <SelectItem value="just_chatting" className="text-white">Just Chatting</SelectItem>
                      <SelectItem value="music" className="text-white">Music</SelectItem>
                      <SelectItem value="art" className="text-white">Art</SelectItem>
                      <SelectItem value="coding" className="text-white">Coding</SelectItem>
                      <SelectItem value="fitness" className="text-white">Fitness</SelectItem>
                      <SelectItem value="cooking" className="text-white">Cooking</SelectItem>
                      <SelectItem value="education" className="text-white">Education</SelectItem>
                      <SelectItem value="irl" className="text-white">IRL</SelectItem>
                      <SelectItem value="other" className="text-white">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Language
                  </label>
                  <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                    <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-500/20">
                      <SelectItem value="english" className="text-white">English</SelectItem>
                      <SelectItem value="spanish" className="text-white">Spanish</SelectItem>
                      <SelectItem value="french" className="text-white">French</SelectItem>
                      <SelectItem value="german" className="text-white">German</SelectItem>
                      <SelectItem value="other" className="text-white">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Tags (comma separated)
                </label>
                <Input
                  placeholder="gaming, fps, competitive"
                  onChange={(e) => handleTagsChange(e.target.value)}
                  className="bg-black/20 border-purple-500/20 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Thumbnail
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files[0])}
                  className="bg-black/20 border-purple-500/20 text-white file:text-purple-300 file:bg-purple-500/10 file:border-0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  NFT Gating (Optional)
                </label>
                {!nftGateSettings ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNFTGateSetup(true)}
                    className="w-full border-purple-500/30 text-white hover:bg-purple-500/10 flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Add NFT Gate to your stream
                  </Button>
                ) : (
                  <div className="p-3 bg-purple-600/10 border border-purple-500/20 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-400">NFT Gate Active</p>
                      <p className="text-xs text-gray-400 truncate">
                        Collection: {nftGateSettings.collection?.slice(0, 10) || 'N/A'}...
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setNftGateSettings(null)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10 flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.title || !formData.category}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Create Stream
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <AnimatePresence>
          {showNFTGateSetup && (
            <NFTGateSetup
              onSetup={(settings) => {
                setNftGateSettings(settings);
                setShowNFTGateSetup(false);
              }}
              onCancel={() => setShowNFTGateSetup(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
