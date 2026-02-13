import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X, Youtube, Twitter, Instagram, Globe, Video, Eye } from "lucide-react";
import { base44 } from "@/api/base44Client";

const platformIcons = {
  youtube: Youtube,
  x: Twitter,
  instagram: Instagram,
  tiktok: Video,
  facebook: Globe,
  website: Globe,
  other: Globe
};

export default function CreatorOnboarding({ onComplete, userColorScheme }) {
  const [step, setStep] = useState("choice"); // "choice", "creator", "viewer"
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [socialLinks, setSocialLinks] = useState([]);
  const [newLinkPlatform, setNewLinkPlatform] = useState("youtube");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChoice = (isCreator) => {
    if (isCreator) {
      setStep("creator");
    } else {
      setStep("viewer");
      handleViewerSubmit();
    }
  };

  const handleViewerSubmit = async () => {
    setIsSubmitting(true);
    try {
      await base44.entities.CreatorProfile.create({
        channel_name: "Viewer",
        is_creator: false,
        description: "",
        social_links: []
      });
      onComplete(false);
    } catch (error) {
      console.error("Error creating viewer profile:", error);
      setIsSubmitting(false);
    }
  };

  const addSocialLink = () => {
    if (newLinkUrl.trim()) {
      setSocialLinks([...socialLinks, { platform: newLinkPlatform, url: newLinkUrl.trim() }]);
      setNewLinkUrl("");
      setNewLinkPlatform("youtube");
    }
  };

  const removeSocialLink = (index) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleCreatorSubmit = async () => {
    if (!channelName.trim()) return;

    setIsSubmitting(true);
    try {
      await base44.entities.CreatorProfile.create({
        channel_name: channelName.trim(),
        description: description.trim(),
        social_links: socialLinks,
        is_creator: true
      });
      onComplete(true);
    } catch (error) {
      console.error("Error creating creator profile:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: `linear-gradient(135deg, ${userColorScheme.accent}E6, ${userColorScheme.primary}40, #000000)`
    }}>
      <AnimatePresence mode="wait">
        {step === "choice" && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-2xl">
            
            <div className="text-center mb-12">
              <motion.img
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/d31ff4d3d_1000044465.png"
                alt="EqoFlow"
                className="h-24 mx-auto mb-6"
              />
              <motion.h1
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold text-white mb-4">
                Welcome to Creator Hub
              </motion.h1>
              <motion.p
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-white/70">
                How would you like to experience EqoFlow?
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.button
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleChoice(true)}
                className="group relative overflow-hidden rounded-2xl p-8 text-left will-change-transform"
                style={{ transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                style={{
                  background: `linear-gradient(135deg, ${userColorScheme.primary}40, ${userColorScheme.secondary}40)`,
                  border: `2px solid ${userColorScheme.primary}60`
                }}>
                
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <Video className="w-16 h-16 mb-4 text-white" />
                <h2 className="text-2xl font-bold text-white mb-2">I'm a Creator</h2>
                <p className="text-white/70">
                  Stamp your content, build your audience, and protect your work with blockchain technology.
                </p>
              </motion.button>

              <motion.button
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleChoice(false)}
                className="group relative overflow-hidden rounded-2xl p-8 text-left will-change-transform"
                style={{ transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                style={{
                  background: `linear-gradient(135deg, ${userColorScheme.primary}40, ${userColorScheme.secondary}40)`,
                  border: `2px solid ${userColorScheme.primary}60`
                }}>
                
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <Eye className="w-16 h-16 mb-4 text-white" />
                <h2 className="text-2xl font-bold text-white mb-2">I'm a Viewer</h2>
                <p className="text-white/70">
                  Discover amazing content, support creators, and explore the EqoFlow community.
                </p>
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === "creator" && (
          <motion.div
            key="creator"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-2xl rounded-2xl p-8"
            style={{
              background: `linear-gradient(135deg, ${userColorScheme.accent}CC, ${userColorScheme.primary}60)`,
              border: `2px solid ${userColorScheme.primary}80`
            }}>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Creator Profile Setup</h2>
              <p className="text-white/70">Tell us about your channel</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="channelName" className="text-white text-lg mb-2 block">
                  Channel Name *
                </Label>
                <Input
                  id="channelName"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Your awesome channel name"
                  className="bg-black/30 border-white/20 text-white placeholder:text-white/40 text-lg h-12"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-white text-lg mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers what your channel is about..."
                  className="bg-black/30 border-white/20 text-white placeholder:text-white/40 min-h-[120px]"
                />
              </div>

              <div>
                <Label className="text-white text-lg mb-3 block">Social Media Links</Label>
                
                <div className="flex gap-2 mb-3">
                  <select
                    value={newLinkPlatform}
                    onChange={(e) => setNewLinkPlatform(e.target.value)}
                    className="bg-black/30 border border-white/20 text-white rounded-md px-3 py-2">
                    <option value="youtube">YouTube</option>
                    <option value="x">X (Twitter)</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                    <option value="website">Website</option>
                    <option value="other">Other</option>
                  </select>
                  <Input
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-black/30 border-white/20 text-white placeholder:text-white/40"
                  />
                  <Button
                    onClick={addSocialLink}
                    disabled={!newLinkUrl.trim()}
                    style={{ background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})` }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {socialLinks.map((link, index) => {
                    const Icon = platformIcons[link.platform];
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 bg-black/30 rounded-lg p-3 border border-white/10">
                        <Icon className="w-5 h-5 text-white" />
                        <span className="flex-1 text-white text-sm truncate">{link.url}</span>
                        <button
                          onClick={() => removeSocialLink(index)}
                          className="text-red-400 hover:text-red-300">
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setStep("choice")}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  disabled={isSubmitting}>
                  Back
                </Button>
                <Button
                  onClick={handleCreatorSubmit}
                  disabled={!channelName.trim() || isSubmitting}
                  className="flex-1 text-lg h-12"
                  style={{ background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})` }}>
                  {isSubmitting ? "Creating..." : "Complete Setup"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}