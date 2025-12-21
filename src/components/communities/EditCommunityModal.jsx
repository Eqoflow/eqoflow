
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge"; // New import
import { X, Upload, Save, Loader2, DollarSign, Video, Trash2, Plus, Info, Zap, RefreshCw } from 'lucide-react'; // Added Plus, Info, Zap, RefreshCw
import { UploadFile } from '@/integrations/Core';
// Assuming 'Community' is a type definition not strictly needed at runtime for this component to compile
// import { Community } from '@/entities/Community'; 
import PayToFeatureCommunityModal from './PayToFeatureCommunityModal'; // New import

export default function EditCommunityModal({ community, onSubmit, onClose, onCommunityUpdated }) {// Added onCommunityUpdated prop
  const [editedData, setEditedData] = useState({}); // Renamed editedCommunity to editedData
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [currentTag, setCurrentTag] = useState(''); // New state for tag input
  const [tagError, setTagError] = useState(null); // New state for tag input errors
  const [showFeatureModal, setShowFeatureModal] = useState(false); // New state for featuring modal

  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const mediaInputRef = useRef(null);

  useEffect(() => {
    if (community) {
      setEditedData({
        name: community.name || '',
        description: community.description || '',
        logo_url: community.logo_url || '',
        banner_url: community.banner_url || '',
        media_gallery: community.media_gallery || [],
        pricing_model: community.pricing_model || 'free',
        membership_fee: community.membership_fee || '',
        currency: community.currency || 'USD',
        subscription_type: community.subscription_type || 'one_time',
        tags: community.tags || [],
        access_type: community.access_type || 'public', // NEW: Add access type
        invite_code: community.invite_code || '' // NEW: Add invite code
      });
      setError('');
    }
  }, [community]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');

    let setUploadingState;
    if (fileType === 'logo') setUploadingState = setIsUploadingLogo;
    else if (fileType === 'banner') setUploadingState = setIsUploadingBanner;
    else if (fileType === 'media') setUploadingState = setIsUploadingMedia;

    setUploadingState(true);

    try {
      const { file_url } = await UploadFile({ file });
      if (fileType === 'media') {
        const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
        setEditedData((prev) => ({
          ...prev,
          media_gallery: [...prev.media_gallery, { url: file_url, type: mediaType }]
        }));
      } else {
        setEditedData((prev) => ({
          ...prev,
          [`${fileType}_url`]: file_url
        }));
      }
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
      setError(`Failed to upload ${fileType}. Please try again.`);
    } finally {
      setUploadingState(false);
      if (e.target) e.target.value = null; // Clear the file input
    }
  };

  const handleRemoveMedia = (indexToRemove) => {
    setEditedData((prev) => ({
      ...prev,
      media_gallery: prev.media_gallery.filter((_, index) => index !== indexToRemove)
    }));
  };

  const addTag = () => {
    const trimmedTag = currentTag.trim().toLowerCase();
    setTagError(null);

    if ((editedData.tags || []).length >= 5) {
      setTagError("You can add a maximum of 5 tags.");
      return;
    }

    if (trimmedTag.length === 0) return; // Prevent adding empty tags

    if (trimmedTag && !(editedData.tags || []).includes(trimmedTag)) {
      if (trimmedTag.length > 25) {
        setTagError("Tags cannot be longer than 25 characters.");
        return;
      }
      setEditedData((prev) => ({ ...prev, tags: [...(prev.tags || []), trimmedTag] }));
      setCurrentTag("");
    } else if ((editedData.tags || []).includes(trimmedTag)) {
      setTagError("Tag already exists.");
    }
  };

  const removeTag = (indexToRemove) => {
    setEditedData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove)
    }));
  };

  // NEW: Function to regenerate invite code
  const regenerateInviteCode = () => {
    const newCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setEditedData((prev) => ({ ...prev, invite_code: newCode }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    setError('');

    if (!editedData.name || !editedData.description) {
      setError('Community name and description are required.');
      return;
    }

    if (editedData.pricing_model === 'paid') {
      const fee = parseFloat(editedData.membership_fee);
      if (isNaN(fee) || fee <= 0) {
        setError('A valid membership fee greater than 0 is required for paid communities.');
        return;
      }
    }

    setIsSubmitting(true);
    let communityDataToSave = { ...editedData };

    // Ensure numeric type for fee and reset if free
    if (communityDataToSave.pricing_model === 'free') {
      communityDataToSave.membership_fee = 0;
      communityDataToSave.currency = 'USD'; // Default to USD for free, or remove if not needed for free
      communityDataToSave.subscription_type = 'one_time'; // Default to one_time for free, or remove
    } else {
      communityDataToSave.membership_fee = parseFloat(communityDataToSave.membership_fee);
    }

    try {
      await onSubmit(communityDataToSave);
      onClose();
    } catch (err) {
      console.error("Failed to save community:", err);
      setError("Failed to save community changes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Logic to determine if the community is currently featured
  const isCurrentlyFeatured = community.featured_until && new Date(community.featured_until) > new Date();

  if (!community) return null;

  return (
    <Dialog open={!!community} onOpenChange={onClose}>
      <DialogContent className="dark-card sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Community</DialogTitle>
          {/* Close button for the dialog */}
          <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        
        {/* Scrollable content area for the form */}
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <form onSubmit={handleSubmit} className="space-y-4"> {/* Form element wraps the editable fields */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-50 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Community Name</Label>
              <Input
                id="name"
                name="name"
                value={editedData.name || ''}
                onChange={handleChange}
                className="bg-slate-950 border-purple-500/20 text-white"
                required />

            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-50 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={editedData.description || ''}
                onChange={handleChange}
                className="bg-slate-950 border-purple-500/20 text-white h-32"
                required />

            </div>
            
            {/* Tags Input Section */}
            <div className="space-y-2 pt-2">
              <Label className="text-slate-50 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {(editedData.tags || []).map((tag, index) =>
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
                  placeholder={(editedData.tags || []).length >= 5 ? "5 tags maximum" : "Add relevant tags..."}
                  className={`flex-1 bg-slate-950 border-purple-500/20 text-white placeholder:text-gray-400 ${tagError ? 'border-red-500' : ''}`}
                  disabled={(editedData.tags || []).length >= 5} />

                <Button
                  type="button"
                  onClick={addTag}
                  size="sm"
                  variant="outline" className="bg-background text-slate-950 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 rounded-md border-purple-500/20 hover:bg-slate-800"

                  disabled={(editedData.tags || []).length >= 5}>

                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {tagError && <p className="text-xs text-red-400 mt-1">{tagError}</p>}
              <div className="flex items-start gap-2 p-2 mt-1 bg-purple-900/20 border border-purple-500/20 rounded-md">
                  <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-300">
                      Adding tags helps your community get discovered. To guarantee visibility, feature it below.
                  </p>
              </div>
            </div>

            {/* Logo and Banner Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="logo" className="text-slate-50 mb-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block">Logo</Label>
                <input type="file" ref={logoInputRef} onChange={(e) => handleFileChange(e, 'logo')} accept="image/*" className="hidden" />
                <div
                  onClick={() => !isUploadingLogo && logoInputRef.current?.click()}
                  className={`aspect-square bg-slate-950 border-2 border-dashed border-purple-500/30 rounded-xl flex items-center justify-center cursor-pointer ${isUploadingLogo ? 'opacity-50' : 'hover:bg-slate-800'}`}>

                  {isUploadingLogo ?
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400" /> :
                  editedData.logo_url ?
                  <img src={editedData.logo_url} alt="Logo preview" className="w-full h-full object-cover rounded-xl" /> :

                  <div className="text-center text-gray-400">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">Click to upload logo</p>
                    </div>
                  }
                </div>
              </div>
              
              <div>
                <Label htmlFor="banner" className="text-slate-50 mb-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block">Banner</Label>
                <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" className="hidden" />
                <div
                  onClick={() => !isUploadingBanner && bannerInputRef.current?.click()}
                  className={`aspect-video bg-slate-950 border-2 border-dashed border-purple-500/30 rounded-xl flex items-center justify-center cursor-pointer ${isUploadingBanner ? 'opacity-50' : 'hover:bg-slate-800'}`}>

                  {isUploadingBanner ?
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400" /> :
                  editedData.banner_url ?
                  <img src={editedData.banner_url} alt="Banner preview" className="w-full h-full object-cover rounded-xl" /> :

                  <div className="text-center text-gray-400">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">Click to upload banner</p>
                    </div>
                  }
                </div>
              </div>
            </div>

            {/* Media Gallery Section */}
            <div>
              <Label className="text-slate-50 mb-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block">Media Gallery</Label>
              <div className="p-4 bg-slate-950 border-2 border-dashed border-purple-500/30 rounded-xl min-h-[140px]">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {(editedData.media_gallery || []).map((media, index) =>
                  <div key={index} className="relative aspect-square group">
                      {media.type === 'image' ?
                    <img src={media.url} alt={`Media ${index}`} className="w-full h-full object-cover rounded-lg" /> :

                    <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
                            <Video className="w-8 h-8 text-purple-400" />
                        </div>
                    }
                      <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveMedia(index)}>

                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <input type="file" ref={mediaInputRef} onChange={(e) => handleFileChange(e, 'media')} accept="image/*,video/*" className="hidden" />
                  <div
                    onClick={() => !isUploadingMedia && mediaInputRef.current?.click()}
                    className="aspect-square bg-slate-950/50 border-2 border-dashed border-purple-500/30 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-800">

                    {isUploadingMedia ?
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" /> :

                    <div className="text-center text-gray-400">
                            <Upload className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-xs">Add Media</p>
                        </div>
                    }
                  </div>
                </div>
              </div>
            </div>
            
            {/* NEW: Access Type Selection */}
            <div className="space-y-2 pt-2 border-t border-gray-700">
              <Label className="text-slate-50 text-sm font-medium">Community Access</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div 
                  onClick={() => setEditedData(prev => ({ ...prev, access_type: 'public' }))}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    editedData.access_type === 'public' 
                      ? 'border-green-500/50 bg-green-500/10' 
                      : 'border-gray-500/20 bg-black/20 hover:border-gray-400/30'
                  }`}
                >
                  <h4 className="text-sm font-semibold text-white mb-1">Public</h4>
                  <p className="text-xs text-gray-400">Visible to everyone</p>
                </div>
                <div 
                  onClick={() => {
                    setEditedData(prev => {
                      const newData = { ...prev, access_type: 'private_invite' };
                      // Generate invite code if switching to private and no code exists
                      if (!prev.invite_code) {
                        newData.invite_code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                      }
                      return newData;
                    });
                  }}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    editedData.access_type === 'private_invite' 
                      ? 'border-purple-500/50 bg-purple-500/10' 
                      : 'border-gray-500/20 bg-black/20 hover:border-gray-400/30'
                  }`}
                >
                  <h4 className="text-sm font-semibold text-white mb-1">Private (Invite Only)</h4>
                  <p className="text-xs text-gray-400">Hidden, invite link required</p>
                </div>
              </div>

              {/* NEW: Show invite code management for private communities */}
              {editedData.access_type === 'private_invite' && editedData.invite_code && (
                <div className="mt-3 p-3 bg-purple-900/20 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-300">Invite Code</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={regenerateInviteCode}
                      className="h-7 text-xs bg-slate-950 border-purple-500/20 text-purple-300 hover:bg-slate-800 hover:text-white"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                  <code className="text-xs text-purple-200 bg-black/30 px-2 py-1 rounded block overflow-auto">
                    {editedData.invite_code}
                  </code>
                  <p className="text-xs text-gray-400 mt-2">
                    Regenerating will invalidate the old invite link
                  </p>
                </div>
              )}
            </div>

            {/* Monetization Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Monetization</h3>
              </div>
            
              <div className="space-y-2">
                <Label htmlFor="pricing_model">Pricing Model</Label>
                <Select
                  value={editedData.pricing_model || 'free'}
                  onValueChange={(value) => handleSelectChange('pricing_model', value)}>

                  <SelectTrigger id="pricing_model" className="w-full bg-slate-950 border-purple-500/20 text-white">
                    <SelectValue placeholder="Select a pricing model" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-purple-500/20">
                    <SelectItem value="free">Free to Join</SelectItem>
                    <SelectItem value="paid">Paid Membership</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editedData.pricing_model === 'paid' &&
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="membership_fee">Membership Fee</Label>
                      <Input
                    id="membership_fee"
                    name="membership_fee"
                    type="number"
                    min="0.50"
                    step="0.01"
                    value={editedData.membership_fee}
                    onChange={handleChange}
                    className="bg-slate-950 border-purple-500/20 text-white"
                    placeholder="e.g., 5.00" />

                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                    value={editedData.currency || 'USD'}
                    onValueChange={(value) => handleSelectChange('currency', value)}>

                        <SelectTrigger id="currency" className="w-full bg-slate-950 border-purple-500/20 text-white">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 text-white border-purple-500/20">
                          <SelectItem value="EQOFLO">$EQOFLO</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                </div>
              }
            </div>

            {/* Feature Community Section */}
            <div className="space-y-3 pt-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Promote Your Community
              </h3>
              {isCurrentlyFeatured ?
              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
                      <p className="font-semibold text-green-300">Your community is currently featured!</p>
                      <p className="text-sm text-green-400">
                          Expires on: {new Date(community.featured_until).toLocaleString()}
                      </p>
                  </div> :

              <p className="text-sm text-gray-400">
                      Feature your community to pin it to the top of the discovery page and get recommended to more users.
                  </p>
              }
              <Button
                type="button"
                onClick={() => setShowFeatureModal(true)}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:opacity-90">

                  {isCurrentlyFeatured ? 'Extend Promotion' : 'Feature Community'}
              </Button>
            </div>
            
            {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            
            <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-gray-700"> {/* Updated className */}
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit" // This button now submits the form
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 py-2 flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                disabled={isSubmitting || isUploadingLogo || isUploadingBanner || isUploadingMedia}>

                {isSubmitting || isUploadingLogo || isUploadingBanner || isUploadingMedia ?
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isUploadingLogo ? 'Uploading...' : isUploadingBanner ? 'Uploading...' : isUploadingMedia ? 'Uploading...' : 'Saving...'}
                  </> :

                <>
                    Save Changes <Save className="w-4 h-4 ml-2" />
                  </>
                }
              </Button>
            </DialogFooter>
          </form> {/* End of form */}
        </div>
      </DialogContent>

      {/* Pay to Feature Community Modal */}
      {showFeatureModal &&
      <PayToFeatureCommunityModal
        community={community}
        onClose={() => setShowFeatureModal(false)}
        onSuccess={() => {
          setShowFeatureModal(false);
          // Call the parent's update handler to re-fetch community data or update state
          onCommunityUpdated();
        }} />

      }
    </Dialog>
  );
}
