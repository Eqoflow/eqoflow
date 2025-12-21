
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Settings, Key, Copy, Save, Info, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import { initializeMux } from "@/functions/initializeMux";

export default function StreamSettingsModal({ onClose }) {
  const [streamInfo, setStreamInfo] = useState({ stream_key: '', rtmp_url: '' });
  const [formData, setFormData] = useState({
    stream_about: '',
    stream_schedule: '',
    merchandise_url: '',
    donation_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Initializing Mux for user...');
        const response = await initializeMux();
        
        if (response.data) {
          setStreamInfo(response.data);
        } else {
          // This case might not be hit if the function always throws on error
          setError('Failed to get stream keys from Mux: No data returned.');
        }

        const currentUser = await User.me();
        if (currentUser.creator_profile) {
          setFormData(currentUser.creator_profile);
        }
      } catch (err) {
        console.error("Error initializing stream settings:", err);
        const errorData = err.data || {};
        let displayError = errorData.error || err.message || 'Unknown error. Check the function logs in the workspace.';

        // NEW: Add specific, user-friendly error message for Mux free plan limitation.
        if (typeof displayError === 'string' && displayError.includes("Live streams are unavailable on the free plan")) {
            displayError = "Your Mux account is on the free plan, which does not support live streaming. Please upgrade your Mux account to a paid plan and then try again.\n\n" +
                           "Instructions for upgrading your Mux account can be found in the Mux documentation.";
        }
        
        setError(`Failed to initialize streaming. Reason: ${displayError}`);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await User.updateMyUserData({ creator_profile: formData });
    } catch (error) {
      console.error("Failed to save stream settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="dark-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-purple-400" />
              Stream Settings
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5 text-gray-400" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
                  <p className="text-white">Setting up your streaming keys...</p>
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-lg mb-4">
                  <p className="text-red-400 font-medium">Error Setting Up Streaming</p>
                  <p className="text-red-300 text-sm mt-2 whitespace-pre-wrap">{error}</p>
                </div>
                <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-700">
                  Try Again
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="keys" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 gap-2 dark-card p-1.5 rounded-2xl">
                   <TabsTrigger value="keys" className="rounded-xl text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500">
                      <Key className="w-4 h-4 mr-2" /> OBS Keys
                   </TabsTrigger>
                   <TabsTrigger value="profile" className="rounded-xl text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500">
                      <UserIcon className="w-4 h-4 mr-2" /> Creator Profile
                   </TabsTrigger>
                </TabsList>
                
                <TabsContent value="keys">
                  <div className="p-4 bg-black/20 rounded-lg space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300">RTMP URL</label>
                      <div className="p-3 bg-black/30 rounded-md mt-1 font-mono text-sm text-white/80 break-all">
                        {streamInfo.rtmp_url || 'Loading...'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Stream Key</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input 
                          type="password"
                          readOnly
                          value={streamInfo.stream_key || ''}
                          className="font-mono text-white/80 bg-black/30 border-purple-500/20"
                          placeholder={isLoading ? "Loading..." : "Stream key will appear here"}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleCopy(streamInfo.stream_key)}
                          disabled={!streamInfo.stream_key}
                        >
                          <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                        </Button>
                      </div>
                      {copiedKey && <p className="text-xs text-green-400 mt-1">Copied to clipboard!</p>}
                    </div>
                    <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-400">
                          Enter these details into your streaming software (e.g., OBS, Streamlabs). Do not share your Stream Key with anyone.
                        </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="profile">
                  <form onSubmit={handleSave} className="space-y-6">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">About Section</label>
                      <Textarea name="stream_about" value={formData.stream_about} onChange={handleInputChange} placeholder="Tell viewers about yourself and your stream..." className="bg-black/20 border-purple-500/20 text-white h-28" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">Stream Schedule</label>
                      <Textarea name="stream_schedule" value={formData.stream_schedule} onChange={handleInputChange} placeholder="e.g., Mon, Wed, Fri at 8 PM EST" className="bg-black/20 border-purple-500/20 text-white h-20" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Merchandise URL</label>
                        <Input name="merchandise_url" value={formData.merchandise_url} onChange={handleInputChange} placeholder="https://my-store.com" className="bg-black/20 border-purple-500/20 text-white" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Donation URL</label>
                        <Input name="donation_url" value={formData.donation_url} onChange={handleInputChange} placeholder="https://ko-fi.com/my-name" className="bg-black/20 border-purple-500/20 text-white" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={isSaving} className="bg-gradient-to-r from-purple-600 to-pink-500">
                        {isSaving ? 'Saving...' : 'Save Profile'}
                        <Save className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
