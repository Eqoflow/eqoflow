
import React, { useState, useEffect, useCallback } from "react";
import { GovernanceProposal } from "@/entities/GovernanceProposal";
import { DAOTreasury } from "@/entities/DAOTreasury";
import { User } from "@/entities/User";
import { UserProfileData } from "@/entities/UserProfileData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Vote,
  Coins,
  Clock,
  DollarSign,
  BarChart3,
  Info,
  Landmark,
  FileText,
  UserCheck,
  PlusCircle,
  Crown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import CreateProposalModal from "../components/dao/CreateProposalModal";
import ProposalCard from "../components/dao/ProposalCard";
import VotingModal from "../components/dao/VotingModal";
import TreasuryOverview from "../components/dao/TreasuryOverview";
import DistributionCountdown from "../components/dao/DistributionCountdown";
import DaoCouncilModal from "../components/dao/DaoCouncilModal";
import HowDaoWorksModal from "../components/dao/HowDaoWorksModal";

export default function DAOPage() {
  const [proposals, setProposals] = useState([]);
  const [treasury, setTreasury] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [showCouncilModal, setShowCouncilModal] = useState(false);
  const [showHowDaoWorksModal, setShowHowDaoWorksModal] = useState(false);

  // Define all tabs and their lazy loading status
  const allTabs = [
    { value: 'proposals', label: 'Proposals', icon: FileText, isLazy: false },
    { value: 'treasury', label: 'Treasury', icon: Landmark, isLazy: true },
    { value: 'my-votes', label: 'My Votes', icon: UserCheck, isLazy: false },
    { value: 'create-proposal', label: 'Create Proposal', icon: PlusCircle, isLazy: false },
    { value: 'distributions', label: 'Distributions', icon: Coins, isLazy: true }
  ];

  // Initial active tab.
  const [activeTab, setActiveTab] = useState("proposals");

  // Track which tabs have been loaded to enable lazy loading
  // Initialize with tabs that are not lazy-loaded
  const [loadedTabs, setLoadedTabs] = useState(new Set(["proposals"]));

  // NEW: Function to handle tab changes and track loaded tabs
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setLoadedTabs(prev => new Set([...prev, tabName])); // Mark this tab as loaded
  };

  // Helper function to load user data and profile
  const loadUser = useCallback(async () => {
    try {
      const userData = await User.me();
      // Add delay between API calls to prevent rate limiting, as per original logic
      await new Promise(resolve => setTimeout(resolve, 200));
      if (userData) {
        try {
          const profileDataRecords = await UserProfileData.filter({ user_email: userData.email });
          if (profileDataRecords.length > 0) {
            setUser({ ...userData, ...profileDataRecords[0] });
          } else {
            setUser(userData);
          }
        } catch (profileError) {
          console.warn("Could not load profile data:", profileError);
          setUser(userData);
        }
      } else {
        setUser(userData);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      throw error; // Re-throw to be caught by main loadData
    }
  }, [setUser]); // setUser is stable

  // Helper function to load treasury data
  const loadTreasury = useCallback(async () => {
    try {
      const treasuryData = await DAOTreasury.list("-created_date", 50);
      setTreasury(treasuryData);
    } catch (error) {
      console.error("Error loading treasury data:", error);
      throw error; // Re-throw to be caught by main loadData
    }
  }, [setTreasury]); // setTreasury is stable

  // Helper function to load and enrich proposals
  const loadProposals = useCallback(async () => {
    try {
      const fetchedProposals = await GovernanceProposal.list("-created_date", 50);

      if (fetchedProposals.length > 0) {
        // OPTIMIZED: Batch fetch all creator data for proposals
        const creatorEmails = [...new Set(fetchedProposals.map(proposal => proposal.created_by))];

        // Batch fetch creator information
        // Using .catch(() => []) to handle cases where User.filter might throw an error (e.g., no users found, network error)
        const creators = await User.filter({ email: { $in: creatorEmails } }).catch(() => []);

        // Create creators map for efficient lookup
        const creatorsMap = creators.reduce((acc, creator) => {
          acc[creator.email] = creator;
          return acc;
        }, {});

        // Define dynamic passing thresholds
        const getPassingThreshold = (type) => {
            switch (type) {
                case 'treasury_allocation': return 0.6; // 60% for treasury
                case 'protocol_upgrade':
                case 'tokenomics_change': return 0.75; // 75% for critical
                default: return 0.5; // 50% for 'regular' or other types
            }
        };

        // Enrich proposals with creator data and calculated fields
        const enrichedProposals = fetchedProposals.map(proposal => {
          const totalVotes = (proposal.votes_for || 0) + (proposal.votes_against || 0) + (proposal.votes_abstain || 0);
          const creator = creatorsMap[proposal.created_by] || null;
          const passingThreshold = getPassingThreshold(proposal.proposal_type || 'regular');
          const totalEligibleVotingPower = Object.values(proposal.voting_power_snapshot || {}).reduce((sum, val) => sum + val, 0);

          return {
            ...proposal,
            creator,
            creator_name: creator?.full_name || proposal.created_by?.split('@')[0] || 'Unknown',
            total_votes: totalVotes,
            // Calculate participation rate based on total eligible voting power from snapshot
            participation_rate: totalEligibleVotingPower > 0 ?
              (totalVotes / totalEligibleVotingPower) : 0,
            is_passing: totalVotes > 0 ?
              (proposal.votes_for / totalVotes) >= passingThreshold : false, // >= for "at or above"
            time_remaining: new Date(proposal.voting_end).getTime() - new Date().getTime(), // Time in milliseconds
            voter_count: proposal.voter_records ? new Set(proposal.voter_records.map(vr => vr.voter_email)).size : 0, // Count unique voters
            passing_threshold: passingThreshold // Include for potential display
          };
        });

        setProposals(enrichedProposals);
      } else {
        setProposals([]);
      }
    } catch (error) {
      console.error("Error loading proposals:", error);
      setProposals([]);
      throw error; // Re-throw to be caught by main loadData
    }
  }, [setProposals]); // setProposals is stable

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null); // Clear previous errors

    try {
      // Load user data first, as it's often a prerequisite for UI and other actions
      await loadUser();

      // Add delay before next API calls (proposals and treasury)
      // This delay mimics the original sequential loading behavior for rate limiting.
      await new Promise(resolve => setTimeout(resolve, 250));

      // Concurrently load proposals and treasury data
      await Promise.all([
        loadProposals(),
        loadTreasury()
      ]);

    } catch (error) {
      console.error("Error loading DAO data:", error);

      if (error.response?.status === 429) {
        setLoadError("Rate limit reached. Please wait a moment and refresh the page.");
      } else {
        setLoadError("Failed to load DAO data. Please try refreshing the page.");
      }
    } finally {
      setIsLoading(false); // Ensure loading state is reset regardless of success or failure
    }
  }, [loadUser, loadProposals, loadTreasury, setIsLoading, setLoadError]); // These are useCallback'd functions or stable state setters

  useEffect(() => {
    loadData();
  }, [loadData]); // loadData is now stable due to useCallback

  const handleCreateProposal = async (proposalData) => {
    let totalHoldAmount = 0; // Initialize outside try for potential rollback
    try {
      // Define creation thresholds here to calculate hold amount
      const getCreationThreshold = (proposalType) => {
        switch (proposalType) {
          case 'treasury_allocation':return 5000;
          case 'protocol_upgrade':
          case 'tokenomics_change':return 10000;
          default:return 1000; // Default for 'regular' or other types
        }
      };

      const creationThreshold = getCreationThreshold(proposalData.proposal_type);
      const bondAmount = proposalData.bond_amount || 0;
      totalHoldAmount = creationThreshold + bondAmount; // Assign to outer scope variable

      // Safeguard check
      if ((user?.token_balance || 0) < totalHoldAmount) {
        alert("You don't have enough $EQOFLO tokens for this proposal's creation threshold and bond. Required: " + totalHoldAmount.toLocaleString() + " $EQOFLO. Your balance: " + (user?.token_balance || 0).toLocaleString() + " $EQOFLO.");
        return;
      }

      // Create voting power snapshot
      // The total supply is a constant, but voting power snapshot should reflect individual balances at the time.
      // The outline suggested `voting_power_snapshot: { [user.email]: user.token_balance || 0 }`.
      // For a realistic DAO, this would involve a snapshot of *all* token holders.
      // For this implementation, keeping it to the creator's balance as per existing logic.
      const votingPowerSnapshot = {
        [user.email]: user.token_balance || 0
      };

      const finalProposal = {
        ...proposalData,
        voting_power_snapshot: votingPowerSnapshot,
        voting_start: new Date().toISOString(),
        status: "active"
      };

      // Update user's token balances
      await User.updateMyUserData({
        token_balance: (user.token_balance || 0) - totalHoldAmount,
        tokens_on_hold: (user.tokens_on_hold || 0) + totalHoldAmount
      });
      // Update local user state immediately for instant UI feedback
      setUser((prevUser) => ({
        ...prevUser,
        token_balance: (prevUser.token_balance || 0) - totalHoldAmount,
        tokens_on_hold: (prevUser.tokens_on_hold || 0) + totalHoldAmount
      }));

      await GovernanceProposal.create(finalProposal);

      // After successful creation, switch back to proposals tab
      setActiveTab("proposals");
      loadData(); // Reload all data to include the new proposal
    } catch (error) {
      console.error("Error creating proposal:", error);
      // Revert token changes in case of an error after user update but before proposal creation
      // This is a simplified client-sided rollback. In a real system,
      // a transaction or more robust error handling would be needed.
      if (user && totalHoldAmount > 0) {
        setUser((prevUser) => ({
          ...prevUser,
          token_balance: (prevUser.token_balance || 0) + totalHoldAmount,
          tokens_on_hold: Math.max(0, (prevUser.tokens_on_hold || 0) - totalHoldAmount)
        }));
      }
      alert("Failed to create proposal. Please try again.");
    }
  };

  const handleVote = async (proposal, voteChoice, voteReason) => {
    try {
      const votingPower = user.token_balance || 0; // Use current token balance as voting power
      const newVoteRecord = {
        voter_email: user.email,
        voter_name: user.full_name,
        vote_choice: voteChoice,
        voting_power: votingPower,
        vote_reason: voteReason,
        voted_at: new Date().toISOString()
      };

      // Update vote counts
      const updatedProposal = {
        ...proposal,
        voter_records: [...(proposal.voter_records || []), newVoteRecord],
        votes_for: proposal.votes_for + (voteChoice === 'for' ? votingPower : 0),
        votes_against: proposal.votes_against + (voteChoice === 'against' ? votingPower : 0),
        votes_abstain: proposal.votes_abstain + (voteChoice === 'abstain' ? votingPower : 0)
      };

      await GovernanceProposal.update(proposal.id, updatedProposal);
      setSelectedProposal(null);
      loadData(); // Reload all data to reflect the new vote
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const getTreasuryStats = () => {
    const eqofloToUsdRate = 0.02; // UPDATED: Token price set to $0.02

    const eqofloAmount = treasury.reduce((sum, tx) => {
        // amount_qflow is positive for deposits and negative for withdrawals
        return sum + (tx.amount_qflow || 0);
    }, 0);

    const totalValue = eqofloAmount * eqofloToUsdRate;

    return { totalValue, eqofloAmount };
  };

  const getProposalStats = () => {
    const active = proposals.filter((p) => p.status === 'active').length;
    const passed = proposals.filter((p) => p.status === 'passed' || p.status === 'queued' || p.status === 'executed').length;
    const failed = proposals.filter((p) => p.status === 'failed' || p.status === 'vetoed').length;

    return { active, passed, failed };
  };

  // Conditional rendering for load errors
  if (loadError) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="dark-card rounded-2xl p-12 text-center neon-glow">
            <div className="text-red-400 mb-4 text-4xl">⚠️</div>
            <h3 className="text-xl font-semibold text-white mb-2">Loading Error</h3>
            <p className="text-gray-400 mb-4">{loadError}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { totalValue, eqofloAmount } = getTreasuryStats();
  const { active, passed, failed } = getProposalStats();

  const userVotingPower = user?.token_balance || 0;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--neon-primary), var(--neon-secondary))' }}>
              DAO Governance
            </h1>
            <p className="text-gray-400">
              Shape the future of EqoFlow. Your voice, your vote.
            </p>
          </div>
          <Badge
            onClick={() => setShowHowDaoWorksModal(true)}
            className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs px-3 py-2 shadow-[0_0_8px_rgba(59,130,246,0.4)] hover:bg-blue-500/30 transition-colors cursor-pointer"
          >
            <Info className="w-3 h-3 mr-1" />
            How DAO Works
          </Badge>
        </div>

        {/* View Council Members Button */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setShowCouncilModal(true)}
            variant="outline"
            className="border-purple-500/30 text-white hover:bg-purple-500/10 flex items-center gap-2"
          >
            <Crown className="w-4 h-4" />
            View Council Members
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="dark-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-400">Your Voting Power</p>
                  <p className="text-xl md:text-2xl font-bold text-purple-400">{userVotingPower.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">
                    {eqofloAmount > 0
                      ? `${((userVotingPower / eqofloAmount) * 100).toFixed(2)}% of treasury`
                      : '0.00% of treasury'}
                  </p>
                </div>
                <Vote className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-400">Active Proposals</p>
                  <p className="text-xl md:text-2xl font-bold text-blue-400">{active}</p>
                  <p className="text-xs text-gray-500">Need your vote</p>
                </div>
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-400">Treasury Value</p>
                  <p className="text-xl md:text-2xl font-bold text-green-400">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-gray-500">{eqofloAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} $EQOFLO</p>
                </div>
                <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-400">Total Proposals</p>
                  <p className="text-xl md:text-2xl font-bold text-yellow-400">{proposals.length}</p>
                  <p className="text-xs text-gray-500">{passed} passed, {failed} failed</p>
                </div>
                <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NEW: Revenue Distribution System with Tooltip */}
        <div className="mb-6 flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Revenue Distribution System</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-5 h-5 text-green-400 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent className="max-w-md bg-zinc-800 text-white border border-green-500/20 shadow-lg p-4 rounded-lg">
                <p className="text-sm font-semibold text-green-400 mb-2">How EqoFlow Revenue Sharing Works:</p>
                <p className="text-gray-300 text-xs mb-3">
                  The DAO Treasury collects revenue from platform activities. Each quarter, a portion of the treasury can be distributed to all $EQOFLO holders as dividends, with the exact percentage being decided by a community vote.
                </p>
                <p className="text-sm font-semibold text-green-400 mb-2">Distribution Process:</p>
                <ol className="list-decimal list-inside text-gray-300 text-xs space-y-1 pl-4">
                  <li>Any token holder proposes a percentage of the treasury to distribute.</li>
                  <li>The community votes for 7 days to decide on a fair percentage.</li>
                  <li>If a percentage is approved, funds are distributed proportionally to all token holders.</li>
                </ol>
                <div className="mt-3 p-2 bg-green-600/10 border border-green-500/20 rounded-md">
                  <p className="text-green-400 text-xs font-medium">Example:</p>
                  <p className="text-gray-300 text-xs mt-0.5">
                    Hold 1,000 $EQOFLO (1% of total supply), and 10,000 $EQOFLO is distributed from treasury. You would receive 100 $EQOFLO. The more tokens you hold, the larger your share.
                  </p>
                </div>
                <div className="mt-2 p-2 bg-yellow-600/10 border border-yellow-500/20 rounded-md">
                  <p className="text-yellow-400 text-xs font-medium">Important Legal Note:</p>
                  <p className="text-gray-300 text-xs mt-0.5">
                    The platform does not promise or guarantee any distributions. All revenue sharing is decided by the decentralized community through governance votes. Token holders control when and how much to distribute from the treasury they collectively own.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Distribution Countdown */}
        <DistributionCountdown
          onCreateProposal={(proposalType) => {
            handleTabChange("create-proposal");
            // You could also pre-select the proposal type here if needed
          }} />


        {/* Governance Thresholds Summary - Now AFTER Distribution Countdown */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Governance Thresholds Summary</h3>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto relative rounded-lg bg-black/20 border border-purple-500/20">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-black/30">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Proposal Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-center">
                    Creation Threshold
                  </th>
                  <th scope="col" className="px-6 py-3 text-center">
                    Minimum Voting Threshold
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-purple-500/20 hover:bg-purple-500/5 transition-colors">
                  <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    Regular <span className="text-gray-400 text-xs">(e.g., Feature Request)</span>
                  </th>
                  <td className="px-6 py-4 text-center">
                    1,000 $EQOFLO
                  </td>
                  <td className="px-6 py-4 text-center">
                    250 $EQOFLO
                  </td>
                </tr>
                <tr className="border-b border-purple-500/20 hover:bg-purple-500/5 transition-colors">
                  <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    Treasury <span className="text-gray-400 text-xs">(e.g., Funding)</span>
                  </th>
                  <td className="px-6 py-4 text-center">
                    5,000 $EQOFLO
                  </td>
                  <td className="px-6 py-4 text-center">
                    1,250 $EQOFLO
                  </td>
                </tr>
                <tr className="hover:bg-purple-500/5 transition-colors">
                  <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    Critical <span className="text-gray-400 text-xs">(e.g., Protocol Change)</span>
                  </th>
                  <td className="px-6 py-4 text-center">
                    10,000 $EQOFLO
                  </td>
                  <td className="px-6 py-4 text-center">
                    4,000 $EQOFLO
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            <div className="p-4 bg-black/20 border border-purple-500/20 rounded-lg">
              <h5 className="font-semibold text-white mb-2">Regular <span className="text-gray-400 text-xs">(e.g., Feature Request)</span></h5>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Creation Threshold:</span>
                <span className="text-white">1,000 $EQOFLO</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Voting Threshold:</span>
                <span className="text-white">250 $EQOFLO</span>
              </div>
            </div>
            <div className="p-4 bg-black/20 border border-purple-500/20 rounded-lg">
              <h5 className="font-semibold text-white mb-2">Treasury <span className="text-gray-400 text-xs">(e.g., Funding)</span></h5>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Creation Threshold:</span>
                <span className="text-white">5,000 $EQOFLO</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Voting Threshold:</span>
                <span className="text-white">1,250 $EQOFLO</span>
              </div>
            </div>
            <div className="p-4 bg-black/20 border border-purple-500/20 rounded-lg">
              <h5 className="font-semibold text-white mb-2">Critical <span className="text-gray-400 text-xs">(e.g., Protocol Change)</span></h5>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Creation Threshold:</span>
                <span className="text-white">10,000 $EQOFLO</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Voting Threshold:</span>
                <span className="text-white">4,000 $EQOFLO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        {/* Replaced <Tabs> component with custom button group for tab navigation */}
        <div className="grid w-full grid-cols-2 lg:grid-cols-5 gap-1 md:gap-2 dark-card p-1 md:p-1.5 rounded-2xl">
            {allTabs.map((tab) => (
              <Button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                variant="ghost" // Always use ghost for base, then override class
                className={`flex items-center justify-center p-2 text-xs md:text-sm rounded-xl transition-all ${
                  activeTab === tab.value
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg neon-glow'
                    : 'text-gray-400 hover:text-white hover:bg-black/30'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2 inline" />
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Tab Content - Now wrapped with AnimatePresence for transitions */}
          <div className="mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Proposals Tab Content */}
                {activeTab === 'proposals' && (
                  <div>
                    {isLoading ? (
                      <div className="flex items-center justify-center pt-20">
                        <div className="flex items-center gap-3 text-white">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
                          <span className="text-lg">Loading proposals...</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {proposals.length > 0 ? (
                          <div className="bg-slate-950 space-y-4 p-4 rounded-lg">
                            <AnimatePresence>
                              {proposals.map((proposal, index) => (
                                <ProposalCard
                                  key={proposal.id}
                                  proposal={proposal}
                                  user={user}
                                  index={index}
                                  onVote={() => setSelectedProposal(proposal)}
                                />
                              ))}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <div className="dark-card rounded-2xl p-12 text-center neon-glow">
                            <Vote className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                            <h3 className="text-xl font-semibold text-white mb-2">No Proposals Yet</h3>
                            <p className="text-gray-500 mb-4">Be the first to create a governance proposal!</p>
                            <Button
                              onClick={() => handleTabChange("create-proposal")} // Use new handleTabChange
                              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                            >
                              Create First Proposal
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Treasury Tab Content - Lazy loaded */}
                {activeTab === 'treasury' && loadedTabs.has('treasury') && (
                  <TreasuryOverview treasury={treasury} />
                )}

                {/* My Votes Tab Content */}
                {activeTab === 'my-votes' && (
                  <Card className="dark-card">
                    <CardHeader>
                      <CardTitle className="text-white">Your Voting History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400">This section will display proposals you have voted on, along with your vote choice and voting power used.</p>
                      <div className="mt-4 space-y-4">
                        {proposals.filter((p) => p.voter_records?.some((vr) => vr.voter_email === user?.email)).length > 0 ?
                        proposals.filter((p) => p.voter_records?.some((vr) => vr.voter_email === user?.email)).map((proposal) => {
                          const userVote = proposal.voter_records.find((vr) => vr.voter_email === user?.email);
                          return (
                            <div key={proposal.id} className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                              <div>
                                <p className="font-medium text-white">{proposal.title}</p>
                                <p className="text-sm text-gray-400">
                                  Your vote: <span className={`font-semibold ${userVote.vote_choice === 'for' ? 'text-green-400' : userVote.vote_choice === 'against' ? 'text-red-400' : 'text-blue-400'}`}>{userVote.vote_choice.charAt(0).toUpperCase() + userVote.vote_choice.slice(1)}</span> with {userVote.voting_power.toLocaleString()} $EQOFLO
                                </p>
                              </div>
                              <Badge className={
                                proposal.status === 'passed' || proposal.status === 'executed' ? 'bg-green-500/20 text-green-400' :
                                proposal.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                proposal.status === 'vetoed' ? 'bg-orange-500/20 text-orange-400' :
                                proposal.status === 'queued' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-gray-500/20 text-gray-400'
                              }>
                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                              </Badge>
                            </div>
                          );
                        }) :
                        <p className="text-gray-500 text-center py-4">You haven't cast any votes yet.</p>
                        }
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Create Proposal Tab Content */}
                {activeTab === 'create-proposal' && (
                  <Card className="dark-card neon-glow">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-purple-400" />
                        New Governance Proposal
                      </CardTitle>
                      <p className="text-gray-400 text-sm">Submit your idea to the EqoFlow DAO community.</p>
                    </CardHeader>
                    <CardContent className="bg-slate-950 pt-0 p-6">
                      <CreateProposalModal
                        user={user}
                        treasuryBalance={eqofloAmount}
                        onSubmit={handleCreateProposal}
                        onClose={() => handleTabChange("proposals")} // Use new handleTabChange
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Distributions Tab Content - Lazy loaded */}
                {activeTab === 'distributions' && loadedTabs.has('distributions') && (
                  <Card className="dark-card neon-glow">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Coins className="w-5 h-5 text-green-400" />
                        Historical Distributions
                      </CardTitle>
                      <p className="text-gray-400 text-sm">Review past token distributions from the DAO treasury to $EQOFLO holders.</p>
                    </CardHeader>
                    <CardContent className="bg-slate-950 pt-0 p-6">
                      {/* Placeholder for Distribution history content */}
                      <p className="text-gray-500 text-center py-4">Distribution history coming soon!</p>
                      <p className="text-gray-500 text-center py-2">The current "Distribution Countdown" above provides info on upcoming distributions.</p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
      </div>

      {/* Voting Modal (remains separate as it's for interaction, not a main section) */}
      <AnimatePresence>
        {selectedProposal &&
        <VotingModal
          proposal={selectedProposal}
          user={user}
          onVote={handleVote}
          onClose={() => setSelectedProposal(null)} />

        }
      </AnimatePresence>

      {/* DAO Council Modal */}
      <DaoCouncilModal isOpen={showCouncilModal} onClose={() => setShowCouncilModal(false)} />
      
      {/* How DAO Works Modal */}
      <HowDaoWorksModal isOpen={showHowDaoWorksModal} onClose={() => setShowHowDaoWorksModal(false)} />
    </div>);

}
