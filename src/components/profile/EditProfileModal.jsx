
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User } from '@/entities/User';
import { updatePostsAfterNameChange } from '@/functions/updatePostsAfterNameChange';
import { updatePostsAfterAvatarChange } from "@/functions/updatePostsAfterAvatarChange";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X, Image, Upload, Loader2, User as UserIcon } from 'lucide-react';
import { UploadFile } from '@/integrations/Core';

export default function EditProfileModal({ user, isOpen, onClose, onSave }) {
  // --- State Definitions ---
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  const [currentSkill, setCurrentSkill] = useState('');
  const [currentInterest, setCurrentInterest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Refs for file inputs
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // --- Effect to initialize form data when modal opens or user changes ---
  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.full_name || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setWebsite(user.website || '');
      setSkills(user.skills || []);
      setInterests(user.interests || []);
      setAvatarUrl(user.avatar_url || '');
      setBannerUrl(user.banner_url || '');
    }
  }, [user, isOpen]);

  // --- File Upload Handlers ---
  const handleAvatarUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploadingAvatar(true);
    const file = e.target.files[0];

    try {
      const response = await UploadFile({ file });
      if (response && response.file_url) {
        setAvatarUrl(response.file_url);
      } else {
        alert('Failed to upload avatar.');
        console.error('Avatar upload failed:', response);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleBannerUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploadingBanner(true);
    const file = e.target.files[0];

    try {
      const response = await UploadFile({ file });
      if (response && response.file_url) {
        setBannerUrl(response.file_url);
      } else {
        alert('Failed to upload banner.');
        console.error('Banner upload failed:', response);
      }
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert('Error uploading banner. Please try again.');
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  };

  const triggerAvatarUpload = () => {
    avatarInputRef.current?.click();
  };

  const triggerBannerUpload = () => {
    bannerInputRef.current?.click();
  };

  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!fullName?.trim()) {
      alert('Display Name is required');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('Updating profile...');

    const originalAvatarUrl = user.avatar_url;
    const originalFullName = user.full_name;

    try {
      // Build updateData object carefully to preserve existing values.
      const updateData = {
        full_name: fullName,
        username,
        bio,
        location,
        website,
        skills,
        interests,
        // Always use the current state for the avatar, as that's what the user sees and may have just changed.
        avatar_url: avatarUrl,
        // Preserve the banner URL. If the user uploaded a new banner, `bannerUrl` will have a value.
        // If not, the `bannerUrl` state might be empty, so we fall back to the original `user.banner_url`
        // to prevent it from being accidentally erased.
        banner_url: bannerUrl || user.banner_url || '',
      };

      const nameChanged = fullName !== originalFullName;

      // 1. Update the user record
      setSubmitStatus('Saving...');
      await User.updateMyUserData(updateData);

      // 2. Trigger background sync for name if changed
      if (nameChanged) {
        setSubmitStatus('Synchronizing your name across posts...');
        try {
          await updatePostsAfterNameChange({ newFullName: updateData.full_name });
          console.log('Post synchronization triggered successfully for name change.');
        } catch (syncError) {
          console.error('Error triggering post sync for name change:', syncError);
          // Don't fail the whole operation if post sync fails
        }
      }

      // 3. Trigger background sync for avatar if changed
      const avatarChanged = avatarUrl && avatarUrl !== originalAvatarUrl;
      if (avatarChanged) {
        setSubmitStatus('Synchronizing your avatar across posts...');
        try {
          await updatePostsAfterAvatarChange({ newAvatarUrl: avatarUrl });
          console.log('Post synchronization triggered successfully for avatar change.');
        } catch (syncError) {
          console.error('Error triggering post sync for avatar change:', syncError);
        }
      }
      
      await onSave(updateData);
      onClose();

    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('');
    }
  };

  // --- Skill and Interest Handlers ---
  const addSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills(prev => [...prev, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const addInterest = () => {
    if (currentInterest.trim() && !interests.includes(currentInterest.trim())) {
      setInterests(prev => [...prev, currentInterest.trim()]);
      setCurrentInterest('');
    }
  };

  const removeInterest = (interestToRemove) => {
    setInterests(prev => prev.filter(interest => interest !== interestToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dark-card text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Profile</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update your profile information and preferences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="edit-profile-form" className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-white">Display Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-black/20 border-purple-500/20 text-white"
              placeholder="Your display name"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-black/20 border-purple-500/20 text-white"
              placeholder="@username"
            />
          </div>

          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label htmlFor="avatarUpload" className="text-white">Profile Picture</Label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border border-purple-500/20 flex items-center justify-center bg-black/20 shrink-0">
                {avatarUrl ? (
                  <>
                    <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="absolute top-0 right-0 bg-red-500 rounded-full p-0.5 text-white hover:bg-red-600 transition-colors"
                      title="Remove avatar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : isUploadingAvatar ? (
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                ) : (
                  <UserIcon className="w-12 h-12 text-gray-500" />
                )}
              </div>
              <Input
                id="avatarUpload"
                type="file"
                accept="image/*"
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploadingAvatar}
              />
              <Button
                type="button"
                onClick={triggerAvatarUpload}
                variant="outline"
                className="border-purple-500/30 text-white flex items-center gap-2"
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isUploadingAvatar ? 'Uploading...' : 'Upload Image'}
              </Button>
            </div>
          </div>

          {/* Banner Upload */}
          <div className="space-y-2">
            <Label htmlFor="bannerUpload" className="text-white">Profile Banner</Label>
            <div className="relative w-full h-32 rounded-lg overflow-hidden border border-purple-500/20 flex items-center justify-center bg-black/20">
              {bannerUrl ? (
                <>
                  <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setBannerUrl('')}
                    className="absolute top-2 right-2 bg-red-500 rounded-full p-0.5 text-white hover:bg-red-600 transition-colors"
                    title="Remove banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : isUploadingBanner ? (
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              ) : (
                <Image className="w-12 h-12 text-gray-500" />
              )}
              <Input
                id="bannerUpload"
                type="file"
                accept="image/*"
                ref={bannerInputRef}
                onChange={handleBannerUpload}
                className="hidden"
                disabled={isUploadingBanner}
              />
              <Button
                type="button"
                onClick={triggerBannerUpload}
                variant="outline"
                className="absolute bottom-4 right-4 border-purple-500/30 text-white flex items-center gap-2"
                disabled={isUploadingBanner}
              >
                {isUploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isUploadingBanner ? 'Uploading...' : 'Upload Banner'}
              </Button>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-white">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-black/20 border-purple-500/20 text-white h-24"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-white">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-black/20 border-purple-500/20 text-white"
              placeholder="City, Country"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="text-white">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="bg-black/20 border-purple-500/20 text-white"
              placeholder="https://your-website.com"
            />
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="skillInput" className="text-white">Skills</Label>
            <div className="flex gap-2">
              <Input
                id="skillInput"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1 bg-black/20 border-purple-500/20 text-white"
                placeholder="Add a skill..."
              />
              <Button type="button" onClick={addSkill} variant="outline" className="border-purple-500/30 text-white">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-1 text-purple-300 hover:text-purple-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <Label htmlFor="interestInput" className="text-white">Interests</Label>
            <div className="flex gap-2">
              <Input
                id="interestInput"
                value={currentInterest}
                onChange={(e) => setCurrentInterest(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                className="flex-1 bg-black/20 border-purple-500/20 text-white"
                placeholder="Add an interest..."
              />
              <Button type="button" onClick={addInterest} variant="outline" className="border-purple-500/30 text-white">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <Badge key={index} variant="secondary" className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(interest)}
                    className="ml-1 text-cyan-300 hover:text-cyan-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-purple-500/20">
            <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-profile-form"
              className="bg-gradient-to-r from-purple-600 to-pink-500 neon-glow text-white min-w-[120px]"
              disabled={isSubmitting || isUploadingAvatar || isUploadingBanner}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>{submitStatus || 'Saving...'}</span>
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
