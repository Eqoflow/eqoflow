
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { User, XCircle, Ban, Loader2 } from 'lucide-react';

export default function KickBanModal({ member, onAction, onClose }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (actionType) => {
    setIsLoading(true);
    await onAction(actionType);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md"
      >
        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-white">Moderate Member</CardTitle>
            <CardDescription className="text-gray-400">
              Choose an action for <span className="font-bold text-white">{member.full_name}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p className="font-medium text-white">{member.full_name}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">
                <span className="font-bold text-orange-400">Kicking</span> a member removes them from the community. They can rejoin later.
              </p>
              <p className="text-sm text-gray-400">
                <span className="font-bold text-red-500">Banning</span> a member permanently removes them and prevents them from rejoining.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between gap-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
              Cancel
            </Button>
            <div className="flex-1 flex gap-3">
              <Button
                variant="destructive"
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={() => handleAction('kick')}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Kick
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleAction('ban')}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
                Ban
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
