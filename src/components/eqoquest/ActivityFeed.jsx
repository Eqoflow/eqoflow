import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Trophy, Star, Zap, Award } from "lucide-react";

export default function ActivityFeed({ activities }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'rank_up': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'rank_down': return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'quest_complete': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'level_up': return <Star className="w-5 h-5 text-purple-500" />;
      case 'ep_earned': return <Zap className="w-5 h-5 text-blue-500" />;
      default: return <Award className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'rank_up': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'rank_down': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'quest_complete': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'level_up': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'ep_earned': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-2 p-6" style={{ borderColor: 'var(--color-primary)' }}>
      <h3 className="text-lg font-bold mb-4 uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
        Recent Activity
      </h3>
      
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No recent activity. Complete quests to get started!
          </p>
        ) : (
          activities.map((activity, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={getActivityColor(activity.type)}>
                    {activity.badge}
                  </Badge>
                  <span className="text-xs text-gray-400">{formatTime(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}