import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Sparkles, Loader2 } from 'lucide-react';
import { UserProfileData } from '@/entities/UserProfileData';

export default function ManageInterestsModal({ user, onClose }) {
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    async function fetchInterests() {
      if (user?.email) {
        try {
          const profile = await UserProfileData.filter({ user_email: user.email });
          if (profile.length > 0) {
            setProfileData(profile[0]);
            setInterests(profile[0].interests || []);
          }
        } catch (error) {
          console.error("Failed to fetch user interests:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchInterests();
  }, [user]);

  const handleAddInterest = () => {
    const trimmedInterest = newInterest.trim().toLowerCase();
    if (trimmedInterest && !interests.includes(trimmedInterest)) {
      setInterests([...interests, trimmedInterest]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (profileData) {
        await UserProfileData.update(profileData.id, { interests });
      } else {
        await UserProfileData.create({ user_email: user.email, interests });
      }
      onClose(true); // Pass true to indicate a refresh is needed
    } catch (error) {
      console.error("Failed to save interests:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
        onClick={() => !isSaving && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Manage Your Interests
              </CardTitle>
              <p className="text-sm text-gray-400">Personalize the communities recommended to you.</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add an interest (e.g., 'gaming')"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                      className="flex-1 bg-black/20 border-purple-500/20 text-white"
                    />
                    <Button onClick={handleAddInterest} size="icon" className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-black/10 rounded-lg min-h-[80px] border border-gray-800">
                    {interests.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {interests.map(interest => (
                          <Badge key={interest} variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/30 capitalize">
                            {interest}
                            <button
                              onClick={() => handleRemoveInterest(interest)}
                              className="ml-1.5 text-purple-300 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-center text-gray-500 pt-4">Add some interests to get started!</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onClose()} disabled={isSaving} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || isLoading} className="bg-gradient-to-r from-purple-600 to-pink-500">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Save and Refresh
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}