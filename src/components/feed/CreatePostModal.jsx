import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import CreatePost from "./CreatePost";

export default function CreatePostModal({ isOpen, onClose, onSubmit, user, communityId, isCreatorOfCommunity, initialContent, articleTitle }) {
  if (!isOpen) {
    return null;
  }

  const handleInnerSubmit = async (postData) => {
    try {
      // Close modal immediately when user clicks broadcast
      onClose();
      const result = await onSubmit(postData);
      return result; // Return enriched post data back to CreatePost
    } catch (error) {
      // The error is already handled and displayed within the CreatePost component
      // or the Feed page's global error handler.
      console.error("Submission failed:", error);
      throw error;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-2xl mb-20 md:mb-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* The CreatePost component is a Card, so it provides its own background and structure */}
            <CreatePost
              onSubmit={handleInnerSubmit}
              user={user}
              communityId={communityId}
              isCreatorOfCommunity={isCreatorOfCommunity}
              initialContent={initialContent}
              articleTitle={articleTitle}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}