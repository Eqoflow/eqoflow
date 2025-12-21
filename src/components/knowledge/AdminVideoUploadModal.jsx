
import React, { useState } from 'react';
import { VideoTutorial } from '@/entities/VideoTutorial';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Upload, Youtube, X } from 'lucide-react';

export default function AdminVideoUploadModal({ isOpen, onClose, onVideoAdded }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    thumbnail_url: '',
    duration: '',
    category: 'getting_started',
    order: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  const extractYouTubeVideoId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const handleThumbnailUpload = async (file) => {
    try {
      setIsUploadingThumbnail(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, thumbnail_url: file_url }));
    } catch (error) {
      console.error('Failed to upload thumbnail:', error);
      setErrors(prev => ({ ...prev, thumbnail: 'Failed to upload thumbnail' }));
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.youtube_url.trim()) {
      newErrors.youtube_url = 'YouTube URL is required';
    } else if (!extractYouTubeVideoId(formData.youtube_url)) {
      newErrors.youtube_url = 'Invalid YouTube URL';
    }
    if (!formData.thumbnail_url) newErrors.thumbnail = 'Thumbnail is required';
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const videoId = extractYouTubeVideoId(formData.youtube_url);
      
      await VideoTutorial.create({
        ...formData,
        youtube_video_id: videoId
      });

      if (onVideoAdded) {
        onVideoAdded();
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        youtube_url: '',
        thumbnail_url: '',
        duration: '',
        category: 'getting_started',
        order: 0
      });

      onClose();
    } catch (error) {
      console.error('Failed to create video tutorial:', error);
      setErrors(prev => ({ ...prev, submit: 'Failed to create video tutorial' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Add Video Tutorial</DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload a new video tutorial for the EqoUniversity
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-white">Video Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Getting Started with EqoFlow"
              className="bg-slate-800/50 border-purple-500/30 text-white"
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-white">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this tutorial covers..."
              rows={3}
              className="bg-slate-800/50 border-purple-500/30 text-white"
            />
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* YouTube URL */}
          <div>
            <Label htmlFor="youtube_url" className="text-white flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-500" />
              YouTube URL *
            </Label>
            <Input
              id="youtube_url"
              value={formData.youtube_url}
              onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..."
              className="bg-slate-800/50 border-purple-500/30 text-white"
            />
            {errors.youtube_url && <p className="text-red-400 text-sm mt-1">{errors.youtube_url}</p>}
          </div>

          {/* Duration and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration" className="text-white">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 8:45"
                className="bg-slate-800/50 border-purple-500/30 text-white"
              />
              {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration}</p>}
            </div>

            <div>
              <Label htmlFor="category" className="text-white">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-slate-800/50 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-purple-500/30">
                  <SelectItem value="getting_started" className="text-white">Getting Started</SelectItem>
                  <SelectItem value="features" className="text-white">Features</SelectItem>
                  <SelectItem value="dao" className="text-white">DAO & Governance</SelectItem>
                  <SelectItem value="rewards" className="text-white">Rewards & Tokens</SelectItem>
                  <SelectItem value="skills" className="text-white">Skills Marketplace</SelectItem>
                  <SelectItem value="communities" className="text-white">Communities</SelectItem>
                  <SelectItem value="other" className="text-white">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Display Order */}
          <div>
            <Label htmlFor="order" className="text-white">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              className="bg-slate-800/50 border-purple-500/30 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <Label className="text-white">Thumbnail Image *</Label>
            <div className="mt-2">
              {formData.thumbnail_url ? (
                <div className="relative inline-block">
                  <img
                    src={formData.thumbnail_url}
                    alt="Thumbnail"
                    className="w-full max-w-md h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-purple-500/30 rounded-lg cursor-pointer hover:bg-slate-800/50">
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">Click to upload thumbnail</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleThumbnailUpload(file);
                    }}
                  />
                </label>
              )}
            </div>
            {errors.thumbnail && <p className="text-red-400 text-sm mt-1">{errors.thumbnail}</p>}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-300 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isUploadingThumbnail}
              className="border-purple-500/30 text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploadingThumbnail}
              className="bg-gradient-to-r from-purple-600 to-pink-500"
            >
              {isSubmitting ? 'Adding...' : 'Add Video'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
