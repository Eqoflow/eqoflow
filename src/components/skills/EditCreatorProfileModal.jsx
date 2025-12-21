
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  X,
  Upload,
  Plus,
  Trash2,
  User,
  Briefcase,
  Award,
  Image,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadFile } from "@/integrations/Core";

export default function EditCreatorProfileModal({ creatorProfile, onSave, onClose }) {
  const [profile, setProfile] = useState(creatorProfile || {
    business_name: "",
    business_bio: "",
    business_avatar_url: "",
    business_banner_url: "",
    tagline: "",
    business_website: "",
    business_email: "",
    business_phone: "",
    professional_skills: [],
    certifications: [],
    portfolio_items: [],
    response_time: "within_24_hours",
    availability_status: "available"
  });

  const [currentSkill, setCurrentSkill] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPortfolioIndex, setUploadingPortfolioIndex] = useState(null);
  const [activePortfolioIndex, setActivePortfolioIndex] = useState(null);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const portfolioFileInputRef = useRef(null);

  const handleFileUpload = async (file, type) => {
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setProfile((prev) => ({
        ...prev,
        [type]: file_url
      }));
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const addSkill = () => {
    if (currentSkill.trim() && !profile.professional_skills.includes(currentSkill.trim())) {
      setProfile((prev) => ({
        ...prev,
        professional_skills: [...prev.professional_skills, currentSkill.trim()]
      }));
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfile((prev) => ({
      ...prev,
      professional_skills: prev.professional_skills.filter((skill) => skill !== skillToRemove)
    }));
  };

  const addCertification = () => {
    setProfile((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { name: "", issuer: "", date: "", url: "" }]
    }));
  };

  const updateCertification = (index, field, value) => {
    setProfile((prev) => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const removeCertification = (index) => {
    setProfile((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const addPortfolioItem = () => {
    setProfile((prev) => ({
      ...prev,
      portfolio_items: [...prev.portfolio_items, { title: "", description: "", image_url: "", project_url: "" }]
    }));
  };

  const updatePortfolioItem = (index, field, value) => {
    setProfile((prev) => ({
      ...prev,
      portfolio_items: prev.portfolio_items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removePortfolioItem = (index) => {
    setProfile((prev) => ({
      ...prev,
      portfolio_items: prev.portfolio_items.filter((_, i) => i !== index)
    }));
  };

  const handlePortfolioFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || activePortfolioIndex === null) return;

    setUploadingPortfolioIndex(activePortfolioIndex);
    try {
      const { file_url } = await UploadFile({ file });
      updatePortfolioItem(activePortfolioIndex, 'image_url', file_url);
    } catch (error) {
      console.error("Error uploading portfolio file:", error);
      alert("Failed to upload portfolio file. Please try again.");
    } finally {
      setUploadingPortfolioIndex(null);
      setActivePortfolioIndex(null);
      if(portfolioFileInputRef.current) {
        portfolioFileInputRef.current.value = "";
      }
    }
  };

  const triggerPortfolioUpload = (index) => {
    setActivePortfolioIndex(index);
    portfolioFileInputRef.current?.click();
  };

  const renderPortfolioMedia = (url) => {
    if (!url) return null;
    const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('video'); // Added .ogg and 'video' check
    if (isVideo) {
      return <video src={url} className="w-full h-full object-cover" controls muted autoPlay loop />;
    }
    return <img src={url} alt="Portfolio item" className="w-full h-full object-cover" />;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(profile);
      onClose();
    } catch (error) {
      console.error("Error saving creator profile:", error);
      alert("Failed to save profile. Please try again.");
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
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">

          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                Edit Creator Profile
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>

            <CardContent className="p-6">
              <input
                type="file"
                ref={portfolioFileInputRef}
                onChange={handlePortfolioFileChange}
                accept="image/*,video/mp4,video/webm,video/ogg"
                className="hidden"
              />
              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 gap-1 dark-card p-1 rounded-2xl">
                  <TabsTrigger value="basic" className="rounded-xl text-xs md:text-sm p-1.5 md:p-2">
                    <span className="md:hidden">Info</span>
                    <span className="hidden md:inline">Basic Info</span>
                  </TabsTrigger>
                  <TabsTrigger value="media" className="rounded-xl text-xs md:text-sm p-1.5 md:p-2">
                    Media
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="rounded-xl text-xs md:text-sm p-1.5 md:p-2">
                    <span className="md:hidden">Skills</span>
                    <span className="hidden md:inline">Skills & Certs</span>
                  </TabsTrigger>
                  <TabsTrigger value="portfolio" className="rounded-xl text-xs md:text-sm p-1.5 md:p-2">
                    <span className="md:hidden">Work</span>
                    <span className="hidden md:inline">Portfolio</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="bg-slate-950 grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Business Name</label>
                      <Input
                        value={profile.business_name}
                        onChange={(e) => setProfile((prev) => ({ ...prev, business_name: e.target.value }))}
                        placeholder="Your business or professional name"
                        className="bg-black/20 border-purple-500/20 text-white" />

                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Tagline</label>
                      <Input
                        value={profile.tagline}
                        onChange={(e) => setProfile((prev) => ({ ...prev, tagline: e.target.value }))}
                        placeholder="Co-founder and creator of Quantum Flow - Crypto Enthusiast"
                        className="bg-black/20 border-purple-500/20 text-white" />

                    </div>
                  </div>

                  <div className="bg-slate-950 mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-4">
                    <label className="block text-sm font-medium text-white mb-2">Professional Bio</label>
                    <Textarea
                      value={profile.business_bio}
                      onChange={(e) => setProfile((prev) => ({ ...prev, business_bio: e.target.value }))}
                      placeholder="Tell potential clients about your professional background and expertise..."
                      className="h-32 bg-black/20 border-purple-500/20 text-white" />

                  </div>

                  <div className="bg-slate-950 grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Business Website</label>
                      <Input
                        value={profile.business_website}
                        onChange={(e) => setProfile((prev) => ({ ...prev, business_website: e.target.value }))}
                        placeholder="https://yourbusiness.com"
                        className="bg-black/20 border-purple-500/20 text-white" />

                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Business Email</label>
                      <Input
                        value={profile.business_email}
                        onChange={(e) => setProfile((prev) => ({ ...prev, business_email: e.target.value }))}
                        placeholder="contact@yourbusiness.com"
                        className="bg-black/20 border-purple-500/20 text-white" />

                    </div>
                  </div>

                  <div className="bg-slate-950 grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-950">
                      <label className="block text-sm font-medium text-white mb-2">Response Time</label>
                      <Select
                        value={profile.response_time}
                        onValueChange={(value) => setProfile((prev) => ({ ...prev, response_time: value }))}>

                        <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-purple-500/20">
                          <SelectItem value="within_1_hour" className="text-white">Within 1 hour</SelectItem>
                          <SelectItem value="within_6_hours" className="text-white">Within 6 hours</SelectItem>
                          <SelectItem value="within_24_hours" className="text-white">Within 24 hours</SelectItem>
                          <SelectItem value="within_3_days" className="text-white">Within 3 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Availability</label>
                      <Select
                        value={profile.availability_status}
                        onValueChange={(value) => setProfile((prev) => ({ ...prev, availability_status: value }))}>

                        <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-purple-500/20">
                          <SelectItem value="available" className="text-white">Available</SelectItem>
                          <SelectItem value="busy" className="text-white">Busy</SelectItem>
                          <SelectItem value="unavailable" className="text-white">Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="bg-slate-950 mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-6">
                    <label className="block text-sm font-medium text-white mb-2">Business Avatar</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center overflow-hidden">
                        {profile.business_avatar_url ?
                        <img src={profile.business_avatar_url} alt="Business avatar" className="w-full h-full object-cover" /> :

                        <User className="w-8 h-8 text-white" />
                        }
                      </div>
                      <div>
                        <input
                          type="file"
                          ref={avatarInputRef}
                          onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'business_avatar_url')}
                          accept="image/*"
                          className="hidden" />

                        <Button
                          onClick={() => avatarInputRef.current?.click()}
                          variant="outline"
                          disabled={isUploading}
                          className="border-purple-500/30 text-white hover:bg-purple-500/10">

                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                          Upload Avatar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Banner Upload */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Business Banner</label>
                    <div className="bg-slate-950 space-y-4">
                      <div className="w-full h-48 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg overflow-hidden">
                        {profile.business_banner_url ?
                        <img src={profile.business_banner_url} alt="Business banner" className="w-full h-full object-cover" /> :

                        <div className="bg-slate-950 w-full h-full flex items-center justify-center">
                            <Image className="w-12 h-12 text-white opacity-50" />
                          </div>
                        }
                      </div>
                      <div>
                        <input
                          type="file"
                          ref={bannerInputRef}
                          onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'business_banner_url')}
                          accept="image/*"
                          className="hidden" />

                        <Button
                          onClick={() => bannerInputRef.current?.click()}
                          variant="outline"
                          disabled={isUploading}
                          className="border-purple-500/30 text-white hover:bg-purple-500/10">

                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                          Upload Banner
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="skills" className="space-y-6">
                  {/* Professional Skills */}
                  <div className="bg-slate-950 mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-6">
                    <label className="block text-sm font-medium text-white mb-2">Professional Skills</label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        placeholder="Add a skill..."
                        className="flex-1 bg-black/20 border-purple-500/20 text-white" />

                      <Button onClick={addSkill} size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.professional_skills.map((skill, index) =>
                      <Badge key={index} className="bg-purple-600/20 text-purple-400 border-purple-500/30">
                          {skill}
                          <button
                          onClick={() => removeSkill(skill)}
                          className="ml-1 text-purple-300 hover:text-purple-100">

                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div>
                    <div className="bg-slate-950 mb-4 flex items-center justify-between">
                      <label className="block text-sm font-medium text-white">Certifications</label>
                      <Button onClick={addCertification} size="sm" className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Certification
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {profile.certifications.map((cert, index) =>
                      <Card key={index} className="bg-black/20 border-purple-500/20">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <Award className="w-5 h-5 text-yellow-400" />
                              <Button
                              onClick={() => removeCertification(index)}
                              variant="ghost"
                              size="icon"
                              className="text-red-400 hover:text-red-300">

                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                              <Input
                              value={cert.name}
                              onChange={(e) => updateCertification(index, 'name', e.target.value)}
                              placeholder="Certification name"
                              className="bg-black/20 border-purple-500/20 text-white" />

                              <Input
                              value={cert.issuer}
                              onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                              placeholder="Issuing organization"
                              className="bg-black/20 border-purple-500/20 text-white" />

                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="portfolio" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-white">Portfolio Items</label>
                    <Button onClick={addPortfolioItem} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Portfolio Item
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {profile.portfolio_items.map((item, index) => (
                      <Card key={index} className="bg-black/20 border-purple-500/20">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <Briefcase className="w-5 h-5 text-cyan-400" />
                            <Button
                              onClick={() => removePortfolioItem(index)}
                              variant="ghost"
                              size="icon"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-3">
                            <Input
                              value={item.title}
                              onChange={(e) => updatePortfolioItem(index, 'title', e.target.value)}
                              placeholder="Project title"
                              className="bg-black/20 border-purple-500/20 text-white"
                            />
                            <Textarea
                              value={item.description}
                              onChange={(e) => updatePortfolioItem(index, 'description', e.target.value)}
                              placeholder="A short description of the project"
                              className="bg-black/20 border-purple-500/20 text-white"
                            />
                            <div className="grid md:grid-cols-2 gap-4 items-center">
                              <div className="space-y-2">
                                <div className="aspect-video w-full bg-black/20 rounded-lg overflow-hidden flex items-center justify-center">
                                  {item.image_url ? (
                                    renderPortfolioMedia(item.image_url)
                                  ) : (
                                    <Image className="w-10 h-10 text-gray-500" />
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  onClick={() => triggerPortfolioUpload(index)}
                                  variant="outline"
                                  disabled={uploadingPortfolioIndex === index}
                                  className="w-full border-purple-500/30 text-white hover:bg-purple-500/10"
                                >
                                  {uploadingPortfolioIndex === index ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  {item.image_url ? 'Change Media' : 'Upload Media'}
                                </Button>
                              </div>
                              <Input
                                value={item.project_url}
                                onChange={(e) => updatePortfolioItem(index, 'project_url', e.target.value)}
                                placeholder="Link to live project (optional)"
                                className="bg-black/20 border-purple-500/20 text-white self-end"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-purple-500/20">
                <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-700/50">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Creator Profile'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
