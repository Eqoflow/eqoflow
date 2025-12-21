
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, AlertTriangle, Upload, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { UploadFile } from '@/integrations/Core';

export default function RaiseDisputeModal({ transaction, user, onClose, onDisputeRaised }) {
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isBuyer = user.email === transaction.buyer_email;

  const disputeReasons = {
    buyer: [
      { value: 'service_not_delivered', label: 'Service Not Delivered' },
      { value: 'poor_quality', label: 'Poor Quality Work' },
      { value: 'late_delivery', label: 'Late Delivery' },
      { value: 'not_as_described', label: 'Not As Described' },
      { value: 'seller_unresponsive', label: 'Seller Unresponsive' },
      { value: 'other', label: 'Other Issue' }
    ],
    seller: [
      { value: 'payment_not_received', label: 'Payment Not Received' },
      { value: 'buyer_unresponsive', label: 'Buyer Unresponsive' },
      { value: 'scope_creep', label: 'Scope Creep / Extra Work' },
      { value: 'false_completion', label: 'Buyer Marked Complete Incorrectly' },
      { value: 'other', label: 'Other Issue' }
    ]
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setEvidenceFiles([...evidenceFiles, { url: file_url, name: file.name }]);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const handleSubmit = async () => {
    if (!disputeReason) {
      alert('Please select a reason for the dispute');
      return;
    }

    if (!disputeDetails.trim() || disputeDetails.trim().length < 50) {
      alert('Please provide a detailed explanation (at least 50 characters)');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the dispute
      await base44.entities.SkillDispute.create({
        transaction_id: transaction.id,
        skill_id: transaction.item_id,
        skill_title: transaction.item_title,
        complainant_email: user.email,
        complainant_role: isBuyer ? 'buyer' : 'seller',
        respondent_email: isBuyer ? transaction.seller_email : transaction.buyer_email,
        dispute_reason: disputeReason,
        dispute_details: disputeDetails.trim(),
        evidence_urls: evidenceFiles.map(f => f.url),
        status: 'open'
      });

      // Update transaction status to disputed (regular update, not asServiceRole)
      await base44.entities.MarketplaceTransaction.update(transaction.id, {
        status: 'disputed',
        notes: `${transaction.notes || ''}\n\n[${new Date().toISOString()}] Dispute raised by ${isBuyer ? 'buyer' : 'seller'}: ${disputeReason}`
      });

      // Notify the other party about the dispute
      const respondentEmail = isBuyer ? transaction.seller_email : transaction.buyer_email;
      try {
        await base44.functions.invoke('sendMarketplaceNotification', {
          recipientEmail: respondentEmail,
          type: 'system',
          title: '⚠️ Dispute Raised',
          message: `A dispute has been raised regarding "${transaction.item_title}". An admin will review the case and contact both parties.`,
          relatedContentId: transaction.id,
          relatedContentType: 'skill',
          actionUrl: `/SkillWorkroom?transactionId=${transaction.id}`,
          metadata: {
            dispute_reason: disputeReason,
            raised_by: isBuyer ? 'buyer' : 'seller'
          }
        });
      } catch (notifError) {
        console.error('Failed to send notification to respondent:', notifError);
      }

      // Notify admins about new dispute
      try {
        // Get all admin users
        const adminUsers = await base44.entities.User.filter({ role: 'admin' });
        
        // Send notification to each admin
        for (const admin of adminUsers) {
          if (admin.email) { // Ensure admin has an email to send notification to
            await base44.functions.invoke('sendMarketplaceNotification', {
              recipientEmail: admin.email,
              type: 'system',
              title: '🚨 New Dispute Requires Review',
              message: `A dispute has been raised for "${transaction.item_title}" by ${user.full_name || user.email}. Reason: ${disputeReasons[isBuyer ? 'buyer' : 'seller'].find(r => r.value === disputeReason)?.label || disputeReason}`,
              relatedContentId: transaction.id,
              relatedContentType: 'skill',
              actionUrl: `/MarketplaceMonitor`,
              metadata: {
                transaction_id: transaction.id,
                dispute_reason: disputeReason,
                raised_by_role: isBuyer ? 'buyer' : 'seller',
                complainant_email: user.email,
                respondent_email: respondentEmail
              }
            });
          }
        }
      } catch (notifError) {
        console.error('Failed to send admin notifications:', notifError);
      }

      alert('✅ Dispute submitted successfully. An admin will review your case shortly.');
      onDisputeRaised();
      onClose();
    } catch (error) {
      console.error('Error submitting dispute:', error);
      alert('Failed to submit dispute. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl my-8"
      >
        <Card className="dark-card border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between border-b border-red-500/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <CardTitle className="text-white">Raise a Dispute</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 mt-6">
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-300 text-sm">
                Raising a dispute will pause any payouts and escalate this issue to admin review. 
                Please provide detailed information to help resolve this matter fairly.
              </AlertDescription>
            </Alert>

            <div>
              <h4 className="text-lg font-semibold text-white mb-2">{transaction.item_title}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-gray-400">Transaction ID: <span className="text-gray-300">{transaction.id.slice(0, 8)}...</span></p>
                <p className="text-gray-400">Amount: <span className="text-white">${transaction.amount_total.toFixed(2)}</span></p>
              </div>
            </div>

            {/* Dispute Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for Dispute *
              </label>
              <Select value={disputeReason} onValueChange={setDisputeReason}>
                <SelectTrigger className="bg-black/20 border-red-500/30 text-white">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-red-500/20">
                  {disputeReasons[isBuyer ? 'buyer' : 'seller'].map((reason) => (
                    <SelectItem key={reason.value} value={reason.value} className="text-white hover:bg-gray-800">
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Detailed Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Detailed Explanation * (minimum 50 characters)
              </label>
              <Textarea
                value={disputeDetails}
                onChange={(e) => setDisputeDetails(e.target.value)}
                placeholder="Please provide a detailed explanation of the issue, including dates, what was agreed upon, what actually happened, and any attempts to resolve this directly with the other party..."
                className="bg-black/20 border-red-500/30 text-white min-h-[150px]"
                maxLength={2000}
              />
              <div className="flex justify-between text-xs mt-1">
                <p className={disputeDetails.length < 50 ? 'text-red-400' : 'text-gray-500'}>
                  {disputeDetails.length}/2000 characters {disputeDetails.length < 50 && `(${50 - disputeDetails.length} more needed)`}
                </p>
              </div>
            </div>

            {/* Evidence Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Evidence (Screenshots, files, etc.)
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                accept="image/*,.pdf"
                className="hidden"
                id="evidence-upload"
                disabled={isUploading}
              />
              <label htmlFor="evidence-upload">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  className="border-gray-600 text-white hover:bg-gray-800 cursor-pointer"
                  onClick={() => document.getElementById('evidence-upload').click()}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Evidence
                    </>
                  )}
                </Button>
              </label>
              {evidenceFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {evidenceFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                      <span className="text-sm text-gray-300">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                💡 <strong>Tip:</strong> The more detailed information and evidence you provide, the faster we can resolve this dispute fairly for both parties.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !disputeReason || disputeDetails.length < 50}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Dispute'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
