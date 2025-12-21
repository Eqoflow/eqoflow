import React from "react";
import { Trophy, Medal, Award, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LeaderboardHeader({ leaderboard, season, timeRemaining, onViewFull }) {
  const topThree = leaderboard.slice(0, 3);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-8 h-8" />;
    if (rank === 2) return <Medal className="w-7 h-7" />;
    if (rank === 3) return <Award className="w-7 h-7" />;
    return null;
  };

  const getRankColors = (rank) => {
    if (rank === 1) return {
      glow: '#00ff88',
      border: '#00ff88',
      text: '#00ff88',
      shadow: '0 0 20px rgba(0, 255, 136, 0.6), 0 0 40px rgba(0, 255, 136, 0.4)'
    };
    if (rank === 2) return {
      glow: '#00d4ff',
      border: '#00d4ff',
      text: '#00d4ff',
      shadow: '0 0 15px rgba(0, 212, 255, 0.5), 0 0 30px rgba(0, 212, 255, 0.3)'
    };
    if (rank === 3) return {
      glow: '#ff00ff',
      border: '#ff00ff',
      text: '#ff00ff',
      shadow: '0 0 15px rgba(255, 0, 255, 0.5), 0 0 30px rgba(255, 0, 255, 0.3)'
    };
  };

  return (
    <div 
      className="bg-black p-8 rounded-2xl mb-6 relative overflow-hidden border-2"
      style={{
        borderColor: 'var(--color-primary)',
        boxShadow: '0 0 30px var(--color-primary), inset 0 0 50px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff88 2px, #00ff88 4px)'
        }} />
      </div>

      {/* Season Info */}
      <div className="text-center text-white mb-8 relative z-10">
        <h2 className="text-4xl font-black mb-2 uppercase tracking-wider" style={{
          textShadow: '0 0 10px #00ff88, 0 0 20px #00ff88',
          color: '#00ff88'
        }}>
          <Zap className="inline w-8 h-8 mr-2" />
          Creator Sprint
          <Zap className="inline w-8 h-8 ml-2" />
        </h2>
        <p className="text-cyan-300 mb-3 text-lg">{season?.theme}</p>
        <Badge 
          className="text-base px-4 py-2 font-bold border-2"
          style={{
            background: 'rgba(0, 255, 136, 0.1)',
            borderColor: '#00ff88',
            color: '#00ff88',
            boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)'
          }}
        >
          ⏱️ {timeRemaining}
        </Badge>
      </div>

      {/* Top 3 List View */}
      <div className="space-y-4 relative z-10 max-w-3xl mx-auto">
        {topThree.map((entry, index) => {
          const rank = index + 1;
          const colors = getRankColors(rank);
          
          return (
            <div
              key={entry.user_id}
              className="relative p-5 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-102"
              style={{
                background: `linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(${rank === 1 ? '0, 255, 136' : rank === 2 ? '0, 212, 255' : '255, 0, 255'}, 0.05))`,
                border: `2px solid ${colors.border}`,
                boxShadow: colors.shadow
              }}
            >
              {/* Rank Badge */}
              <div 
                className="absolute -left-4 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl border-4 border-black"
                style={{
                  background: colors.glow,
                  color: '#000',
                  boxShadow: `0 0 20px ${colors.glow}`
                }}
              >
                {rank}
              </div>

              <div className="flex items-center gap-6 ml-14">
                {/* Icon */}
                <div style={{ color: colors.text }}>
                  {getRankIcon(rank)}
                </div>

                {/* Avatar */}
                <div 
                  className="w-16 h-16 rounded-full overflow-hidden border-4"
                  style={{
                    borderColor: colors.border,
                    boxShadow: `0 0 15px ${colors.glow}`
                  }}
                >
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{entry.display_name?.[0] || '?'}</span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <p className="text-2xl font-black text-white uppercase tracking-wide">
                    {entry.display_name || entry.handle}
                  </p>
                  <p className="text-sm" style={{ color: colors.text }}>@{entry.handle}</p>
                </div>

                {/* SP Score */}
                <div className="text-right">
                  <p 
                    className="text-4xl font-black"
                    style={{ 
                      color: colors.text,
                      textShadow: `0 0 10px ${colors.glow}`
                    }}
                  >
                    {entry.sp_total}
                  </p>
                  <p className="text-sm font-bold" style={{ color: colors.text }}>SP</p>
                </div>
              </div>

              {/* Animated Glow Line */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-1"
                style={{
                  background: `linear-gradient(90deg, transparent, ${colors.glow}, transparent)`,
                  animation: 'glow-slide 2s ease-in-out infinite'
                }}
              />
            </div>
          );
        })}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slide {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        @keyframes glow-slide {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}