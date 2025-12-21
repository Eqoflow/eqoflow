import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, MessageSquare, Send } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function AppealModal({ log, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(log, reason);
      onClose();
    } catch (error) {
      console.error('Appeal submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="dark-card border-blue-500/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-blue-400">
                <MessageSquare className="w-6 h-6" />
                Appeal Moderation Decision
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-400">
                You are appealing the decision on the following content. Please provide a clear and concise reason why you believe this decision should be overturned. This will be sent to our moderation team for a final review.
              </p>
              <div className="bg-black/20 p-3 rounded-lg border border-gray-700 max-h-24 overflow-y-auto">
                <p className="text-white font-mono text-xs">{log.content_snapshot}</p>
              </div>
              <div>
                <Label htmlFor="appeal-reason" className="text-white mb-2 block">Your Appeal Reason</Label>
                <Textarea
                  id="appeal-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why the flag should be removed..."
                  className="min-h-[120px] bg-black/20 border-blue-500/20 text-white focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose} className="border-gray-500/30 hover:bg-gray-500/10">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!reason.trim() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Submitting Appeal...' : 'Submit Appeal'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}