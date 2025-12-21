
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Loader2, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from "@/components/ui/badge"; // Import Badge

export default function EditSkillModal({ skill, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: skill.title || '',
    description: skill.description || '',
    category: skill.category || 'other',
    price_type: skill.price_type || 'fiat',
    price_amount: skill.price_amount || 0,
    duration_hours: skill.duration_hours || 0,
    is_remote: skill.is_remote !== undefined ? skill.is_remote : true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(skill.id, formData);
      onClose(); // Close on success
    } catch (error) {
      console.error("Failed to save skill", error);
      alert("Failed to save skill. Please try again.");
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
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl"
        >
          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                Edit Skill
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Skill Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., UI/UX Design for Web Apps"
                  className="bg-black/20 border-purple-500/20 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe your skill or service in detail..."
                  className="h-32 bg-black/20 border-purple-500/20 text-white"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-white mb-2">Category</label>
                    <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                        <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-purple-500/20 text-white">
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="development">Development</SelectItem>
                            <SelectItem value="writing">Writing</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="consulting">Consulting</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="art">Art</SelectItem>
                            <SelectItem value="music">Music</SelectItem>
                            <SelectItem value="fitness">Fitness</SelectItem>
                            <SelectItem value="cooking">Cooking</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-white mb-2">Price Type</label>
                    <Select 
                      value={formData.price_type} 
                      onValueChange={(value) => {
                        if (value === "tokens") {
                          alert("$EQOFLO token payments are coming soon! Our token will launch with full escrow protection once it's trading on exchanges. For now, you can use Traditional Currency for secure payments.");
                          return; // Don't change the selection
                        }
                        handleChange('price_type', value)
                      }}
                    >
                        <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-purple-500/20 text-white">
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="fiat">Fiat (USD / GBP)</SelectItem>
                            <SelectItem value="tokens">
                              <div className="flex items-center gap-2">
                                <span>$EQOFLO Tokens</span>
                                <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30 text-xs">
                                  Coming Soon
                                </Badge>
                              </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>

               <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Price Amount</label>
                        <Input
                            type="number"
                            value={formData.price_amount}
                            onChange={(e) => handleChange('price_amount', parseFloat(e.target.value))}
                            placeholder="0"
                            disabled={formData.price_type === 'free' || formData.price_type === 'tokens'}
                            className="bg-black/20 border-purple-500/20 text-white"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-white mb-2">Estimated Duration (hours)</label>
                        <Input
                            type="number"
                            value={formData.duration_hours}
                            onChange={(e) => handleChange('duration_hours', parseFloat(e.target.value))}
                            placeholder="e.g., 10"
                            className="bg-black/20 border-purple-500/20 text-white"
                        />
                    </div>
                </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-purple-500/20">
                <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-700/50">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                >
                  {isSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
                  ) : (
                    'Save Changes'
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
