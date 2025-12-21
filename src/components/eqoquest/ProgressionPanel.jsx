import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star } from "lucide-react";
import AllBadgesModal from "./AllBadgesModal";

import { Zap as LucideZap, Gem as LucideGem, Flame as LucideFlame, Crown as LucideCrown, Trophy as LucideTrophy } from "lucide-react";

const LEVEL_THRESHOLDS = [
  { level: 0, ep: 0, title: null },
  { level: 1, ep: 1000, title: "Breather" },
  { level: 2, ep: 2000, title: "Whisperer" },
  { level: 3, ep: 3000, title: "Rippler" },
  { level: 4, ep: 5000, title: "Tuner" },
  { level: 5, ep: 8000, title: "Channeler" },
  { level: 6, ep: 13000, title: "Attenuator" },
  { level: 7, ep: 21000, title: "Reflector" },
  { level: 8, ep: 34000, title: "Equalizer" },
  { level: 9, ep: 55000, title: "Harmonizer" },
  { level: 10, ep: 89000, title: "Signaler" },
  { level: 11, ep: 144000, title: "Oscillator" },
  { level: 12, ep: 233000, title: "Resonator" },
  { level: 13, ep: 377000, title: "Vocalizer" },
  { level: 14, ep: 610000, title: "Modulator" },
  { level: 15, ep: 987000, title: "Synthesizer" },
  { level: 16, ep: 1597000, title: "Phaser" },
  { level: 17, ep: 2584000, title: "Beaconer" },
  { level: 18, ep: 4181000, title: "Projector" },
  { level: 19, ep: 6765000, title: "Emitter" },
  { level: 20, ep: 10946000, title: "Transmitter" },
  { level: 21, ep: 17711000, title: "Broadcaster" },
  { level: 22, ep: 28657000, title: "Pulsar" },
  { level: 23, ep: 46368000, title: "Reverberator" },
  { level: 24, ep: 75025000, title: "Expander" },
  { level: 25, ep: 121393000, title: "Generator" },
  { level: 26, ep: 196418000, title: "Conductor" },
  { level: 27, ep: 317811000, title: "Orchestrator" },
  { level: 28, ep: 514229000, title: "Radiator" },
  { level: 29, ep: 832040000, title: "Thunderer" },
  { level: 30, ep: 1346269000, title: "Blaster" },
];

export default function ProgressionPanel({ progression, badges, allBadges, onViewBadges }) {
  const [showAllBadges, setShowAllBadges] = useState(false);
  const currentLevel = progression?.level || 0;
  const epTotal = progression?.ep_total || 0;
  
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel) || LEVEL_THRESHOLDS[0];
  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
  
  const epForCurrentLevel = currentThreshold.ep;
  const epForNextLevel = nextThreshold?.ep || currentThreshold.ep;
  const epIntoLevel = epTotal - epForCurrentLevel;
  const epNeeded = epForNextLevel - epForCurrentLevel;
  const progressPercent = epNeeded > 0 ? Math.min((epIntoLevel / epNeeded) * 100, 100) : 100;

  // Use LEVEL_THRESHOLDS as the source of truth for titles
  const allLevelTitles = LEVEL_THRESHOLDS.filter(t => t.title !== null);

  const getBadgeIcon = (level) => {
    // Assign icons based on level ranges
    if (level <= 4) return <Star className="w-8 h-8" />;
    if (level <= 9) return <LucideFlame className="w-8 h-8" />;
    if (level <= 14) return <LucideGem className="w-8 h-8" />;
    if (level <= 19) return <LucideZap className="w-8 h-8" />;
    if (level <= 24) return <LucideCrown className="w-8 h-8" />;
    return <LucideTrophy className="w-8 h-8" />;
  };

  return (
    <div className="space-y-6">
      {/* Level Progress Card */}
      <Card className="bg-white dark:bg-gray-800 border-2" style={{ borderColor: 'var(--color-primary)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
            Lifetime Progression
          </CardTitle>
          <CardDescription>
            Level up by earning Engagement Points across all seasons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Circle */}
            <div className="flex items-center justify-center">
              <div className="relative w-36 h-36">
                <svg className="w-36 h-36 transform -rotate-90" style={{ overflow: 'visible' }}>
                  <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <circle cx="72" cy="72" r="64" stroke="currentColor" className="text-gray-300 dark:text-gray-700" strokeWidth="8" fill="none" />
                  <circle 
                    cx="72" 
                    cy="72" 
                    r="64" 
                    stroke="var(--color-primary)" 
                    strokeWidth="8" 
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(progressPercent / 100) * (2 * Math.PI * 64)} ${2 * Math.PI * 64}`}
                    filter="url(#glow)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Next Level</p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>{Math.round(progressPercent)}%</p>
                </div>
              </div>
            </div>

            {/* EP Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{epTotal.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total EP</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{Math.max(0, epIntoLevel).toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">In Level</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{Math.max(0, epNeeded - epIntoLevel).toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">To Next</p>
              </div>
            </div>


          </div>
        </CardContent>
      </Card>

      {/* Titles Section */}
      <Card className="bg-white dark:bg-gray-800 border-2" style={{ borderColor: 'var(--color-primary)' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              Titles Earned
            </CardTitle>
            <Badge>{currentLevel} / {allLevelTitles.length}</Badge>
          </div>
          <CardDescription>Each level unlocks a unique title</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {allLevelTitles.slice(0, 10).map((threshold) => {
              const isEarned = currentLevel >= threshold.level;
              return (
                <div 
                  key={threshold.level}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all cursor-pointer ${
                    isEarned 
                      ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:shadow-md hover:scale-105' 
                      : 'bg-gray-100 dark:bg-gray-800/50 opacity-50 hover:opacity-70'
                  }`}
                  title={`Level ${threshold.level}: ${threshold.title} (${threshold.ep.toLocaleString()} EP)`}
                  style={isEarned ? { borderColor: 'var(--color-primary)', borderWidth: '2px' } : {}}
                >
                  <div style={isEarned ? { color: 'var(--color-primary)' } : { color: '#9CA3AF' }}>
                    {getBadgeIcon(threshold.level)}
                  </div>
                  <p className="text-xs font-medium text-center">{threshold.title}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Level {threshold.level}</p>
                  {!isEarned && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Locked</p>
                  )}
                </div>
              );
            })}
          </div>
          {allLevelTitles.length > 10 && (
            <button 
              onClick={() => setShowAllBadges(true)}
              className="w-full mt-4 text-sm font-medium hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              View All {allLevelTitles.length} Titles →
            </button>
          )}
        </CardContent>
      </Card>

      {/* All Badges Modal */}
      <AllBadgesModal 
        isOpen={showAllBadges} 
        onClose={() => setShowAllBadges(false)} 
        currentLevel={currentLevel}
      />

      {/* Info Note */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> Lifetime EP affects your level and badges. Seasonal Points decide the monthly leaderboard rankings.
          </p>
        </CardContent>
      </Card>
      </div>
      );
      }