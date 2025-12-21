import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star, Flame, Gem, Zap, Crown, Trophy } from "lucide-react";

const LEVEL_THRESHOLDS = [
  { level: 0, ep: 0, badge: null },
  { level: 1, ep: 1000, badge: "Breather" },
  { level: 2, ep: 2000, badge: "Whisperer" },
  { level: 3, ep: 3000, badge: "Rippler" },
  { level: 4, ep: 5000, badge: "Tuner" },
  { level: 5, ep: 8000, badge: "Channeler" },
  { level: 6, ep: 13000, badge: "Attenuator" },
  { level: 7, ep: 21000, badge: "Reflector" },
  { level: 8, ep: 34000, badge: "Equalizer" },
  { level: 9, ep: 55000, badge: "Harmonizer" },
  { level: 10, ep: 89000, badge: "Signaler" },
  { level: 11, ep: 144000, badge: "Oscillator" },
  { level: 12, ep: 233000, badge: "Resonator" },
  { level: 13, ep: 377000, badge: "Vocalizer" },
  { level: 14, ep: 610000, badge: "Modulator" },
  { level: 15, ep: 987000, badge: "Synthesizer" },
  { level: 16, ep: 1597000, badge: "Phaser" },
  { level: 17, ep: 2584000, badge: "Beaconer" },
  { level: 18, ep: 4181000, badge: "Projector" },
  { level: 19, ep: 6765000, badge: "Emitter" },
  { level: 20, ep: 10946000, badge: "Transmitter" },
  { level: 21, ep: 17711000, badge: "Broadcaster" },
  { level: 22, ep: 28657000, badge: "Pulsar" },
  { level: 23, ep: 46368000, badge: "Reverberator" },
  { level: 24, ep: 75025000, badge: "Expander" },
  { level: 25, ep: 121393000, badge: "Generator" },
  { level: 26, ep: 196418000, badge: "Conductor" },
  { level: 27, ep: 317811000, badge: "Orchestrator" },
  { level: 28, ep: 514229000, badge: "Radiator" },
  { level: 29, ep: 832040000, badge: "Thunderer" },
  { level: 30, ep: 1346269000, badge: "Blaster" },
];

export default function AllBadgesModal({ isOpen, onClose, currentLevel }) {
  const allLevelBadges = LEVEL_THRESHOLDS.filter(t => t.badge !== null);

  const getBadgeIcon = (level) => {
    if (level <= 4) return <Star className="w-10 h-10" />;
    if (level <= 9) return <Flame className="w-10 h-10" />;
    if (level <= 14) return <Gem className="w-10 h-10" />;
    if (level <= 19) return <Zap className="w-10 h-10" />;
    if (level <= 24) return <Crown className="w-10 h-10" />;
    return <Trophy className="w-10 h-10" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
            All Level Badges
          </DialogTitle>
          <DialogDescription>
            Unlock badges by reaching new levels. You're currently at level {currentLevel}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4">
          {allLevelBadges.map((threshold) => {
            const isEarned = currentLevel >= threshold.level;
            return (
              <div 
                key={threshold.level}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all ${
                  isEarned 
                    ? 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-800/50 opacity-50'
                }`}
                style={isEarned ? { borderColor: 'var(--color-primary)', borderWidth: '2px' } : {}}
              >
                <div style={isEarned ? { color: 'var(--color-primary)' } : { color: '#9CA3AF' }}>
                  {getBadgeIcon(threshold.level)}
                </div>
                <p className="text-sm font-bold text-center">{threshold.badge}</p>
                <Badge variant="outline" className="text-xs">
                  Level {threshold.level}
                </Badge>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {threshold.ep.toLocaleString()} EP
                </p>
                {isEarned && (
                  <Badge className="text-xs" style={{ backgroundColor: 'var(--color-primary)' }}>
                    Earned
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}