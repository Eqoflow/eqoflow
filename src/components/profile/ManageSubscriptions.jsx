
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Users, BookOpen, Check, X, Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { cancelSubscription } from '@/functions/cancelSubscription';
import { createStripeCheckout } from '@/functions/createStripeCheckout';

// Helper function to get color scheme with fallback
const getColorScheme = (schemeName) => {
  const colorSchemes = {
    purple: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#2d1b69' },
    blue: { primary: '#3b82f6', secondary: '#06b6d4', accent: '#1e3a8a' },
    green: { primary: '#10b981', secondary: '#059669', accent: '#064e3b' },
    orange: { primary: '#f97316', secondary: '#eab308', accent: '#92400e' },
    red: { primary: '#ef4444', secondary: '#ec4899', accent: '#991b1b' },
    pink: { primary: '#ec4899', secondary: '#f472b6', accent: '#be185d' },
    cyan: { primary: '#06b6d4', secondary: '#3b82f6', accent: '#0e7490' },
    yellow: { primary: '#eab308', secondary: '#f97316', accent: '#a16207' },
    indigo: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#4338ca' },
    emerald: { primary: '#10b981', secondary: '#059646', accent: '#065f46' },
  };
  
  return colorSchemes[schemeName] || colorSchemes.purple;
};

export default function ManageSubscriptions({ user, onUpdate }) {
  const [activeTab, setActiveTab] = useState('eqo_plus');
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState(null);
  const [upgradingTier, setUpgradingTier] = useState(null);
  
  // Safe color scheme access with fallback
  const userColorScheme = user?.color_scheme ? getColorScheme(user.color_scheme) : getColorScheme('purple');

  const currentTier = user?.subscription_tier || 'free';
  const courseUploadPlan = user?.course_upload_plan || 'free';

  const tabs = [
    { id: 'eqo_plus', label: 'Eqo+ Subscription', icon: Crown },
    { id: 'communities', label: 'Community Memberships', icon: Users },
    { id: 'courses', label: 'Course Upload Plan', icon: BookOpen }
  ];

  const plans = [
    {
      name: 'Free',
      tier: 'free',
      price: '$0',
      period: 'forever',
      features: [
        { name: '$EQOFLO Engagement Rewards', included: true },
        { name: 'REP multiplier', value: '1.0x' },
        { name: 'Analytics', value: false },
        { name: 'Advanced features', included: false }
      ]
    },
    {
      name: 'Eqo+ Lite',
      tier: 'lite',
      price: '$4.99',
      period: '/month',
      stripePrice: 'price_1SNHVv2KsMoELOOVOOoZb9kd', // Updated Stripe Price ID
      features: [
        { name: '$EQOFLO Engagement Rewards', included: true },
        { name: 'REP multiplier', value: '1.1x' },
        { name: 'Analytics', value: 'Lite' },
        { name: 'Priority support', included: true }
      ]
    },
    {
      name: 'Eqo+ Creator',
      tier: 'creator',
      price: '$14.99',
      period: '/month',
      stripePrice: 'price_1SISfy2KsMoELOOVqeJZqvn6',
      features: [
        { name: '$EQOFLO Engagement Rewards', included: true },
        { name: 'REP multiplier', value: '1.25x' },
        { name: 'Analytics', value: 'Standard' },
        { name: 'Creator tools', included: true }
      ]
    },
    {
      name: 'Eqo+ Pro',
      tier: 'pro',
      price: '$39.99',
      period: '/month',
      stripePrice: 'price_1SNHWW2KsMoELOOVoRI4OHuG', // Updated Stripe Price ID
      features: [
        { name: '$EQOFLO Engagement Rewards', included: true },
        { name: 'REP multiplier', value: '1.5x' },
        { name: 'Analytics', value: 'Advanced' },
        { name: 'All features unlocked', included: true }
      ]
    }
  ];

  const handleCancelSubscription = async (subscriptionType, planName) => {
    if (!confirm(`Are you sure you want to cancel your ${planName}? You will lose access to premium features at the end of your current billing period.`)) {
      return;
    }

    setIsCancelling(true);
    setMessage(null);

    try {
      const response = await cancelSubscription({
        subscriptionType: subscriptionType
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: `Successfully cancelled ${planName}. Your subscription will remain active until the end of your current billing period.`
        });

        // Refresh user data after successful cancellation
        if (onUpdate) {
          setTimeout(() => {
            onUpdate();
          }, 1500);
        }
      } else {
        throw new Error(response.data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Failed to cancel subscription. Please contact support.'
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpgrade = async (plan) => {
    if (!plan.stripePrice) {
      setMessage({
        type: 'error',
        text: 'This plan is not available for purchase yet.'
      });
      return;
    }

    setUpgradingTier(plan.tier);
    setMessage(null);

    try {
      const response = await createStripeCheckout({
        priceId: plan.stripePrice,
        successUrl: `${window.location.origin}${createPageUrl('Profile')}?section=subscriptions&payment=success&plan=${plan.name}`,
        cancelUrl: `${window.location.origin}${createPageUrl('Profile')}?section=subscriptions`,
      });

      if (response.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setMessage({
        type: 'error',
        text: 'Failed to start checkout. Please try again or contact support.'
      });
      setUpgradingTier(null);
    }
  };

  const renderEqoPlusTab = () => {
    const currentPlan = plans.find(p => p.tier === currentTier) || plans[0];
    const nextPlan = currentTier === 'free' ? plans[1] : plans.find((p, i) => i > plans.findIndex(plan => plan.tier === currentTier));

    return (
      <div className="space-y-6">
        {/* Success/Error Messages */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className={message.type === 'success' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <AlertDescription className={message.type === 'success' ? 'text-green-300' : 'text-red-300'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Subscription Card */}
        <Card className="dark-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5" style={{ color: userColorScheme.primary }} />
              <CardTitle className="text-white">Current Subscription</CardTitle>
            </div>
            <p className="text-sm text-gray-400">Manage your Eqo+ subscription and billing</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border" style={{
              backgroundColor: `${userColorScheme.primary}10`,
              borderColor: `${userColorScheme.primary}30`
            }}>
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" style={{ color: userColorScheme.primary }} />
                <div>
                  <h3 className="font-semibold text-white">{currentPlan.name}</h3>
                  <p className="text-sm text-gray-400">{currentPlan.price} {currentPlan.period}</p>
                </div>
              </div>
              {currentTier !== 'free' && (
                <Button
                  onClick={() => handleCancelSubscription('eqo_plus', currentPlan.name)}
                  disabled={isCancelling}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Subscription'
                  )}
                </Button>
              )}
            </div>

            {currentTier === 'free' && (
              <div className="p-4 bg-black/20 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400">
                  You're currently on the free Standard tier. Upgrade to unlock premium features!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-white text-center text-2xl">Pick the plan that works best for you</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.tier}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    currentTier === plan.tier
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-gray-700 bg-black/20 hover:border-gray-600'
                  }`}
                >
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold mb-1" style={{ color: userColorScheme.primary }}>
                      {plan.price}
                    </div>
                    <div className="text-sm text-gray-400">{plan.period}</div>
                  </div>

                  {currentTier === plan.tier ? (
                    <Badge className="w-full justify-center bg-green-600/20 text-green-400 border-green-500/30 mb-4">
                      Current Plan
                    </Badge>
                  ) : plan.tier !== 'free' ? (
                    <Button
                      onClick={() => handleUpgrade(plan)}
                      disabled={upgradingTier === plan.tier}
                      className="w-full mb-4"
                      style={{
                        background: upgradingTier === plan.tier ? '#666' : userColorScheme.primary,
                      }}
                    >
                      {upgradingTier === plan.tier ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Upgrade'
                      )}
                    </Button>
                  ) : (
                    <div className="h-10 mb-4" />
                  )}

                  <div className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        {feature.included || feature.value ? (
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="text-gray-300">
                          {feature.name}: {feature.value !== undefined && feature.value !== false && feature.value !== true && (
                            <span className="font-semibold">{feature.value}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCommunitiesTab = () => {
    return (
      <Card className="dark-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: userColorScheme.primary }} />
            <CardTitle className="text-white">Community Memberships</CardTitle>
          </div>
          <p className="text-sm text-gray-400">Manage your paid community memberships</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 mb-4">You don't have any paid community memberships yet</p>
            <Link to={createPageUrl('Communities')}>
              <Button style={{ background: userColorScheme.primary }}>
                Explore Communities
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCoursesTab = () => {
    return (
      <Card className="dark-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: userColorScheme.primary }} />
            <CardTitle className="text-white">Course Upload Plan</CardTitle>
          </div>
          <p className="text-sm text-gray-400">Manage your EqoUniversity course upload subscription</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border" style={{
            backgroundColor: `${userColorScheme.primary}10`,
            borderColor: `${userColorScheme.primary}30`
          }}>
            <div>
              <h3 className="font-semibold text-white capitalize">{courseUploadPlan} Plan</h3>
              <p className="text-sm text-gray-400">
                {courseUploadPlan === 'free' && 'No course uploads available'}
                {courseUploadPlan === 'tutor' && '5 courses per month'}
                {courseUploadPlan === 'master' && 'Unlimited courses'}
              </p>
            </div>
            {courseUploadPlan !== 'free' && (
              <Button
                onClick={() => handleCancelSubscription('course_upload', `${courseUploadPlan} Plan`)}
                disabled={isCancelling}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Plan'
                )}
              </Button>
            )}
          </div>

          {courseUploadPlan === 'free' && (
            <div className="text-center py-8">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 mb-4">Upgrade to start uploading courses to EqoUniversity</p>
              <Link to={createPageUrl('EqoUniversity')}>
                <Button style={{ background: userColorScheme.primary }}>
                  View Upload Plans
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${
                activeTab === tab.id
                  ? 'text-white border-b-2'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{
                borderBottomColor: activeTab === tab.id ? userColorScheme.primary : 'transparent'
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'eqo_plus' && renderEqoPlusTab()}
      {activeTab === 'communities' && renderCommunitiesTab()}
      {activeTab === 'courses' && renderCoursesTab()}
    </div>
  );
}
