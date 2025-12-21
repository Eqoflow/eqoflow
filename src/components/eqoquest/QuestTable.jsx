import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Repeat, Star } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CATEGORY_COLORS = {
  content: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  engagement: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  community: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  privacy: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  builder: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  discovery: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
};

export default function QuestTable({ quests, completions, onClaim, onTrack, isLoading }) {
  const getFrequencyIcon = (frequency) => {
    if (frequency === 'once') return <Star className="w-3 h-3" />;
    if (frequency === 'daily') return <Clock className="w-3 h-3" />;
    if (frequency === 'weekly') return <Clock className="w-3 h-3" />;
    if (frequency === 'multi') return <Repeat className="w-3 h-3" />;
    return null;
  };

  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden bg-[#000000]">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-800">
            <TableHead className="w-[40%] text-white">Quest</TableHead>
            <TableHead className="text-white">Category</TableHead>
            <TableHead className="text-white">Progress</TableHead>
            <TableHead className="text-center text-white">SP</TableHead>
            <TableHead className="text-right text-white">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quests.map((quest) => {
            const completion = completions.find((c) => c.quest_id === quest.quest_id);
            const isCompleted = completion?.completed;
            const progress = completion?.progress || 0;
            const canClaim = progress >= 100 && !isCompleted;
            const isRepeatable = quest.frequency === 'multi' || quest.frequency === 'daily' || quest.frequency === 'weekly';
            const claimCount = completion?.claim_count || 0;
            const maxClaims = quest.max_claims;

            return (
              <TableRow key={quest.quest_id} className={`border-b border-gray-800 ${isCompleted ? 'opacity-60' : ''}`}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>{quest.title}</p>
                      <Badge variant="outline" className="flex items-center gap-1 text-white border-gray-700">
                        {getFrequencyIcon(quest.frequency)}
                        <span className="capitalize text-xs">{quest.frequency}</span>
                      </Badge>
                      {isRepeatable && maxClaims && (
                        <Badge variant="secondary" className="text-xs text-white bg-gray-800">
                          {claimCount}/{maxClaims}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{quest.description}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={CATEGORY_COLORS[quest.category] || CATEGORY_COLORS.content}>
                    {quest.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 min-w-[120px]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1" style={{ color: 'var(--color-primary)' }}>
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold">{quest.sp_reward}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {canClaim ? (
                    <Button 
                      onClick={() => onClaim(quest.quest_id)} 
                      disabled={isLoading}
                      size="sm"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Claim
                    </Button>
                  ) : isCompleted && !isRepeatable ? (
                    <Button disabled size="sm" variant="outline">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Done
                    </Button>
                  ) : isCompleted && isRepeatable && claimCount >= maxClaims ? (
                    <Button disabled size="sm" variant="outline" className="text-xs">
                      Max Reached
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => onTrack(quest.quest_id)} 
                      variant="outline"
                      size="sm"
                    >
                      Track
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}