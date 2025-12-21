import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Gift } from "lucide-react";

export default function UserStrip({ userScore, gapToNextRank, pendingClaims, onViewFullLeaderboard, onClaimPending }) {
  return (
    <Card className="bg-[#000000] text-card-foreground mb-6 p-4 rounded-xl sticky top-14 lg:top-0 z-10 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg border-2" style={{ borderColor: 'var(--color-primary)' }}>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* User Stats */}
        <div className="flex items-center gap-4 flex-1">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Gap to Next Rank</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {gapToNextRank !== null ? `+${gapToNextRank} Seasonal EP` : '—'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {pendingClaims > 0 &&
          <Button onClick={onClaimPending} className="relative" style={{ backgroundColor: 'var(--color-primary)' }}>
              <Gift className="w-4 h-4 mr-2" />
              Claim Rewards
              <Badge className="ml-2 bg-white text-gray-900 hover:bg-white">
                {pendingClaims}
              </Badge>
            </Button>
          }
          <Button variant="outline" onClick={onViewFullLeaderboard}>
            View Full Leaderboard
          </Button>
        </div>
      </div>
    </Card>);

}