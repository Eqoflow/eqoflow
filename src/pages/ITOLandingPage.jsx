import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/entities/User';
import { UserProfileData } from '@/entities/UserProfileData';
import { GovernanceProposal } from '@/entities/GovernanceProposal';
import { ITOTransaction } from '@/entities/ITOTransaction';
import { ITOTransfer } from '@/entities/ITOTransfer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Coins,
  TrendingUp,
  Shield,
  Vote,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  Plus,
  X,
  Info,
  Copy,
  AlertTriangle,
  Lock,
  Check,
  Rocket,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import CreateITOProposalModal from '../components/ito/CreateITOProposalModal';
import CommunityQnA from '../components/communities/CommunityQnA';
import TransactionFeed from '../components/ito/TransactionFeed';
import TransferFeed from '../components/ito/TransferFeed';
import { updateUserProfileData } from '@/functions/updateUserProfileData';
import VeriffKYCModal from '../components/kyc/VeriffKYCModal';

const phases = [
  {
    id: 1,
    name: "Private Sale",
    tokens: 25000000,
    price: 0.002,
    status: "completed",
    description: "An exclusive sale for early backers and strategic partners."
  },
  {
    id: 2,
    name: "Phase 1",
    tokens: 50000000,
    price: 0.008,
    status: "active",
    description: "First public opportunity to purchase in EqoFlow."
  },
  {
    id: 3,
    name: "Phase 2",
    tokens: 50000000,
    price: 0.012,
    status: "upcoming",
    description: "Continued opportunity for public purchases."
  },
  {
    id: 4,
    name: "Phase 3",
    tokens: 50000000,
    price: 0.016,
    status: "upcoming",
    description: "Scaling the project with community support."
  },
  {
    id: 5,
    name: "Phase 4",
    tokens: 50000000,
    price: 0.018,
    status: "upcoming",
    description: "Final phase before token launch and exchange listing."
  }
];

const DepositModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const usdcAddress = 'FQnEUeAozEnUCVRMGDhNsZSu4EzxepvJqLUkDWJT86Hh';

  useEffect(() => {
    if (user?.has_acknowledged_cex_warning) {
      setHasAcknowledged(true);
    } else if (isOpen) {
      setHasAcknowledged(false);
    }
  }, [user?.has_acknowledged_cex_warning, isOpen]);

  const handleAcknowledgeWarning = async () => {
    if (isUpdatingProfile) return;

    setIsUpdatingProfile(true);
    try {
      await updateUserProfileData({
        updateData: { has_acknowledged_cex_warning: true }
      });

      setHasAcknowledged(true);

      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Failed to save CEX warning acknowledgment:', error);
      alert('Could not save your acknowledgment. Please try again.');
      setHasAcknowledged(false);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(usdcAddress);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 border border-green-500/30 rounded-2xl w-full max-w-md p-6 relative"
      >
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Deposit USDC</h2>
          <p className="text-gray-400">
            Send your USDC to the address below to participate in the Private Sale.
          </p>
        </div>

        <div className="mb-4">
          <p className="text-gray-300 mb-4">
            Make sure to only send USDC on the Solana network.
          </p>

          {!hasAcknowledged ? (
            <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-red-300 text-lg mb-2">Warning</h3>
                  <p className="text-red-200/90 text-sm leading-relaxed">
                    Do not make deposits from a CEX (Centralized Exchange) wallet or any non-Solana wallet. All deposit addresses will be used for trust.swap. If you attempt to claim using an unsupported wallet, your funds may be lost, and we will not be able to offer refunds.
                  </p>
                </div>
              </div>

              <div
                className="flex items-center space-x-3 cursor-pointer select-none p-2 -m-2 rounded hover:bg-red-900/10"
                onClick={(e) => {
                  if (!isUpdatingProfile) {
                    handleAcknowledgeWarning();
                  }
                }}
              >
                <input
                  type="checkbox"
                  id="cex-warning-checkbox"
                  className="w-5 h-5 text-red-500 bg-slate-800 border-red-500 rounded focus:ring-red-500 focus:ring-2 cursor-pointer"
                  checked={hasAcknowledged}
                  onChange={() => { }}
                  disabled={isUpdatingProfile}
                />
                <label
                  htmlFor="cex-warning-checkbox"
                  className="text-red-200 font-medium cursor-pointer"
                >
                  I understand
                </label>
                {isUpdatingProfile && (
                  <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-green-500/20">
              <p className="text-sm text-gray-400 mb-2">USDC Address (Solana)</p>
              <div className="flex items-center justify-between gap-3 bg-slate-900/70 rounded-lg p-3">
                <code className="text-green-400 font-mono text-sm break-all">
                  {usdcAddress}
                </code>
                <Button
                  onClick={handleCopyAddress}
                  size="sm"
                  className={`flex-shrink-0 transition-all ${
                    isCopied
                      ? 'bg-green-700 hover:bg-green-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm text-gray-400 p-2 bg-slate-800/30 rounded-md border border-yellow-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <p>
                <strong className="text-yellow-400">Important:</strong> Only send USDC on Solana network. Sending other tokens or from other networks will result in loss of funds.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <p>
                Your tokens will be allocated based on the current phase pricing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <p>
                All tokens are subject to the specified vesting schedule.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Color schemes for dynamic theming
const colorSchemes = {
  purple: { primary: '#8b5cf6', secondary: '#ec4899' },
  blue: { primary: '#3b82f6', secondary: '#06b6d4' },
  green: { primary: '#10b981', secondary: '#059669' },
  orange: { primary: '#f97316', secondary: '#eab308' },
  red: { primary: '#ef4444', secondary: '#ec4899' },
  pink: { primary: '#ec4899', secondary: '#f472b6' },
  cyan: { primary: '#06b6d4', secondary: '#3b82f6' },
  yellow: { primary: '#eab308', secondary: '#f97316' },
  indigo: { primary: '#6366f1', secondary: '#8b5cf6' },
  emerald: { primary: '#10b981', secondary: '#059646' }
};

const getColorScheme = (schemeName) => {
  return colorSchemes[schemeName] || colorSchemes.purple;
};

export default function ITOLandingPage() {
  const [user, setUser] = useState(null);
  const [showITOProposalModal, setShowITOProposalModal] = useState(false);
  const [daoProposals, setDaoProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itoStats, setItoStats] = useState({ totalRaised: 0, transactions: [], transfers: [] });
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [depositAddress] = useState('FQnEUeAozEnUCVRMGDhNsZSu4EzxepvJqLUkDWJT86Hh');
  const [copied, setCopied] = useState(false);

  const vestingSchedule = [
    { day: 'Day 30', unlocked: '10%', total: '10%' },
    { day: 'Day 60', unlocked: '15%', total: '25%' },
    { day: 'Day 90', unlocked: '15%', total: '40%' },
    { day: 'Day 120', unlocked: '15%', total: '55%' },
    { day: 'Day 150', unlocked: '15%', total: '70%' },
    { day: 'Day 180', unlocked: '15%', total: '85%' },
    { day: 'Day 210', unlocked: '15%', total: '100%' },
  ];

  const loadItoStats = useCallback(async () => {
    try {
      const allTransactions = await ITOTransaction.list('-created_date');
      const transfers = await ITOTransfer.list('-created_date', 10);

      // Calculate total raised ONLY for the current active phase (Phase 1) for progress bar
      const currentPhaseTransactions = allTransactions.filter(tx => tx.phase_name === 'Phase 1');
      const totalRaised = currentPhaseTransactions.reduce((sum, tx) => sum + tx.amount_usdc, 0);

      // BUT show ALL recent transactions in the feed (from all phases)
      const recentTransactions = allTransactions.slice(0, 10);

      setItoStats({ totalRaised, transactions: recentTransactions, transfers });
    } catch (error) {
      console.error('Error loading ITO stats:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const baseUser = await User.me();
      if (baseUser) {
        const profileRecords = await UserProfileData.filter({ user_email: baseUser.email });
        let mergedUser = baseUser;
        if (profileRecords.length > 0) {
            mergedUser = { ...baseUser, ...profileRecords[0] };
        }
        setUser(mergedUser);
      } else {
        setUser(null);
      }

      await loadItoStats();

      const proposals = await GovernanceProposal.filter({
        tags: { $in: ["ito_funding"] }
      }, "-created_date", 5);
      setDaoProposals(proposals);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadItoStats]);

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadItoStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadData, loadItoStats]);

  const handleCreateITOProposal = async (proposalData) => {
    try {
      const itoProposalData = {
        ...proposalData,
        tags: [...(proposalData.tags || []), 'ito_funding'],
        proposal_type: 'treasury_allocation'
      };

      await GovernanceProposal.create(itoProposalData);
      setShowITOProposalModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating ITO proposal:', error);
      alert('Failed to create proposal. Please try again.');
    }
  };

  const handleCopyDepositAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPhase = phases.find(phase => phase.status === "active");
  const totalTokens = phases.reduce((sum, phase) => sum + phase.tokens, 0);
  const totalValue = phases.reduce((sum, phase) => sum + (phase.tokens * phase.price), 0);
  const currentPhaseTarget = currentPhase ? (currentPhase.tokens * currentPhase.price) : 0;
  const progressPercentage = currentPhaseTarget > 0 ? (itoStats.totalRaised / currentPhaseTarget) * 100 : 0;
  const currentPrice = currentPhase ? currentPhase.price : 0;

  const itoQnAProps = {
    id: 'quantumflow_ito_page',
    name: 'ITO Page',
    created_by: user?.role === 'admin' ? user.email : 'platform_admin'
  };

  const userColorScheme = getColorScheme(user?.color_scheme);

  return (
    <div className="min-h-screen bg-black text-white p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1
              className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r mb-4"
              style={{
                backgroundImage: `linear-gradient(to right, ${userColorScheme.primary}, ${userColorScheme.secondary})`
              }}
            >
              Initial Token Offering
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Join the future of decentralized social networks. Be part of the EqoFlow revolution.
            </p>
          </motion.div>

          {/* Utility Token Explanation */}
          <Card className="dark-card mb-8">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <Coins className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: userColorScheme.primary }} />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">$EQOFLO: Platform Utility Token</h2>
                  <p className="text-gray-300 text-lg leading-relaxed mb-4">
                    $EQOFLO is the native utility token that powers the EqoFlow platform economy. It enables transactions, unlocks premium features, and facilitates community governance.
                  </p>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    You can participate in the raise to acquire tokens, or <span className="font-semibold" style={{ color: userColorScheme.primary }}>earn them organically</span> through meaningful engagement, quality content creation, active participation in communities, and providing valuable services to other users.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
            <Card className="dark-card">
              <CardContent className="p-6 text-center">
                <Coins className="w-12 h-12 mx-auto mb-4" style={{ color: userColorScheme.primary }} />
                <h3 className="text-2xl font-bold text-white mb-2">{totalTokens.toLocaleString()}</h3>
                <p className="text-gray-400">Total Tokens for Sale</p>
              </CardContent>
            </Card>

            <Card className="dark-card">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">${totalValue.toLocaleString()}</h3>
                <p className="text-gray-400">Total Fundraising Goal</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ITO Phases */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-3xl font-bold text-white text-center mb-8">ITO Phases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {phases.map((phase, index) => (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`dark-card relative overflow-hidden ${
                  phase.status === 'active' ? 'ring-2' : ''
                }`}
                style={{
                  '--tw-ring-color': phase.status === 'active' ? userColorScheme.primary : undefined
                }}
                >
                  {/* SOLD OUT Banner for Private Sale */}
                  {phase.name === "Private Sale" && phase.status === "completed" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="bg-red-600 text-white font-bold text-xl px-12 py-2 transform -rotate-12 shadow-2xl border-4 border-red-800 whitespace-nowrap">
                        SOLD OUT
                      </div>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">
                        {phase.name}
                      </CardTitle>
                      <Badge className={
                        phase.status === 'active'
                          ? 'bg-green-600 text-white'
                          : phase.status === 'upcoming'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-600 text-white'
                      }>
                        {phase.status === 'active' ? 'LIVE' :
                         phase.status === 'upcoming' ? 'COMING SOON' : 'COMPLETED'}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold" style={{ color: userColorScheme.primary }}>{phase.name}</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tokens:</span>
                        <span className="text-white font-semibold">{phase.tokens.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white font-semibold">${phase.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Value:</span>
                        <span className="text-white font-semibold">${(phase.tokens * phase.price).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-300 text-sm mt-4">{phase.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Current Phase Progress Section */}
        <Card className="dark-card mb-8 md:mb-12">
          <CardContent className="p-6 md:p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Current Phase Progress</h2>
              <div className="flex items-center justify-center gap-3 mb-4">
                <Badge className="bg-green-600 text-white px-4 py-2 text-lg">
                  LIVE
                </Badge>
                <span className="text-xl font-semibold" style={{ color: userColorScheme.primary }}>{currentPhase?.name || 'Loading...'}</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white font-semibold">Raised: {itoStats.totalRaised.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                <span className="text-gray-400">Target: {currentPhaseTarget.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progressPercentage}%`,
                    background: `linear-gradient(to right, ${userColorScheme.primary}, ${userColorScheme.secondary})`
                  }}
                ></div>
              </div>
              <div className="text-center mt-2">
                <span className="font-bold text-lg" style={{ color: userColorScheme.primary }}>{progressPercentage.toFixed(2)}% Complete</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="dark-card" style={{ borderColor: `${userColorScheme.primary}33` }}>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                    <Rocket className="w-6 h-6" style={{ color: userColorScheme.primary }} />
                    How to Participate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-4">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: userColorScheme.primary }}
                    >
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Complete Identity Verification (KYC)</h3>
                      <p className="text-gray-400 mb-3">
                        To participate in the ITO and view your deposit address, you must complete identity verification. This ensures compliance with regulations and protects all participants.
                      </p>

                      {user ? (
                        user.kyc_status === 'verified' ? (
                          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 font-medium">Verification Complete</span>
                          </div>
                        ) : user.kyc_status === 'pending' ? (
                          <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                            <span className="text-blue-400 font-medium">Verification In Progress</span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setShowKYCModal(true)}
                            className="text-white"
                            style={{
                              background: `linear-gradient(to right, ${userColorScheme.primary}, ${userColorScheme.secondary})`
                            }}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Start Verification
                          </Button>
                        )
                      ) : (
                        <p className="text-sm text-gray-500">Please log in to start verification</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: userColorScheme.primary }}
                    >
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Get Your Unique Deposit Address</h3>
                      <p className="text-gray-400 mb-3">
                        Once verified, you'll receive a unique Solana wallet address to deposit USDC.
                      </p>

                      {user && user.kyc_status === 'verified' ? (
                        <div className="space-y-3">
                          <div
                            className="p-4 rounded-lg"
                            style={{
                              backgroundColor: `${userColorScheme.primary}10`,
                              borderColor: `${userColorScheme.primary}33`,
                              border: '1px solid'
                            }}
                          >
                            <p className="text-sm text-gray-400 mb-2">Your ITO Deposit Address:</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 font-mono text-sm break-all" style={{ color: userColorScheme.primary }}>
                                {depositAddress}
                              </code>
                              <Button
                                onClick={handleCopyDepositAddress}
                                size="sm"
                                variant="outline"
                                className="text-white flex-shrink-0"
                                style={{
                                  borderColor: `${userColorScheme.primary}33`
                                }}
                              >
                                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 p-3 bg-red-600/10 border border-red-500/30 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-red-400 font-medium text-sm">Important Warning</p>
                              <p className="text-gray-400 text-sm">
                                Only send USDC from a <strong>non-custodial wallet</strong> (Phantom, Solflare, etc.).
                                Do NOT send from centralized exchanges (Coinbase, Binance, etc.) as you won't be able to claim your tokens.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                          <p className="text-gray-500 text-sm">
                            {user ? 'Complete KYC verification to view your deposit address' : 'Log in and complete KYC to view your deposit address'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: userColorScheme.primary }}
                    >
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Send USDC (Solana Network)</h3>
                      <p className="text-gray-400 mb-3">
                        Transfer USDC on the Solana network to your deposit address. Your $EQOFLO tokens will be allocated based on the current price.
                      </p>
                      <div className="p-3 bg-yellow-600/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-400 text-sm">
                          <strong>Current Price:</strong> 1 $EQOFLO = ${currentPrice.toFixed(4)} USDC
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: userColorScheme.primary }}
                    >
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Claim Your $EQOFLO Tokens</h3>
                      <p className="text-gray-400">
                        After the ITO ends, you can claim your $EQOFLO tokens directly to your connected wallet through the platform.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </CardContent>
        </Card>

        {/* Token Lock & Release Schedule */}
        <Card className="dark-card mb-8 md:mb-12">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-6 h-6" style={{ color: userColorScheme.primary }} />
              Token Lock & Release Schedule
            </CardTitle>
            <p className="text-gray-400 text-sm mt-2">
              All tokens purchased during the ITO are subject to a gradual vesting schedule to ensure long-term community alignment
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: `${userColorScheme.primary}10`,
                    borderColor: `${userColorScheme.primary}33`,
                    border: '1px solid'
                  }}
                >
                  <h3 className="font-semibold text-white mb-2">Vesting Details</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Cliff Period:</strong> Tokens begin unlocking 30 days after the ITO concludes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Vesting Duration:</strong> 210 days (7 months) total</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Release Frequency:</strong> Every 30 days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Claiming:</strong> Manual claim via trust.swap after each unlock period</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Why Vesting?</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    The vesting schedule ensures long-term commitment from early supporters and prevents market manipulation.
                    It aligns everyone's interests with the sustainable growth of the EqoFlow ecosystem.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-4">Release Schedule</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderColor: `${userColorScheme.primary}33` }}>
                        <TableHead style={{ color: userColorScheme.primary }}>Period</TableHead>
                        <TableHead style={{ color: userColorScheme.primary }}>Unlocked</TableHead>
                        <TableHead style={{ color: userColorScheme.primary }}>Cumulative</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vestingSchedule.map((schedule, index) => (
                        <TableRow key={index} style={{ borderColor: `${userColorScheme.primary}1A` }}>
                          <TableCell className="text-white font-medium">{schedule.day}</TableCell>
                          <TableCell className="text-green-400">+{schedule.unlocked}</TableCell>
                          <TableCell className="text-white">{schedule.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Important:</strong> You must manually claim your unlocked tokens via trust.swap after each vesting period.
                      Unclaimed tokens will remain in the vesting contract.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Transaction Feed */}
        <div className="mb-8 md:mb-12">
            <TransactionFeed transactions={itoStats.transactions} />
        </div>

        {/* Live Transfer Feed */}
        <div className="mb-8 md:mb-12">
            <TransferFeed transfers={itoStats.transfers} />
        </div>

        {/* Transparency Statement */}
        <Card className="dark-card mb-8 md:mb-12">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Complete Transparency</h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-4">
                  We are launching the first ITO of its kind where all the tokens received are openly and transparently shared with the community so you know exactly where money is being spent and how.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed">
                  For any major expenses or ways to improve the platform, the community will have a say in the proposal within the DAO. Your tokens, your voice.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active DAO Proposals */}
        <Card className="dark-card mb-8 md:mb-12">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Vote className="w-6 h-6" style={{ color: userColorScheme.primary }} />
                <div>
                  <CardTitle className="text-white">Active ITO Proposals</CardTitle>
                  <p className="text-gray-400 text-sm mt-1">
                    Proposals related to the allocation and use of ITO funds.
                  </p>
                </div>
              </div>
              {user && user.role === 'admin' && (
                <Button
                  onClick={() => setShowITOProposalModal(true)}
                  className="text-white"
                  style={{
                    background: `linear-gradient(to right, ${userColorScheme.primary}, ${userColorScheme.secondary})`
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create ITO Proposal
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: userColorScheme.primary }} />
              </div>
            ) : daoProposals.length > 0 ? (
              <div className="space-y-4">
                {daoProposals.map(proposal => (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-slate-800/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <h4 className="font-semibold text-white mb-1">{proposal.title}</h4>
                      <p className="text-sm text-gray-400">
                        Status: <Badge className={
                          proposal.status === 'active' ? 'bg-yellow-600/20 text-yellow-300' :
                          proposal.status === 'passed' ? 'bg-green-600/20 text-green-300' :
                          'bg-gray-600/20 text-gray-300'
                        }>{proposal.status}</Badge>
                      </p>
                    </div>
                    <Link to={createPageUrl(`DAO`)}>
                      <Button
                        variant="outline"
                        className="text-white w-full sm:w-auto"
                        style={{
                          borderColor: `${userColorScheme.primary}33`
                        }}
                      >
                        View in DAO
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Vote className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">No ITO Proposals Yet</h3>
                <p className="text-gray-500 text-sm">
                  Proposals for use of ITO funds will appear here once submitted to the DAO.
                </p>
              </div>
            )}
          </CardContent>
        </Card>



        {/* Q&A Section */}
        <div className="mt-8 md:mt-12">
           <CommunityQnA
              community={itoQnAProps}
              user={user}
              isCreator={user?.role === 'admin'}
              isMember={!!user}
            />
        </div>
      </div>

      {showITOProposalModal && (
        <CreateITOProposalModal
          user={user}
          onSubmit={handleCreateITOProposal}
          onClose={() => setShowITOProposalModal(false)}
        />
      )}

      <VeriffKYCModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        user={user}
        onStatusUpdate={async () => {
          await loadData();
        }}
      />
    </div>
  );
}