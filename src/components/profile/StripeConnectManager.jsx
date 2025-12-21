
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, ExternalLink, Loader2, CreditCard, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import VeriffKYCModal from '../kyc/VeriffKYCModal';
import { motion } from 'framer-motion';

export default function StripeConnectManager({ user, onUpdate }) {
  const [stripeStatus, setStripeStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [showKYCModal, setShowKYCModal] = useState(false);

  const isKYCVerified = user?.kyc_status === 'verified';

  useEffect(() => {
    // Only load Stripe status if KYC is verified, otherwise it's irrelevant/blocked
    if (isKYCVerified) {
      loadStripeStatus();
    } else {
      setIsLoading(false); // Stop loading if KYC is not verified, and we don't need to load Stripe status yet
    }
  }, [isKYCVerified]); // Re-run if KYC status changes

  useEffect(() => {
    // Check for success/refresh URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('stripe_success') === 'true') {
      loadStripeStatus();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname + '?tab=wallet');
    }
  }, []);

  const loadStripeStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('getStripeConnectStatus');
      setStripeStatus(response.data);
    } catch (err) {
      console.error('Error loading Stripe status:', err);
      setError('Failed to load Stripe connection status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('createStripeConnectAccount');
      
      if (response.data.onboardingUrl) {
        // Redirect to Stripe onboarding
        window.location.href = response.data.onboardingUrl;
      }
    } catch (err) {
      console.error('Error connecting Stripe:', err);
      setError(err.response?.data?.error || 'Failed to connect Stripe account');
      setIsConnecting(false);
    }
  };

  const handleRefreshLink = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('refreshStripeConnectLink');
      
      if (response.data.onboardingUrl) {
        window.location.href = response.data.onboardingUrl;
      }
    } catch (err) {
      console.error('Error refreshing Stripe link:', err);
      setError('Failed to refresh Stripe onboarding link');
      setIsConnecting(false);
    }
  };

  if (isLoading && isKYCVerified) { // Only show loading spinner for Stripe if KYC is verified
    return (
      <Card className="dark-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KYC Modal */}
      <VeriffKYCModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        user={user}
        onStatusUpdate={(newStatus) => {
          if (onUpdate) {
            onUpdate({ ...user, kyc_status: newStatus });
          }
        }}
      />

      {/* KYC Warning Banner */}
      {!isKYCVerified && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-yellow-600/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-400 font-medium mb-1">Identity Verification Required</p>
              <p className="text-gray-400 text-sm mb-3">
                To connect Stripe and receive payments, you must complete identity verification (KYC).
              </p>
              <Button
                onClick={() => setShowKYCModal(true)}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                <Shield className="w-4 h-4 mr-2" />
                Start Verification
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Existing Stripe Connect UI - with conditional disabling */}
      <Card className="dark-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                Stripe Connect for Sellers
              </CardTitle>
              <CardDescription className="text-gray-400 mt-2">
                Connect your Stripe account to receive payments from Skills Marketplace sales
              </CardDescription>
            </div>
            {isKYCVerified && stripeStatus?.connected && ( // Only show badge if KYC is verified and connected
              <Badge 
                className={
                  stripeStatus.charges_enabled && stripeStatus.payouts_enabled
                    ? 'bg-green-600/20 text-green-400 border-green-500/30'
                    : 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
                }
              >
                {stripeStatus.charges_enabled && stripeStatus.payouts_enabled ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Pending Setup
                  </>
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isKYCVerified ? (
            <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Complete KYC verification to connect Stripe
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {!stripeStatus?.connected ? (
                <div className="space-y-4">
                  <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Why Connect Stripe?</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Receive payments directly from buyers on the Skills Marketplace</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Secure, automated payouts after job completion</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Professional payment processing with buyer protection</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Connect Stripe Account
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-sm text-gray-400 mb-1">Account ID</p>
                      <p className="text-white font-mono text-xs break-all">{stripeStatus.accountId}</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-sm text-gray-400 mb-1">Payouts Status</p>
                      <p className={`text-sm font-medium ${stripeStatus.payouts_enabled ? 'text-green-400' : 'text-yellow-400'}`}>
                        {stripeStatus.payouts_enabled ? 'Enabled' : 'Pending'}
                      </p>
                    </div>
                  </div>

                  {!stripeStatus.charges_enabled || !stripeStatus.payouts_enabled ? (
                    <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">Complete Your Setup</h4>
                          <p className="text-sm text-gray-300 mb-3">
                            Your Stripe account needs additional information before you can receive payments.
                          </p>
                          <Button
                            onClick={handleRefreshLink}
                            disabled={isConnecting}
                            variant="outline"
                            className="border-yellow-500/30 text-white hover:bg-yellow-500/10"
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Complete Setup
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-white font-medium mb-1">All Set!</h4>
                          <p className="text-sm text-gray-300">
                            Your Stripe account is fully connected. You can now receive payments from Skills Marketplace sales.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Need help? Visit the{' '}
                    <a
                      href="https://dashboard.stripe.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      Stripe Dashboard
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
