
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Crown, 
    Zap, 
    Shield, 
    CreditCard, 
    Calendar,
    AlertTriangle,
    CheckCircle,
    ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/entities/User';

const SubscriptionManager = ({ user, onUpdate }) => {
    const [isLoading, setIsLoading] = useState(false);

    const subscriptionTiers = {
        Standard: {
            name: 'Standard',
            price: 'Free',
            description: 'The core QuantumFlow experience',
            icon: Shield,
            color: 'bg-gray-600',
            features: ['Basic features', 'Community access', 'Standard EP rates']
        },
        Creator: {
            name: 'Quantum Creator',
            price: '$9.99/month',
            description: 'For active creators and professionals',
            icon: Zap,
            color: 'bg-gradient-to-r from-purple-600 to-pink-500',
            features: ['1.5x EP rates', 'Advanced analytics', 'HD streaming', 'QC badge']
        },
        Pro: {
            name: 'Quantum Pro',
            price: '$24.99/month',
            description: 'For ultimate power users',
            icon: Crown,
            color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
            features: ['2x EP rates', 'FlowAI access', '4K streaming', 'QPro badge', 'Priority support']
        }
    };

    const currentTier = subscriptionTiers[user?.subscription_tier] || subscriptionTiers.Standard;
    const CurrentIcon = currentTier.icon;

    const handleCancelSubscription = async () => {
        if (window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
            setIsLoading(true);
            try {
                // In a real implementation, this would call Square's API to cancel the subscription
                await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
                
                // Update user to Standard tier
                await User.updateMyUserData({ subscription_tier: 'Standard' });
                onUpdate();
                
                alert('Subscription cancelled successfully. You will retain access until the end of your billing period.');
            } catch (error) {
                console.error('Error cancelling subscription:', error);
                alert('Failed to cancel subscription. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <Card className="dark-card">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-green-400" />
                    Subscription Management
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Current Subscription */}
                <div className="p-4 bg-black/20 border border-purple-500/20 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl ${currentTier.color} flex items-center justify-center`}>
                                <CurrentIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-white">{currentTier.name}</h3>
                                    {user?.subscription_tier !== 'Standard' && (
                                        <Badge className={`${currentTier.color} text-white border-0 text-xs`}>
                                            Active
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-400">{currentTier.description}</p>
                                <p className="text-lg font-bold text-purple-400 mt-1">{currentTier.price}</p>
                            </div>
                        </div>
                        
                        {user?.subscription_tier !== 'Standard' && (
                            <div className="text-right">
                                <CheckCircle className="w-5 h-5 text-green-400 mb-1" />
                                <p className="text-xs text-green-400">Subscribed</p>
                            </div>
                        )}
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-white text-sm">Current Features:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {currentTier.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Billing Information */}
                {user?.subscription_tier !== 'Standard' && (
                    <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <h4 className="font-medium text-blue-300">Billing Information</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Next billing date:</span>
                                <span className="text-white">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Amount:</span>
                                <span className="text-white">{currentTier.price}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Payment method:</span>
                                <span className="text-white">•••• 4242 (Visa)</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {user?.subscription_tier === 'Standard' ? (
                        <Link to={createPageUrl('QuantumPlus')} className="flex-1">
                            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                                <Crown className="w-4 h-4 mr-2" />
                                Upgrade to Quantum+
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link to={createPageUrl('QuantumPlus')} className="flex-1">
                                <Button variant="outline" className="w-full border-purple-500/30 text-white hover:bg-purple-500/10">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Change Plan
                                </Button>
                            </Link>
                            <Button
                                onClick={handleCancelSubscription}
                                disabled={isLoading}
                                variant="outline"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                                {isLoading ? 'Cancelling...' : 'Cancel'}
                            </Button>
                        </>
                    )}
                </div>

                {/* Upgrade Benefits */}
                {user?.subscription_tier === 'Standard' && (
                    <div className="p-4 bg-green-900/20 border border-green-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-green-400" />
                            <h4 className="font-medium text-green-300">Why Upgrade?</h4>
                        </div>
                        <ul className="text-sm text-green-200 space-y-1">
                            <li>• Earn EP faster with multiplied rates</li>
                            <li>• Get exclusive badges and recognition</li>
                            <li>• Access premium features like FlowAI</li>
                            <li>• Support platform development</li>
                        </ul>
                    </div>
                )}

                {/* Cancellation Notice */}
                {user?.subscription_tier !== 'Standard' && (
                    <div className="p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-yellow-300">
                                <p className="font-medium mb-1">Cancellation Policy</p>
                                <p>You can cancel anytime. You'll retain access to premium features until the end of your billing period.</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SubscriptionManager;
