
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Users, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowLeft,
  Database,
  DatabaseZap // Changed from Sync to DatabaseZap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { syncCrossPlatformData } from '@/functions/syncCrossPlatformData';

export default function CrossPlatformManager() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const handleSyncAllUsers = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const response = await syncCrossPlatformData();
      
      if (response.data?.success) {
        setSyncResult({
          success: true,
          message: response.data.message,
          updatedCount: response.data.updated_count
        });
        setLastSyncTime(new Date());
      } else {
        setSyncResult({
          success: false,
          message: response.data?.error || 'Sync failed'
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncResult({
        success: false,
        message: error.message || 'An error occurred during sync'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("AdminHub")}>
            <Button variant="outline" className="border-yellow-500/30 text-white hover:bg-yellow-500/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Hub
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
              Cross-Platform Management
            </h1>
            <p className="text-gray-400 mt-2">
              Manage cross-platform identity synchronization and social connections
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Manual Sync Card */}
          <Card className="dark-card border-yellow-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-yellow-400">
                <DatabaseZap className="w-6 h-6" /> {/* Changed icon from Sync to DatabaseZap */}
                Manual Cross-Platform Data Sync
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white mb-2">Public Directory Sync</h3>
                    <p className="text-gray-300 text-sm mb-3">
                      This function syncs all users' cross-platform identity data (social media connections, follower counts) 
                      to the PublicUserDirectory entity, making it visible on public profiles.
                    </p>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Updates cross-platform identity data for all users</li>
                      <li>• Syncs follower counts from connected social accounts</li>
                      <li>• Ensures public profiles display accurate social data</li>
                      <li>• Only processes users with existing cross-platform connections</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sync Controls */}
              <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-gray-700">
                <div>
                  <p className="text-white font-medium">Sync Status</p>
                  <p className="text-sm text-gray-400">
                    {lastSyncTime 
                      ? `Last synced: ${lastSyncTime.toLocaleString()}` 
                      : 'Never synced'
                    }
                  </p>
                </div>
                <Button
                  onClick={handleSyncAllUsers}
                  disabled={isSyncing}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync All Users
                    </>
                  )}
                </Button>
              </div>

              {/* Sync Results */}
              {syncResult && (
                <div className={`p-4 rounded-lg border ${
                  syncResult.success 
                    ? 'bg-green-900/20 border-green-500/30' 
                    : 'bg-red-900/20 border-red-500/30'
                }`}>
                  <div className="flex items-start gap-3">
                    {syncResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`font-semibold ${
                        syncResult.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
                      </h4>
                      <p className="text-white text-sm mt-1">
                        {syncResult.message}
                      </p>
                      {syncResult.success && syncResult.updatedCount && (
                        <Badge className="bg-green-600/20 text-green-300 border-green-500/40 mt-2">
                          {syncResult.updatedCount} users updated
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Information Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="dark-card border-yellow-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-yellow-400">
                  <Globe className="w-5 h-5" />
                  Cross-Platform Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-gray-300">Social Media Verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-gray-300">Follower Count Sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-gray-300">Public Profile Display</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-gray-300">Cross-Platform Badges</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark-card border-yellow-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-yellow-400">
                  <Users className="w-5 h-5" />
                  Supported Platforms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300">Twitter/X</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-300">LinkedIn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                    <span className="text-gray-300">GitHub</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300">Spotify</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-300">YouTube</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-300">Instagram</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
