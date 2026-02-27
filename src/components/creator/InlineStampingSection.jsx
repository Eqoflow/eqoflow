import React, { useState } from "react";
import { Upload, Loader2, Film } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import PlatformSelector from "./PlatformSelector";
import { useBlockchainTimestamp } from "@/components/blockchain/useBlockchainTimestamp";

const MAX_FILE_SIZE_MB = 5120; // 5GB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function InlineStampingSection({ user, userColorScheme, onComplete }) {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isStamping, setIsStamping] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [fileSizeError, setFileSizeError] = useState(null);
  const { timestampContent } = useBlockchainTimestamp();

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFileSizeError(`File is too large (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`);
      setFile(null);
      setFilePreview(null);
      event.target.value = "";
      return;
    }

    setFileSizeError(null);
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleStamp = async () => {
    if (!file) {
      alert("Please select a file to stamp");
      return;
    }

    setIsStamping(true);

    try {
      // Upload file to S3 (supports large files)
      const uploadResponse = await uploadToS3({ file }, { rawFormData: true });
      const { file_url } = uploadResponse.data;

      // Generate content hash
      const hashResponse = await base44.functions.invoke('generateContentHash', {
        content_url: file_url
      });

      if (!hashResponse.data || !hashResponse.data.hash) {
        throw new Error("Failed to generate content hash");
      }

      const contentHash = hashResponse.data.hash;

      // Create stamped content record
      const stampedContent = await base44.entities.Post.create({
        author_full_name: user.full_name,
        content: description || `Stamped content - ${new Date().toLocaleDateString()}`,
        gated_content_title: title || file.name,
        media_urls: [file_url],
        privacy_level: "private",
        content_hash: contentHash,
        category: "entertainment"
      });

      // Timestamp on blockchain with postId
      const result = await timestampContent(contentHash, stampedContent.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to timestamp on blockchain');
      }

      alert(`Content stamped successfully! Transaction ID: ${result.blockchain_tx_id}`);
      
      // Reset form
      setFile(null);
      setFilePreview(null);
      setTitle("");
      setDescription("");
      setSelectedPlatforms([]);
      
      if (onComplete) {
        await onComplete();
      }
    } catch (error) {
      console.error("Error stamping content:", error);
      alert("Failed to stamp content. Please try again.");
    } finally {
      setIsStamping(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
      
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Stamp new content</h2>
        <p className="text-white/60">Protect and sync to your channels in one flow</p>
      </div>

      <div className="bg-black/40 rounded-2xl p-6 border border-white/5 mb-6">
        {!filePreview ? (
          <label className="flex flex-col items-center justify-center h-48 cursor-pointer group">
            <input
              type="file"
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-white/10 transition-all">
                <Upload className="w-6 h-6 text-white/60" />
              </div>
              <p className="text-white/60 text-sm">Click to upload content</p>
              <p className="text-white/40 text-xs mt-1">Supports images and videos (max 5GB)</p>
            </div>
          </label>
        ) : (
          <div className="relative group">
            {file?.type.startsWith('video/') ? (
              <video
                src={filePreview}
                className="w-full h-48 object-cover rounded-lg"
                controls
              />
            ) : (
              <img
                src={filePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <button
              onClick={() => {
                setFile(null);
                setFilePreview(null);
              }}
              className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all">
              <Film className="w-4 h-4" />
            </button>
          </div>
        )}
        {fileSizeError && (
          <p className="text-red-400 text-sm mt-3 text-center">{fileSizeError}</p>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-white/60 text-sm mb-2 block">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter content title"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/20"
          />
        </div>
        <div>
          <label className="text-white/60 text-sm mb-2 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter content description"
            rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/20 resize-none"
          />
        </div>
      </div>

      <div className="mb-6">
        <p className="text-white/60 text-sm mb-3">Select platforms to sync</p>
        <PlatformSelector
          selected={selectedPlatforms}
          onChange={setSelectedPlatforms}
          userColorScheme={userColorScheme}
        />
      </div>

      <Button
        onClick={handleStamp}
        disabled={!file || isStamping}
        className="w-full py-6 text-lg font-semibold"
        style={{
          background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`
        }}>
        {isStamping ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Stamping...
          </>
        ) : (
          'Stamp & Generate Proof'
        )}
      </Button>
    </motion.div>
  );
}