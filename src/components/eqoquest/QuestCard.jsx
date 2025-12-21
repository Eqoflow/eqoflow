import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Repeat, Star } from "lucide-react";

const CATEGORY_COLORS = {
  content: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  engagement: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  community: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  privacy: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  builder: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  discovery: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
};

export default function QuestCard({ quest, completion, onClaim, onTrack, isLoading }) {
  const isCompleted = completion?.completed;
  const progress = completion?.progress || 0;
  const canClaim = progress >= 100 && !isCompleted;
  const isRepeatable = quest.frequency === 'multi' || quest.frequency === 'daily' || quest.frequency === 'weekly';
  const claimCount = completion?.claim_count || 0;
  const maxClaims = quest.max_claims;

  const getFrequencyIcon = () => {
    if (quest.frequency === 'once') return <Star className="w-3 h-3" />;
    if (quest.frequency === 'daily') return <Clock className="w-3 h-3" />;
    if (quest.frequency === 'weekly') return <Clock className="w-3 h-3" />;
    if (quest.frequency === 'multi') return <Repeat className="w-3 h-3" />;
    return null;
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-lg ${isCompleted ? 'opacity-75' : ''} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800`}
      style={{
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 0 35px color-mix(in srgb, var(--color-primary) 70%, transparent), 0 0 60px color-mix(in srgb, var(--color-primary) 40%, transparent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
      }}>

      <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
                  <Badge className={CATEGORY_COLORS[quest.category] || CATEGORY_COLORS.content}>
                    {quest.category}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 text-gray-300 border-gray-600">
                    {getFrequencyIcon()}
                    <span className="capitalize">{quest.frequency}</span>
                  </Badge>
                  {isRepeatable && maxClaims &&
              <Badge variant="secondary" className="text-gray-300 bg-gray-800">
                      {claimCount}/{maxClaims}
                    </Badge>
              }
                </div>
                <CardTitle className="text-lg text-white">{quest.title}</CardTitle>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-xl font-bold">{quest.sp_reward * (maxClaims || 1)}</span>
                </div>
                <p className="text-xs text-gray-400">Total SEP</p>
              </div>
            </div>
            <CardDescription className="text-gray-400">{quest.description}</CardDescription>
            </CardHeader>

            <CardContent className="bg-[#000] pt-0 p-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="font-medium text-white">{progress}%</span>
              </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          {canClaim ?
          <Button
            onClick={() => onClaim(quest.quest_id)}
            disabled={isLoading}
            className="flex-1 text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}>

              <CheckCircle2 className="w-4 h-4 mr-2" />
              Claim Reward
            </Button> :
          isCompleted && !isRepeatable ?
          <Button disabled className="flex-1 text-black bg-white hover:bg-gray-100" variant="outline">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Completed
            </Button> :
          isCompleted && isRepeatable && claimCount >= maxClaims ?
          <Button disabled className="flex-1 text-black bg-white hover:bg-gray-100" variant="outline">
              Max Claims Reached
            </Button> :

          <Button
            onClick={() => onTrack(quest.quest_id)}
            variant="outline"
            className="flex-1 text-black bg-white hover:bg-gray-100 border-transparent">

              Track Progress
            </Button>
          }
        </div>

        {/* Additional Info */}
        {isRepeatable &&
        <p className="text-xs text-gray-400 mt-2 text-center">
            Resets {quest.frequency === 'daily' ? 'daily' : quest.frequency === 'weekly' ? 'weekly' : 'after claim'}
          </p>
        }
      </CardContent>
    </Card>);

}