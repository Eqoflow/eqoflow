import React, { useContext } from 'react';
import { Shield } from 'lucide-react';
import PrivacyHubTab from '../components/profile/PrivacyHubTab';
import { UserContext } from '../components/contexts/UserContext';
import { base44 } from '@/api/base44Client';

export default function PrivacyPage() {
  const { user, isLoading } = useContext(UserContext);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  const handleUpdate = async (data) => {
    await base44.auth.updateMe(data);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Privacy Hub</h1>
          </div>
          <p className="text-gray-400">Control your privacy, data, and security settings</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="px-3 py-1 bg-green-600/20 border border-green-500/40 rounded-full text-green-400 text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Nillion Powered
            </div>
          </div>
        </div>

        {/* Use the existing PrivacyHubTab component */}
        <PrivacyHubTab user={user} onUpdate={handleUpdate} />
      </div>
    </div>
  );
}