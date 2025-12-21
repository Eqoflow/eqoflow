import React, { useEffect } from 'react';
import { User } from '@/entities/User';
import { createPageUrl } from '@/utils';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';

export default function Landing() {
  useEffect(() => {
    const redirect = async () => {
      try {
        const user = await User.me();
        if (user) {
          window.location.href = createPageUrl('Feed');
        } else {
          window.location.href = createPageUrl('Updates');
        }
      } catch (error) {
        window.location.href = createPageUrl('Updates');
      }
    };
    redirect();
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <QuantumFlowLoader message="Redirecting..." size="lg" />
    </div>
  );
}