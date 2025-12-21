import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Share2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RepostModal({ post, onRepost, onClose }) {
  const [comment, setComment] = useState("");

  const handleRepost = (withComment) => {
    if (withComment) {
      onRepost(post, comment);
    } else {
      onRepost(post, "");
    }
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
          className="w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Repost Echo</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Original Post Preview */}
              <div className="p-4 bg-black/30 border border-purple-500/20 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Original echo by {post.author_full_name || post.created_by}</p>
                <p className="text-white text-sm line-clamp-3">{post.content}</p>
              </div>

              {/* Comment Input */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Add your thoughts (optional)</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[100px] bg-black/20 border-purple-500/20 text-white"
                  placeholder="Share why you're reposting this..."
                />
                {comment.trim().length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-green-400 bg-green-600/10 border border-green-500/20 rounded-lg p-2">
                    <Zap className="w-4 h-4" />
                    <span>Reposting with a comment earns you 14 EP instead of 5 EP!</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose} className="border-purple-500/30 text-white hover:bg-purple-500/10">
                  Cancel
                </Button>
                <Button
                  onClick={() => handleRepost(comment.trim().length > 0)}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Repost {comment.trim().length > 0 && `(+14 EP)`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}