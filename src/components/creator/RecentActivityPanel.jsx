import React from "react";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function RecentActivityPanel({ activities = [] }) {
  const defaultActivities = [
    "Recent Activity & activity your channels",
    "Recent Acitie & activity your channels",
    "Recentt Activit & dativity your chractunels"
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Recent</h3>
        <ChevronRight className="w-4 h-4 text-white/40" />
      </div>

      <div className="space-y-3">
        {displayActivities.slice(0, 3).map((activity, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
            <p className="text-white/60 text-xs leading-relaxed">{activity}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}