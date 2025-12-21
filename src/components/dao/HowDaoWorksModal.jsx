import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Info, Coins, Shield } from 'lucide-react';

export default function HowDaoWorksModal({ isOpen, onClose }) {
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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                How EqoFlow DAO Works
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Token-Weighted Voting */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Token-Weighted Voting</h4>
                  <p className="text-gray-300 text-sm mb-4">
                    Your voting power is proportional to your $EQOFLO token holdings. More tokens = more influence in governance decisions. This ensures that those most invested in the platform's success have the strongest voice.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-gray-300 text-sm">Creation thresholds: 1,000 $EQOFLO (regular), 5,000 $EQOFLO (treasury), 10,000 $EQOFLO (critical).</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-gray-300 text-sm">Voting thresholds: 250 $EQOFLO (regular), 1,250 $EQOFLO (treasury), 4,000 $EQOFLO (critical). You keep your tokens.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-gray-300 text-sm">Voting lasts 7 days from proposal creation.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-gray-300 text-sm">Important: If you sell or move your tokens after voting, your vote will be nullified.</span>
                    </div>
                  </div>
                </div>

                {/* Treasury & Proposal Safeguards */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Treasury & Proposal Safeguards</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Coins className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Proposal Bonds & Hold</p>
                        <p className="text-gray-400 text-sm">To prevent spam, proposals require a small amount of tokens to be held (not spent) from your balance to cover creation thresholds and any explicit bond amounts. These tokens are returned when the proposal concludes.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Council Veto & Time Locks</p>
                        <p className="text-gray-400 text-sm">A Governance Council can veto malicious proposals, and time locks provide a safety window before any funds are moved, ensuring the treasury is always secure.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}