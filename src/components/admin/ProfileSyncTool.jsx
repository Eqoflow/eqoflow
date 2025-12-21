import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fixProfileDataSync } from "@/functions/fixProfileDataSync";
import { forceRefreshDirectory } from "@/functions/forceRefreshDirectory";
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function ProfileSyncTool() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);

  const handleSync = async () => {
    if (!email.trim()) {
      setResult({ error: 'Please enter an email address' });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await fixProfileDataSync({ targetUserEmail: email.trim() });
      setResult(response.data);
    } catch (error) {
      setResult({ error: error.message || 'An unknown error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshDirectory = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const response = await forceRefreshDirectory();
      setRefreshResult(response.data);
    } catch (error) {
      setRefreshResult({ error: error.message || 'Failed to refresh directory' });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
            <Card className="dark-card mt-6 border-purple-500/20">
                <CardHeader>
                    <CardTitle className="text-slate-50 font-semibold leading-none tracking-tight">Profile Sync Tool</CardTitle>
                    <CardDescription>
                        Manually sync a user's data between the User and UserProfileData entities to fix display issues on the Discovery page.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
              type="email"
              placeholder="Enter user's email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/30 border-gray-700 pl-4 text-white"
              disabled={loading} />

                        <Button onClick={handleSync} disabled={loading} className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                            Sync Profile Data
                        </Button>
                    </div>
                    {result &&
          <div className="mt-4 p-4 rounded-lg border bg-black/20">
                            {result.success ?
            <div className="text-green-400 flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold">Success!</p>
                                        <p>{result.message}</p>
                                        <pre className="text-xs mt-2 bg-black p-2 rounded overflow-x-auto">{JSON.stringify(result.syncedData || result.newProfileData, null, 2)}</pre>
                                    </div>
                                </div> :

            <div className="text-red-400 flex items-start gap-3">
                                    <XCircle className="w-5 h-5 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold">Error!</p>
                                        <p>{result.error}</p>
                                    </div>
                                </div>
            }
                        </div>
          }
                </CardContent>
            </Card>

            <Card className="dark-card mt-6 border-orange-500/20">
                <CardHeader>
                    <CardTitle className="text-slate-50 font-semibold leading-none tracking-tight">Discovery Directory Refresh</CardTitle>
                    <CardDescription>
                        Force refresh the entire Discovery directory. Use this AFTER syncing individual profiles to make Discovery show updated data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
            onClick={handleRefreshDirectory}
            disabled={refreshing}
            className="bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600">

                        {refreshing ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
                        Force Refresh Discovery Directory
                    </Button>
                    
                    {refreshResult &&
          <div className="mt-4 p-4 rounded-lg border bg-black/20">
                            {refreshResult.success ?
            <div className="text-green-400 flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold">Directory Refreshed!</p>
                                        <p>{refreshResult.message}</p>
                                        <p className="text-sm mt-1">Updated: {refreshResult.stats.updated}, Created: {refreshResult.stats.created}, Total: {refreshResult.stats.totalUsers}</p>
                                    </div>
                                </div> :

            <div className="text-red-400 flex items-start gap-3">
                                    <XCircle className="w-5 h-5 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold">Error!</p>
                                        <p>{refreshResult.error}</p>
                                    </div>
                                </div>
            }
                        </div>
          }
                </CardContent>
            </Card>
        </>);

}