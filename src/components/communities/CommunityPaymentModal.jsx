import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, CreditCard, Shield, DollarSign, Info, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CommunityPaymentModal({ community, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    calculatePaymentDetails();
  }, [community]);

  const calculatePaymentDetails = () => {
    const totalAmount = community.membership_fee;
    const platformFee = totalAmount * 0.15;
    const creatorPayout = totalAmount - platformFee;

    setPaymentDetails({
      total_amount: totalAmount,
      platform_fee: platformFee,
      creator_payout: creatorPayout,
      currency: community.currency || 'USD'
    });
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('createCommunityMembershipCheckout', {
        communityId: community.id
      });

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  if (!paymentDetails) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="dark-card w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-lg"
      >
        <Card className="dark-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Join {community.name}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Membership Fee</span>
                  <span className="text-white font-medium">
                    ${paymentDetails.total_amount.toFixed(2)} {paymentDetails.currency}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Creator receives</span>
                  <span className="text-green-400">${paymentDetails.creator_payout.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Platform fee (15%)</span>
                  <span className="text-blue-400">${paymentDetails.platform_fee.toFixed(2)}</span>
                </div>
                
                {community.subscription_type && community.subscription_type !== 'one_time' && (
                  <div className="pt-2 mt-2 border-t border-blue-500/20">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
                      {community.subscription_type === 'monthly' ? 'Monthly' : 'Yearly'} Subscription
                    </Badge>
                  </div>
                )}
                
                {community.free_trial_days > 0 && (
                  <div className="pt-2">
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/40">
                      {community.free_trial_days} Days Free Trial
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-purple-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-purple-300 font-medium mb-1">Secure Checkout</p>
                  <p className="text-purple-200">
                    You'll be redirected to Stripe's secure payment page to complete your purchase.
                    {community.subscription_type !== 'one_time' && (
                      <span className="block mt-1">You can cancel your subscription at any time from your profile settings.</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-green-600/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-green-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-green-300 font-medium">Secure Payment</p>
                  <p className="text-green-200">Your payment is processed securely through Stripe. We never store your card details.</p>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  Redirecting to checkout...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Proceed to Checkout - ${paymentDetails.total_amount.toFixed(2)} {paymentDetails.currency}
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}