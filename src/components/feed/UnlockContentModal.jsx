import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Lock, AlertCircle, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function UnlockContentModal({ post, user, onClose, onSuccess }) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState(null);

  // Parse values carefully to ensure proper comparison
  const userBalance = parseFloat(user?.token_balance) || 0;
  const price = parseFloat(post?.eqoflo_price) || 0;
  const platformFee = Math.floor(price * 0.07);
  const creatorReceives = price - platformFee;
  const hasEnoughBalance = userBalance >= price && price > 0;

  const handleUnlock = async () => {
    setIsUnlocking(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('unlockGatedContent', { postId: post.id });
      
      if (response?.data?.success) {
        onSuccess(response.data);
      } else {
        setError(response?.data?.error || 'Failed to unlock content');
      }
    } catch (err) {
      console.error('Unlock error:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred while unlocking content');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
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
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-black/90 border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Lock className="w-5 h-5 text-amber-400" />
              Unlock Premium Content
            </CardTitle>
            <CardDescription className="text-gray-400">
              Pay {price} $eqoflo to unlock this exclusive content
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Pricing Breakdown */}
            <div className="space-y-3 p-4 bg-gradient-to-r from-amber-600/10 to-orange-600/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Content Price</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white">{price} $eqoflo</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Creator receives</span>
                <span className="text-green-400">{creatorReceives} $eqoflo (93%)</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Platform fee</span>
                <span className="text-gray-400">{platformFee} $eqoflo (7%)</span>
              </div>

              <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between">
                <span className="text-sm text-gray-400">Your Balance</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className={`font-semibold ${hasEnoughBalance ? 'text-white' : 'text-red-400'}`}>
                    {userBalance} $eqoflo
                  </span>
                </div>
              </div>
            </div>

            {/* Insufficient Balance Warning */}
            {!hasEnoughBalance && (
              <div className="flex items-start gap-2 p-3 bg-red-600/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-400 font-medium">Insufficient Balance</p>
                  <p className="text-xs text-red-300 mt-1">
                    You need {price - userBalance} more $eqoflo to unlock this content
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 p-3 bg-red-600/10 border border-red-500/30 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isUnlocking}
                className="flex-1 border-gray-600 text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUnlock}
                disabled={!hasEnoughBalance || isUnlocking}
                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              >
                {isUnlocking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 mr-2" />
                    Unlock Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}