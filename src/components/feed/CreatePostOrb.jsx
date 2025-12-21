import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import { base44 } from "@/api/base44Client";

export default function CreatePostOrb() {
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 800));
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.warn("Could not load user:", error);
        setUser(null);
      }
    };
    loadUser();
  }, []);

  if (!user) return null;

  return (
    <>
      <motion.button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-2xl hover:shadow-purple-500/50 transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus className="w-8 h-8 text-white" />
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <CreatePostModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={async (postData) => {
              await base44.entities.Post.create(postData);
              setShowModal(false);
              window.location.reload();
            }}
            user={user}
          />
        )}
      </AnimatePresence>
    </>
  );
}