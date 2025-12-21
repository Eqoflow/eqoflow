import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, Trophy, Star, Zap, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ReadyPlayerOne() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await User.me();
        
        // Redirect non-admin users to Feed
        if (!currentUser || currentUser.role !== 'admin') {
          navigate(createPageUrl('Feed'));
          return;
        }
        
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
        navigate(createPageUrl('Feed'));
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Don't render anything if user is not admin (will redirect)
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Gamepad2 className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              EqoQuest
            </h1>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">ADMIN ONLY</Badge>
          </div>
          <p className="text-gray-400">
            Gamify your EqoFlow experience - Coming Soon
          </p>
        </div>

        {/* Coming Soon Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">
                  Unlock achievements as you interact with EqoFlow
                </p>
                <div className="flex items-center gap-2 text-yellow-400">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Coming Soon</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-400" />
                  Quests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">
                  Complete daily and weekly quests for rewards
                </p>
                <div className="flex items-center gap-2 text-yellow-400">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Coming Soon</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  Leaderboards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">
                  Compete with other users on global leaderboards
                </p>
                <div className="flex items-center gap-2 text-yellow-400">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Coming Soon</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Admin Testing Notice */}
        <div className="mt-8">
          <Card className="dark-card border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Gamepad2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Admin Preview</h3>
                  <p className="text-gray-400 text-sm">
                    This page is currently in development and only accessible to administrators. 
                    Once complete, it will provide a gamified experience for all EqoFlow users with achievements, quests, and leaderboards.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}