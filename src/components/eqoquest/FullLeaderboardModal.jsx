import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function FullLeaderboardModal({ isOpen, onClose, leaderboard, userScore, userId }) {
  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-orange-600" />;
    return null;
  };

  const getReward = (rank) => {
    const rewards = {
      1: "1,000 $EQOFLO",
      2: "750 $EQOFLO",
      3: "500 $EQOFLO",
      4: "350 $EQOFLO",
      5: "250 $EQOFLO",
      6: "200 $EQOFLO",
      7: "150 $EQOFLO",
      8: "100 $EQOFLO",
      9: "75 $EQOFLO",
      10: "50 $EQOFLO"
    };
    return rewards[rank] || "-";
  };

  const isUserRow = (entry) => entry.user_id === userId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Full Leaderboard</DialogTitle>
        </DialogHeader>
        
        {/* User Position Pinned at Top */}
        {userScore && userScore.rank > 10 && (
          <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Position:</p>
            <div 
              className="p-3 rounded-lg border-2 bg-gray-100 dark:bg-gray-800"
              style={{ 
                borderColor: 'var(--color-primary)'
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full font-bold flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                  #{userScore.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">You</p>
                </div>
                <div className="flex gap-8">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Score</p>
                    <p className="font-bold">{userScore.sp_total}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Reward</p>
                    <p className="font-bold">{getReward(userScore.rank)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Leaderboard List */}
        <div className="flex-1 overflow-y-auto mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Estimated Reward</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry) => (
                <TableRow 
                  key={entry.user_id} 
                  className={isUserRow(entry) ? "bg-gray-50 dark:bg-gray-800/50" : ""}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getRankIcon(entry.rank)}
                      <span>#{entry.rank}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <span className={isUserRow(entry) ? "font-bold text-primary" : ""}>
                        {entry.display_name || entry.handle || "Anonymous"}
                        {isUserRow(entry) && " (You)"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {entry.sp_total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{getReward(entry.rank)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}