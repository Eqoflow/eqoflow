import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, BookMarked, FileKey, Shield, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Community } from '@/entities/Community';
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";

export default function EditPostModal({ post, user, onSave, onClose }) {
  const [content, setContent] = useState("");
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [userCommunities, setUserCommunities] = useState([]);
  const [postToX, setPostToX] = useState(false);
  
  // Content License state
  const [selectedLicenseId, setSelectedLicenseId] = useState(null);
  const [availableLicenses, setAvailableLicenses] = useState([]);
  const [enableBlockchainTimestamp, setEnableBlockchainTimestamp] = useState(false);

  const fetchUserCommunities = useCallback(async () => {
    if (user) {
      try {
        const communities = await Community.filter({ created_by: user.email });
        setUserCommunities(communities);
      } catch (error) {
        console.error("Failed to fetch user communities:", error);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchUserCommunities();
    loadLicenses();
  }, [fetchUserCommunities]);

  const loadLicenses = async () => {
    try {
      const licenses = await base44.entities.ContentLicense.filter({ is_active: true }, 'sort_order');
      setAvailableLicenses(licenses);
    } catch (error) {
      console.error("Failed to load licenses:", error);
    }
  };

  useEffect(() => {
    if (post) {
      setContent(post.content);
      setSelectedCommunityId(post.community_id || '');
      setPostToX(post.post_to_x || false);
      setSelectedLicenseId(post.license_id || null);
      setEnableBlockchainTimestamp(false); // Can't re-timestamp existing posts
    }
  }, [post]);

  const handleSave = () => {
    const updatedData = {
      content,
      community_id: selectedCommunityId === '' ? null : selectedCommunityId,
      post_to_x: postToX,
      license_id: selectedLicenseId
    };

    // If tagging a community, always share to main feed
    if (selectedCommunityId && selectedCommunityId !== '') {
      updatedData.share_to_main_feed = true;
    }
    
    onSave(post.id, updatedData);
  };

  if (!post) return null;

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
          className="w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Edit Echo</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] bg-black/20 border-purple-500/20 text-white"
                placeholder="Edit your echo content..."
              />
              
              {/* Community Tagging Section */}
              {userCommunities.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">Tag a Community (Optional)</span>
                  </div>
                  <Select value={selectedCommunityId} onValueChange={setSelectedCommunityId}>
                    <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                      <SelectValue placeholder="Select one of your communities to tag..." />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-500/20">
                      <SelectItem value={null} className="text-white hover:bg-purple-500/10">
                        No community tag
                      </SelectItem>
                      {userCommunities.map((community) => (
                        <SelectItem key={community.id} value={community.id} className="text-white hover:bg-purple-500/10">
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCommunityId && (
                    <div className="text-xs text-purple-400 bg-purple-600/10 border border-purple-500/20 rounded-lg p-2">
                      This post will appear on your community page and drive traffic to "{userCommunities.find(c => c.id === selectedCommunityId)?.name}"
                    </div>
                  )}
                </div>
              )}

              {/* Content License Selection */}
              {availableLicenses.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileKey className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">Content License</span>
                  </div>
                  <Select value={selectedLicenseId} onValueChange={setSelectedLicenseId}>
                    <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                      <SelectValue placeholder="Select a license..." />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-500/20">
                      {availableLicenses.map((license) => (
                        <SelectItem key={license.id} value={license.id} className="text-white hover:bg-purple-500/10">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{license.name}</span>
                            <span className="text-xs text-gray-400">({license.short_code})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedLicenseId && (
                    <div className="text-xs text-gray-400 bg-purple-600/10 border border-purple-500/20 rounded-lg p-2">
                      {availableLicenses.find(l => l.id === selectedLicenseId)?.description}
                    </div>
                  )}
                </div>
              )}

              {/* Blockchain Timestamp Info (if already timestamped) */}
              {post?.blockchain_tx_id && (
                <div className="p-3 bg-green-600/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Blockchain Verified</span>
                    <Check className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    This content has been timestamped on the blockchain.
                  </p>
                </div>
              )}

              {/* X (Twitter) Cross-Posting Toggle */}
              {user?.x_access_token && (
                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <div>
                      <Label htmlFor="edit-post-to-x" className="text-sm font-medium text-white cursor-pointer">
                        Also post to X (Twitter)
                      </Label>
                      <p className="text-xs text-gray-400">Share this post to your connected X account</p>
                    </div>
                  </div>
                  <Switch
                    id="edit-post-to-x"
                    checked={postToX}
                    onCheckedChange={setPostToX}
                  />
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose} className="border-purple-500/30 text-white hover:bg-purple-500/10">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}