import React, { useEffect } from 'react';
import { User } from '@/entities/User';
import { createPageUrl } from '@/utils';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';

export default function Index() {
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const user = await User.me();
        
        if (user) {
          // User is logged in - redirect to Feed
          console.log('User logged in, redirecting to Feed');
          window.location.href = createPageUrl('Feed');
        } else {
          // User is not logged in - redirect to Updates
          console.log('No user, redirecting to Updates');
          window.location.href = createPageUrl('Updates');
        }
      } catch (error) {
        // Error or not logged in - redirect to Updates
        console.error('Auth check error:', error);
        window.location.href = createPageUrl('Updates');
      }
    };

    checkAuthAndRedirect();
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <QuantumFlowLoader message="Loading EqoFlow..." size="lg" />
    </div>
  );
}