import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X, DollarSign, AlertCircle } from 'lucide-react';

export default function CreateITOProposalModal({ user, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'economic',
    minimum_quorum: 0.1,
    passing_threshold: 0.5,
    estimated_cost: 0,
    timeline_estimate: '',
    rationale: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate voting end time (7 days from now)
      const votingEnd = new Date();
      votingEnd.setDate(votingEnd.getDate() + 7);

      const proposalData = {
        title: formData.title,
        description: formData.description,
        proposal_type: 'treasury_allocation',
        category: formData.category,
        bond_amount: 5000, // Higher bond for treasury proposals
        minimum_voting_threshold: 1250, // Higher threshold for treasury proposals
        passing_threshold: formData.passing_threshold,
        minimum_quorum: formData.minimum_quorum,
        voting_end: votingEnd.toISOString(),
        time_lock_end: votingEnd.toISOString(),
        tags: ['ito_funding'],
        impact_assessment: {
          technical_complexity: 'medium',
          estimated_cost: formData.estimated_cost,
          timeline_estimate: formData.timeline_estimate,
          risks: [],
          benefits: []
        },
        status: 'active'
      };

      await onSubmit(proposalData);
    } catch (error) {
      console.error('Error submitting proposal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="dark-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Create ITO Proposal
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-gray-400 text-sm">
                Create a proposal for the allocation or use of ITO funds.
              </p>
            </CardHeader>

            <CardContent>
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">ITO Proposal Requirements</span>
                </div>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>• Bond Required: <strong>5,000 $QFLOW</strong></p>
                  <p>• Minimum Voting Threshold: <strong>1,250 $QFLOW</strong></p>
                  <p>• Your current balance: <strong>{user?.token_balance?.toLocaleString() || 0} $QFLOW</strong></p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="text-gray-300 mb-2 block">Proposal Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g., Allocate ITO funds for marketing campaign"
                    className="bg-black/20 border-purple-500/20 text-white"
                    required
                  />
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Provide detailed explanation of how ITO funds will be used..."
                    className="bg-black/20 border-purple-500/20 text-white min-h-[120px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                      <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-purple-500/20">
                        <SelectItem value="economic" className="text-white">Economic</SelectItem>
                        <SelectItem value="technical" className="text-white">Technical</SelectItem>
                        <SelectItem value="social" className="text-white">Social</SelectItem>
                        <SelectItem value="governance" className="text-white">Governance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">Amount Requested ($QFLOW)</Label>
                    <Input
                      type="number"
                      value={formData.estimated_cost}
                      onChange={(e) => handleChange('estimated_cost', parseFloat(e.target.value) || 0)}
                      className="bg-black/20 border-purple-500/20 text-white"
                      placeholder="e.g. 50000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Required Voter Turnout (%)</Label>
                    <Input
                      type="number"
                      min="10"
                      max="100"
                      value={formData.minimum_quorum * 100}
                      onChange={(e) => handleChange('minimum_quorum', parseFloat(e.target.value) / 100)}
                      className="bg-black/20 border-purple-500/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block">"For" Votes Needed to Pass (%)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.passing_threshold * 100}
                      onChange={(e) => handleChange('passing_threshold', parseFloat(e.target.value) / 100)}
                      className="bg-black/20 border-purple-500/20 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">Timeline Estimate</Label>
                  <Input
                    value={formData.timeline_estimate}
                    onChange={(e) => handleChange('timeline_estimate', e.target.value)}
                    placeholder="e.g., 2-4 weeks"
                    className="bg-black/20 border-purple-500/20 text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="border-gray-600">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !user?.token_balance || user.token_balance < 5000}
                    className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Proposal'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}