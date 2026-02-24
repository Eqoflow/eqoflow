import React, { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const platforms = [
  { id: 'youtube', name: 'YouTube', color: '#FF0000' },
  { id: 'tiktok', name: 'TikTok', color: '#000000' },
  { id: 'instagram', name: 'Instagram', color: '#E4405F' },
];

export default function PlatformSelector({ selected, onChange, userColorScheme }) {
  const handleToggle = (platformId) => {
    if (selected.includes(platformId)) {
      onChange(selected.filter(id => id !== platformId));
    } else {
      onChange([...selected, platformId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {platforms.map((platform) => {
        const isSelected = selected.includes(platform.id);
        return (
          <motion.button
            key={platform.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleToggle(platform.id)}
            className={`
              relative px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${isSelected 
                ? 'text-white' 
                : 'bg-white/5 border border-white/20 text-white/60 hover:bg-white/10 hover:text-white'
              }
            `}
            style={isSelected ? {
              background: platform.id === 'instagram' 
                ? `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`
                : platform.color === '#000000'
                ? 'linear-gradient(135deg, #111111, #333333)'
                : platform.color
            } : {}}>
            <span className="flex items-center gap-2">
              {platform.name}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}>
                    <X className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}