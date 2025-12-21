import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VeriffKYCModal({ isOpen, onClose, onVerificationComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStartVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the backend function to create a Veriff session
      const response = await base44.functions.invoke('initiateVeriffSession');
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const { url, sessionId } = response.data;

      if (!url) {
        throw new Error('No verification URL received');
      }

      console.log('✓ Veriff session created:', sessionId);

      // Open Veriff in a new window
      const veriffWindow = window.open(url, '_blank', 'width=800,height=600');

      if (!veriffWindow) {
        throw new Error('Please allow popups to complete verification');
      }

      // Poll for verification completion
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await base44.functions.invoke('checkVeriffStatus');
          
          if (statusResponse.data.status === 'verified') {
            clearInterval(pollInterval);
            setIsLoading(false);
            if (onVerificationComplete) {
              onVerificationComplete();
            }
            onClose();
          } else if (statusResponse.data.status === 'declined') {
            clearInterval(pollInterval);
            setIsLoading(false);
            setError('Verification was declined. Please try again or contact support.');
          }
        } catch (pollError) {
          console.error('Error checking verification status:', pollError);
        }
      }, 5000); // Check every 5 seconds

      // Stop polling after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsLoading(false);
      }, 600000);

    } catch (error) {
      console.error('Error starting verification:', error);
      setError(error.message || 'Failed to start verification. Please try again.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="dark-card border-purple-500/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Identity Verification
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>To participate in the ITO and receive tokens, you need to complete identity verification.</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Takes 2-3 minutes</li>
                      <li>Requires government-issued ID</li>
                      <li>Secure and encrypted</li>
                      <li>One-time verification</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-gray-600 text-white hover:bg-gray-800"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartVerification}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    'Start Verification'
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Your data is encrypted and processed securely by Veriff
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}