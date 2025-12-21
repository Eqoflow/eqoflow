import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SponsorFormModal({ isOpen, onClose, onSave, sponsor, categories }) {
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    website: '',
    monthly_budget_usd: 0,
    subscribed_category_ids: []
  });

  useEffect(() => {
    if (sponsor) {
      setFormData({
        name: sponsor.name || '',
        logo_url: sponsor.logo_url || '',
        website: sponsor.website || '',
        monthly_budget_usd: sponsor.monthly_budget_usd || 0,
        subscribed_category_ids: sponsor.subscribed_category_ids || []
      });
    } else {
      setFormData({ name: '', logo_url: '', website: '', monthly_budget_usd: 0, subscribed_category_ids: [] });
    }
  }, [sponsor, isOpen]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dark-card">
        <DialogHeader>
          <DialogTitle className="text-white">{sponsor ? 'Edit Sponsor' : 'Create New Sponsor'}</DialogTitle>
          <DialogDescription>Fill in the details for the brand partner.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Sponsor Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="dark-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo_url" className="text-gray-300">Logo URL</Label>
            <Input id="logo_url" value={formData.logo_url} onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })} className="dark-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website" className="text-gray-300">Website URL</Label>
            <Input id="website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="dark-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget" className="text-gray-300">Monthly Budget (USD)</Label>
            <Input id="budget" type="number" value={formData.monthly_budget_usd} onChange={(e) => setFormData({ ...formData, monthly_budget_usd: Number(e.target.value) })} className="dark-input" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">Save Sponsor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}