import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MobileSelect as Select, 
  MobileSelectContent as SelectContent, 
  MobileSelectItem as SelectItem, 
  MobileSelectTrigger as SelectTrigger, 
  MobileSelectValue as SelectValue 
} from '@/components/ui/mobile-select';
import { Badge } from '@/components/ui/badge';
import { X, Loader, DollarSign, Coins, Zap, Info, CreditCard, Upload, Plus, Trash2, ImagePlus, Sparkles } from 'lucide-react';
import { UploadFile } from '@/integrations/Core';

export default function CreateCommunityModal({ user, onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    token_name: '',
    token_symbol: '',
    token_total_supply: 1000000,
    // New pricing fields
    pricing_model: 'free', // 'free', 'paid'
    membership_fee: 0,
    payment_method: 'eqoflow', // 'eqoflow', 'fiat' - Changed from qflow to eqoflow
    currency: 'USD', // For fiat payments
    subscription_type: 'one_time', // 'one_time', 'monthly', 'yearly'
    free_trial_days: 0, // Optional free trial period
    tags: [], // Added tags to state
    access_type: 'public', // NEW: Add access type
    landing_page_perks: [], // NEW: Landing page perks
    landing_page_images: [], // NEW: Landing page images
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerFilePreview] = useState(null);
  const [mediaGallery, setMediaGallery] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const [currentTag, setCurrentTag] = useState(''); // State for current tag input
  const [tagError, setTagError] = useState(null); // State for tag input error

  // NEW: Landing page states
  const [currentPerk, setCurrentPerk] = useState({ title: '', description: '' });
  const [isUploadingLandingImage, setIsUploadingLandingImage] = useState(false);

  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const landingImageInputRef = useRef(null); // NEW: Ref for landing page images

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(previewUrl);
    } else if (type === 'banner') {
      setBannerFile(file);
      setBannerFilePreview(previewUrl);
    }
  };

  const handleMediaFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsMediaUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      setMediaGallery((prev) => [...prev, { url: file_url, type: fileType }]);
    } catch (error) {
      console.error("Error uploading media:", error);
      alert("There was an error uploading your media file. Please try again.");
    } finally {
      setIsMediaUploading(false);
    }
  };

  const handleRemoveMedia = (indexToRemove) => {
    setMediaGallery((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTokenSupplyChange = (value) => {
    const supply = parseInt(value, 10);
    if (!isNaN(supply) && supply > 0) {
      setFormData((prev) => ({ ...prev, token_total_supply: supply }));
    } else if (value === '') {
      setFormData((prev) => ({ ...prev, token_total_supply: 0 }));
    }
  };

  const addTag = () => {
    const trimmedTag = currentTag.trim().toLowerCase();
    setTagError(null);

    if (formData.tags.length >= 5) {
      setTagError("You can add a maximum of 5 tags.");
      return;
    }

    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      if (trimmedTag.length > 25) {
        setTagError("Tags cannot be longer than 25 characters.");
        return;
      }
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, trimmedTag] }));
      setCurrentTag("");
    } else if (formData.tags.includes(trimmedTag)) {
      setTagError("Tag already exists.");
    }
  };

  const removeTag = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove)
    }));
  };

  // NEW: Landing page perk functions
  const addPerk = () => {
    if (!currentPerk.title.trim() || !currentPerk.description.trim()) {
      alert("Please enter both a title and description for the perk.");
      return;
    }
    if (formData.landing_page_perks.length >= 6) {
      alert("Maximum 6 perks allowed.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      landing_page_perks: [...prev.landing_page_perks, currentPerk]
    }));
    setCurrentPerk({ title: '', description: '' });
  };

  const removePerk = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      landing_page_perks: prev.landing_page_perks.filter((_, index) => index !== indexToRemove)
    }));
  };

  // NEW: Landing page image upload
  const handleLandingImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (formData.landing_page_images.length >= 4) {
      alert("Maximum 4 images allowed for landing page.");
      return;
    }

    setIsUploadingLandingImage(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        landing_page_images: [...prev.landing_page_images, file_url]
      }));
    } catch (error) {
      console.error("Error uploading landing page image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingLandingImage(false);
    }
  };

  const removeLandingImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      landing_page_images: prev.landing_page_images.filter((_, index) => index !== indexToRemove)
    }));
  };

  // NEW: Function to generate invite code
  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsUploading(true);

    let communityData = { ...formData, media_gallery: mediaGallery }; // tags included from formData

    // NEW: Generate invite code if private
    if (communityData.access_type === 'private_invite') {
      communityData.invite_code = generateInviteCode();
    }

    try {
      if (logoFile) {
        const { file_url } = await UploadFile({ file: logoFile });
        communityData.logo_url = file_url;
      }
      if (bannerFile) {
        const { file_url } = await UploadFile({ file: bannerFile });
        communityData.banner_url = file_url;
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("There was an error uploading your images. Please try again.");
      setIsSubmitting(false);
      setIsUploading(false);
      return;
    }

    setIsUploading(false);
    await onSubmit(communityData); // Changed onSubmit to onCommunityCreated
    setIsSubmitting(false);
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const currencies = [
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'GBP', symbol: '£', label: 'British Pound' },
    { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' }
  ];

  // const maxSteps = 2; // Always 2 steps - OLD
  // NEW: maxSteps is now 3, implicitly handled by step advancement logic

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" style={{
      paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">

        <Card className="dark-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Create a New Community</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-purple-600' : 'bg-gray-600'}`}>
                  <span className="text-white text-sm">1</span>
                </div>
                <div className={`h-1 w-12 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-600'}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-purple-600' : 'bg-gray-600'}`}>
                  <span className="text-white text-sm">2</span>
                </div>
                {/* NEW: Step 3 Indicator */}
                <div className={`h-1 w-12 ${step >= 3 ? 'bg-purple-600' : 'bg-gray-600'}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-purple-600' : 'bg-gray-600'}`}>
                  <span className="text-white text-sm">3</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="relative overflow-hidden">
                {/* Step 1: Community Details */}
                <motion.div
                  animate={{ x: step === 1 ? '0%' : '-100%' }}
                  transition={{ ease: 'easeInOut' }}
                  className={`space-y-4 ${step !== 1 ? 'absolute top-0 left-0 w-full' : ''}`}>

                  <p className="text-sm text-gray-400">First, let's set up your community's identity.</p>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Community Name</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Quantum Gamers"
                      required
                      className="bg-black/20 border-purple-500/20 text-white" />

                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="What is your community about?"
                      required
                      className="bg-black/20 border-purple-500/20 text-white h-24" />

                  </div>

                  {/* Tags Input Section */}
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium text-gray-300">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) =>
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-sm">

                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="ml-1.5 text-purple-200 hover:text-white">

                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={currentTag}
                        onChange={(e) => {
                          setCurrentTag(e.target.value);
                          if (tagError) setTagError(null);
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder={formData.tags.length >= 5 ? "5 tags maximum" : "Add relevant tags (e.g., ai, gaming, art)"}
                        className={`flex-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 ${tagError ? 'border-red-500' : ''}`}
                        disabled={formData.tags.length >= 5} />

                      <Button
                        type="button"
                        onClick={addTag}
                        size="sm"
                        variant="outline" className="bg-background text-slate-950 px-3 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 border-gray-600 hover:bg-gray-700"

                        disabled={formData.tags.length >= 5}>

                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {tagError && <p className="text-xs text-red-400 mt-1">{tagError}</p>}
                    <div className="flex items-start gap-2 p-2 mt-1 bg-purple-900/20 border border-purple-500/20 rounded-md">
                      <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-purple-300">
                        Adding relevant tags helps your community get discovered organically. To guarantee visibility, you can pay to feature it after creation.
                      </p>
                    </div>
                  </div>

                  {/* NEW: Access Type Selection */}
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium text-gray-300">Community Access</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div
                        onClick={() => setFormData((prev) => ({ ...prev, access_type: 'public' }))}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.access_type === 'public' ?
                            'border-green-500/50 bg-green-500/10' :
                            'border-gray-500/20 bg-black/20 hover:border-gray-400/30'}`
                        }>

                        <h4 className="text-sm font-semibold text-white mb-1">Public</h4>
                        <p className="text-xs text-gray-400">Visible to everyone on the EqoChambers page</p>
                      </div>
                      <div
                        onClick={() => setFormData((prev) => ({ ...prev, access_type: 'private_invite' }))}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.access_type === 'private_invite' ?
                            'border-purple-500/50 bg-purple-500/10' :
                            'border-gray-500/20 bg-black/20 hover:border-gray-400/30'}`
                        }>

                        <h4 className="text-sm font-semibold text-white mb-1">Private (Invite Only)</h4>
                        <p className="text-xs text-gray-400">Hidden from public, join via invite link only</p>
                      </div>
                    </div>
                  </div>

                  {/* Image Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">Logo (Optional)</label>
                      <input type="file" ref={logoInputRef} onChange={(e) => handleFileChange(e, 'logo')} accept="image/*" className="hidden" />
                      <div
                        onClick={() => logoInputRef.current.click()}
                        className="aspect-square bg-black/20 border-2 border-dashed border-purple-500/30 rounded-xl flex items-center justify-center cursor-pointer hover:bg-black/30">

                        {logoPreview ?
                          <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover rounded-xl" /> :

                          <div className="text-center text-gray-400">
                            <Upload className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-xs">Click to upload logo</p>
                          </div>
                        }
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">Banner (Optional)</label>
                      <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" className="hidden" />
                      <div
                        onClick={() => bannerInputRef.current.click()}
                        className="aspect-square bg-black/20 border-2 border-dashed border-purple-500/30 rounded-xl flex items-center justify-center cursor-pointer hover:bg-black/30">

                        {bannerPreview ?
                          <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover rounded-xl" /> :

                          <div className="text-center text-gray-400">
                            <Upload className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-xs">Click to upload banner</p>
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  {/* Optional Media Gallery on creation */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Media Gallery (Optional)</label>
                    <input type="file" ref={mediaInputRef} onChange={handleMediaFileChange} accept="image/*,video/*" className="hidden" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 rounded-lg bg-black/20 border border-purple-500/20">
                      {mediaGallery.map((media, index) =>
                        <div key={index} className="relative group aspect-square bg-black/20 rounded-md">
                          {media.type === 'image' ?
                            <img src={media.url} alt={`Media ${index}`} className="w-full h-full object-cover rounded-md" /> :

                            <video src={media.url} controls muted loop playsInline className="w-full h-full object-cover rounded-md" />
                          }
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveMedia(index)}>

                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      <div
                        onClick={() => !isMediaUploading && mediaInputRef.current.click()}
                        className="aspect-square bg-black/20 border-2 border-dashed border-purple-500/30 rounded-xl flex items-center justify-center cursor-pointer hover:bg-black/30">

                        {isMediaUploading ?
                          <Loader className="w-6 h-6 animate-spin text-gray-400" /> :

                          <div className="text-center text-gray-400">
                            <Upload className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-xs">Add Media</p>
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!formData.name || !formData.description}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500">

                    Next: Design Landing Page
                  </Button>
                </motion.div>

                {/* NEW: Step 2: Landing Page Design */}
                <motion.div
                  animate={{ x: step === 2 ? '0%' : step < 2 ? '100%' : '-100%' }}
                  transition={{ ease: 'easeInOut' }}
                  className={`space-y-6 ${step !== 2 ? 'absolute top-0 left-0 w-full' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <p className="text-sm text-gray-400">Customize what non-members see when they visit your community.</p>
                  </div>

                  {/* Landing Page Perks */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Community Perks & Benefits (Max 6)
                    </label>

                    {formData.landing_page_perks.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {formData.landing_page_perks.map((perk, index) => (
                          <div key={index} className="p-3 bg-black/30 border border-purple-500/20 rounded-lg">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="text-white font-medium text-sm mb-1">{perk.title}</h4>
                                <p className="text-gray-400 text-xs">{perk.description}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                                onClick={() => removePerk(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {formData.landing_page_perks.length < 6 && (
                      <div className="space-y-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <Input
                          placeholder="Perk title (e.g., 'Exclusive Content')"
                          value={currentPerk.title}
                          onChange={(e) => setCurrentPerk(prev => ({ ...prev, title: e.target.value }))}
                          className="bg-black/20 border-purple-500/20 text-white"
                        />
                        <Textarea
                          placeholder="Perk description (e.g., 'Access weekly tutorials and resources')"
                          value={currentPerk.description}
                          onChange={(e) => setCurrentPerk(prev => ({ ...prev, description: e.target.value }))}
                          className="bg-black/20 border-purple-500/20 text-white h-20"
                        />
                        <Button
                          type="button"
                          onClick={addPerk}
                          variant="outline"
                          className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                          disabled={!currentPerk.title.trim() || !currentPerk.description.trim()}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Perk
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      {formData.landing_page_perks.length}/6 perks added
                    </p>
                  </div>

                  {/* Landing Page Images */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Landing Page Images (Max 4)
                    </label>
                    <input
                      type="file"
                      ref={landingImageInputRef}
                      onChange={handleLandingImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {formData.landing_page_images.map((imageUrl, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={imageUrl}
                            alt={`Landing ${index}`}
                            className="w-full h-full object-cover rounded-lg border border-purple-500/20"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeLandingImage(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}

                      {formData.landing_page_images.length < 4 && (
                        <div
                          onClick={() => !isUploadingLandingImage && landingImageInputRef.current.click()}
                          className="aspect-square bg-black/20 border-2 border-dashed border-purple-500/30 rounded-lg flex items-center justify-center cursor-pointer hover:bg-black/30"
                        >
                          {isUploadingLandingImage ? (
                            <Loader className="w-6 h-6 animate-spin text-gray-400" />
                          ) : (
                            <div className="text-center text-gray-400">
                              <ImagePlus className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-xs">Add Image</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {formData.landing_page_images.length}/4 images added. These will showcase your community to potential members.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-200">
                        These perks and images will be displayed on your community's landing page for non-members. If you skip this step, default perks will be shown.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                      Previous
                    </Button>
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500"
                    >
                      Next: Set Pricing
                    </Button>
                  </div>
                </motion.div>


                {/* Step 3: Pricing Model (formerly Step 2) */}
                <motion.div
                  animate={{ x: step === 3 ? '0%' : step < 3 ? '100%' : '-100%' }}
                  transition={{ ease: 'easeInOut' }}
                  className={`space-y-6 ${step !== 3 ? 'absolute top-0 left-0 w-full' : ''}`}>

                  <p className="text-sm text-gray-400">Choose how members will access your community.</p>

                  {/* Pricing Model Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() => setFormData((prev) => ({ ...prev, pricing_model: 'free' }))}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.pricing_model === 'free' ?
                          'border-green-500/50 bg-green-500/10' :
                          'border-gray-500/20 bg-black/20 hover:border-gray-400/30'}`
                      }>

                      <div className="flex items-center gap-3 mb-3">
                        <Zap className="w-6 h-6 text-green-400" />
                        <h3 className="text-lg font-semibold text-white">Free Community</h3>
                      </div>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Open to everyone</li>
                        <li>• Build engaged communities</li>
                        <li>• Monetize through other means</li>
                        <li>• Perfect for community building</li>
                      </ul>
                      {formData.pricing_model === 'free' &&
                        <Badge className="mt-3 bg-green-600/20 text-green-400">Selected</Badge>
                      }
                    </div>

                    <div
                      onClick={() => setFormData((prev) => ({ ...prev, pricing_model: 'paid' }))}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.pricing_model === 'paid' ?
                          'border-purple-500/50 bg-purple-500/10' :
                          'border-gray-500/20 bg-black/20 hover:border-gray-400/30'}`
                      }>

                      <div className="flex items-center gap-3 mb-3">
                        <DollarSign className="w-6 h-6 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">Paid Community</h3>
                      </div>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Exclusive access</li>
                        <li>• Generate recurring revenue</li>
                        <li>• Multiple payment options</li>
                        <li>• Premium member experience</li>
                      </ul>
                      {formData.pricing_model === 'paid' &&
                        <Badge className="mt-3 bg-purple-600/20 text-purple-400">Selected</Badge>
                      }
                    </div>
                  </div>

                  {/* Paid Community Options */}
                  {formData.pricing_model === 'paid' &&
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">

                      <h4 className="font-medium text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Payment Configuration
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Payment Method */}
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-2 block">Payment Method</label>
                          <Select
                            value={formData.payment_method}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, payment_method: value }))}>

                            <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-purple-500/20">
                              <SelectItem value="eqoflow" className="text-white">
                                <div className="flex items-center gap-2">
                                  <Coins className="w-4 h-4 text-yellow-400" />
                                  $EQOFLO Tokens
                                </div>
                              </SelectItem>
                              <SelectItem value="fiat" className="text-white">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-400" />
                                  Traditional Currency (USD/EUR/etc.)
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Subscription Type */}
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-2 block">Billing Frequency</label>
                          <Select
                            value={formData.subscription_type}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, subscription_type: value }))}>

                            <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-purple-500/20">
                              <SelectItem value="one_time" className="text-white">One-time Payment</SelectItem>
                              <SelectItem value="monthly" className="text-white">Monthly Subscription</SelectItem>
                              <SelectItem value="yearly" className="text-white">Yearly Subscription</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Membership Fee */}
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-2 block">
                            Membership Fee
                            {formData.payment_method === 'fiat' &&
                              <span className="text-gray-400 ml-1">
                                ({currencies.find((c) => c.code === formData.currency)?.symbol || '$'})
                              </span>
                            }
                            {formData.payment_method === 'eqoflow' &&
                              <span className="text-yellow-400 ml-1">($EQOFLO)</span>
                            }
                          </label>
                          <Input
                            type="number"
                            value={formData.membership_fee}
                            onChange={(e) => setFormData((prev) => ({ ...prev, membership_fee: parseFloat(e.target.value) || 0 }))}
                            placeholder="e.g., 10"
                            className="bg-black/20 border-purple-500/20 text-white" />

                        </div>

                        {/* Currency (for fiat) */}
                        {formData.payment_method === 'fiat' &&
                          <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">Currency</label>
                            <Select
                              value={formData.currency}
                              onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}>

                              <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-black border-purple-500/20">
                                {currencies.map((currency) =>
                                  <SelectItem key={currency.code} value={currency.code} className="text-white">
                                    {currency.symbol} {currency.label}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        }

                        {/* Free Trial (for subscriptions) */}
                        {formData.subscription_type !== 'one_time' &&
                          <div>
                            <label className="text-sm font-medium text-gray-300 mb-2 block">Free Trial (Days)</label>
                            <Input
                              type="number"
                              value={formData.free_trial_days}
                              onChange={(e) => setFormData((prev) => ({ ...prev, free_trial_days: parseInt(e.target.value) || 0 }))}
                              placeholder="e.g., 7"
                              className="bg-black/20 border-purple-500/20 text-white" />

                          </div>
                        }
                      </div>

                      {/* Payment Method Specific Notes */}
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-blue-200">
                            {formData.payment_method === 'eqoflow' &&
                              <p>Tokens will be sent to your wallet after a deduction of fees.</p>
                            }
                            {formData.payment_method === 'fiat' &&
                              <p>Connect your Square account link in your profile to receive your payments after platform fees are deducted.</p>
                            }
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  }

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                      Previous
                    </Button>
                    <Button
                      type="button" // Change to type="button" as submit is handled manually
                      onClick={() => {
                        // Auto-generate default token values and create community directly for both free and paid
                        const updatedFormData = {
                          ...formData,
                          token_name: formData.token_name || `${formData.name}Token`,
                          token_symbol: formData.token_symbol || `$${formData.name.toUpperCase().substring(0, 4)}`
                        };
                        setFormData(updatedFormData);
                        handleSubmit({ preventDefault: () => { } });
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500"
                      disabled={isSubmitting || isMediaUploading || isUploadingLandingImage}>

                      {isUploading || isMediaUploading || isSubmitting || isUploadingLandingImage ? (
                        <>
                          <Loader className="animate-spin mr-2 w-4 h-4" />
                          Creating...
                        </>
                      ) : (
                        'Create Community'
                      )}
                    </Button>
                  </div>
                </motion.div>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>);

}