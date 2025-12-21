import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function LatestUpdatesWidget({ activities }) {
  const recentActivities = activities.slice(0, 5);

  return (
    <Card className="dark-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm font-semibold">LATEST UPDATES</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentActivities.length > 0 ? (
          recentActivities.map((activity, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {activity.avatar ? (
                  <img src={activity.avatar} alt={activity.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs">
                  <span className="font-semibold">{activity.name}</span>{' '}
                  <span className="text-gray-400">{activity.action}</span>
                </p>
                <p className="text-gray-500 text-[10px]">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-xs text-center py-4">No recent activity</p>
        )}
      </CardContent>
    </Card>
  );
}