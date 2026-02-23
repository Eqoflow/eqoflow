import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shield, Upload, Link as LinkIcon, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { timestampOnBlockchain } from "@/functions/timestampOnBlockchain";
import { generateContentHash } from "@/functions/generateContentHash";

export default function ContentStampModal({ isOpen, onClose, userColorScheme }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [file, setFile] = useState(null);
  const [isStamping, setIsStamping] = useState(false);
  const [stampResult, setStampResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleStamp = async () => {
    if (!title.trim()) {
      alert("Please provide a title for your content");
      return;
    }

    if (!contentUrl.trim() && !file) {
      alert("Please provide either a content URL or upload a file");
      return;
    }

    setIsStamping(true);
    try {
      let finalContentUrl = contentUrl;

      // Upload file if provided
      if (file) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        finalContentUrl = file_url;
      }

      // Generate content hash
      const { data: hashData } = await generateContentHash({ content_url: finalContentUrl });
      const contentHash = hashData.hash;

      // Timestamp on blockchain
      const { data: txData } = await timestampOnBlockchain({ 
        content_hash: contentHash,
        content_title: title
      });

      setStampResult({
        hash: contentHash,
        txId: txData.tx_id,
        contentUrl: finalContentUrl
      });

      // Reset form
      setTitle("");
      setDescription("");
      setContentUrl("");
      setFile(null);
    } catch (error) {
      console.error("Error stamping content:", error);
      alert("Failed to stamp content. Please try again.");
    } finally {
      setIsStamping(false);
    }
  };

  const handleClose = () => {
    setStampResult(null);
    setTitle("");
    setDescription("");
    setContentUrl("");
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-black/95 border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="w-6 h-6" style={{ color: userColorScheme.primary }} />
            Blockchain Content Protection
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Create an immutable timestamp of your content on the blockchain
          </DialogDescription>
        </DialogHeader>

        {!stampResult ? (
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title" className="text-white mb-2 block">Content Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My awesome image, video, or creation"
                className="bg-white/5 border-white/20 text-white"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-white mb-2 block">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your content..."
                className="bg-white/5 border-white/20 text-white"
              />
            </div>

            <div>
              <Label htmlFor="contentUrl" className="text-white mb-2 block">Content URL</Label>
              <Input
                id="contentUrl"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or Instagram post URL"
                className="bg-white/5 border-white/20 text-white"
              />
            </div>

            <div className="text-center text-white/50">- OR -</div>

            <div>
              <Label htmlFor="file" className="text-white mb-2 block">Upload File (Images, Videos, Documents)</Label>
              <div className="relative">
                <input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                <Button
                  type="button"
                  onClick={() => document.getElementById('file').click()}
                  variant="outline"
                  className="w-full border-white/20 text-black hover:bg-white/10">
                  <Upload className="w-4 h-4 mr-2" />
                  {file ? file.name : "Choose File"}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleStamp}
              disabled={isStamping}
              className="w-full text-lg h-12"
              style={{ background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})` }}>
              {isStamping ? "Stamping..." : "Stamp Content on Blockchain"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Content Successfully Stamped!</h3>
              <p className="text-white/70">Your content is now protected on the blockchain</p>
            </div>

            <div className="bg-white/5 border border-white/20 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-white/60 text-sm mb-1">Content Hash</p>
                <p className="text-white font-mono text-xs break-all">{stampResult.hash}</p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-1">Transaction ID</p>
                <p className="text-white font-mono text-xs break-all">{stampResult.txId}</p>
              </div>
              {stampResult.contentUrl && (
                <div>
                  <p className="text-white/60 text-sm mb-1">Content URL</p>
                  <a
                    href={stampResult.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs break-all flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    {stampResult.contentUrl}
                  </a>
                </div>
              )}
            </div>

            <Button
              onClick={handleClose}
              className="w-full"
              style={{ background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})` }}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}