import React from "react";
import { motion } from "framer-motion";

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
          <div className="relative flex items-center justify-center flex-shrink-0">
            <div 
              className={`w-3 h-3 rounded-full ${
                isWalletConnected ? 'bg-green-400' : 'bg-red-400'
              }`}
              style={{
                boxShadow: isWalletConnected 
                  ? '0 0 10px rgba(74, 222, 128, 0.6), 0 0 20px rgba(74, 222, 128, 0.4)' 
                  : '0 0 10px rgba(248, 113, 113, 0.6), 0 0 20px rgba(248, 113, 113, 0.4)'
              }}
            />
            <div 
              className={`absolute w-3 h-3 rounded-full animate-ping ${
                isWalletConnected ? 'bg-green-400' : 'bg-red-400'
              }`}
              style={{ opacity: 0.4 }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}