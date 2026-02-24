import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Plus, Upload, Sparkles } from "lucide-react";

export default function EditCreatorProfileModal({ isOpen, onClose, creatorProfile, userColorScheme, onUpdate }) {
  const [formData, setFormData] = useState({
    channel_name: "",
    description: "",
    logo_url: "",
    social_links: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (creatorProfile) {
      setFormData({
        channel_name: creatorProfile.channel_name || "",
        description: creatorProfile.description || "",
        logo_url: creatorProfile.logo_url || "",
        social_links: creatorProfile.social_links || []
      });
    }
  }, [creatorProfile]);

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, logo_url: file_url }));
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Failed to upload logo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const addSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      social_links: [...prev.social_links, { platform: "", url: "" }]
    }));
  };

  const updateSocialLink = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      social_links: prev.social_links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const removeSocialLink = (index) => {
    setFormData(prev => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!creatorProfile || !formData.channel_name.trim()) {
      alert("Channel name is required");
      return;
    }

    setIsSaving(true);
    try {
      // Filter out empty social links
      const validSocialLinks = formData.social_links.filter(
        link => link.platform && link.url
      );

      await base44.entities.CreatorProfile.update(creatorProfile.id, {
        channel_name: formData.channel_name.trim(),
        description: formData.description.trim(),
        logo_url: formData.logo_url,
        social_links: validSocialLinks
      });

      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating creator profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6" style={{ color: userColorScheme.primary }} />
            Edit Creator Profile
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Update your public creator profile information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Logo Upload */}
          <div>
            <Label className="text-white mb-2 block">Channel Logo</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/10 rounded-xl p-2 border-2 border-white/20 flex items-center justify-center">
                {formData.logo_url ? (
                  <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Sparkles className="w-8 h-8 text-white/40" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  disabled={isUploading}
                />
                <label htmlFor="logo-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    disabled={isUploading}
                    onClick={() => document.getElementById('logo-upload').click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? "Uploading..." : "Upload Logo"}
                  </Button>
                </label>
              </div>
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <Label className="text-white mb-2 block">Channel Name *</Label>
            <Input
              value={formData.channel_name}
              onChange={(e) => setFormData(prev => ({ ...prev, channel_name: e.target.value }))}
              placeholder="Enter your channel name"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-white mb-2 block">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tell viewers about your channel"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[100px]"
            />
          </div>

          {/* Social Links */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">Social Links</Label>
              <Button
                type="button"
                size="sm"
                onClick={addSocialLink}
                className="bg-white/10 text-white hover:bg-white/20">
                <Plus className="w-4 h-4 mr-1" />
                Add Link
              </Button>
            </div>

            <div className="space-y-3">
              {formData.social_links.map((link, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <select
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                      className="bg-white/10 border border-white/20 text-white rounded-md px-3 py-2">
                      <option value="">Select Platform</option>
                      <option value="youtube">YouTube</option>
                      <option value="x">X (Twitter)</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="facebook">Facebook</option>
                      <option value="website">Website</option>
                      <option value="other">Other</option>
                    </select>
                    <Input
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeSocialLink(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-white/20 text-white hover:bg-white/10"
              disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.channel_name.trim()}
              style={{
                background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`
              }}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}