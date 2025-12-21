
import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Save, Image, FileText, Loader2, Shield } from "lucide-react"; // Added Shield
import { motion, AnimatePresence } from "framer-motion";
import { UploadFile } from "@/integrations/Core";

const CATEGORIES = [
  "design", "development", "writing", "marketing", "consulting",
  "education", "art", "music", "fitness", "cooking", "other"
];

export default function CreateSkillForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    skill_type: "offering",
    price_type: "free", // Changed initial value from "tokens" to "free"
    price_amount: 0,
    duration_hours: 1,
    is_remote: true,
    tags: [],
    media_urls: []
  });
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category) return;

    setIsSubmitting(true);
    try {
      const skillData = {
        ...formData,
        media_urls: mediaFiles.map(f => f.url)
      };
      await onSubmit(skillData);
    } catch (error) {
      console.error("Error creating skill:", error);
    }
    setIsSubmitting(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      let fileType = 'file';
      if (file.type.startsWith('image/')) fileType = 'image';
      if (file.type.startsWith('video/')) fileType = 'video';

      setMediaFiles([...mediaFiles, { url: file_url, type: fileType, name: file.name }]);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const removeMediaFile = (indexToRemove) => {
    setMediaFiles(mediaFiles.filter((_, index) => index !== indexToRemove));
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, trimmedTag]
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const renderMedia = (file) => {
    if (file.type === 'image') {
      return <img src={file.url} alt="skill showcase" className="w-full h-full object-cover" />;
    }
    if (file.type === 'video') {
      return <video src={file.url} className="w-full h-full object-cover" controls />;
    }
    return (
      <div className="p-2 flex flex-col items-center justify-center h-full bg-gray-700">
        <FileText className="w-8 h-8 text-purple-400 mb-2" />
        <p className="text-xs text-center text-gray-300 truncate w-full font-medium">{file.name}</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="glass-morphism border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Post a New Skill</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., React Development, Logo Design"
                    className="bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-gray-300">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category} className="text-gray-300 capitalize hover:bg-white/10">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what you're offering or looking for..."
                  className="bg-white/5 border-white/10 text-white min-h-[100px]"
                  required
                />
              </div>

              {/* Media Upload Section */}
              <div className="space-y-2">
                <Label className="text-gray-300">Showcase Media (Optional)</Label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current.click()}
                    disabled={isUploading}
                    className="border-white/20 text-black bg-white hover:bg-gray-100 transition-transform duration-200 ease-in-out hover:scale-105"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-black" />
                    ) : (
                      <Image className="w-4 h-4 mr-2 text-black" />
                    )}
                    <span className="text-black">Add Images/Videos</span>
                  </Button>
                  <p className="text-xs text-gray-400">Show your work or explain your service</p>
                </div>

                <AnimatePresence>
                  {mediaFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid gap-3 grid-cols-2 md:grid-cols-3"
                    >
                      {mediaFiles.map((file, index) => (
                        <div key={index} className="relative group aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
                          {renderMedia(file)}
                          <button
                            type="button"
                            onClick={() => removeMediaFile(index)}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Type</Label>
                  <Select
                    value={formData.skill_type}
                    onValueChange={(value) => setFormData({ ...formData, skill_type: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      <SelectItem value="offering" className="text-gray-300 hover:bg-white/10">Offering</SelectItem>
                      <SelectItem value="seeking" className="text-gray-300 hover:bg-white/10">Seeking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Payment</Label>
                  <Select
                    value={formData.price_type}
                    onValueChange={(value) => {
                      if (value === "tokens") {
                        // Show coming soon message for EQOFLO tokens
                        alert("$EQOFLO token payments are coming soon! Our token will launch with full escrow protection once it's trading on exchanges. For now, you can use Traditional Currency for secure payments.");
                        return; // Don't change the selection
                      }
                      setFormData({ ...formData, price_type: value });
                    }}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                      <SelectItem value="free" className="text-gray-300 hover:bg-white/10">Free</SelectItem>
                      <SelectItem value="tokens" className="text-gray-300 hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          <span>$EQOFLO Tokens</span>
                          <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30 text-xs">
                            Coming Soon
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="fiat" className="text-gray-300 hover:bg-white/10">Traditional Currency</SelectItem> {/* Changed from Crypto to Fiat */}
                    </SelectContent>
                  </Select>
                </div>

                {formData.price_type !== "free" && formData.price_type !== "tokens" && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">
                      Price Amount (USD)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price_amount}
                      onChange={(e) => setFormData({ ...formData, price_amount: parseFloat(e.target.value) })}
                      className="bg-white/5 border-white/10 text-gray-300"
                    />
                  </div>
                )}
              </div>

              {/* Escrow Notice */}
              {formData.price_type !== "free" && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-300 mb-1">Secure Escrow System</h4>
                      {formData.price_type === "fiat" ? (
                        <p className="text-sm text-blue-200">
                          All payments are held in secure escrow until the service is delivered and approved by the client.
                          This protects both parties and ensures fair transactions.
                        </p>
                      ) : (
                        <p className="text-sm text-blue-200">
                          $EQOFLO token payments will be held in blockchain-based smart contract escrow for maximum security and transparency.
                          Coming soon with our token launch!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-gray-300">Duration (hours)</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add tags (press Enter)"
                    className="bg-white/5 border-white/10 text-gray-300 flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-black bg-white hover:bg-gray-100 transition-transform duration-200 ease-in-out hover:scale-105"
                  >
                    <span className="text-black">Add</span>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      className="bg-purple-500/20 text-purple-300 border-purple-500/30"
                    >
                      {tag}
                      <X
                        className="w-3 h-3 ml-1 cursor-pointer hover:text-red-400"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-white/20 text-black bg-white hover:bg-gray-100 transition-transform duration-200 ease-in-out hover:scale-105"
                >
                  <span className="text-black">Cancel</span>
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.title || !formData.description || !formData.category || isUploading}
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 neon-glow transition-transform duration-200 ease-in-out hover:scale-105"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      <span className="text-white">Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2 text-white" />
                      <span className="text-white">Post Skill</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
