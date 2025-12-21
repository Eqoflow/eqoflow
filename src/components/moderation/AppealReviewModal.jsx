import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Send, Gavel, CheckCircle, XCircle, BrainCircuit, User } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function AppealReviewModal({ log, onResolve, onClose }) {
  const [decision, setDecision] = useState(null);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!decision || !response.trim()) return;
    setIsSubmitting(true);
    try {
      await onResolve(log, decision, response);
      onClose();
    } catch (error) {
      console.error('Failed to resolve appeal:', error);
      // Let parent component handle UI alert
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!log) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="dark-card border-purple-500/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-purple-400">
                <Gavel className="w-6 h-6" />
                Resolve Content Appeal
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-white">Original Content</h3>
                  <div className="p-3 bg-black/30 rounded-lg text-gray-300 italic whitespace-pre-wrap text-sm border border-gray-700">
                    "{log.content_snapshot}"
                  </div>

                  <h3 className="font-semibold text-white flex items-center gap-2 pt-2">
                    <BrainCircuit className="w-5 h-5 text-yellow-400" />
                    AI Analysis
                  </h3>
                  <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg space-y-1 text-sm">
                    <p><strong>Reason:</strong> <span className="capitalize text-yellow-300">{log.moderation_reason?.replace(/_/g, ' ')}</span></p>
                    {log.ai_confidence_score && <p><strong>Confidence:</strong> <span className="text-yellow-300">{(log.ai_confidence_score * 100).toFixed(1)}%</span></p>}
                    {log.ai_explanation && <p><strong>Explanation:</strong> <span className="text-gray-300">{log.ai_explanation}</span></p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    User's Appeal
                  </h3>
                  <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-gray-300 italic text-sm">
                    "{log.appeal_reason || 'No reason provided.'}"
                  </div>
                   <p className="text-xs text-gray-500">Appealed by: {log.created_by}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-purple-500/20 space-y-4">
                 <h3 className="font-semibold text-white">Final Decision</h3>
                 <div className="flex gap-4">
                    <Button
                        variant={decision === 'upheld' ? 'default' : 'outline'}
                        onClick={() => setDecision('upheld')}
                        className={`flex-1 ${decision === 'upheld' ? 'bg-red-600 hover:bg-red-700' : 'text-red-400 border-red-500/50 hover:bg-red-500/10'}`}
                    >
                        <XCircle className="w-4 h-4 mr-2" /> Uphold Flag
                    </Button>
                    <Button
                        variant={decision === 'overturned' ? 'default' : 'outline'}
                        onClick={() => setDecision('overturned')}
                        className={`flex-1 ${decision === 'overturned' ? 'bg-green-600 hover:bg-green-700' : 'text-green-400 border-green-500/50 hover:bg-green-500/10'}`}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" /> Overturn Flag
                    </Button>
                 </div>
                 
                <div>
                  <Label htmlFor="admin-response" className="text-white mb-2 block">Admin Response</Label>
                  <Textarea
                    id="admin-response"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Provide a final, clear reason for your decision. This will be sent to the user."
                    className="min-h-[100px] bg-black/20 border-purple-500/20 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!decision || !response.trim() || isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-500"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Resolving...' : 'Confirm & Resolve'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}