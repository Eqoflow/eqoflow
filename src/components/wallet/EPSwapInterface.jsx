
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, ArrowRight, Zap, Coins, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { swapEPToTokens } from '@/functions/swapEPToTokens';
import { EngagementPoint } from '@/entities/EngagementPoint';

export default function EPSwapInterface({ user, onUpdate }) {
  const [epToSwap, setEpToSwap] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [trueSwappableEP, setTrueSwappableEP] = useState(0);
  const [isCalculatingEP, setIsCalculatingEP] = useState(true);
  const [epBreakdown, setEpBreakdown] = useState({ earned: 0, purchased: 0 }); // New state variable

  useEffect(() => {
    const calculateTrueSwappable = async () => {
      if (!user || !user.email) {
        setIsCalculatingEP(false);
        return;
      }
      setIsCalculatingEP(true);

      try {
        // Fetch all EP records to understand the breakdown
        const allEPRecords = await EngagementPoint.filter({ created_by: user.email });
        const purchasedEPRecords = allEPRecords.filter(ep => ep.source === 'purchased');
        const earnedEPRecords = allEPRecords.filter(ep => ep.source !== 'purchased');

        const totalPurchasedEP = purchasedEPRecords.reduce((sum, ep) => sum + (ep.final_points || 0), 0);
        const totalEarnedEP = earnedEPRecords.reduce((sum, ep) => sum + (ep.final_points || 0), 0);

        setEpBreakdown({ earned: totalEarnedEP, purchased: totalPurchasedEP });
        setTrueSwappableEP(Math.max(0, totalEarnedEP)); // Set trueSwappableEP to total earned EP
      } catch (error) {
        console.error("Error calculating true swappable EP:", error);
        setTrueSwappableEP(0); // Set to 0 or a safe default on error
        setEpBreakdown({ earned: 0, purchased: 0 }); // Set breakdown to 0 on error
      } finally {
        setIsCalculatingEP(false);
      }
    };

    calculateTrueSwappable();
  }, [user]);

  const minSwapAmount = 1000; // Minimum 1000 EP required
  const swapRate = 10; // 1000 EP = 10 EQOFLO (so 100 EP = 1 EQOFLO)

  // Calculate how many EQOFLO tokens user would get
  const calculateEQOFLO = (ep) => {
    const validEP = Math.max(0, parseInt(ep) || 0);
    return Math.floor(validEP / 100); // 100 EP = 1 EQOFLO
  };

  // Calculate the maximum swappable amount (must be multiple of 1000)
  const maxSwappableEP = Math.floor(trueSwappableEP / minSwapAmount) * minSwapAmount;

  useEffect(() => {
    // Auto-set to maximum swappable amount when component loads
    if (!isCalculatingEP && maxSwappableEP >= minSwapAmount) {
      setEpToSwap(maxSwappableEP.toString());
    } else if (!isCalculatingEP && maxSwappableEP < minSwapAmount) {
      setEpToSwap('');
    }
  }, [maxSwappableEP, minSwapAmount, isCalculatingEP]);

  const handleSwap = async () => {
    const swapAmount = parseInt(epToSwap) || 0;

    if (isCalculatingEP) {
      setMessage('Still calculating your swappable EP. Please wait...');
      setMessageType('error');
      setTimeout(() => { setMessage(''); setMessageType(''); }, 3000);
      return;
    }

    if (swapAmount < minSwapAmount) {
      setMessage(`Minimum swap amount is ${minSwapAmount} earned EP.`);
      setMessageType('error');
      setTimeout(() => { setMessage(''); setMessageType(''); }, 5000);
      return;
    }

    if (swapAmount > trueSwappableEP) {
      setMessage(`You only have ${trueSwappableEP} earned EP available for swapping.`);
      setMessageType('error');
      setTimeout(() => { setMessage(''); setMessageType(''); }, 5000);
      return;
    }

    // Must be multiple of 1000
    if (swapAmount % minSwapAmount !== 0) {
      setMessage(`Swap amount must be a multiple of ${minSwapAmount} earned EP.`);
      setMessageType('error');
      setTimeout(() => { setMessage(''); setMessageType(''); }, 5000);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await swapEPToTokens({ epToSwap: swapAmount });

      if (error || !data?.success) {
        // Handle different types of errors from the backend
        let errorMessage = 'Swap failed. Please try again.';

        if (error?.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (data?.error) {
          errorMessage = data.error;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        // Handle specific backend errors
        if (errorMessage.includes('Insufficient earned EP balance')) {
          errorMessage = 'Backend rejected the swap due to insufficient earned EP. This may be due to purchased EP in your account. Please contact support if you believe this is an error.';
        }

        throw new Error(errorMessage);
      }

      setMessage(`Successfully swapped ${swapAmount} earned EP for ${data.tokensAwarded} $EQOFLO tokens!`);
      setMessageType('success');
      setEpToSwap('');

      // Refresh the EP calculation after successful swap
      if (user?.email) {
        try {
          const allEPRecords = await EngagementPoint.filter({ created_by: user.email });
          const purchasedEPRecords = allEPRecords.filter(ep => ep.source === 'purchased');
          const earnedEPRecords = allEPRecords.filter(ep => ep.source !== 'purchased');

          const totalPurchasedEP = purchasedEPRecords.reduce((sum, ep) => sum + (ep.final_points || 0), 0);
          const totalEarnedEP = earnedEPRecords.reduce((sum, ep) => sum + (ep.final_points || 0), 0);

          setEpBreakdown({ earned: totalEarnedEP, purchased: totalPurchasedEP });
          setTrueSwappableEP(Math.max(0, totalEarnedEP));
        } catch (error) {
          console.error("Error recalculating EP after swap:", error);
          setTrueSwappableEP(0);
          setEpBreakdown({ earned: 0, purchased: 0 });
        }
      }

      if (onUpdate) {
        onUpdate();
      }

      setTimeout(() => { setMessage(''); setMessageType(''); }, 5000);
    } catch (error) {
      console.error('Swap error:', error);
      let displayMessage = error.message || 'Swap failed. Please try again.';

      setMessage(displayMessage);
      setMessageType('error');
      setTimeout(() => { setMessage(''); setMessageType(''); }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    if (!isCalculatingEP && maxSwappableEP >= minSwapAmount) {
      setEpToSwap(maxSwappableEP.toString());
    }
  };

  const swapAmountValid = parseInt(epToSwap) >= minSwapAmount && parseInt(epToSwap) <= trueSwappableEP && parseInt(epToSwap) % minSwapAmount === 0;

  return (
    <Card className="dark-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-green-400" />
          Convert Earned EP to $EQOFLO
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Exchange your organically earned Engagement Points for real cryptocurrency
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Exchange Rate Display - Very Prominent */}
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-green-400" />
            <span className="font-semibold text-green-400">Exchange Rate</span>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              1000 EP = 10 $EQOFLO
            </div>
            <div className="text-sm text-gray-300">
              (100 EP = 1 $EQOFLO)
            </div>
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-black/20 border border-purple-500/20 rounded-lg p-4 space-y-2">
          {isCalculatingEP ? (
            <div className="text-center text-white">Calculating EP Balance...</div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className="text-green-400 font-medium">Earned EP (Swappable):</span>
                <span className="font-bold text-white text-xl">{epBreakdown.earned.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-400">Purchased EP (Not Swappable):</span>
                <span className="font-bold text-white text-xl">{epBreakdown.purchased.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        {/* Swap Interface */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Earned EP to Swap
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={minSwapAmount}
                max={trueSwappableEP}
                step={minSwapAmount}
                value={epToSwap}
                onChange={(e) => setEpToSwap(e.target.value)}
                placeholder={`Minimum ${minSwapAmount} earned EP`}
                className="flex-1 bg-black/20 border-purple-500/20 text-white" />

              <Button
                onClick={handleMaxClick}
                variant="outline" className="bg-background text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-purple-500/30 hover:bg-purple-500/10"

                disabled={maxSwappableEP < minSwapAmount || isCalculatingEP}>

                Max
              </Button>
            </div>
            <div className="flex justify-between items-center mt-1 text-xs">
              <span className="text-gray-400">Must be multiple of {minSwapAmount}</span>
              {!isCalculatingEP && maxSwappableEP >= minSwapAmount &&
                <span className="text-green-400">Max: {maxSwappableEP.toLocaleString()} earned EP</span>
              }
            </div>
          </div>

          {/* Conversion Preview */}
          <div className="bg-black/30 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <span className="text-white">{parseInt(epToSwap) || 0} EP</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-green-400" />
                <span className="text-white font-bold">{calculateEQOFLO(epToSwap)} $EQOFLO</span>
              </div>
            </div>
            <div className="text-center text-xs text-gray-400 mt-2">
              Conversion Rate: 100 EP = 1 $EQOFLO
            </div>
          </div>

          {/* Requirements Notice */}
          {!isCalculatingEP && trueSwappableEP < minSwapAmount &&
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-orange-300 text-sm font-medium">
                  Minimum {minSwapAmount} Earned EP Required
                </p>
                <p className="text-orange-400 text-xs mt-1">
                  You need {(minSwapAmount - trueSwappableEP).toLocaleString()} more earned EP to make your first swap. Keep engaging organically!
                </p>
              </div>
            </div>
          }

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={!swapAmountValid || isLoading || trueSwappableEP < minSwapAmount || isCalculatingEP}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50">

            {isLoading || isCalculatingEP ?
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {isCalculatingEP ? "Verifying EP..." : "Swapping..."}
              </> :
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Swap Now
              </>
            }
          </Button>

          {/* Important Notice */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-blue-300 text-xs">
                  Swapped tokens are held for 7 days before becoming available in your wallet.
                </p>
                <p className="text-yellow-300 text-xs font-medium">
                  ⚠️ Only organically earned EP can be swapped. Purchased EP cannot be converted to prevent exploitation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <AnimatePresence>
          {message &&
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-3 rounded-lg border ${
                messageType === 'success' ?
                  'bg-green-500/10 border-green-500/30 text-green-400' :
                  'bg-red-500/10 border-red-500/30 text-red-400'}`
              }>

              {message}
            </motion.div>
          }
        </AnimatePresence>
      </CardContent>
    </Card>
  );

}
