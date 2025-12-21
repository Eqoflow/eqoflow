
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Wallet,
  Gift,
  HelpCircle,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { User } from '@/entities/User';
import { claimITOTokens } from '@/functions/claimITOTokens';
import { ITOClaim } from '@/entities/ITOClaim';

export default function TokenBalanceCard({ user, onSwap, onStake }) {
  const [totalBalance, setTotalBalance] = useState(0);
  const [connectedWallet, setConnectedWallet] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isCheckingClaim, setIsCheckingClaim] = useState(true);

  useEffect(() => {
    if (user) {
      setTotalBalance((user.token_balance || 0) + (user.tokens_on_hold || 0));
    }
  }, [user]);

  // Effect to check if the user has already claimed tokens
  useEffect(() => {
    if (user?.email) {
      setIsCheckingClaim(true);
      const checkClaimStatus = async () => {
        try {
          const claims = await ITOClaim.filter({ claimed_by_user_email: user.email });
          if (claims && claims.length > 0) {
            setHasClaimed(true);
          }
        } catch (e) {
          console.error("Failed to check claim status", e);
        } finally {
          setIsCheckingClaim(false);
        }
      };
      checkClaimStatus();
    } else {
      setHasClaimed(false);
      setIsCheckingClaim(false);
    }
  }, [user]);

  const connectWallet = async () => {
    if (!window.solana) {
      setClaimError("Please install a Solana wallet like Phantom to continue.");
      return;
    }

    setIsConnecting(true);
    setClaimError(null);

    try {
      const response = await window.solana.connect();
      const walletAddress = response.publicKey.toString();
      setConnectedWallet(walletAddress);
      setClaimError(null);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setClaimError("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClaimTokens = async () => {
    if (!connectedWallet) {
      setClaimError("Please connect your wallet first.");
      return;
    }

    if (!window.solana) {
      setClaimError("Solana wallet not found.");
      return;
    }

    setIsClaiming(true);
    setClaimError(null);
    setClaimSuccess(null);

    try {
      // Create a unique message to sign
      const message = `I am claiming my $EQOFLO tokens for EqoFlow account: ${user.email}\nTimestamp: ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);

      // Request signature from wallet
      const signedMessage = await window.solana.signMessage(encodedMessage, 'utf8');
      
      if (!signedMessage || !signedMessage.signature) {
        throw new Error("Failed to sign message. Please try again.");
      }

      // Convert signature to base64 string using browser APIs
      // This line was changed from: const signature = Buffer.from(signedMessage.signature).toString('base64');
      const signature = btoa(String.fromCharCode(...new Uint8Array(signedMessage.signature)));

      const response = await claimITOTokens({
        walletAddress: connectedWallet,
        message: message,
        signature: signature
      });

      if (response.error) {
        let errorMessage = response.error.message || response.error;
        
        if (errorMessage.includes('already been claimed')) {
          errorMessage = 'Token address already claimed - please email support if you think there has been a mistake: support@eqoflow.app';
        } else if (errorMessage.includes('No unclaimed transactions')) {
          errorMessage = 'No transactions found for this wallet address. Please verify the address or contact support: support@eqoflow.app';
        } else if (errorMessage.includes('Invalid signature')) {
          errorMessage = 'Wallet signature verification failed. Please try again.';
        }
        
        throw new Error(errorMessage);
      }

      if (response.data && response.data.success) {
        setClaimSuccess(`Successfully claimed ${response.data.claimedAmount.toLocaleString()} $EQOFLO! Your balance has been updated.`);
        setHasClaimed(true);
        // Refresh user data to show new balance
        const freshUser = await User.me();
      } else {
        throw new Error(response.data?.error || 'Claim failed. Please try again.');
      }

    } catch (err) {
      console.error("Claiming error:", err);
      
      let displayError = err.message || 'Failed to claim tokens.';
      
      if (err.response?.data?.error) {
        displayError = err.response.data.error;
        
        if (displayError.includes('already been claimed')) {
          displayError = 'Token address already claimed - please email support if you think there has been a mistake: support@eqoflow.app';
        }
      } else if (typeof err === 'string') {
          displayError = err;
      }
      
      setClaimError(displayError);
    } finally {
      setIsClaiming(false);
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet('');
    setClaimError(null);
    setClaimSuccess(null);
  };

  return (
    <Card className="dark-card h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-6 h-6 text-purple-400" />
          My Wallet
        </CardTitle>
        <Sparkles className="w-5 h-5 text-yellow-400" />
      </CardHeader>
      <CardContent className="flex-grow space-y-6 pt-4">
        <div>
          <p className="text-sm text-gray-400">Total Balance</p>
          <motion.p
            key={totalBalance}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white"
          >
            {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.p>
          <p className="text-lg font-semibold text-purple-400">$EQOFLO</p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Available</p>
            <p className="font-medium text-gray-200">{(user?.token_balance || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">On Hold (Staked/Bonded)</p>
            <p className="font-medium text-gray-200">{(user?.tokens_on_hold || 0).toLocaleString()}</p>
          </div>
        </div>

        {user && !user.welcome_bonus_received && (
          <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-lg p-3 text-center">
            <p className="text-sm text-yellow-300">
              <Gift className="w-4 h-4 inline mr-2" />
              You have a 1,000 $EQOFLO welcome bonus waiting! It will be automatically added to your wallet soon.
            </p>
          </div>
        )}

      </CardContent>
      <CardFooter className="flex-col items-stretch gap-4 border-t border-purple-500/20 pt-4">
        <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
          <p className="text-sm text-blue-200 text-center">
            <Info className="w-4 h-4 inline mr-2" />
            These tokens are for visual reference only and the real $EQOFLO tokens will only be available after the ITO ends and tokens will be claimable via trust.swap after the vesting schedule.
          </p>
        </div>
        
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 space-y-4">
          <h4 className="font-semibold text-white">Claim ITO Tokens</h4>
          
          {isCheckingClaim ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              <p className="ml-2 text-purple-300">Checking claim status...</p>
            </div>
          ) : hasClaimed ? (
            <div className="p-4 bg-green-600/10 border border-green-500/20 rounded-lg text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <h5 className="font-semibold text-white">Tokens Already Claimed</h5>
              <p className="text-sm text-gray-300">You have successfully claimed your ITO tokens on this account. Thank you!</p>
              <p className="text-xs text-gray-400 mt-2">If you believe this is an error, please contact <a href="mailto:support@eqoflow.app" className="underline hover:text-green-200">support@eqoflow.app</a></p>
            </div>
          ) : (
            <>
              <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-md text-sm text-blue-300 flex items-start gap-2">
                <HelpCircle className="w-5 h-4 flex-shrink-0 mt-0.5" />
                <span>Connect the Solana wallet you used to send USDC to the ITO. We will verify ownership and automatically add your purchased $EQOFLO to your balance.</span>
              </div>

              <div className="p-3 bg-purple-600/10 border border-purple-500/20 rounded-md text-sm text-purple-300 flex items-start gap-2">
                <AlertTriangle className="w-5 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Important Claim Limitations:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• You can only claim tokens <strong>once per account</strong> - once approved, you cannot claim again</li>
                    <li>• If you used <strong>multiple wallet addresses</strong> to purchase $EQOFLO tokens, please email <a href="mailto:support@eqoflow.app" className="font-semibold underline hover:text-purple-200">support@eqoflow.app</a> so we can assist you in claiming the rest</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                {!connectedWallet ? (
                  <Button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting Wallet...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect Solana Wallet
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-600/10 border border-green-500/20 rounded-md">
                      <p className="text-sm text-green-300 font-medium mb-1">Connected Wallet:</p>
                      <p className="text-xs text-green-200 font-mono break-all">{connectedWallet}</p>
                      <Button
                        onClick={disconnectWallet}
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-green-400 hover:text-green-300 p-0 h-auto"
                      >
                        Disconnect
                      </Button>
                    </div>
                    <Button
                      onClick={handleClaimTokens}
                      disabled={isClaiming}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isClaiming ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying & Claiming...
                        </>
                      ) : "Verify & Claim My Tokens"}
                    </Button>
                  </div>
                )}
              </div>

              {claimSuccess && (
                <div className="p-3 bg-green-600/10 border border-green-500/20 rounded-md text-sm text-green-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{claimSuccess}</span>
                </div>
              )}
              {claimError && (
                <div className="p-3 bg-red-600/10 border border-red-500/20 rounded-md text-sm text-red-300 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span>{claimError}</span>
                </div>
              )}

              <div className="p-3 bg-yellow-600/10 border border-yellow-500/20 rounded-md text-sm text-yellow-300 flex items-start gap-2">
                <AlertTriangle className="w-8 h-5 flex-shrink-0 mt-0.5" />
                <span>If you sent USDC from a Centralized Exchange (CEX) or a non-Solana wallet, please contact support to verify your transaction: <a href="mailto:support@eqoflow.app" className="font-semibold underline hover:text-yellow-200">support@eqoflow.app</a></span>
              </div>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
