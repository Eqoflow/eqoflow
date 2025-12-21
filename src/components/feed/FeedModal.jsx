import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostCard from "./PostCard";
import { base44 } from "@/api/base44Client";

export default function FeedModal({ posts, initialPostId, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.warn("Could not load user:", error);
        setUser(null);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const index = posts.findIndex(p => p.id === initialPostId);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [initialPostId, posts]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : posts.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < posts.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentPost = posts[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <Button
          onClick={onClose}
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Navigation */}
        {posts.length > 1 && (
          <>
            <Button
              onClick={handlePrevious}
              size="icon"
              variant="ghost"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              onClick={handleNext}
              size="icon"
              variant="ghost"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}

        {/* Post Content */}
        <AnimatePresence mode="wait">
          {currentPost && (
            <motion.div
              key={currentPost.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <PostCard
                post={currentPost}
                currentUser={user}
                onUserUpdate={() => {}}
                author={currentPost.author}
                index={0}
                showCommunityContext={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Counter */}
        {posts.length > 1 && (
          <div className="text-center mt-4 text-white/50 text-sm">
            {currentIndex + 1} / {posts.length}
          </div>
        )}
      </div>
    </motion.div>
  );
}