import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Zap, Loader2, CheckCircle } from 'lucide-react';
import { createCommunityFeaturePayment } from '@/functions/createCommunityFeaturePayment';

const featureOptions = [
    { id: '3_day', days: 3, price: 100, priceId: '3-day-feature', popular: false },
    { id: '7_day', days: 7, price: 250, priceId: '7-day-feature', popular: true },
    { id: '14_day', days: 14, price: 500, priceId: '14-day-feature', popular: false },
];

export default function PayToFeatureCommunityModal({ community, onClose, onSuccess }) {
    const [selectedOption, setSelectedOption] = useState(featureOptions.find(o => o.popular));
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [paymentUrl, setPaymentUrl] = useState(null);

    const handlePayment = async () => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const result = await createCommunityFeaturePayment({
                communityId: community.id,
                featureId: selectedOption.id,
                price: selectedOption.price,
            });

            if (result.data?.url) {
                setPaymentUrl(result.data.url);
                 window.open(result.data.url, '_blank');
            } else {
                throw new Error(result.data?.error || "Failed to create payment link.");
            }
        } catch (error) {
            console.error("Payment initiation failed:", error);
            setErrorMessage(error.message || "Could not connect to the payment processor. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (paymentUrl) {
        return (
             <motion.div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <Card className="dark-card w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-green-400 flex items-center gap-2">
                            <CheckCircle /> Payment Link Created
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-gray-300">Your payment link is ready. Please complete the payment in the new tab that was opened.</p>
                        <p className="text-sm text-gray-400">If the tab didn't open, you can <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">click here to open it manually</a>.</p>
                        <p className="text-sm text-yellow-400">Once payment is complete, your community will be featured. You can close this window.</p>
                         <Button onClick={() => {onSuccess(); onClose();}} className="w-full">
                            Done
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="w-full max-w-lg"
                initial={{ scale: 0.9, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                <Card className="dark-card">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Zap className="text-yellow-400" /> Promote Community
                                </CardTitle>
                                <CardDescription className="text-gray-400 mt-1">Boost your community's visibility.</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="-mt-2 -mr-2">
                                <X className="w-5 h-5 text-gray-400" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {featureOptions.map(option => (
                                <div
                                    key={option.id}
                                    onClick={() => setSelectedOption(option)}
                                    className={`p-4 rounded-lg cursor-pointer border-2 transition-all relative ${selectedOption.id === option.id ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}`}
                                >
                                    {option.popular && (
                                        <div className="absolute -top-3 right-3 bg-yellow-400 text-black px-2 py-0.5 rounded-full text-xs font-bold">POPULAR</div>
                                    )}
                                    <p className="font-bold text-lg text-white">{option.days} Days</p>
                                    <p className="text-2xl font-extrabold text-white">${option.price}</p>
                                    <p className="text-sm text-gray-400">Featured Placement</p>
                                </div>
                            ))}
                        </div>

                        {errorMessage && <p className="text-sm text-red-400 text-center">{errorMessage}</p>}

                        <Button
                            onClick={handlePayment}
                            disabled={isLoading}
                            className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                `Pay $${selectedOption.price} to Feature`
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}