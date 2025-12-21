
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Lock,
  TrendingUp,
  Calendar,
  Info,
  DollarSign,
  Shield,
  Award,
  Calculator,
  Download,
  AlertTriangle } from
'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

import { createStake } from '@/functions/createStake';
import { getActiveStakes } from '@/functions/getActiveStakes';
import { withdrawStake } from '@/functions/withdrawStake';

export default function EQOFLOStakingCard({ user, onUpdate }) {
  const [activeStakes, setActiveStakes] = useState([]);
  const [stakingAmount, setStakingAmount] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [isStaking, setIsStaking] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Staking periods with their respective returns
  const stakingPeriods = [
  {
    days: 30,
    label: '30 Days',
    apy: 5.0,
    description: 'Perfect for testing the waters',
    icon: <Calendar className="w-4 h-4" />,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    days: 60,
    label: '60 Days',
    apy: 8.5,
    description: 'Great balance of commitment and returns',
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'from-purple-500 to-pink-500'
  },
  {
    days: 90,
    label: '90 Days',
    apy: 12.0,
    description: 'Strong returns for moderate commitment',
    icon: <Award className="w-4 h-4" />,
    color: 'from-green-500 to-emerald-500'
  },
  {
    days: 365,
    label: '1 Year',
    apy: 20.0,
    description: 'Maximum returns for true believers',
    icon: <Shield className="w-4 h-4" />,
    color: 'from-yellow-500 to-orange-500'
  }];


  const selectedStakingPeriod = stakingPeriods.find((p) => p.days.toString() === selectedPeriod);
  const availableBalance = user?.token_balance || 0;
  const stakingAmountNum = parseFloat(stakingAmount) || 0;
  const projectedReturns = stakingAmountNum * (selectedStakingPeriod?.apy || 0) / 100 / 365 * (selectedStakingPeriod?.days || 0);

  // Memoize loadActiveStakes to prevent re-creation on every render
  const loadActiveStakes = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await getActiveStakes({});

      if (response.data.success) {
        setActiveStakes(response.data.stakes);
      } else {
        console.error('Failed to load stakes:', response.data.error);
        setActiveStakes([]);
      }
    } catch (error) {
      console.error('Error loading stakes:', error);
      setActiveStakes([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]); // user is a dependency for loadActiveStakes

  useEffect(() => {
    if (user) {
      loadActiveStakes();
    }
  }, [user, loadActiveStakes]); // Added loadActiveStakes to dependency array

  const handleStake = async () => {
    if (!stakingAmountNum || stakingAmountNum <= 0 || stakingAmountNum > availableBalance) {
      return;
    }

    setIsStaking(true);
    try {
      const response = await createStake({
        amount: stakingAmountNum,
        period_days: selectedStakingPeriod.days
      });

      if (response.data.success) {
        setStakingAmount('');
        await loadActiveStakes();

        // Update user balance in parent component
        if (onUpdate) onUpdate();

        alert(`Successfully staked ${stakingAmountNum} EQOFLO for ${selectedStakingPeriod.days} days!`);
      } else {
        alert(`Failed to stake tokens: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Staking error:', error);
      alert('Failed to stake tokens. Please try again.');
    } finally {
      setIsStaking(false);
    }
  };

  const handleWithdraw = async (stakeId) => {
    if (!window.confirm('Are you sure you want to withdraw this stake? This action cannot be undone.')) {
      return;
    }

    setIsWithdrawing(true);
    try {
      const response = await withdrawStake({ stakeId });

      if (response.data.success) {
        await loadActiveStakes();

        // Update user balance in parent component
        if (onUpdate) onUpdate();

        alert(`Successfully withdrew stake! You received ${response.data.totalReturn.toFixed(2)} EQOFLO (including ${response.data.rewards.toFixed(2)} in rewards).`);
      } else {
        alert(`Failed to withdraw stake: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert('Failed to withdraw stake. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const totalStakedAmount = activeStakes.reduce((sum, stake) => sum + stake.amount, 0);
  const totalCurrentRewards = activeStakes.reduce((sum, stake) => sum + (stake.current_rewards || 0), 0);

  return (
    <Card className="dark-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-green-400" />
          EQOFLO Staking
        </CardTitle>
        {/* Add disclaimer */}
        <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-3 mt-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-yellow-300 text-sm">
              <strong>Development Feature:</strong> This staking interface is for demonstration purposes only.
              Rewards will not accrue to your token balance as we are still developing this feature for future use.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* How Staking Works - Transparency Section */}
        <Alert className="bg-blue-600/10 border-blue-500/20 text-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle className="text-blue-300">How Staking Rewards Work</AlertTitle>
          <AlertDescription className="text-sm mt-2">
            Staking rewards come from <span className="font-bold text-blue-300">platform revenue sharing</span>:
            <br />• Marketplace fees (15% of all transactions)
            <br />• Premium subscription revenue
            <br />• NFT gating fees
            <br />
            <span className="text-blue-400">Excess revenue after staking rewards goes to the DAO treasury for community benefit.</span>
          </AlertDescription>
        </Alert>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-black/30 rounded-lg border border-purple-500/20">
            <div className="text-xl font-bold text-purple-400">15%</div>
            <div className="text-xs text-gray-400">Platform Fees</div>
          </div>
          <div className="text-center p-3 bg-black/30 rounded-lg border border-green-500/20">
            <div className="text-xl font-bold text-green-400">{activeStakes.length}</div>
            <div className="text-xs text-gray-400">Active Stakes</div>
          </div>
          <div className="text-center p-3 bg-black/30 rounded-lg border border-yellow-500/20">
            <div className="text-xl font-bold text-yellow-400">
              {totalStakedAmount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Total Staked EQOFLO</div>
          </div>
        </div>

        {/* Main Staking Interface */}
        <Tabs defaultValue="stake" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/20">
            <TabsTrigger value="stake" className="data-[state=active]:bg-purple-600">
              Stake Tokens
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600">
              My Stakes ({activeStakes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stake" className="space-y-6">
            {/* Staking Period Selection */}
            <div className="bg-slate-950">
              <Label className="text-white font-medium mb-4 block">Choose Staking Period</Label>
              <div className="bg-slate-950 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stakingPeriods.map((period) =>
                <motion.button
                  key={period.days}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPeriod(period.days.toString())}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedPeriod === period.days.toString() ?
                  'border-purple-500 bg-purple-600/20' :
                  'border-gray-600 bg-black/20 hover:border-gray-500'}`
                  }>

                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${period.color}`}>
                        {period.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{period.label}</h4>
                        <p className="text-xs text-gray-400">{period.description}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-400">
                        {period.apy}% APY
                      </span>
                    </div>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Staking Amount Input */}
            <div className="bg-slate-950 mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-6">
              <Label className="text-white font-medium mb-2 block">
                Amount to Stake
              </Label>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="number"
                    value={stakingAmount}
                    onChange={(e) => setStakingAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-black/20 border-purple-500/20 text-white pr-20"
                    max={availableBalance}
                    min="0"
                    step="0.01" />

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-xs text-gray-400">EQOFLO</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">
                    Available: {availableBalance.toLocaleString()} EQOFLO
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStakingAmount(availableBalance.toString())}
                    className="text-purple-400 hover:text-purple-300 h-auto p-1">

                    Stake Max
                  </Button>
                </div>
              </div>
            </div>

            {/* Projection Calculator */}
            {stakingAmountNum > 0 && selectedStakingPeriod &&
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }} className="bg-slate-950 p-4 from-green-600/10 to-emerald-600/10 border border-green-500/20 rounded-xl">


                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-green-400" />
                  <h4 className="font-bold text-green-300">Staking Projection</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">
                      {stakingAmountNum.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">EQOFLO Staked</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-400">
                      +{projectedReturns.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">Est. Rewards</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-400">
                      {(stakingAmountNum + projectedReturns).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">Total Return</div>
                  </div>
                </div>
              </motion.div>
            }

            {/* Stake Button */}
            <Button
              onClick={handleStake}
              disabled={isStaking || !stakingAmountNum || stakingAmountNum > availableBalance || stakingAmountNum <= 0}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 h-12">

              {isStaking ?
              <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing Stake...
                </> :

              <>
                  <Lock className="w-4 h-4 mr-2" />
                  Stake {stakingAmountNum || 0} EQOFLO
                </>
              }
            </Button>

            {/* Important Notes */}
            <Alert className="bg-slate-950 text-foreground p-4 relative w-full rounded-lg border [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground border-yellow-500/20">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-yellow-200 text-sm">
                Staked tokens are locked for the selected period. Early withdrawal is not possible. Rewards are distributed from actual platform revenue.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            {isLoading ?
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4" />
                <p className="text-gray-400">Loading your stakes...</p>
              </div> :
            activeStakes.length > 0 ?
            <div className="bg-slate-950 space-y-4">
                {activeStakes.map((stake) => {
                const progressPercent = Math.min(100, Math.max(0, stake.progress_percentage || 0));

                return (
                  <Card key={stake.id} className="bg-black/20 border-purple-500/20">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-white font-bold">{stake.amount.toLocaleString()} EQOFLO Staked</h4>
                            <p className="text-sm text-gray-400">{stake.period_days} days • {stake.apy}% APY</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                              {stake.status === 'active' ? 'Active' : stake.status}
                            </Badge>
                            {stake.is_mature &&
                          <Button
                            onClick={() => handleWithdraw(stake.id)}
                            disabled={isWithdrawing}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white">

                                {isWithdrawing ?
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /> :

                            <>
                                    <Download className="w-3 h-3 mr-1" />
                                    Withdraw
                                  </>
                            }
                              </Button>
                          }
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Started:</p>
                            <p className="text-sm text-white font-medium">
                              {format(new Date(stake.start_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Ends:</p>
                            <p className="text-sm text-white font-medium">
                              {format(new Date(stake.end_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Current Rewards:</p>
                            <p className="text-sm text-green-400 font-bold">
                              +{(stake.current_rewards || 0).toFixed(2)} EQOFLO
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Value:</p>
                            <p className="text-sm text-purple-400 font-bold">
                              {(stake.amount + (stake.current_rewards || 0)).toLocaleString()} EQOFLO
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                          className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }} />

                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {stake.days_remaining || 0} days remaining • {progressPercent.toFixed(1)}% complete
                        </p>

                        {stake.is_mature &&
                      <p className="text-xs text-green-400 mt-2 font-medium">
                            🎉 This stake has matured! You can now withdraw it.
                          </p>
                      }
                      </CardContent>
                    </Card>);

              })}

                {/* Summary Card */}
                {totalCurrentRewards > 0 &&
              <Card className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-green-500/20">
                    <CardContent className="bg-slate-950 p-4">
                      <div className="text-center">
                        <h4 className="text-green-300 font-bold mb-2">Total Pending Rewards</h4>
                        <p className="text-2xl font-bold text-green-400">
                          +{totalCurrentRewards.toFixed(2)} EQOFLO
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          From all active stakes
                        </p>
                      </div>
                    </CardContent>
                  </Card>
              }
              </div> :

            <div className="bg-slate-950 text-slate-50 py-8">
                <Lock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-white mb-2 text-lg font-semibold text-center">No Active Stakes</h3>
                <p className="text-sm text-center">Start staking EQOFLO to earn rewards from platform revenue!</p>
              </div>
            }
          </TabsContent>
        </Tabs>

        {/* Revenue Sharing Breakdown */}
        <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-xl p-4">
          <h4 className="font-bold text-purple-300 mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Revenue Distribution
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Marketplace Fees:</span>
              <span className="text-white">→ Stakers (70%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Subscription Revenue:</span>
              <span className="text-white">→ Stakers (50%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Remaining Revenue:</span>
              <span className="text-purple-400">→ DAO Treasury</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">DAO Benefits:</span>
              <span className="text-green-400">→ All Token Holders</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>);

}
