
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import CreatePost from "./CreatePost";

export default function CreatePostModal({ isOpen, onClose, onSubmit, user, communityId, isCreatorOfCommunity, initialContent, articleTitle }) {
  if (!isOpen) {
    return null;
  }

  const handleInnerSubmit = async (postData) => {
    try {
      await onSubmit(postData);
      onClose(); // Close modal on successful submission
    } catch (error) {
      // The error is already handled and displayed within the CreatePost component
      // or the Feed page's global error handler. We keep the modal open
      // so the user doesn't lose their draft and can retry.
      console.error("Submission failed, keeping modal open:", error);
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
            className="w-full max-w-2xl"
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
