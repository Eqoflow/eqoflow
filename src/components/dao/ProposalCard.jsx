
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Vote,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ExternalLink // Added ExternalLink for the "View Project" link
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom'; // Assuming react-router-dom for Link component
import { createPageUrl } from '@/utils';

export default function ProposalCard({ proposal, user, index, onVote }) {
  const totalVotes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;
  const forPercentage = totalVotes > 0 ? (proposal.votes_for / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (proposal.votes_against / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (proposal.votes_abstain / totalVotes) * 100 : 0;

  const hasVoted = proposal.voter_records?.some(record => record.voter_email === user?.email);
  const userVote = proposal.voter_records?.find(record => record.voter_email === user?.email);

  // Fix the voting active logic
  const now = new Date();
  const votingEndDate = new Date(proposal.voting_end);
  const isVotingPeriodActive = now < votingEndDate;
  const isActive = proposal.status === 'active' && isVotingPeriodActive;

  console.log('Proposal voting debug:', {
    proposalId: proposal.id,
    status: proposal.status,
    votingEnd: proposal.voting_end,
    now: now.toISOString(),
    votingEndDate: votingEndDate.toISOString(),
    isVotingPeriodActive,
    isActive
  });

  const getStatusInfo = () => {
    switch (proposal.status) {
      case 'active':
        return { icon: <Clock className="w-4 h-4" />, color: 'bg-blue-500/20 text-blue-400', text: 'Active' };
      case 'passed':
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-500/20 text-green-400', text: 'Passed' };
      case 'failed':
        return { icon: <XCircle className="w-4 h-4" />, color: 'bg-red-500/20 text-red-400', text: 'Failed' };
      case 'executed':
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-purple-500/20 text-purple-400', text: 'Executed' };
      default:
        return { icon: <AlertCircle className="w-4 h-4" />, color: 'bg-gray-500/20 text-gray-400', text: 'Draft' };
    }
  };

  const getTypeColor = () => {
    switch (proposal.proposal_type) {
      case 'feature_request': return 'bg-blue-500/20 text-blue-400';
      case 'treasury_allocation': return 'bg-green-500/20 text-green-400';
      case 'treasury_distribution': return 'bg-yellow-500/20 text-yellow-400';
      case 'policy_change': return 'bg-orange-500/20 text-orange-400';
      case 'protocol_upgrade': return 'bg-purple-500/20 text-purple-400';
      case 'moderation_rule': return 'bg-red-500/20 text-red-400';
      case 'project_approval': return 'bg-cyan-500/20 text-cyan-400'; // Added new case
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const statusInfo = getStatusInfo();
  const typeColor = getTypeColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="dark-card hover-lift transition-all duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={typeColor}>
                  {proposal.proposal_type?.replace('_', ' ')}
                </Badge>
                <Badge className={statusInfo.color}>
                  {statusInfo.icon}
                  <span className="ml-1">{statusInfo.text}</span>
                </Badge>
              </div>
              <CardTitle className="text-white text-xl mb-2">{proposal.title}</CardTitle>
              <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                {proposal.description}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Project Approval Details - UPDATED BLOCK */}
          {proposal.proposal_type === 'project_approval' && proposal.project_approval_details && (
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-cyan-400">Project Approval Details</h4>
                <Link
                  to={`${createPageUrl("ProjectDetails", { id: proposal.project_approval_details.project_id })}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-lg text-cyan-300 hover:text-cyan-200 transition-colors text-sm"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Project
                </Link>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Project Type:</span>
                  <span className="text-white capitalize">{proposal.project_approval_details.project_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Funding Goal:</span>
                  <span className="text-white font-medium">
                    {proposal.project_approval_details.funding_currency === 'gbp' ? '£' : ''}
                    {proposal.project_approval_details.funding_goal?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Creator:</span>
                  <span className="text-white">{proposal.project_approval_details.project_creator?.split('@')[0]}</span>
                </div>
                {proposal.project_approval_details.viability_score > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Community Viability Score:</span>
                    <span className="text-green-400 font-medium">
                      {proposal.project_approval_details.viability_score}/10
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Treasury Distribution Details */}
          {proposal.proposal_type === 'treasury_distribution' && proposal.distribution_details && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <h4 className="font-semibold text-yellow-400 mb-2">Distribution Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Distribution Type:</span>
                  <span className="text-white capitalize">{proposal.distribution_details.distribution_type?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-medium">
                    {proposal.distribution_details.distribution_type === 'percentage'
                      ? `${(proposal.distribution_details.distribution_percentage * 100).toFixed(1)}% of Treasury`
                      : `${proposal.distribution_details.distribution_amount?.toLocaleString()} $EQOFLO`}
                  </span>
                </div>
                {proposal.distribution_details.estimated_per_token_payout > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Est. per Token:</span>
                    <span className="text-green-400 font-medium">
                      ~{proposal.distribution_details.estimated_per_token_payout.toFixed(4)} $EQOFLO
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Voting Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Voting Progress</span>
              <span className="text-white">{totalVotes.toLocaleString()} votes cast</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">For</span>
                </div>
                <span className="text-white">{forPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={forPercentage} className="h-2 bg-gray-800">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                  style={{ width: `${forPercentage}%` }}
                />
              </Progress>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">Against</span>
                </div>
                <span className="text-white">{againstPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={againstPercentage} className="h-2 bg-gray-800">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                  style={{ width: `${againstPercentage}%` }}
                />
              </Progress>
            </div>

            {abstainPercentage > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400">Abstain</span>
                  </div>
                  <span className="text-white">{abstainPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={abstainPercentage} className="h-2 bg-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
                    style={{ width: `${abstainPercentage}%` }}
                  />
                </Progress>
              </div>
            )}
          </div>

          {/* Proposal Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <User className="w-4 h-4" />
              <span>By {proposal.created_by?.split('@')[0]}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Ends {format(new Date(proposal.voting_end), 'MMM d')}</span>
            </div>
          </div>

          {/* Impact Assessment */}
          {proposal.impact_assessment && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Impact Assessment</span>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                  {proposal.impact_assessment.technical_complexity} complexity
                </Badge>
              </div>
              {proposal.impact_assessment.estimated_cost > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <DollarSign className="w-4 h-4" />
                  <span>Cost: {proposal.impact_assessment.estimated_cost.toLocaleString()} $EQOFLO</span>
                </div>
              )}
            </div>
          )}

          {/* User's Vote */}
          {hasVoted && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Vote className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400">
                  You voted: <span className="font-medium capitalize">{userVote?.vote_choice}</span>
                </span>
                <span className="text-gray-400">
                  ({userVote?.voting_power?.toLocaleString()} voting power)
                </span>
              </div>
              {userVote?.vote_reason && (
                <p className="text-sm text-gray-300 mt-1 italic">"{userVote.vote_reason}"</p>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end">
            {isActive && !hasVoted ? (
              <Button
                onClick={onVote}
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
              >
                <Vote className="w-4 h-4 mr-2" />
                Cast Vote
              </Button>
            ) : (
              <Button variant="outline" disabled className="border-gray-600 text-gray-400">
                {hasVoted ? 'Already Voted' : !isVotingPeriodActive ? 'Voting Ended' : 'Voting Not Active'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
