import React, { useState, useEffect } from 'react';
import { Course } from '@/entities/Course';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Link as LinkIcon, FileVideo, FileText, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Removed createCourseUploadCheckout import as per outline; now invoked via base44.functions
// import { createCourseUploadCheckout } from '@/functions/createCourseUploadCheckout';

export default function CreateCourseModal({ isOpen, onClose, user, onCourseCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: [],
    price_amount: 0,
    currency: 'USD',
    external_url: '',
    internal_media_urls: [],
    thumbnail_url: '',
    duration_hours: '',
    difficulty_level: 'all_levels',
    what_you_will_learn: [''],
    requirements: [''],
    target_audience: ''
  });

  const [currentTag, setCurrentTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});

  const [eligibilityData, setEligibilityData] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Renamed from eligibilityDisplayError to eligibilityError
  const [eligibilityError, setEligibilityError] = useState('');

  // Check eligibility when modal opens
  useEffect(() => {
    if (isOpen && user) {
      checkEligibility();
    } else if (!isOpen) {
      // Reset state when modal closes
      setEligibilityData(null);
      setCheckingEligibility(true);
      setErrors({});
      setEligibilityError(''); // Clear eligibility error
      setFormData({
        title: '',
        description: '',
        category: '',
        tags: [],
        price_amount: 0,
        currency: 'USD',
        external_url: '',
        internal_media_urls: [],
        thumbnail_url: '',
        duration_hours: '',
        difficulty_level: 'all_levels',
        what_you_will_learn: [''],
        requirements: [''],
        target_audience: ''
      });
      setCurrentTag('');
      setIsUploading(false);
      setUploadProgress({});
      setIsSubmitting(false); // Also reset isSubmitting state
    }
  }, [isOpen, user]);

  const checkEligibility = async () => {
    try {
      setCheckingEligibility(true);
      setErrors((prev) => ({ ...prev, eligibility: undefined })); // Clear general eligibility error
      setEligibilityError(''); // Clear specific display error message
      const { data } = await base44.functions.invoke('checkCourseUploadEligibility');
      setEligibilityData(data);

      if (!data.canUpload) {
        setEligibilityError(
          `You've reached your monthly upload limit (${data.monthlyLimit === Infinity ? "unlimited" : data.monthlyLimit} courses/month on ${data.planLabel} plan).`
        );
      }
    } catch (error) {
      console.error('Failed to check eligibility:', error);
      // Set a general error for form-level display, and specific display error
      setErrors((prev) => ({ ...prev, eligibility: 'Failed to check upload eligibility. Please try again.' }));
      setEligibilityError('Failed to check upload eligibility. Please try again.');
      setEligibilityData({
        canUpload: false,
        monthlyLimit: 0,
        coursesUploadedThisMonth: 0,
        remaining: 0,
        planLabel: 'Unknown'
      }); // Set a default restricted state on error
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleUpgrade = async (plan) => {
    try {
      setIsSubmitting(true);

      const priceIds = {
        tutor: 'price_1SMpNc2KsMoELOOVBkl4qyZz',
        master: 'price_1SMpVI2KsMoELOOVJqMRczhm'
      };

      // Changed to use base44.functions.invoke
      const response = await base44.functions.invoke('createCourseUploadCheckout', {
        priceId: priceIds[plan],
        userEmail: user.email
      });

      if (response.data && response.data.url) {
        // Open in new window
        window.open(response.data.url, '_blank');
      } else {
        throw new Error("No checkout URL returned.");
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'health', label: 'Health & Fitness' },
  { value: 'languages', label: 'Languages' },
  { value: 'personal_development', label: 'Personal Development' },
  { value: 'other', label: 'Other' }];


  const difficultyLevels = [
  { value: 'all_levels', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }];


  const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'QFLOW', label: '$EQOFLO' }];


  const handleFileUpload = async (file, type) => {
    try {
      setIsUploading(true);
      setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
      setErrors((prev) => ({ ...prev, upload: undefined })); // Clear previous upload error

      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      if (type === 'thumbnail') {
        setFormData((prev) => ({ ...prev, thumbnail_url: file_url }));
      } else if (type === 'media') {
        setFormData((prev) => ({
          ...prev,
          internal_media_urls: [...prev.internal_media_urls, file_url]
        }));
      }

      setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
      setTimeout(() => {
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      setErrors((prev) => ({ ...prev, upload: 'Failed to upload file. Please try again.' }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove)
    }));
  };

  const handleRemoveMedia = (urlToRemove) => {
    setFormData((prev) => ({
      ...prev,
      internal_media_urls: prev.internal_media_urls.filter((url) => url !== urlToRemove)
    }));
  };

  const handleAddLearningObjective = () => {
    setFormData((prev) => ({
      ...prev,
      what_you_will_learn: [...prev.what_you_will_learn, '']
    }));
  };

  const handleUpdateLearningObjective = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      what_you_will_learn: prev.what_you_will_learn.map((item, i) => i === index ? value : item)
    }));
  };

  const handleRemoveLearningObjective = (index) => {
    setFormData((prev) => ({
      ...prev,
      what_you_will_learn: prev.what_you_will_learn.filter((_, i) => i !== index)
    }));
  };

  const handleAddRequirement = () => {
    setFormData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const handleUpdateRequirement = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.map((item, i) => i === index ? value : item)
    }));
  };

  const handleRemoveRequirement = (index) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.thumbnail_url) newErrors.thumbnail = 'Thumbnail image is required';
    if (!formData.external_url && formData.internal_media_urls.length === 0) {
      newErrors.content = 'Please provide either an external URL or upload course materials';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors

    // Re-check eligibility before submitting to ensure up-to-date status
    await checkEligibility();

    // Check eligibility again after potential update from backend, using the updated eligibilityData
    if (!eligibilityData?.canUpload) {
      setErrors((prev) => ({
        ...prev,
        submit: eligibilityError || `You've reached your monthly upload limit. Please upgrade to upload more courses.`
      }));
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsUploading(true); // This variable now also acts as a general submission loading indicator for course creation

      // Filter out empty learning objectives and requirements
      const cleanedData = {
        ...formData,
        what_you_will_learn: formData.what_you_will_learn.filter((item) => item.trim() !== ''),
        requirements: formData.requirements.filter((item) => item.trim() !== ''),
        creator_email: user.email,
        creator_name: user.full_name,
        creator_avatar: user.avatar_url,
        upload_plan_tier: user.course_upload_plan || 'free',
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : undefined
      };

      await Course.create(cleanedData);

      if (onCourseCreated) {
        onCourseCreated();
      }

      onClose();

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        tags: [],
        price_amount: 0,
        currency: 'USD',
        external_url: '',
        internal_media_urls: [],
        thumbnail_url: '',
        duration_hours: '',
        difficulty_level: 'all_levels',
        what_you_will_learn: [''],
        requirements: [''],
        target_audience: ''
      });
    } catch (error) {
      console.error('Failed to create course:', error);
      setErrors((prev) => ({ ...prev, submit: 'Failed to create course. Please try again.' }));
    } finally {
      setIsUploading(false); // Reset general submission loading indicator
    }
  };

  // The initial eligibility check rendering moved here as a standalone check
  if (checkingEligibility) {
    return (
      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}>

            <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}>

              <Card className="dark-card">
                <CardContent className="py-8">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin h-12 w-12 text-purple-500 mb-4" />
                    <p className="text-gray-400">Checking eligibility...</p>
                    {errors.eligibility &&
                  <p className="text-red-400 text-sm mt-2 text-center">{errors.eligibility}</p>
                  }
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>);

  }

  return (
    <AnimatePresence>
      {isOpen &&
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
        style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
        }}
        onClick={onClose} // Closes modal when clicking backdrop
      >
          <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-4xl my-8"
          onClick={(e) => e.stopPropagation()} // Prevents modal from closing when clicking inside
        >
            {/* Replaced DialogContent with Card, applying original styling */}
            <Card className="dark-card max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-white">List Your Course</CardTitle>
                  <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <CardDescription className="text-gray-400">
                  Share your knowledge with the EqoFlow community
                </CardDescription>
                {/* Updated eligibility display badges as per outline */}
                <div className="flex items-center gap-4 mt-4">
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                    {user.course_upload_plan === 'free' && 'Free Plan'}
                    {user.course_upload_plan === 'tutor' && 'Tutor Plan'}
                    {user.course_upload_plan === 'master' && 'Master Tutor Plan'}
                  </Badge>
                  <span className="text-sm text-gray-400">
                    {eligibilityData?.planLabel === 'Free' && `${eligibilityData?.coursesUploadedThisMonth || 0}/${eligibilityData?.monthlyLimit} uploads this month (${eligibilityData?.remaining} remaining)`}
                    {eligibilityData?.planLabel === 'Tutor' && `${eligibilityData?.coursesUploadedThisMonth || 0}/${eligibilityData?.monthlyLimit} uploads this month (${eligibilityData?.remaining} remaining)`}
                    {eligibilityData?.planLabel === 'Master' && 'Unlimited uploads'}
                  </span>
                </div>
              </CardHeader>

              <CardContent>
                {/* Display upgrade message based on eligibilityData and eligibilityError */}
                {eligibilityData && !eligibilityData.canUpload && eligibilityError &&
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-300 mb-4">{eligibilityError}</p>
                    <p className="text-white font-semibold mb-3">Upgrade your plan to upload more courses:</p>

                    <div className="space-y-3">
                      {/* Tutor Plan */}
                      <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-semibold">Tutor Plan</h4>
                          <p className="text-gray-400 text-sm">$9.99/month - 5 courses per month</p>
                        </div>
                        <Button
                      onClick={() => handleUpgrade('tutor')}
                      disabled={isSubmitting} // Use new isSubmitting state
                      className="bg-purple-600 hover:bg-purple-700">

                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy Now'}
                        </Button>
                      </div>

                      {/* Master Plan */}
                      <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-semibold">Master Plan</h4>
                          <p className="text-gray-400 text-sm">$24.99/month - Unlimited courses</p>
                        </div>
                        <Button
                      onClick={() => handleUpgrade('master')}
                      disabled={isSubmitting} // Use new isSubmitting state
                      className="bg-purple-600 hover:bg-purple-700">

                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy Now'}
                        </Button>
                      </div>
                    </div>
                  </div>
              }

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Basic Information</h3>

                    {/* Title */}
                    <div>
                      <Label htmlFor="title" className="text-white">Course Title *</Label>
                      <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Complete Web Development Bootcamp"
                      className="bg-slate-800/50 border-purple-500/30 text-white" />

                      {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor="description" className="text-white">Description *</Label>
                      <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Provide a detailed description of your course..."
                      rows={4}
                      className="bg-slate-800/50 border-purple-500/30 text-white" />

                      {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
                    </div>

                    {/* Category and Difficulty */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category" className="text-white">Category *</Label>
                        <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>

                          <SelectTrigger className="bg-slate-800/50 border-purple-500/30 text-white">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-purple-500/30">
                            {categories.map((cat) =>
                          <SelectItem key={cat.value} value={cat.value} className="text-white">
                                {cat.label}
                              </SelectItem>
                          )}
                          </SelectContent>
                        </Select>
                        {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
                      </div>

                      <div>
                        <Label htmlFor="difficulty" className="text-white">Difficulty Level</Label>
                        <Select
                        value={formData.difficulty_level}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, difficulty_level: value }))}>

                          <SelectTrigger className="bg-slate-800/50 border-purple-500/30 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-purple-500/30">
                            {difficultyLevels.map((level) =>
                          <SelectItem key={level.value} value={level.value} className="text-white">
                                {level.label}
                              </SelectItem>
                          )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <Label htmlFor="tags" className="text-white">Tags</Label>
                      <div className="flex gap-2">
                        <Input
                        id="tags"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Add a tag..."
                        className="bg-slate-800/50 border-purple-500/30 text-white" />

                        <Button type="button" onClick={handleAddTag} variant="outline" className="border-purple-500/30">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <AnimatePresence>
                          {formData.tags.map((tag) =>
                        <motion.div
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}>

                              <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                                {tag}
                                <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-2 hover:text-white">

                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            </motion.div>
                        )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Pricing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price" className="text-white">Price (0 for free)</Label>
                        <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price_amount}
                        onChange={(e) => setFormData((prev) => ({ ...prev, price_amount: parseFloat(e.target.value) || 0 }))}
                        className="bg-slate-800/50 border-purple-500/30 text-white" />

                      </div>

                      <div>
                        <Label htmlFor="currency" className="text-white">Currency</Label>
                        <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}>

                          <SelectTrigger className="bg-slate-800/50 border-purple-500/30 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-purple-500/30">
                            {currencies.map((curr) =>
                          <SelectItem key={curr.value} value={curr.value} className="text-white">
                                {curr.label}
                              </SelectItem>
                          )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Note: EqoFlow takes a 10% platform fee on all course sales.
                    </p>
                  </div>

                  {/* Course Content */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Course Content</h3>

                    {/* Thumbnail */}
                    <div>
                      <Label className="text-white">Course Thumbnail *</Label>
                      <div className="mt-2">
                        {formData.thumbnail_url ?
                      <div className="relative inline-block">
                            <img
                          src={formData.thumbnail_url}
                          alt="Thumbnail"
                          className="w-full max-w-md h-48 object-cover rounded-lg" />

                            <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, thumbnail_url: '' }))}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600">

                              <X className="w-4 h-4" />
                            </button>
                          </div> :

                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-purple-500/30 rounded-lg cursor-pointer hover:bg-slate-800/50">
                            <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-400">Click to upload thumbnail</span>
                            <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleFileUpload(file, 'thumbnail');
                          }} />

                          </label>
                      }
                      </div>
                      {errors.thumbnail && <p className="text-red-400 text-sm mt-1">{errors.thumbnail}</p>}
                    </div>

                    {/* External URL */}
                    <div>
                      <Label htmlFor="external_url" className="text-white flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        External Course Link
                      </Label>
                      <Input
                      id="external_url"
                      value={formData.external_url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, external_url: e.target.value }))}
                      placeholder="https://youtube.com/... or https://udemy.com/..."
                      className="bg-slate-800/50 border-purple-500/30 text-white" />

                      <p className="text-xs text-gray-400 mt-1">
                        Link to where your course is hosted (YouTube, Udemy, your website, etc.)
                      </p>
                    </div>

                    {/* Internal Media Upload */}
                    <div>
                      <Label className="text-white flex items-center gap-2">
                        <FileVideo className="w-4 h-4" />
                        Upload Course Materials (Optional)
                      </Label>
                      <div className="mt-2 space-y-2">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-500/30 rounded-lg cursor-pointer hover:bg-slate-800/50">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-400">Click to upload videos, PDFs, or documents</span>
                          <input
                          type="file"
                          accept="video/*,.pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleFileUpload(file, 'media');
                          }} />

                        </label>

                        {formData.internal_media_urls.length > 0 &&
                      <div className="space-y-2">
                            {formData.internal_media_urls.map((url, index) =>
                        <div key={index} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-purple-400" />
                                  <span className="text-sm text-white truncate max-w-xs">
                                    {url.split('/').pop()}
                                  </span>
                                </div>
                                <button
                            type="button"
                            onClick={() => handleRemoveMedia(url)}
                            className="text-red-400 hover:text-red-300">

                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                        )}
                          </div>
                      }
                      </div>
                      {errors.content && <p className="text-red-400 text-sm mt-1">{errors.content}</p>}
                    </div>

                    {/* Duration */}
                    <div>
                      <Label htmlFor="duration" className="text-white">Course Duration (hours)</Label>
                      <Input
                      id="duration"
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.duration_hours}
                      onChange={(e) => setFormData((prev) => ({ ...prev, duration_hours: e.target.value }))}
                      placeholder="e.g., 10.5"
                      className="bg-slate-800/50 border-purple-500/30 text-white" />

                    </div>
                  </div>

                  {/* Learning Objectives */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">What You'll Learn</h3>
                    <div className="space-y-2">
                      {formData.what_you_will_learn.map((objective, index) =>
                    <div key={index} className="flex gap-2">
                          <Input
                        value={objective}
                        onChange={(e) => handleUpdateLearningObjective(index, e.target.value)}
                        placeholder="e.g., Build responsive websites with HTML & CSS"
                        className="bg-slate-800/50 border-purple-500/30 text-white" />

                          <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveLearningObjective(index)}
                        className="border-purple-500/30">

                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                    )}
                      <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddLearningObjective}
                      className="bg-background text-slate-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:bg-accent hover:text-accent-foreground h-10 border-purple-500/30">

                        <Plus className="w-4 h-4 mr-2" />
                        Add Learning Objective
                      </Button>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Requirements</h3>
                    <div className="space-y-2">
                      {formData.requirements.map((req, index) =>
                    <div key={index} className="flex gap-2">
                          <Input
                        value={req}
                        onChange={(e) => handleUpdateRequirement(index, e.target.value)}
                        placeholder="e.g., Basic computer skills"
                        className="bg-slate-800/50 border-purple-500/30 text-white" />

                          <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveRequirement(index)}
                        className="border-purple-500/30">

                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                    )}
                      <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddRequirement}
                      className="bg-background text-black px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:bg-accent hover:text-accent-foreground h-10 border-purple-500/30">

                        <Plus className="w-4 h-4 mr-2" />
                        Add Requirement
                      </Button>
                    </div>
                  </div>

                  {/* Target Audience */}
                  <div>
                    <Label htmlFor="target_audience" className="text-white">Target Audience</Label>
                    <Textarea
                    id="target_audience"
                    value={formData.target_audience}
                    onChange={(e) => setFormData((prev) => ({ ...prev, target_audience: e.target.value }))}
                    placeholder="Who is this course for? e.g., Beginners who want to learn web development"
                    rows={2}
                    className="bg-slate-800/50 border-purple-500/30 text-white" />

                  </div>

                  {/* Upload Progress */}
                  {Object.keys(uploadProgress).length > 0 &&
                <div className="space-y-2">
                      {Object.entries(uploadProgress).map(([filename, progress]) =>
                  <div key={filename} className="space-y-1">
                          <div className="flex justify-between text-sm text-gray-400">
                            <span>{filename}</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }} />

                          </div>
                        </div>
                  )}
                    </div>
                }

                  {/* Error Message */}
                  {errors.submit &&
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <p className="text-red-300 text-sm">{errors.submit}</p>
                    </div>
                }

                  {/* Submit Buttons */}
                  <div className="flex gap-3 justify-end pt-4">
                    <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isUploading || isSubmitting} // Use isSubmitting for upgrade buttons
                    className="bg-background text-slate-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:bg-accent hover:text-accent-foreground h-10 border-purple-500/30">

                      Cancel
                    </Button>
                    <Button
                    type="submit"
                    disabled={isUploading || eligibilityData && !eligibilityData.canUpload || isSubmitting}
                    className="bg-gradient-to-r from-purple-600 to-pink-500">

                      {isUploading ? 'Creating...' : 'List Course'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}