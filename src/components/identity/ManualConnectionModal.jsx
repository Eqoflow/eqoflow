
import React, { useState, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save, Twitter, Github, Linkedin, Youtube, Facebook, Instagram, Globe, Zap, Shield, Star, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SocialConnectionReview } from '@/entities/SocialConnectionReview';
import { UserContext } from '../contexts/UserContext';

const platformDetails = {
  twitter: { icon: Twitter, name: 'X (Twitter)' },
  facebook: { icon: Facebook, name: 'Facebook' },
  instagram: { icon: Instagram, name: 'Instagram' },
  linkedin: { icon: Linkedin, name: 'LinkedIn' },
  github: { icon: Github, name: 'GitHub' },
  youtube: { icon: Youtube, name: 'YouTube' },
  lens: { icon: Globe, name: 'Lens Protocol' },
  farcaster: { icon: Zap, name: 'Farcaster' },
  nostr: { icon: Shield, name: 'Nostr' },
  bluesky: { icon: Star, name: 'Bluesky' },
  mastodon: { icon: Users, name: 'Mastodon' }
};

export default function ManualConnectionModal({ platform, type, onClose, onConnectionSubmitted }) {
  const { user } = useContext(UserContext);
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    profile_url: '',
    follower_count: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const details = platformDetails[platform.id];
  const Icon = details.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that profile URL is provided
    if (!formData.profile_url || formData.profile_url.trim() === '') {
      setError('Profile URL is required and cannot be empty.');
      return;
    }

    // Basic URL validation
    try {
      new URL(formData.profile_url);
    } catch {
      setError('Please enter a valid URL (e.g., https://twitter.com/username)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await SocialConnectionReview.create({
        user_email: user.email,
        platform: platform.id,
        platform_label: details.name, // Use details.name for consistency
        status: 'pending',
        submitted_data: {
          display_name: formData.display_name.trim(),
          username: formData.username.trim(),
          profile_url: formData.profile_url.trim(),
          follower_count: parseInt(formData.follower_count) || 0
        }
      });

      onConnectionSubmitted();
      onClose();
    } catch (err) {
      console.error('Error submitting connection for review:', err);
      setError('Failed to submit connection for review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form is valid (all required fields filled based on outline's logic)
  const isFormValid = formData.display_name.trim() !== '' &&
                     formData.username.trim() !== '' &&
                     formData.profile_url.trim() !== '';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-3">
                <Icon className="w-6 h-6" />
                Add {details.name} Account
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">
                Manually add your account details. This information will be publicly visible but not automatically verified. It will be sent for review.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-300 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="display_name" className="text-white">Display Name *</Label>
                  <Input
                    id="display_name"
                    name="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                    placeholder="Your name as it appears on the platform"
                    className="bg-black/20 border-purple-500/20 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="username" className="text-white">Username/Handle *</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder={`Your ${details.name} username`}
                    className="bg-black/20 border-purple-500/20 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="profile_url" className="text-white">Profile URL * <span className="text-red-400">(Required)</span></Label>
                  <Input
                    id="profile_url"
                    name="profile_url"
                    value={formData.profile_url}
                    onChange={(e) => setFormData({...formData, profile_url: e.target.value})}
                    placeholder={`https://${platform.id === 'twitter' ? 'twitter.com' : platform.id === 'github' ? 'github.com' : platform.id === 'linkedin' ? 'linkedin.com/in' : platform.id === 'youtube' ? 'youtube.com/@' : platform.id === 'facebook' ? 'facebook.com' : platform.id === 'instagram' ? 'instagram.com' : 'example.com'}/yourusername`}
                    className="bg-black/20 border-purple-500/20 text-white"
                    type="url"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    We need your profile URL to verify your account and follower count.
                  </p>
                </div>

                <div>
                  <Label htmlFor="follower_count" className="text-white">Follower Count</Label>
                  <Input
                    id="follower_count"
                    name="follower_count"
                    value={formData.follower_count}
                    onChange={(e) => setFormData({...formData, follower_count: e.target.value})}
                    placeholder="0"
                    type="number"
                    min="0"
                    className="bg-black/20 border-purple-500/20 text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={onClose} className="border-purple-500/30 text-white hover:bg-purple-500/10">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className={`${
                      isFormValid
                        ? 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600'
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Submit for Review
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  Your connection will be reviewed by our team before being added to your profile.
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
