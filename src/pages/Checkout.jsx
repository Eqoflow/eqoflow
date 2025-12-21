
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft, Loader2, CreditCard, Shield, Zap, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { processSubscriptionPayment } from '@/functions/processSubscriptionPayment';
import { motion } from 'framer-motion';

export default function CheckoutPage() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.search);
  const tier = urlParams.get('tier') || 'Creator';
  const billingCycle = urlParams.get('billing') || 'monthly';

  // Subscription tiers configuration with GBP pricing
  const subscriptionTiers = {
    Creator: {
      name: 'Eqo+ Creator',
      monthlyPriceGBP: 11.99,
      yearlyPriceGBP: 119.99,
      monthlyPriceUSD: 14.99, // Approximate USD equivalent for display
      yearlyPriceUSD: 149.99,
      yearlyDiscount: '17% off',
      features: [
        'Creator NFT (Exclusive)',
        '1.5x EP multiplier',
        'Advanced analytics',
        'Creator profile badge',
        'Reduced fees on community pages',
        'Access to AI branding sponsorship'
      ],
      color: 'from-purple-600 to-pink-500',
      icon: <Crown className="w-6 h-6" />
    },
    Pro: {
      name: 'Eqo+ Pro',
      monthlyPriceGBP: 29.99,
      yearlyPriceGBP: 299.99,
      monthlyPriceUSD: 37.49, // Approximate USD equivalent for display
      yearlyPriceUSD: 374.99,
      yearlyDiscount: '17% off',
      features: [
        'One-of-a-kind NFT (Unique)',
        '2x EP multiplier',
        'Governance power boost',
        'FlowAI access (1k messages/day)',
        'All Creator features',
        'Priority support',
        'Access to new features'
      ],
      color: 'from-yellow-400 to-orange-500',
      icon: <Zap className="w-6 h-6" />
    }
  };

  const selectedTier = subscriptionTiers[tier];
  const isYearly = billingCycle === 'yearly';
  const priceGBP = isYearly ? selectedTier.yearlyPriceGBP : selectedTier.monthlyPriceGBP;
  const priceUSD = isYearly ? selectedTier.yearlyPriceUSD : selectedTier.monthlyPriceUSD;

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
      setError('Please log in to continue with your subscription.');
    }
    setLoading(false);
  };

  const handleSubscribe = async () => {
    if (!user) {
      setError('Please log in to subscribe.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create Square payment for subscription
      const res = await processSubscriptionPayment({
        userEmail: user.email,
        subscriptionTier: tier,
        billingCycle,
        amountGBP: priceGBP,
        amountUSD: priceUSD,
        returnUrl: `${window.location.origin}${createPageUrl('Profile')}?subscription=success`
      });

      // Access data from the response object
      if (res.data.success && res.data.paymentUrl) {
        // Redirect to Square payment page
        window.location.href = res.data.paymentUrl;
      } else {
        setError(res.data.error || 'Failed to create payment. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError('An error occurred while processing your subscription. Please try again.');
    }

    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading checkout...</span>
        </div>
      </div>
    );
  }

  if (!selectedTier) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <Card className="dark-card max-w-md w-full text-center">
          <CardContent className="p-8">
            <h2 className="text-xl font-bold text-white mb-4">Invalid Subscription Tier</h2>
            <p className="text-gray-400 mb-6">The requested subscription tier was not found.</p>
            <Link to={createPageUrl('EqoPlus')}>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="dark-card text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Welcome to {selectedTier.name}!</h2>
              <p className="text-gray-400 mb-6">
                Your subscription has been activated successfully. You now have access to all premium features.
              </p>
              <div className="space-y-3">
                <Link to={createPageUrl('Profile')}>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Go to Profile
                  </Button>
                </Link>
                <Link to={createPageUrl('Feed')}>
                  <Button variant="outline" className="w-full border-purple-500/30 text-white hover:bg-purple-500/10">
                    Back to Feed
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('EqoPlus')}>
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Plans
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Details */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedTier.name}</h3>
                  <p className="text-gray-400 capitalize">{billingCycle} subscription</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">£{priceGBP}</div>
                  <div className="text-sm text-gray-400">≈ ${priceUSD}</div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="text-white font-medium mb-3">What's included:</h4>
                <ul className="space-y-2">
                  {selectedTier.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Total */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-bold text-white">Total</div>
                    <div className="text-sm text-gray-400">
                      Billed {isYearly ? 'yearly' : 'monthly'} • Cancel anytime
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">£{priceGBP} GBP</div>
                    <div className="text-sm text-gray-400">≈ ${priceUSD} USD</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Account Info */}
              {user && (
                <div>
                  <h4 className="text-white font-medium mb-3">Account</h4>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user.full_name?.[0] || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.full_name || 'User'}</div>
                      <div className="text-gray-400 text-sm">{user.email}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Payment Button */}
              <Button
                onClick={handleSubscribe}
                disabled={processing || !user}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold"
              >
                {processing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Subscribe for £{priceGBP}/{isYearly ? 'year' : 'month'}
                  </div>
                )}
              </Button>

              {/* Security Notice */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Shield className="w-4 h-4" />
                <span>Secure payment processed by Square</span>
              </div>

              {/* Terms */}
              <p className="text-xs text-gray-500 text-center">
                By subscribing, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
