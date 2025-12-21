
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X, Plus, Trash2, AlertCircle, Vote, Lightbulb, DollarSign, Coins, FileText, Zap, TrendingUp, Target } from 'lucide-react';

// Note: This is no longer a modal, but a form component.
// The name is kept for consistency with the current codebase structure.
export default function CreateProposalModal({ user, onSubmit, onClose, treasuryBalance = 0 }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    proposal_type: 'feature_request',
    category: 'technical',
    minimum_quorum: 0.1,
    passing_threshold: 0.5,
    tags: [],
    impact_assessment: {
      technical_complexity: 'medium',
      estimated_cost: 0,
      timeline_estimate: '',
      risks: [],
      benefits: []
    },
    distribution_details: {
      distribution_type: 'percentage',
      distribution_percentage: 0.1,
      distribution_amount: 0,
      distribution_rationale: '',
      estimated_per_token_payout: 0
    }
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentRisk, setCurrentRisk] = useState('');
  const [currentBenefit, setCurrentBenefit] = useState('');
  const [bondAmount, setBondAmount] = useState(1000);

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const addTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addRisk = () => {
    if (currentRisk && !formData.impact_assessment.risks.includes(currentRisk)) {
      setFormData(prev => ({
        ...prev,
        impact_assessment: {
          ...prev.impact_assessment,
          risks: [...prev.impact_assessment.risks, currentRisk]
        }
      }));
      setCurrentRisk('');
    }
  };

  const addBenefit = () => {
    if (currentBenefit && !formData.impact_assessment.benefits.includes(currentBenefit)) {
      setFormData(prev => ({
        ...prev,
        impact_assessment: {
          ...prev.impact_assessment,
          benefits: [...prev.impact_assessment.benefits, currentBenefit]
        }
      }));
      setCurrentBenefit('');
    }
  };

  const getCreationThreshold = (proposalType) => {
    switch (proposalType) {
      case 'treasury_allocation':
      case 'treasury_distribution':
        return 5000;
      case 'protocol_upgrade':
      case 'tokenomics_change':
        return 10000;
      default:
        return 1000;
    }
  };

  const getVotingThreshold = (proposalType) => {
    switch (proposalType) {
      case 'treasury_allocation':
      case 'treasury_distribution':
        return 1250;
      case 'protocol_upgrade':
      case 'tokenomics_change':
        return 4000;
      default:
        return 250;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.proposal_type === 'treasury_distribution') {
      const distributionAmount = formData.distribution_details.distribution_type === 'percentage'
        ? (formData.distribution_details.distribution_percentage * treasuryBalance)
        : formData.distribution_details.distribution_amount;
      
      const maxAllowed = treasuryBalance * 0.75;
      
      if (distributionAmount > maxAllowed) {
        alert(`Distribution amount (${distributionAmount.toLocaleString()} $EQOFLO) exceeds the maximum allowed (${maxAllowed.toLocaleString()} $EQOFLO = 75% of treasury). Please reduce your proposal amount.`);
        return;
      }
    }
    
    const votingEnd = new Date();
    votingEnd.setDate(votingEnd.getDate() + 7);
    
    const finalFormData = { 
      ...formData,
      minimum_voting_threshold: getVotingThreshold(formData.proposal_type)
    };
    
    if (formData.proposal_type === 'treasury_allocation') {
        finalFormData.bond_amount = bondAmount;
    }

    onSubmit({
      ...finalFormData,
      voting_end: votingEnd.toISOString()
    });
  };

  const proposalTypes = [
    { value: 'feature_request', label: 'Feature Request', icon: Lightbulb, desc: 'Suggest new platform features' },
    { value: 'policy_change', label: 'Policy Change', icon: FileText, desc: 'Modify platform policies or rules' },
    { value: 'treasury_allocation', label: 'Treasury Allocation', icon: DollarSign, desc: 'Allocate treasury funds for specific purposes' },
    { value: 'treasury_distribution', label: 'Treasury Distribution', icon: Coins, desc: 'Distribute treasury funds to token holders' },
    { value: 'protocol_upgrade', label: 'Protocol Upgrade', icon: Zap, desc: 'Technical protocol improvements' },
    { value: 'moderation_rule', label: 'Moderation Rule', icon: Vote, desc: 'Define or change moderation guidelines' }, // Assuming Vote icon or similar for moderation
    { value: 'tokenomics_change', label: 'Tokenomics Change', icon: TrendingUp, desc: 'Modify token economics or distribution' },
    { value: 'project_approval', label: 'Project Approval', icon: Target, desc: 'Approve crowdsourcing projects for funding' }
  ];

  const categories = [
    { value: 'technical', label: 'Technical' },
    { value: 'economic', label: 'Economic' },
    { value: 'social', label: 'Social' },
    { value: 'governance', label: 'Governance' },
    { value: 'emergency', label: 'Emergency' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Creation Requirements Check */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 font-medium">Proposal Creation Requirements</span>
        </div>
        <div className="text-sm text-gray-300 space-y-1">
          <p>• Regular proposals require: <strong>1,000 $EQOFLO</strong></p>
          <p>• Treasury proposals require: <strong>5,000 $EQOFLO</strong></p>
          <p>• Critical proposals require: <strong>10,000 $EQOFLO</strong></p>
          <p>• Your current balance: <strong>{user?.token_balance?.toLocaleString() || 0} $EQOFLO</strong></p>
          <p className="text-red-400">
            This proposal requires: <strong>{getCreationThreshold(formData.proposal_type).toLocaleString()} $EQOFLO</strong>
          </p>
        </div>
      </div>

      {/* Voting Threshold Info */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Vote className="w-4 h-4 text-purple-400" />
          <span className="text-purple-400 font-medium">Voting Requirements</span>
        </div>
        <div className="text-sm text-gray-300 space-y-1">
          <p>• <strong>Regular Proposals:</strong> 250 $EQOFLO minimum to vote</p>
          <p>• <strong>Treasury Proposals:</strong> 1,250 $EQOFLO minimum to vote</p>
          <p>• <strong>Critical Proposals:</strong> 4,000 $EQOFLO minimum to vote</p>
          <p className="text-purple-400 mt-2">
            Your proposal will require: <strong>{getVotingThreshold(formData.proposal_type).toLocaleString()} $EQOFLO</strong> to vote
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300 mb-2 block">Proposal Type</Label>
          <Select value={formData.proposal_type} onValueChange={(value) => handleChange('proposal_type', value)}>
            <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-purple-500/20">
              {proposalTypes.map(type => (
                <SelectItem key={type.value} value={type.value} className="text-white">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-gray-300 mb-2 block">Category</Label>
          <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
            <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black border-purple-500/20">
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value} className="text-white">
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-gray-300 mb-2 block">Proposal Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Enter a clear, descriptive title"
          className="bg-black/20 border-purple-500/20 text-white"
          required
        />
      </div>

      <div>
        <Label className="text-gray-300 mb-2 block">Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Provide detailed explanation of your proposal..."
          className="bg-black/20 border-purple-500/20 text-white min-h-[120px]"
          required
        />
      </div>
      
      {/* Treasury Distribution Specific Fields */}
      {formData.proposal_type === 'treasury_distribution' && (
        <div className="space-y-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400">Treasury Distribution Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 mb-2 block">Distribution Type</Label>
              <Select value={formData.distribution_details.distribution_type} onValueChange={(value) => handleChange('distribution_details.distribution_type', value)}>
                <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/20">
                  <SelectItem value="percentage" className="text-white">Percentage of Treasury</SelectItem>
                  <SelectItem value="fixed_amount" className="text-white">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-300 mb-2 block">
                {formData.distribution_details.distribution_type === 'percentage' 
                  ? 'Percentage (%)' 
                  : 'Amount ($EQOFLO)'}
              </Label>
              <Input
                type="number"
                step={formData.distribution_details.distribution_type === 'percentage' ? '0.1' : '1'}
                min="0"
                max={formData.distribution_details.distribution_type === 'percentage' ? '100' : undefined}
                value={formData.distribution_details.distribution_type === 'percentage' 
                  ? formData.distribution_details.distribution_percentage * 100 
                  : formData.distribution_details.distribution_amount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  if (formData.distribution_details.distribution_type === 'percentage') {
                    handleChange('distribution_details.distribution_percentage', value / 100);
                  } else {
                    handleChange('distribution_details.distribution_amount', value);
                  }
                }}
                className="bg-black/20 border-purple-500/20 text-white"
                required
              />
            </div>
          </div>
          
          <div>
            <Label className="text-gray-300 mb-2 block">Distribution Rationale</Label>
            <Textarea
              value={formData.distribution_details.distribution_rationale}
              onChange={(e) => handleChange('distribution_details.distribution_rationale', e.target.value)}
              placeholder="Explain why this distribution is justified at this time..."
              className="bg-black/20 border-purple-500/20 text-white"
              rows={3}
              required
            />
          </div>
          
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
            <p className="text-blue-300 text-sm">
              <strong>Note:</strong> The token balance snapshot will be taken at the time of voting completion. 
              Only users holding $EQOFLO at that moment will be eligible for distribution.
            </p>
            <p className="text-blue-300 text-sm mt-1">
              Current Treasury Balance: <strong>{treasuryBalance.toLocaleString()} $EQOFLO</strong> (Maximum distributable: 75%)
            </p>
          </div>
        </div>
      )}

      {formData.proposal_type === 'treasury_allocation' && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-medium">Proposal Bond Required</span>
            </div>
            <p className="text-sm text-gray-300 mb-2">
                Treasury allocation proposals require a bond of {bondAmount.toLocaleString()} $EQOFLO. 
                This bond is returned if the proposal passes and is not vetoed. It is forfeited if the proposal fails or is vetoed by the council.
            </p>
            <p className="text-sm text-gray-300">
                Your current balance: {user?.token_balance?.toLocaleString() || 0} $EQOFLO
            </p>
        </div>
      )}

      {/* Voting Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300 mb-2 block">Required Voter Turnout (Quorum %)</Label>
          <Input
            type="number"
            min="10"
            max="100"
            value={formData.minimum_quorum * 100}
            onChange={(e) => handleChange('minimum_quorum', parseFloat(e.target.value) / 100)}
            className="bg-black/20 border-purple-500/20 text-white"
          />
           <p className="text-xs text-gray-500 mt-2">
            The minimum % of total token supply that must vote for the proposal to be valid. (Min: 10%)
          </p>
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
           <p className="text-xs text-gray-500 mt-2">
            The minimum % of votes cast that must be 'For' to approve the proposal.
          </p>
        </div>
      </div>

      {/* Impact Assessment */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Impact Assessment</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-gray-300 mb-2 block">Technical Complexity</Label>
            <Select value={formData.impact_assessment.technical_complexity} onValueChange={(value) => handleChange('impact_assessment.technical_complexity', value)}>
              <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-purple-500/20">
                <SelectItem value="low" className="text-white">Low</SelectItem>
                <SelectItem value="medium" className="text-white">Medium</SelectItem>
                <SelectItem value="high" className="text-white">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-gray-300 mb-2 block">
              {formData.proposal_type === 'treasury_allocation' 
                  ? 'Amount Requested ($EQOFLO)' 
                  : 'Estimated Cost ($EQOFLO)'}
            </Label>
            <Input
              type="number"
              value={formData.impact_assessment.estimated_cost}
              onChange={(e) => handleChange('impact_assessment.estimated_cost', parseFloat(e.target.value) || 0)}
              className="bg-black/20 border-purple-500/20 text-white"
              required={formData.proposal_type === 'treasury_allocation'}
              placeholder={formData.proposal_type === 'treasury_allocation' ? 'e.g. 50000' : 'Optional'}
            />
            {formData.proposal_type === 'treasury_allocation' && (
                <p className="text-xs text-gray-500 mt-2">
                  The amount you are requesting from the treasury.
                </p>
            )}
            {formData.proposal_type === 'treasury_distribution' && (
                <p className="text-xs text-gray-500 mt-2">
                  Estimated cost to implement the distribution (e.g., development, audit fees).
                </p>
            )}
          </div>
          
          <div>
            <Label className="text-gray-300 mb-2 block">Timeline Estimate</Label>
            <Input
              value={formData.impact_assessment.timeline_estimate}
              onChange={(e) => handleChange('impact_assessment.timeline_estimate', e.target.value)}
              placeholder="e.g., 2-4 weeks"
              className="bg-black/20 border-purple-500/20 text-white"
            />
          </div>
        </div>

        {/* Risks and Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-300 mb-2 block">Risks</Label>
            <div className="space-y-2">
              {formData.impact_assessment.risks.map((risk, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-red-500/10 rounded">
                  <span className="text-red-400 text-sm flex-1">{risk}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        impact_assessment: {
                          ...prev.impact_assessment,
                          risks: prev.impact_assessment.risks.filter((_, i) => i !== index)
                        }
                      }));
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a risk"
                  value={currentRisk}
                  onChange={(e) => setCurrentRisk(e.target.value)}
                  className="bg-black/20 border-purple-500/20 text-white"
                />
                <Button type="button" onClick={addRisk} variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-gray-300 mb-2 block">Benefits</Label>
            <div className="space-y-2">
              {formData.impact_assessment.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-green-500/10 rounded">
                  <span className="text-green-400 text-sm flex-1">{benefit}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        impact_assessment: {
                          ...prev.impact_assessment,
                          benefits: prev.impact_assessment.benefits.filter((_, i) => i !== index)
                        }
                      }));
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a benefit"
                  value={currentBenefit}
                  onChange={(e) => setCurrentBenefit(e.target.value)}
                  className="bg-black/20 border-purple-500/20 text-white"
                />
                <Button type="button" onClick={addBenefit} variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label className="text-gray-300 mb-2 block">Tags</Label>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-purple-400 hover:text-purple-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              className="bg-black/20 border-purple-500/20 text-white"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} variant="outline" className="border-purple-500/30">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="border-gray-600">
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 neon-glow"
          disabled={
            !user?.token_balance || 
            user.token_balance < getCreationThreshold(formData.proposal_type) ||
            (formData.proposal_type === 'treasury_allocation' && user.token_balance < bondAmount)
          }
        >
          Create Proposal
        </Button>
      </div>
    </form>
  );
}
