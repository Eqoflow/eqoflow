
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Gift,
  CheckCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Zap,
  Users,
  Coins,
  MessageSquare,
  Heart,
  Share2,
  Vote,
  AlertTriangle // Import AlertTriangle icon
} from 'lucide-react';
import { awardWelcomeBonus } from '@/functions/awardWelcomeBonus';
import { updateUserProfileData } from '@/functions/updateUserProfileData';
import { processReferral } from '@/functions/processReferral';

const onboardingSteps = [
  {
    id: 'welcome',
    title: 'Welcome to EqoFlow',
    subtitle: 'The Future of Decentralized Social',
    icon: Sparkles,
    content: (
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <p className="text-gray-300 text-lg">
            Welcome to the next generation of social media - where your engagement has real value and your voice matters in platform governance.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg p-4">
              <Coins className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h4 className="font-semibold text-white mb-1">Earn Real Value</h4>
              <p className="text-xs text-gray-400">Every interaction earns you Engagement Points (EP)</p>
            </div>
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
              <Vote className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h4 className="font-semibold text-white mb-1">Shape the Platform</h4>
              <p className="text-xs text-gray-400">Vote on features, policies, and platform direction</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'engagement',
    title: 'Engagement Points System',
    subtitle: 'Every Action Has Value',
    icon: Zap,
    content: (
      <div className="space-y-6">
        <p className="text-gray-300 text-center">
          Unlike traditional social media, every interaction on EqoFlow earns you Engagement Points (EP).
        </p>
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <span className="text-white">Create an Echo (Post)</span>
            </div>
            <Badge className="bg-purple-600/20 text-purple-300">+20 EP</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-red-400" />
              <span className="text-white">Like an Echo</span>
            </div>
            <Badge className="bg-purple-600/20 text-purple-300">+1 EP</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <span className="text-white">Comment on Echo</span>
            </div>
            <Badge className="bg-purple-600/20 text-purple-300">+10 EP</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-green-400" />
              <span className="text-white">Share an Echo</span>
            </div>
            <Badge className="bg-purple-600/20 text-purple-300">+5 EP</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-cyan-400" />
              <span className="text-white">Share an Echo + comment</span>
            </div>
            <Badge className="bg-purple-600/20 text-purple-300">+14 EP</Badge>
          </div>
        </div>
        <div className="text-center p-4 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-lg">
          <p className="text-sm text-purple-300 font-medium">
            💡 EP gains on the leaderboard. Keep earning and get rewarded in $EQOFLO!
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'features',
    title: 'Platform Features',
    subtitle: 'Discover What Makes Us Different',
    icon: Users,
    content: (
      <div className="space-y-6">
        <div className="grid gap-4">
          <div className="flex items-start gap-4 p-4 bg-black/20 rounded-lg border border-purple-500/20">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Social Echoes</h4>
              <p className="text-sm text-gray-400">Share thoughts, media, and connect with your community through our enhanced posting system.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-black/20 rounded-lg border border-purple-500/20">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Skills Marketplace</h4>
              <p className="text-sm text-gray-400">Monetize your expertise by offering services and skills to the community.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-black/20 rounded-lg border border-purple-500/20">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">DAO Governance</h4>
              <p className="text-sm text-gray-400">Vote on platform decisions, feature requests, and treasury distributions.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-black/20 rounded-lg border border-purple-500/20">
            <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Communities</h4>
              <p className="text-sm text-gray-400">Create and join topic-based communities with $EQOFLO tokens and governance.</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'getstarted',
    title: "You're Ready!",
    subtitle: 'Start Your EqoFlow Journey',
    icon: CheckCircle,
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-300 text-lg mb-6">
            You now understand how EqoFlow works. Every interaction from this point forward earns you value!
          </p>
        </div>

        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-black/20 to-black/20 border border-purple-500/20">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-500/30 rounded-full filter blur-3xl"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-pink-500/20 rounded-full filter blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-6 h-6 text-purple-400" />
              <h4 className="font-bold text-lg text-white">Your Welcome Gift Awaits!</h4>
            </div>
            <p className="text-gray-300">
              To kickstart your journey in the EqoFlow ecosystem, you'll receive a <span className="font-bold text-purple-300">1,000 $EQOFLO</span> token bonus upon completing this onboarding.
            </p>
          </div>
        </div>

        {/* Quick Start Actions */}
        <div className="grid gap-3">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">🚀 Quick Start Actions:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Create your first post to earn 20 EP</li>
              <li>• Like and comment on others' content</li>
              <li>• Connect your Solana wallet</li>
              <li>• Check out the DAO proposals</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
];

export default function WelcomeModal({ user, onClose, onComplete, bonusAmount = 1000 }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false); // New state for confirmation

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);

      // Process referral code if it exists BEFORE marking onboarding complete
      const referralCode = localStorage.getItem('quantumFlowReferralCode');
      if (referralCode) {
        try {
          console.log('Processing referral code during onboarding:', referralCode);
          const response = await processReferral({ referralCode });
          console.log('Referral processing response:', response);

          if (response.data?.success) {
            console.log('Referral processed successfully:', response.data.message);
          }
        } catch (error) {
          console.error("Error processing referral during onboarding:", error.response?.data?.message || error.message);
        } finally {
          // Always remove the code after attempting to process
          localStorage.removeItem('quantumFlowReferralCode');
          localStorage.removeItem('quantumFlowReferralTimestamp');
        }
      }

      // Try to award the welcome bonus
      try {
        const response = await awardWelcomeBonus();
        if (response.data?.success) {
          console.log('Welcome bonus awarded:', response.data.message);
        }
      } catch (bonusError) {
        // Don't fail onboarding if bonus fails - just log it
        console.log('Welcome bonus not applicable or already received:', bonusError.response?.data?.message || bonusError.message);
      }

      // Update the reliable UserProfileData entity
      await updateUserProfileData({
        updateData: { has_completed_onboarding: true }
      });

      // Call the onComplete callback
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttemptSkip = () => {
    setShowSkipConfirmation(true); // Show confirmation instead of closing directly
  };

  const confirmSkip = () => {
    setShowSkipConfirmation(false);
    onClose(); // Proceed with closing the modal
  };

  const cancelSkip = () => {
    setShowSkipConfirmation(false); // Hide confirmation and stay on the modal
  };

  // Dynamically update the content for the last step with the correct bonus amount
  const finalStepContent = {
    ...onboardingSteps[onboardingSteps.length - 1],
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-300 text-lg mb-6">
            You now understand how EqoFlow works. Every interaction from this point forward earns you real value!
          </p>
        </div>

        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-black/20 to-black/20 border border-purple-500/20">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-500/30 rounded-full filter blur-3xl"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-pink-500/20 rounded-full filter blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-6 h-6 text-purple-400" />
              <h4 className="font-bold text-lg text-white">Your Welcome Gift Awaits!</h4>
            </div>
            <p className="text-gray-300">
              To kickstart your journey in the EqoFlow ecosystem, you'll receive a <span className="font-bold text-purple-300">{bonusAmount.toLocaleString()} $EQOFLO</span> token bonus upon completing this onboarding.
            </p>
          </div>
        </div>

        {/* Quick Start Actions */}
        <div className="grid gap-3">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">🚀 Quick Start Actions:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Create your first post to earn 20 EP</li>
              <li>• Like and comment on others' content</li>
              <li>• Connect your Solana wallet</li>
              <li>• Check out the DAO proposals</li>
            </ul>
          </div>
        </div>
      </div>
    )
  };

  const currentStepData = currentStep === onboardingSteps.length - 1 ? finalStepContent : onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 md:p-8 max-w-2xl w-full mx-auto relative max-h-[95vh] overflow-y-auto"
          style={{ zIndex: 10000 }}
        >
          {/* Close button */}
          <button
            onClick={handleAttemptSkip} // Updated onClick handler
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10 p-2"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Progress indicators */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-2">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'bg-purple-500 scale-125'
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <currentStepData.icon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-white mb-3">{currentStepData.title}</h2>
                <p className="text-purple-400 text-lg leading-relaxed">{currentStepData.subtitle}</p>
              </div>

              {/* Step Content */}
              <div className="mb-8">
                {currentStepData.content}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              {!isFirstStep && (
                <Button
                  onClick={handlePrev}
                  variant="outline"
                  className="border-purple-500/30 text-white hover:bg-purple-500/10"
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAttemptSkip} // Updated onClick handler
                variant="ghost"
                className="text-gray-400 hover:text-white"
                disabled={isLoading}
              >
                Skip for now
              </Button>
              
              {isLastStep ? (
                <Button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 px-8 py-3 text-lg font-semibold transition-all duration-200 hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Setting up your account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Get Started with EqoFlow
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                  disabled={isLoading}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4" />
                <p className="text-lg">Welcome to EqoFlow!</p>
                <p className="text-sm text-gray-400">Setting up your account...</p>
              </div>
            </div>
          )}

          {/* NEW: Skip Confirmation Modal */}
          <AnimatePresence>
            {showSkipConfirmation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-8 rounded-2xl z-20"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="text-center space-y-6 max-w-md"
                >
                  <div className="w-16 h-16 bg-yellow-500/10 border-4 border-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Are You Sure?</h3>
                  <p className="text-gray-300">
                    By skipping, you will miss out on your <span className="font-bold text-purple-400">{bonusAmount.toLocaleString()} $EQOFLO</span> welcome bonus and any applicable referral rewards. This action cannot be undone.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={cancelSkip}
                      variant="outline"
                      className="border-purple-500/30 text-white hover:bg-purple-500/10 px-6"
                    >
                      No, Go Back
                    </Button>
                    <Button
                      onClick={confirmSkip}
                      className="bg-red-600 hover:bg-red-700 text-white px-6"
                    >
                      Yes, Skip Rewards
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
