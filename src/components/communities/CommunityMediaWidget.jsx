
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Upload,
  Video,
  FileAudio,
  FileText,
  Trash2,
  Play,
  Eye,
  Loader2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  X,
  Star // Import Star icon
} from 'lucide-react';
import { CommunityResource } from '@/entities/CommunityResource';
import { UploadFile } from '@/integrations/Core';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleCommunityResourceFeature } from '@/functions/toggleCommunityResourceFeature';

export default function CommunityMediaWidget({ community, user, isCreator }) {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set(['featured']));
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);

  // New state variables for video modal
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState(null);

  // New state for thumbnail upload
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const thumbnailInputRef = useRef(null);
  const [featuringResourceId, setFeaturingResourceId] = useState(null);

  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    category: '',
    media_type: 'video',
    file: null,
    thumbnail_file: null // Added thumbnail_file
  });

  const loadResources = useCallback(async () => {
    if (!community?.id) return;

    try {
      setIsLoading(true);
      const fetchedResources = await CommunityResource.filter(
        { community_id: community.id },
        '-created_date'
      );
      setResources(fetchedResources);

      // Extract unique categories
      const uniqueCategories = [...new Set(fetchedResources.map((r) => r.category).filter(Boolean))];
      setCategories(['featured', ...uniqueCategories.sort()]);
    } catch (error) {
      console.error('Error loading community resources:', error);
    } finally {
      setIsLoading(false);
    }
  }, [community?.id]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setNewResource((prev) => ({ ...prev, file }));

    // Auto-detect media type
    if (file.type.startsWith('video/')) {
      setNewResource((prev) => ({ ...prev, media_type: 'video' }));
    } else if (file.type.startsWith('audio/')) {
      setNewResource((prev) => ({ ...prev, media_type: 'audio' }));
    } else {
      setNewResource((prev) => ({ ...prev, media_type: 'document' }));
    }
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewResource((prev) => ({ ...prev, thumbnail_file: file }));
  };

  const handleUpload = async () => {
    if (!newResource.file || !newResource.title.trim() || !newResource.category.trim()) {
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file: newResource.file });

      let thumbnail_url = null;
      if (newResource.thumbnail_file) {
        setIsUploadingThumbnail(true);
        const thumbnailResult = await UploadFile({ file: newResource.thumbnail_file });
        thumbnail_url = thumbnailResult.file_url;
      }

      await CommunityResource.create({
        community_id: community.id,
        title: newResource.title,
        description: newResource.description,
        media_url: file_url,
        media_type: newResource.media_type,
        category: newResource.category,
        file_size: newResource.file.size,
        thumbnail_url: thumbnail_url // Pass thumbnail_url
      });

      setShowUploadModal(false);
      setNewResource({
        title: '',
        description: '',
        category: '',
        media_type: 'video',
        file: null,
        thumbnail_file: null // Reset thumbnail file
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''; // Clear thumbnail input

      await loadResources();
    } catch (error) {
      console.error('Error uploading resource:', error);
      alert('Failed to upload resource. Please try again.');
    } finally {
      setIsUploading(false);
      setIsUploadingThumbnail(false); // Ensure thumbnail upload state is also reset
    }
  };

  // This handleEdit is not fully implemented in the provided code,
  // but it's part of the original structure. It would need a new
  // dialog similar to the upload one for full functionality.
  const handleEdit = (resource) => {
    setEditingResource(resource);
    setShowEditModal(true);
    // You would typically populate the edit form with `resource` data here
  };

  const handleToggleFeature = async (resource) => {
    setFeaturingResourceId(resource.id);
    try {
      await toggleCommunityResourceFeature({
        resourceId: resource.id,
        isFeatured: !resource.is_featured
      });
      await loadResources(); // Refresh the list to show changes
    } catch (error) {
      console.error("Failed to toggle feature status", error);
      alert("Could not update the item. Please try again.");
    } finally {
      setFeaturingResourceId(null);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      await CommunityResource.delete(resourceId);
      await loadResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource. Please try again.');
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getResourcesByCategory = (category) => {
    if (category === 'featured') {
      return resources.filter((r) => r.is_featured);
    }
    return resources.filter((r) => r.category === category);
  };

  const getMediaIcon = (mediaType) => {
    switch (mediaType) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <FileAudio className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // New function for handling video playback
  const handlePlayVideo = (videoUrl) => {
    setCurrentPlayingVideo(videoUrl);
    setShowVideoModal(true);
  };

  if (isLoading) {
    return (
      <Card className="dark-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Content Library
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="dark-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Content Library
            </CardTitle>
            {isCreator && (
              <Button
                onClick={() => setShowUploadModal(true)}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No content available yet</p>
              {isCreator && (
                <p className="text-xs mt-1">Upload your first resource to get started</p>
              )}
            </div>
          ) : (
            categories.map((category) => {
              const categoryResources = getResourcesByCategory(category);
              if (categoryResources.length === 0 && category !== 'featured') return null;

              const isExpanded = expandedCategories.has(category);

              return (
                <div key={category} className="space-y-2">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center gap-2 w-full text-left text-white hover:text-purple-400 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium capitalize">
                      {category}
                    </span>
                    <Badge variant="outline" className="text-slate-50 px-2.5 py-0.5 text-xs font-semibold inline-flex items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      {categoryResources.length}
                    </Badge>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-6 space-y-2"
                      >
                        {categoryResources.map((resource) => (
                          <div
                            key={resource.id}
                            className="group relative flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                          >
                            {isCreator && (
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={() => handleDelete(resource.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                            
                            {isCreator && (
                               <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-8 h-6 w-6 p-0 text-gray-500 hover:text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                disabled={featuringResourceId === resource.id}
                                onClick={() => handleToggleFeature(resource)}
                              >
                                {featuringResourceId === resource.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Star className={`w-4 h-4 transition-colors ${resource.is_featured ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                                )}
                              </Button>
                            )}

                            <div 
                              className="flex-shrink-0 cursor-pointer"
                              onClick={() => {
                                if (resource.media_type === 'video') {
                                  handlePlayVideo(resource.media_url);
                                } else {
                                  window.open(resource.media_url, '_blank');
                                }
                              }}
                            >
                              {resource.media_type === 'video' && resource.thumbnail_url ? (
                                <div className="w-16 h-10 rounded-md overflow-hidden bg-black/20 relative">
                                  <img 
                                    src={resource.thumbnail_url} 
                                    alt="Video thumbnail" 
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="w-5 h-5 text-white drop-shadow-lg" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-16 h-10 rounded-md bg-black/30 flex items-center justify-center">
                                    <div className="text-purple-400">
                                        {getMediaIcon(resource.media_type)}
                                    </div>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">
                                {resource.title}
                              </p>
                              {resource.description && (
                                <p className="text-xs text-gray-500 truncate">
                                  {resource.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Eye className="w-3 h-3" />
                                  {resource.view_count || 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="dark-card sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Media File</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {newResource.file ? newResource.file.name : 'Choose File'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,audio/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Thumbnail Upload - Only show for videos */}
            {newResource.media_type === 'video' && (
              <div className="space-y-2">
                <Label className="text-white">Video Thumbnail (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {newResource.thumbnail_file ? newResource.thumbnail_file.name : 'Choose Thumbnail Image'}
                  </Button>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-400">Upload a custom thumbnail for your video to make it more appealing</p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-white">Title</Label>
              <Input
                value={newResource.title}
                onChange={(e) => setNewResource((prev) => ({ ...prev, title: e.target.value }))}
                className="bg-slate-950 border-purple-500/20 text-white"
                placeholder="Enter content title"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Description</Label>
              <Textarea
                value={newResource.description}
                onChange={(e) => setNewResource((prev) => ({ ...prev, description: e.target.value }))}
                className="bg-slate-950 border-purple-500/20 text-white h-20"
                placeholder="Brief description (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Category/Topic</Label>
              <Input
                value={newResource.category}
                onChange={(e) => setNewResource((prev) => ({ ...prev, category: e.target.value }))}
                className="bg-slate-950 border-purple-500/20 text-white"
                placeholder="e.g., 'Public Speaking Basics'"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Content Type</Label>
              <Select
                value={newResource.media_type}
                onValueChange={(value) => setNewResource((prev) => ({ ...prev, media_type: value }))}
              >
                <SelectTrigger className="bg-slate-950 border-purple-500/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-purple-500/20">
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio/Podcast</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                className="flex-1"
                disabled={isUploading || isUploadingThumbnail}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || isUploadingThumbnail || !newResource.file || !newResource.title.trim() || !newResource.category.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500"
              >
                {isUploading || isUploadingThumbnail ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isUploadingThumbnail ? 'Uploading Thumbnail...' : 'Uploading...'}
                  </>
                ) : (
                  'Upload Content'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Playback Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="dark-card sm:max-w-4xl max-w-[95vw] max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white">Video Player</DialogTitle>
              <Button
                onClick={() => setShowVideoModal(false)}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
          <div className="px-6 pb-6">
            {currentPlayingVideo && (
              <video
                src={currentPlayingVideo}
                controls
                autoPlay
                className="w-full h-auto max-h-[70vh] rounded-lg bg-black"
                style={{ aspectRatio: '16/9' }}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
