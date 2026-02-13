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
        className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-40 w-16 h-16 md:w-20 md:h-20 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 group"
        style={{
          background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`,
          boxShadow: `0 0 30px ${userColorScheme.primary}80, 0 0 60px ${userColorScheme.primary}40`
        }}
        aria-label="Open EqoFlow AI Assistant">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/7f44056eb_generated-image-removebg.png"
          alt="EqoFlow Assistant"
          className="w-12 h-12 md:w-16 md:h-16 object-contain group-hover:scale-110 transition-transform"
        />
        
        {/* Pulse animation ring */}
        <span 
          className="absolute inset-0 rounded-full animate-ping opacity-75"
          style={{ background: userColorScheme.primary }}
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