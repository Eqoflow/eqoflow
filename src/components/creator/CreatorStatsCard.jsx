import React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

export default function CreatorStatsCard({ icon: Icon, title, subtitle, userColorScheme, delay = 0, isWalletConnected }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${userColorScheme.primary}40, ${userColorScheme.secondary}40)`
          }}>
          <Icon className="w-5 h-5" style={{ color: userColorScheme.primary }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <p className="text-white/60 text-xs truncate">{subtitle}</p>
        </div>
        {isWalletConnected !== undefined && (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
            isWalletConnected ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            {isWalletConnected ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <X className="w-4 h-4 text-red-400" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}