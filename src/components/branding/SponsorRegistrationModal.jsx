import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SponsorProfile } from '@/entities/SponsorProfile';
import { AIBrandingCategory } from '@/entities/AIBrandingCategory';
import { User } from '@/entities/User';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function SponsorRegistrationModal({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    contact_email: '',
    contact_person: '',
    company_description: '',
    monthly_budget_usd: '',
    subscribed_category_ids: []
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        
        if (currentUser) {
          setFormData(prev => ({
            ...prev,
            contact_email: currentUser.email,
            contact_person: currentUser.full_name || ''
          }));
        }

        const activeCategories = await AIBrandingCategory.filter({ is_active: true });
        setCategories(activeCategories);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleCategoryToggle = (categoryId, checked) => {
    setFormData(prev => ({
      ...prev,
      subscribed_category_ids: checked 
        ? [...prev.subscribed_category_ids, categoryId]
        : prev.subscribed_category_ids.filter(id => id !== categoryId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;

    setIsSubmitting(true);
    try {
      await SponsorProfile.create({
        ...formData,
        monthly_budget_usd: parseFloat(formData.monthly_budget_usd) || 0,
        manager_user_email: user.email,
        registration_status: 'pending'
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Error submitting registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      website: '',
      contact_email: '',
      contact_person: '',
      company_description: '',
      monthly_budget_usd: '',
      subscribed_category_ids: []
    });
    onClose();
  };

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="dark-card max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="w-16 h-16 text-green-400" />
            </div>
            <DialogTitle className="text-white text-xl">Registration Submitted!</DialogTitle>
            <DialogDescription className="text-gray-300">
              Thank you for your interest in becoming a sponsor. We'll review your application and get back to you within 2-3 business days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose} className="w-full bg-purple-600 hover:bg-purple-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="dark-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Register as a Sponsor</DialogTitle>
          <DialogDescription className="text-gray-400">
            Join our AI-powered branding program and connect with trending content creators.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="dark-input"
                required
              />
            </div>
            <div>
              <Label htmlFor="website" className="text-gray-300">Website URL *</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="dark-input"
                placeholder="https://example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_email" className="text-gray-300">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="dark-input"
                required
              />
            </div>
            <div>
              <Label htmlFor="contact_person" className="text-gray-300">Contact Person *</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="dark-input"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="company_description" className="text-gray-300">Company Description *</Label>
            <Textarea
              id="company_description"
              value={formData.company_description}
              onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
              className="dark-input h-20"
              placeholder="Tell us about your company and what you do..."
              required
            />
          </div>

          <div>
            <Label htmlFor="monthly_budget" className="text-gray-300">Estimated Monthly Budget (USD)</Label>
            <Input
              id="monthly_budget"
              type="number"
              min="0"
              value={formData.monthly_budget_usd}
              onChange={(e) => setFormData({ ...formData, monthly_budget_usd: e.target.value })}
              className="dark-input"
              placeholder="1000"
            />
            <p className="text-xs text-gray-500 mt-1">Optional - helps us understand your campaign scale</p>
          </div>

          <div>
            <Label className="text-gray-300 mb-3 block">Content Categories of Interest *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {categories.map(category => (
                <div key={category.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={formData.subscribed_category_ids.includes(category.id)}
                    onCheckedChange={(checked) => handleCategoryToggle(category.id, checked)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor={`category-${category.id}`} className="text-sm text-gray-300 cursor-pointer">
                      {category.name}
                    </Label>
                    {category.description && (
                      <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {formData.subscribed_category_ids.length === 0 && (
              <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Please select at least one category
              </p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || formData.subscribed_category_ids.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}