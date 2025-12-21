
import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Crown,
  Zap,
  Sparkles,
  Star,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
// The original createStripeCheckout import is no longer needed as we're using base44.functions.invoke
// import { createStripeCheckout } from '@/functions/createStripeCheckout'; 

// Assuming 'base44' is a global object or implicitly available for serverless function invocation.
// If not, it would need to be imported or defined.
import { base44 } from '@/api/base44Client';

export default function EqoPlusPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState('monthly');
  const [processingTier, setProcessingTier] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (tier) => {
    if (!user) {
      alert('Please log in to subscribe');
      return;
    }

    if (tier === 'Free') {
      alert('You are already on the Free tier!');
      return;
    }

    setProcessingTier(tier);

    try {
      // Map tier to correct Stripe price ID
      // These price IDs should correspond to the specific billing cycle (monthly/yearly)
      // For simplicity, this example uses hardcoded monthly prices for Lite/Creator/Pro.
      // A more robust solution would dynamically select based on `selectedBilling`.
      // For now, assuming the provided price IDs are generic or for monthly.
      const priceMap = {
        'Lite': selectedBilling === 'monthly' ? 'price_1SNHVv2KsMoELOOVOOoZb9kd' : 'price_1SNHVv2KsMoELOOVdZ5gP28I', // Example yearly price ID for Lite
        'Creator': selectedBilling === 'monthly' ? 'price_1SISfy2KsMoELOOVqeJZqvn6' : 'price_1SISfy2KsMoELOOVvYx8K73a', // Example yearly price ID for Creator
        'Pro': selectedBilling === 'monthly' ? 'price_1SNHWW2KsMoELOOVoRI4OHuG' : 'price_1SNHWW2KsMoELOOVOdK9vP61', // Example yearly price ID for Pro
      };

      const priceId = priceMap[tier];

      if (!priceId) {
        throw new Error(`Invalid subscription tier or billing cycle selected for Stripe price ID mapping: ${tier} - ${selectedBilling}`);
      }

      console.log('Creating Stripe checkout for:', { tier, priceId });
      
      const response = await base44.functions.invoke('createStripeCheckout', {
        priceId: priceId,
        successUrl: `${window.location.origin}/Profile?section=subscriptions&payment=success&plan=Eqo+ ${tier}`,
        cancelUrl: `${window.location.origin}/EqoPlus`
      });

      console.log('Stripe checkout response:', response);

      if (!response || !response.data) {
        throw new Error('Invalid response from checkout service');
      }

      if (!response.data.url) {
        throw new Error('Checkout URL not provided');
      }

      console.log('Redirecting to Stripe checkout:', response.data.url);

      if (window.top) {
        window.top.location.href = response.data.url;
      } else {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      console.error('Error details:', error.message, error.stack);
      alert(`Failed to start checkout process: ${error.message || 'Unknown error'}. Please try again.`);
      setProcessingTier(null);
    }
  };

  const tiers = [
    {
      name: 'Free',
      icon: Star,
      color: 'from-gray-500 to-gray-600',
      price: {
        monthly: 0,
        yearly: 0
      },
      description: 'Already here with EqoFlow',
      popular: false,
      features: [
        '$EQOFLO Engagement Rewards',
        '1.0x REP multiplier',
        'Standard Support',
        'Standard Features',
        'Leaderboard participation'
      ]
    },
    {
      name: 'Lite',
      icon: Sparkles,
      color: 'from-green-500 to-emerald-500',
      price: {
        monthly: 4.99,
        yearly: 47.90
      },
      description: 'Essential features for active users',
      popular: false,
      features: [
        '$EQOFLO Engagement Rewards',
        '1.1x REP multiplier',
        'Lite Analytics',
        'Eqo+ Lite badge',
        'Standard Support',
        'Standard Features',
        'Leaderboard participation'
      ]
    },
    {
      name: 'Creator',
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
      price: {
        monthly: 14.99,
        yearly: 143.90
      },
      description: 'For dedicated content creators',
      popular: true,
      features: [
        '$EQOFLO Engagement Rewards',
        '1.25x REP multiplier',
        'Standard Analytics',
        'Eqo+ Creator badge',
        'Standard Support',
        'Standard Features',
        'Leaderboard participation'
      ]
    },
    {
      name: 'Pro',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      price: {
        monthly: 39.99,
        yearly: 383.90
      },
      description: 'For serious builders & entrepreneurs',
      popular: false,
      features: [
        '$EQOFLO Engagement Rewards',
        '1.5x REP multiplier',
        'Advanced Analytics',
        'Eqo+ Pro badge',
        '1k FlowAI messages/day',
        'Priority Support',
        'Early Feature Access',
        'AI Branding Access'
      ]
    }
  ];

  const featureComparison = [
    {
      feature: '$EQOFLO Engagement Rewards',
      free: 'Yes',
      lite: 'Yes',
      creator: 'Yes',
      pro: 'Yes'
    },
    {
      feature: 'REP multiplier',
      free: '1.0x',
      lite: '1.1x',
      creator: '1.25x',
      pro: '1.5x'
    },
    {
      feature: 'Analytics',
      free: false,
      lite: 'Lite',
      creator: 'Standard',
      pro: 'Advanced'
    },
    {
      feature: 'Badge',
      free: false,
      lite: 'Eqo+ Lite',
      creator: 'Eqo+ Creator',
      pro: 'Eqo+ Pro'
    },
    {
      feature: 'FlowAI access',
      free: false,
      lite: false,
      creator: false,
      pro: '1k messages/day'
    },
    {
      feature: 'Support',
      free: 'Standard',
      lite: 'Standard',
      creator: 'Standard',
      pro: 'Priority'
    },
    {
      feature: 'New features',
      free: 'Standard',
      lite: 'Standard',
      creator: 'Standard',
      pro: 'Standard + Early access'
    },
    {
      feature: 'Leaderboard participation',
      free: true,
      lite: true,
      creator: true,
      pro: true
    },
    {
      feature: 'Access to AI Branding sponsorship',
      free: false,
      lite: false,
      creator: false,
      pro: true
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              Eqo+
            </h1>
          </div>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
            Unlock premium features and monetize your presence on EqoFlow
          </p>
        </motion.div>

        {/* DAO Revenue Sharing Notice */}
        <div className="flex justify-center mb-4">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg px-4 md:px-6 py-2 max-w-2xl">
            <p className="text-xs md:text-sm text-gray-300 text-center">
              <span className="text-purple-400 font-semibold">Community First:</span> 15% of all subscription revenue is sent to the DAO treasury at the end of each month to fund community initiatives and governance.
            </p>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-black/40 backdrop-blur-sm rounded-full p-1 border border-purple-500/30">
            <Button
              variant={selectedBilling === 'monthly' ? 'default' : 'ghost'}
              onClick={() => setSelectedBilling('monthly')}
              className={`rounded-full px-4 md:px-6 text-sm ${
                selectedBilling === 'monthly'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </Button>
            <Button
              variant={selectedBilling === 'yearly' ? 'default' : 'ghost'}
              onClick={() => setSelectedBilling('yearly')}
              className={`rounded-full px-4 md:px-6 text-sm ${
                selectedBilling === 'yearly'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <Badge className="ml-2 bg-green-500 text-white border-0 text-xs">
                Save 20%
              </Badge>
            </Button>
          </div>
        </div>

        {/* Pricing Cards - 2x2 Grid with compact sizing */}
        <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto mb-12">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            const isCurrentTier = user?.subscription_tier === tier.name.toLowerCase();
            const isFree = tier.name === 'Free';
            const isLite = tier.name === 'Lite';

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="w-full"
              >
                <div
                  className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                    tier.popular
                      ? 'border-purple-500 shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02]'
                      : isFree
                      ? 'border-gray-600/50 shadow-xl shadow-gray-500/10 hover:shadow-gray-500/30 hover:scale-[1.02]'
                      : isLite
                      ? 'border-green-500/50 shadow-xl shadow-green-500/10 hover:shadow-green-500/30 hover:scale-[1.02]'
                      : 'border-yellow-500/50 shadow-xl shadow-yellow-500/10 hover:shadow-yellow-500/30 hover:scale-[1.02]'
                  } bg-gradient-to-b from-gray-900 to-black`}
                >
                  {/* Most Popular Banner */}
                  {tier.popular && (
                    <div className="relative top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-center py-1 text-xs font-bold tracking-wider z-10">
                      MOST POPULAR
                    </div>
                  )}

                  <div className={`p-3 md:p-4 ${tier.popular ? 'pt-3 md:pt-4' : 'pt-3 md:pt-4'}`}>
                    {/* Icon - Much Smaller */}
                    <div className="flex justify-center mb-2">
                      <div
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                      </div>
                    </div>

                    {/* Title - Smaller */}
                    <h3 className="text-xl md:text-xl font-bold text-white text-center mb-1">
                      {tier.name === 'Free' ? 'Free' : `Eqo+ ${tier.name}`}
                    </h3>

                    {/* Description - Smaller */}
                    <p className="text-gray-400 text-center mb-2 text-xs leading-tight">{tier.description}</p>

                    {/* Current Plan Badge */}
                    {isCurrentTier && (
                      <div className="flex justify-center mb-2">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs py-0.5">
                          Current Plan
                        </Badge>
                      </div>
                    )}

                    {/* Price - Smaller */}
                    <div className="text-center mb-3">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-2xl md:text-3xl font-bold text-white">
                          ${tier.price[selectedBilling].toFixed(2)}
                        </span>
                        <span className="text-gray-400 text-xs">USD</span>
                      </div>
                      <div className="text-gray-400 mt-0 text-xs">
                        {isFree ? 'forever' : `/${selectedBilling === 'monthly' ? 'month' : 'year'}`}
                      </div>
                    </div>

                    {/* Features - Compact display, NO SCROLL */}
                    <div className="space-y-1.5 mb-3">
                      {tier.features.map((feature, i) => {
                        const hasNo = feature.startsWith('No ');
                        
                        return (
                          <div key={i} className="flex items-start gap-1.5">
                            {hasNo ? (
                              <X className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                            )}
                            <span className="text-gray-300 text-[11px] leading-tight">{feature}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* CTA Button */}
                    <Button
                      onClick={() => handleSubscribe(tier.name)}
                      disabled={isCurrentTier || processingTier === tier.name || isFree}
                      className={`w-full py-3 text-sm font-semibold ${
                        tier.popular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600'
                          : isFree
                          ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
                          : isLite
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                          : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                      } text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                    >
                      {processingTier === tier.name ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                          Processing...
                        </>
                      ) : isCurrentTier ? (
                        'Current Plan'
                      ) : isFree ? (
                        'Always Free'
                      ) : (
                        <>
                          Get Started
                          <span className="ml-2">→</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-6xl mx-auto mt-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-6 md:mb-8">
            Pick the plan that works best for you
          </h2>

          <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-0 border-b border-purple-500/20">
              <div className="p-3 md:p-6 border-r border-purple-500/20">
                <h3 className="text-sm md:text-lg font-semibold text-white">Pricing and Features</h3>
              </div>
              <div className="p-3 md:p-6 text-center border-r border-purple-500/20">
                <p className="text-sm md:text-lg font-bold text-white mb-1 md:mb-2">Free</p>
                <p className="text-xl md:text-2xl font-bold text-white">$0</p>
                <p className="text-xs text-gray-400">forever</p>
              </div>
              <div className="p-3 md:p-6 text-center border-r border-purple-500/20">
                <p className="text-sm md:text-lg font-bold text-white mb-1 md:mb-2">Eqo+ Lite</p>
                <p className="text-xl md:text-2xl font-bold text-white">
                  ${selectedBilling === 'monthly' ? '4.99' : '47.90'}
                </p>
                <p className="text-xs text-gray-400">/{selectedBilling === 'monthly' ? 'month' : 'year'}</p>
              </div>
              <div className="p-3 md:p-6 text-center border-r border-purple-500/20 bg-purple-500/10 relative">
                <Badge className="absolute top-1 md:top-2 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white border-0 text-[10px] md:text-xs">
                  MOST POPULAR
                </Badge>
                <p className="text-sm md:text-lg font-bold text-white mb-1 md:mb-2 mt-3 md:mt-4">Eqo+ Creator</p>
                <p className="text-xl md:text-2xl font-bold text-white">
                  ${selectedBilling === 'monthly' ? '14.99' : '143.90'}
                </p>
                <p className="text-xs text-gray-400">/{selectedBilling === 'monthly' ? 'month' : 'year'}</p>
              </div>
              <div className="p-3 md:p-6 text-center">
                <p className="text-sm md:text-lg font-bold text-white mb-1 md:mb-2">Eqo+ Pro</p>
                <p className="text-xl md:text-2xl font-bold text-white">
                  ${selectedBilling === 'monthly' ? '39.99' : '383.90'}
                </p>
                <p className="text-xs text-gray-400">/{selectedBilling === 'monthly' ? 'month' : 'year'}</p>
              </div>
            </div>

            {/* Table Body */}
            {featureComparison.map((item, index) => (
              <div
                key={index}
                className={`grid grid-cols-5 gap-0 ${
                  index !== featureComparison.length - 1 ? 'border-b border-purple-500/10' : ''
                }`}
              >
                <div className="p-2 md:p-4 border-r border-purple-500/10 flex items-center">
                  <p className="text-xs md:text-sm text-gray-300">{item.feature}</p>
                </div>
                <div className="p-2 md:p-4 border-r border-purple-500/10 flex items-center justify-center">
                  {typeof item.free === 'boolean' ? (
                    item.free ? (
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
                    )
                  ) : (
                    <span className="text-xs md:text-sm text-white font-medium">{item.free}</span>
                  )}
                </div>
                <div className="p-2 md:p-4 border-r border-purple-500/10 flex items-center justify-center">
                  {typeof item.lite === 'boolean' ? (
                    item.lite ? (
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
                    )
                  ) : (
                    <span className="text-xs md:text-sm text-white font-medium">{item.lite}</span>
                  )}
                </div>
                <div className="p-2 md:p-4 border-r border-purple-500/10 flex items-center justify-center bg-purple-500/5">
                  {typeof item.creator === 'boolean' ? (
                    item.creator ? (
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
                    )
                  ) : (
                    <span className="text-xs md:text-sm text-white font-medium">{item.creator}</span>
                  )}
                </div>
                <div className="p-2 md:p-4 flex items-center justify-center">
                  {typeof item.pro === 'boolean' ? (
                    item.pro ? (
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                    ) : (
                      <X className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
                    )
                  ) : (
                    <span className="text-xs md:text-sm text-white font-medium">{item.pro}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
