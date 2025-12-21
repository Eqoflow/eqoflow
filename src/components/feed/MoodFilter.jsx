import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const moods = [
  { id: "all", label: "All Vibes", color: "from-white to-gray-300" },
  { id: "inspiring", label: "Inspiring", color: "from-yellow-400 to-orange-500" },
  { id: "curious", label: "Curious", color: "from-purple-400 to-pink-500" },
  { id: "chill", label: "Chill", color: "from-teal-400 to-cyan-500" },
  { id: "focused", label: "Focused", color: "from-blue-400 to-indigo-500" }
];

export default function MoodFilter({ selected, onSelect }) {
  return (
    <div className="flex items-center gap-2">
      <Sparkles className="w-5 h-5 text-white/50" />
      <div className="flex gap-2">
        {moods.map((mood) => (
          <motion.button
            key={mood.id}
            onClick={() => onSelect(mood.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selected === mood.id
                ? 'bg-white/20 backdrop-blur-xl border border-white/30 text-white'
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={selected === mood.id ? `bg-gradient-to-r ${mood.color} bg-clip-text text-transparent font-bold` : ''}>
              {mood.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}