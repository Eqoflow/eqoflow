import React, { useState } from "react";
import { motion } from "framer-motion";
import EqoAssistantModal from "./EqoAssistantModal";

export default function EqoAssistant({ userColorScheme }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Mascot Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-40 md:bottom-24 right-4 md:right-6 z-40 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center transition-all duration-300"
        aria-label="Open EqoFlow AI Assistant">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/7f44056eb_generated-image-removebg.png"
          alt="EqoFlow Assistant"
          className="w-full h-full object-contain hover:scale-110 transition-transform"
        />
      </motion.button>

      {/* Chat Modal */}
      <EqoAssistantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userColorScheme={userColorScheme}
      />
    </>
  );
}