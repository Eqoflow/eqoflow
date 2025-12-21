import { useEffect, useRef } from 'react';
import { User } from '@/entities/User';
import { updatePublicDirectory } from '@/functions/updatePublicDirectory';
import { UserProfileData } from '@/entities/UserProfileData';

export default function AutoDirectoryUpdater({ user }) {
  const isUpdating = useRef(false);
  const lastUpdate = useRef(0);
  const rateLimitBackoff = useRef(0);

  useEffect(() => {
    const updateDirectory = async () => {
      const now = Date.now();

      // Check rate limit backoff
      if (now < rateLimitBackoff.current) {
        return;
      }

      // Check if user available and not already updating
      if (!user || isUpdating.current) {
        return;
      }

      // 5 minute cooldown between updates
      if (now - lastUpdate.current < 300000) {
        return;
      }

      try {
        isUpdating.current = true;
        lastUpdate.current = now;

        // Get current user data with timeout
        const currentUserData = await Promise.race([
          User.me(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('User data fetch timeout')), 10000)
          )
        ]);

        if (!currentUserData) {
          console.warn('Directory update: Could not retrieve current user data');
          return;
        }

        // Get profile data with timeout
        let profileData = [];
        try {
          profileData = await Promise.race([
            UserProfileData.filter({ user_email: currentUserData.email }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile data fetch timeout')), 10000)
            )
          ]);
        } catch (err) {
          console.warn('Profile data fetch failed, using user data only:', err);
        }

        // Merge data
        const mergedData = profileData.length > 0 
          ? { ...currentUserData, ...profileData[0] } 
          : currentUserData;

        // Update directory with timeout
        await Promise.race([
          updatePublicDirectory({ updateData: mergedData }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Directory update timeout')), 15000)
          )
        ]);

        console.log('Public directory updated successfully');
        rateLimitBackoff.current = 0; // Reset backoff on success

      } catch (error) {
        console.warn('Failed to update directory:', error.message);

        // Set backoff on repeated failures
        if (error.message.includes('timeout') || error.message.includes('Rate limit')) {
          rateLimitBackoff.current = now + 300000; // 5 minute backoff
        }
      } finally {
        isUpdating.current = false;
      }
    };

    // Initial delay to avoid conflicts
    const timer = setTimeout(updateDirectory, 3000);
    return () => clearTimeout(timer);
  }, [user]);

  return null;
}