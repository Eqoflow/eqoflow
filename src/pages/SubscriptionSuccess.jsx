import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { invalidateCache, CACHE_CONFIG } from '../components/contexts/UserContext';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear all user-related caches to force fresh data
    invalidateCache(CACHE_CONFIG.USER_DATA);
    invalidateCache(CACHE_CONFIG.USER_PROFILE_DATA);
    invalidateCache(CACHE_CONFIG.FEED_POSTS);
    invalidateCache(CACHE_CONFIG.PROFILE_POSTS);
    
    console.log('User cache invalidated after successful subscription');

    // Wait a moment to ensure webhook has processed, then redirect
    const timer = setTimeout(() => {
      navigate(createPageUrl('Profile') + '?section=subscriptions', { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="dark-card max-w-md">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-4"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-400 mb-6">
              Your Eqo+ subscription is now active.
            </p>
            
            <div className="flex items-center justify-center gap-2 text-purple-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Redirecting to your profile...</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}