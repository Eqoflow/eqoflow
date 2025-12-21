
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  X,
  Vote,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

export default function VotingModal({ proposal, user, onVote, onClose }) {
  const [voteChoice, setVoteChoice] = useState('');
  const [voteReason, setVoteReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!voteChoice) return;

    setIsSubmitting(true);
    try {
      await onVote(proposal, voteChoice, voteReason);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userVotingPower = user?.token_balance || 0;
  const votingThreshold = proposal.minimum_voting_threshold || 1000;
  const canVote = userVotingPower >= votingThreshold;
  const totalVotes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;

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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Vote className="w-5 h-5 text-purple-400" />
                Cast Your Vote
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Proposal Summary */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{proposal.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{proposal.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <User className="w-4 h-4" />
                    <span>By {proposal.created_by?.split('@')[0]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Ends {format(new Date(proposal.voting_end), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                {proposal.impact_assessment?.estimated_cost > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <DollarSign className="w-4 h-4" />
                    <span>Estimated Cost: {proposal.impact_assessment.estimated_cost.toLocaleString()} $EQOFLO</span>
                  </div>
                )}
              </div>

              {/* Current Results */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Current Results</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-medium">For</span>
                    </div>
                    <div className="text-white font-bold">{proposal.votes_for.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-medium">Against</span>
                    </div>
                    <div className="text-white font-bold">{proposal.votes_against.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">Abstain</span>
                    </div>
                    <div className="text-white font-bold">{proposal.votes_abstain.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Voting Eligibility Check */}
              <div className={`p-4 rounded-lg border ${
                canVote
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`font-medium ${canVote ? 'text-green-400' : 'text-red-400'}`}>
                      {canVote ? 'Eligible to Vote' : 'Not Eligible to Vote'}
                    </span>
                    <p className="text-sm text-gray-400 mt-1">
                      Required: {votingThreshold.toLocaleString()} $EQOFLO |
                      Your balance: {userVotingPower.toLocaleString()} $EQOFLO
                    </p>
                  </div>
                  {canVote ? (
                    <div className="text-green-400 font-bold">✓</div>
                  ) : (
                    <div className="text-red-400 font-bold">✗</div>
                  )}
                </div>
              </div>

              {/* Your Voting Power */}
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-purple-400 font-medium">Your Voting Power</span>
                  <span className="text-white font-bold">{userVotingPower.toLocaleString()} $EQOFLO</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {((userVotingPower / 1000000) * 100).toFixed(4)}% of total supply
                </p>
              </div>

              {/* Vote Selection */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-white font-medium">Choose Your Vote</Label>
                  <RadioGroup value={voteChoice} onValueChange={setVoteChoice} disabled={!canVote}>
                    <div className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
                      canVote ? 'hover:bg-green-500/10' : 'opacity-50 cursor-not-allowed'
                    }`}>
                      <RadioGroupItem value="for" id="for" className="border-green-500 text-green-400" />
                      <Label htmlFor="for" className="text-green-400 font-medium cursor-pointer flex-1">
                        Vote For
                      </Label>
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <div className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
                      canVote ? 'hover:bg-red-500/10' : 'opacity-50 cursor-not-allowed'
                    }`}>
                      <RadioGroupItem value="against" id="against" className="border-red-500 text-red-400" />
                      <Label htmlFor="against" className="text-red-400 font-medium cursor-pointer flex-1">
                        Vote Against
                      </Label>
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    </div>
                    <div className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
                      canVote ? 'hover:bg-yellow-500/10' : 'opacity-50 cursor-not-allowed'
                    }`}>
                      <RadioGroupItem value="abstain" id="abstain" className="border-yellow-500 text-yellow-400" />
                      <Label htmlFor="abstain" className="text-yellow-400 font-medium cursor-pointer flex-1">
                        Abstain
                      </Label>
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-white font-medium">Reason for Vote (Optional)</Label>
                  <Textarea
                    value={voteReason}
                    onChange={(e) => setVoteReason(e.target.value)}
                    placeholder="Explain your reasoning..."
                    className="bg-black/20 border-purple-500/20 text-white"
                    rows={3}
                    disabled={!canVote}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onClose} className="border-gray-600">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!voteChoice || isSubmitting || !canVote}
                    className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                  >
                    {isSubmitting ? 'Submitting...' : 'Cast Vote'}
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
