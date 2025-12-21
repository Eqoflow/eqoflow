
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Target, Gift, Plus, Trash2, FileText, Image, DollarSign, Coins } from 'lucide-react';
import { UploadFile } from '@/integrations/Core';

export default function CreateProjectModal({ user, communities, onSubmit, onClose }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: 'fundraising',
    category: 'technology',
    funding_goal: 1000,
    funding_currency: 'eqoflo', // Changed from 'qflow' to 'eqoflo'
    deadline: '',
    milestones: [],
    tags: [],
    community_id: '',
    project_images: [],
    project_documents: [],
    featured_image: ''
  });
  const [currentMilestone, setCurrentMilestone] = useState({ title: '', description: '', funding_required: 0 });
  const [currentTag, setCurrentTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addMilestone = () => {
    if (currentMilestone.title && currentMilestone.funding_required > 0) {
      setFormData((prev) => ({
        ...prev,
        milestones: [...prev.milestones, { ...currentMilestone, completed: false }]
      }));
      setCurrentMilestone({ title: '', description: '', funding_required: 0 });
    }
  };

  const removeMilestone = (index) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (formData.project_images.length >= 6) {
      alert('Maximum 6 images allowed');
      return;
    }

    setIsUploading(true);
    setUploadingType('image');
    try {
      const { file_url } = await UploadFile({ file });
      setFormData((prev) => ({
        ...prev,
        project_images: [...prev.project_images, file_url]
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
      setUploadingType('');
    }
  };

  const handleDocumentUpload = async (event, documentType = 'other') => {
    const file = event.target.files[0];
    if (!file) return;

    if (formData.project_documents.length >= 3) {
      alert('Maximum 3 documents allowed');
      return;
    }

    setIsUploading(true);
    setUploadingType('document');
    try {
      const { file_url } = await UploadFile({ file });
      const newDocument = {
        title: file.name,
        description: `${documentType.replace('_', ' ')} document`,
        document_type: documentType,
        file_url,
        file_name: file.name,
        uploaded_at: new Date().toISOString()
      };
      setFormData((prev) => ({
        ...prev,
        project_documents: [...prev.project_documents, newDocument]
      }));
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    } finally {
      setIsUploading(false);
      setUploadingType('');
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      project_images: prev.project_images.filter((_, i) => i !== index)
    }));
  };

  const removeDocument = (index) => {
    setFormData((prev) => ({
      ...prev,
      project_documents: prev.project_documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const projectTypes = [
    { value: 'fundraising', label: 'Fundraising', icon: Target, desc: 'Raise funds for your project' },
    { value: 'bounty', label: 'Bounty', icon: Gift, desc: 'Post a task with reward' }
  ];


  const currencies = [
    { value: 'eqoflo', label: '$EQOFLO Tokens', icon: Coins, symbol: 'EQOFLO' }, // Updated from $QFLOW to $EQOFLO
    { value: 'gbp', label: 'British Pounds', icon: DollarSign, symbol: '£' }];


  const categories = [
    'technology', 'art', 'music', 'gaming', 'education', 'social_impact', 'research', 'business', 'other'];


  const documentTypes = [
    { value: 'pitch_deck', label: 'Pitch Deck', description: 'Presentation slides for your project' },
    { value: 'one_pager', label: 'One Pager', description: 'Executive summary document' },
    { value: 'financial_projections', label: 'Financial Projections', description: 'Financial forecasts and projections' }];


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">

        <Card className="dark-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Create New Project</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basics" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-2xl">
                <TabsTrigger value="basics" className="rounded-xl text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500">
                  Project Basics
                </TabsTrigger>
                <TabsTrigger value="media" className="rounded-xl text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500">
                  Media & Documents
                </TabsTrigger>
                <TabsTrigger value="details" className="rounded-xl text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500">
                  Additional Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basics" className="space-y-6">
                <form onSubmit={handleSubmit}>
                  {/* Project Type Selection */}
                  <div className="bg-slate-950">
                    <Label className="text-gray-300 text-base font-medium mb-4 block">Project Type</Label>
                    <div className="bg-slate-950 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {projectTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleChange('project_type', type.value)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                              formData.project_type === type.value ?
                                'border-purple-500 bg-purple-500/10' :
                                'border-gray-600 hover:border-gray-400 bg-black/20'}`
                            }>

                            <div className="flex items-center gap-3 mb-2">
                              <Icon className="w-5 h-5 text-purple-400" />
                              <span className="text-white font-medium">{type.label}</span>
                            </div>
                            <p className="text-slate-50 text-sm">{type.desc}</p>
                          </button>);

                      })}
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="bg-slate-950 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950">
                      <Label className="text-gray-300 mb-2 block">Project Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="Enter project title"
                        className="bg-black/20 border-purple-500/20 text-white"
                        required />

                    </div>
                    <div>
                      <Label className="text-gray-300 mb-2 block">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                        <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-purple-500/20">
                          {categories.map((cat) =>
                            <SelectItem key={cat} value={cat} className="text-white">
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-slate-950">
                    <Label className="text-gray-300 mb-2 block">Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Describe your project in detail"
                      className="bg-black/20 border-purple-500/20 text-white min-h-[120px]"
                      required />

                  </div>

                  {/* Funding & Currency */}
                  <div className="bg-slate-950 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-300 mb-2 block">Funding Currency</Label>
                      <Select value={formData.funding_currency} onValueChange={(value) => handleChange('funding_currency', value)}>
                        <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-purple-500/20">
                          {currencies.map((currency) => {
                            const Icon = currency.icon;
                            return (
                              <SelectItem key={currency.value} value={currency.value} className="text-white">
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4" />
                                  {currency.label}
                                </div>
                              </SelectItem>);

                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300 mb-2 block">Funding Goal</Label>
                      <Input
                        type="number"
                        value={formData.funding_goal}
                        onChange={(e) => handleChange('funding_goal', parseInt(e.target.value))}
                        className="bg-black/20 border-purple-500/20 text-white"
                        required />

                    </div>
                    <div>
                      <Label className="text-gray-300 mb-2 block">Deadline</Label>
                      <Input
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => handleChange('deadline', e.target.value)} className="flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-black/20 border-purple-500/20 text-white"

                        required />

                    </div>
                  </div>

                  <div className="bg-slate-950">
                    <Label className="text-gray-300 mb-2 block">Community (Optional)</Label>
                    <Select value={formData.community_id} onValueChange={(value) => handleChange('community_id', value)}>
                      <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                        <SelectValue placeholder="Select community" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-purple-500/20">
                        <SelectItem value={null} className="text-white">No community</SelectItem>
                        {communities.map((community) =>
                          <SelectItem key={community.id} value={community.id} className="text-white">
                            {community.name}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="media" className="space-y-6">
                {/* Project Images */}
                <div className="bg-slate-950 mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-6">
                  <Label className="text-gray-300 text-base font-medium mb-4 block">Project Images (Max 6)</Label>
                  <div className="space-y-4">
                    {formData.project_images.length > 0 &&
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {formData.project_images.map((imageUrl, index) =>
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Project image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-purple-500/20" />

                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">

                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    }

                    {formData.project_images.length < 6 &&
                      <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                          disabled={isUploading} />

                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer flex flex-col items-center gap-2">

                          {isUploading && uploadingType === 'image' ?
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" /> :

                            <Image className="w-8 h-8 text-purple-400" />
                          }
                          <span className="text-white font-medium">
                            {isUploading && uploadingType === 'image' ? 'Uploading...' : 'Upload Project Images'}
                          </span>
                          <span className="text-sm text-gray-400">
                            PNG, JPG, GIF up to 10MB
                          </span>
                        </label>
                      </div>
                    }
                  </div>
                </div>

                {/* Project Documents */}
                <div>
                  <Label className="text-gray-300 text-base font-medium mb-4 block">Project Documents (Max 3)</Label>
                  <div className="space-y-4">
                    {formData.project_documents.length > 0 &&
                      <div className="space-y-3">
                        {formData.project_documents.map((doc, index) =>
                          <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-400" />
                              <div>
                                <p className="text-white font-medium">{doc.file_name}</p>
                                <p className="text-sm text-gray-400">{doc.description}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(index)}
                              className="text-red-400 hover:text-red-300">

                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    }

                    {formData.project_documents.length < 3 &&
                      <div className="bg-slate-950 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {documentTypes.map((docType) =>
                          <div key={docType.value} className="border-2 border-dashed border-purple-500/30 rounded-lg p-4 text-center">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                              onChange={(e) => handleDocumentUpload(e, docType.value)}
                              className="hidden"
                              id={`doc-upload-${docType.value}`}
                              disabled={isUploading} />

                            <label
                              htmlFor={`doc-upload-${docType.value}`}
                              className="cursor-pointer flex flex-col items-center gap-2">

                              {isUploading && uploadingType === 'document' ?
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" /> :

                                <FileText className="w-6 h-6 text-purple-400" />
                              }
                              <span className="text-white font-medium text-sm">{docType.label}</span>
                              <span className="text-xs text-gray-400">{docType.description}</span>
                            </label>
                          </div>
                        )}
                      </div>
                    }
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-6">
                {/* Milestones */}
                <div className="bg-slate-950 mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-6">
                  <Label className="text-gray-300 mb-2 block">Milestones (Optional)</Label>
                  <div className="space-y-3">
                    {formData.milestones.map((milestone, index) =>
                      <div key={index} className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                        <div className="flex-1">
                          <p className="text-white font-medium">{milestone.title}</p>
                          <p className="text-sm text-gray-400">{milestone.description}</p>
                        </div>
                        <div className="text-purple-400 font-medium">{milestone.funding_required}</div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMilestone(index)}
                          className="text-red-400 hover:text-red-300">

                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <Input
                        placeholder="Milestone title"
                        value={currentMilestone.title}
                        onChange={(e) => setCurrentMilestone((prev) => ({ ...prev, title: e.target.value }))}
                        className="bg-black/20 border-purple-500/20 text-white" />

                      <Input
                        placeholder="Description"
                        value={currentMilestone.description}
                        onChange={(e) => setCurrentMilestone((prev) => ({ ...prev, description: e.target.value }))}
                        className="bg-black/20 border-purple-500/20 text-white" />

                      <Input
                        type="number"
                        placeholder="Funding required"
                        value={currentMilestone.funding_required}
                        onChange={(e) => setCurrentMilestone((prev) => ({ ...prev, funding_required: parseInt(e.target.value) }))}
                        className="bg-black/20 border-purple-500/20 text-white" />

                      <Button type="button" onClick={addMilestone} variant="outline" className="border-purple-500/30">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-slate-950">
                  <Label className="text-gray-300 mb-2 block">Tags</Label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) =>
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-1">

                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-purple-400 hover:text-purple-300">

                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        className="bg-black/20 border-purple-500/20 text-white"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />

                      <Button type="button" onClick={addTag} variant="outline" className="border-purple-500/30">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onClose} className="border-gray-600">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 neon-glow">

                    Create Project
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>);

}
