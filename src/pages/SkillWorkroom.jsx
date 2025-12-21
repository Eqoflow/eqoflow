
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { base44 } from '@/api/base44Client';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Send, CheckCircle, AlertTriangle, X, Loader2, Star, Zap } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import LeaveReviewModal from '../components/skills/LeaveReviewModal';
import RaiseDisputeModal from '../components/skills/RaiseDisputeModal';

const ChatMessage = ({ message, isSender }) =>
  <div className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
    {!isSender &&
      <img src={message.sender_avatar || `https://api.dicebear.com/6x/initials/svg?seed=${message.sender_name}`} alt="avatar" className="w-8 h-8 rounded-full" />
    }
    <div className={`max-w-md p-3 rounded-2xl ${isSender ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
      <p>{message.content}</p>
      <p className="text-xs opacity-70 mt-1 text-right">{format(new Date(message.created_date), 'p')}</p>
    </div>
  </div>;


export default function SkillWorkroom() {
  const [transaction, setTransaction] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  // Removed buyerUsername and sellerUsername states
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isReleasingPayment, setIsReleasingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [releaseError, setReleaseError] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasLeftReview, setHasLeftReview] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [skill, setSkill] = useState(null); // Added skill state
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const transactionId = new URLSearchParams(location.search).get('transactionId');
  const chatEndRef = useRef(null);

  // Main data loading useEffect
  useEffect(() => {
    const loadWorkroom = async () => {
      if (!transactionId) {
        navigate(createPageUrl('MyEngagements')); // Consistent with back button
        return;
      }

      try {
        setIsLoading(true);

        const currentUser = await User.me();
        setUser(currentUser);

        const txn = await base44.entities.MarketplaceTransaction.get(transactionId);

        if (!txn) {
          alert('Transaction not found');
          navigate(createPageUrl('MyEngagements')); // Consistent with back button
          return;
        }

        // Fetch buyer and seller names from PublicUserDirectory and skill details
        const [buyerProfile, sellerProfile, skillData] = await Promise.all([
          base44.entities.PublicUserDirectory.filter({ user_email: txn.buyer_email }).then(res => res[0]),
          base44.entities.PublicUserDirectory.filter({ user_email: txn.seller_email }).then(res => res[0]),
          base44.entities.Skill.get(txn.item_id) // Fetch skill details
        ]);

        // Add names to transaction object for display
        txn.buyer_name = buyerProfile?.full_name || txn.buyer_email.split('@')[0];
        txn.seller_name = sellerProfile?.full_name || txn.seller_email.split('@')[0];

        setTransaction(txn);
        setSkill(skillData); // Set skill data

        // Check if user has already left a review
        if (currentUser.email === txn.buyer_email) {
          try {
            const existingReviews = await base44.entities.SkillReview.filter({
              transaction_id: transactionId
            });
            setHasLeftReview(existingReviews.length > 0);
          } catch (reviewError) {
            console.error('Error checking for existing reviews:', reviewError);
            setHasLeftReview(false);
          }
        }

        await loadMessages(txn.id);

      } catch (error) {
        console.error('Error loading workroom:', error);
        alert('Failed to load workroom. Please try refreshing the page.');
        navigate(createPageUrl('MyEngagements')); // Consistent with back button
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkroom();

    // Check for payment success parameter (original logic)
    const urlParams = new URLSearchParams(location.search);
    const paymentSuccessParam = urlParams.get('payment_success');

    if (paymentSuccessParam === 'true') {
      setPaymentSuccess(true);
      // Clear URL parameter
      window.history.replaceState({}, '', `${createPageUrl('SkillWorkroom')}?transactionId=${transactionId}`);

      // Auto-hide after 5 seconds
      setTimeout(() => setPaymentSuccess(false), 5000);
    }
  }, [transactionId, navigate, location.search]); // Added navigate and location.search as dependencies

  // Interval for refreshing messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (transactionId && document.visibilityState === 'visible') {
        loadMessages(transactionId);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [transactionId]);

  // Scroll to bottom of chat on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (transactionIdParam) => {
    try {
      const msgs = await base44.entities.WorkroomMessage.filter(
        { transaction_id: transactionIdParam },
        'created_date'
      );
      setMessages(msgs);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      await base44.entities.WorkroomMessage.create({
        transaction_id: transaction.id,
        sender_email: user.email,
        sender_name: user.full_name,
        sender_avatar: user.avatar_url,
        content: newMessage.trim()
      });

      // Send notification to the other party
      const recipientEmail = user.email === transaction.buyer_email ?
        transaction.seller_email :
        transaction.buyer_email;

      console.log('Sending notification to:', recipientEmail);
      console.log('Current user:', user.email);
      console.log('Transaction:', transaction.id);

      try {
        const notificationResult = await base44.functions.invoke('sendMarketplaceNotification', {
          recipientEmail: recipientEmail,
          type: 'message',
          title: 'New Workroom Message',
          message: `${user.full_name} sent you a message about "${transaction.item_title}"`,
          relatedContentId: transaction.id,
          relatedContentType: 'skill',
          actionUrl: `/SkillWorkroom?transactionId=${transaction.id}`,
          metadata: {
            message_preview: newMessage.trim().substring(0, 100),
            sender_role: user.email === transaction.buyer_email ? 'Buyer' : 'Seller'
          }
        });

        console.log('Notification result:', notificationResult);

        if (notificationResult.data && !notificationResult.data.success) {
          console.error('Notification failed:', notificationResult.data);
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't fail the message send if notification fails
      }

      setNewMessage('');
      await loadMessages(transaction.id);
    } catch (error) {
      console.error("Error sending message:", error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleReleasePayment = async () => {
    if (!confirm('Are you sure you want to mark this job as complete? This will notify admins to process the payout to the seller.')) return;

    setIsReleasingPayment(true);
    setReleaseError(null);

    try {
      const response = await base44.functions.invoke('releaseEscrowToSeller', {
        transactionId: transaction.id
      });

      if (response.data.success) {
        await loadWorkroom(); // Reload data to update transaction status
        alert(`✅ Job marked as complete! Admin will process the $${response.data.amount.toFixed(2)} payout to the seller.`);
        setShowReviewModal(true);
      } else {
        throw new Error(response.data.error || 'Failed to mark job as complete');
      }
    } catch (error) {
      console.error("Error marking job as complete:", error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to mark job as complete. Please contact support.';
      setReleaseError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setIsReleasingPayment(false);
    }
  };

  const handleDisputeRaised = async () => {
    await loadWorkroom(); // Reload data to update transaction status
    setShowDisputeModal(false);
  };

  // Re-define loadWorkroom here to be accessible by other handlers if needed,
  // or wrap them in useCallback if performance is an issue and dependencies are stable.
  // For now, let's keep it as is, it's called on mount.
  const loadWorkroom = async () => {
    if (!transactionId) {
      navigate(createPageUrl('MyEngagements'));
      return;
    }

    try {
      setIsLoading(true);

      const currentUser = await User.me();
      setUser(currentUser);

      const txn = await base44.entities.MarketplaceTransaction.get(transactionId);

      if (!txn) {
        alert('Transaction not found');
        navigate(createPageUrl('MyEngagements'));
        return;
      }

      const [buyerProfile, sellerProfile, skillData] = await Promise.all([
        base44.entities.PublicUserDirectory.filter({ user_email: txn.buyer_email }).then(res => res[0]),
        base44.entities.PublicUserDirectory.filter({ user_email: txn.seller_email }).then(res => res[0]),
        base44.entities.Skill.get(txn.item_id)
      ]);

      txn.buyer_name = buyerProfile?.full_name || txn.buyer_email.split('@')[0];
      txn.seller_name = sellerProfile?.full_name || txn.seller_email.split('@')[0];

      setTransaction(txn);
      setSkill(skillData);

      if (currentUser.email === txn.buyer_email) {
        try {
          const existingReviews = await base44.entities.SkillReview.filter({
            transaction_id: transactionId
          });
          setHasLeftReview(existingReviews.length > 0);
        } catch (reviewError) {
          console.error('Error checking for existing reviews:', reviewError);
          setHasLeftReview(false);
        }
      }

      await loadMessages(txn.id);

    } catch (error) {
      console.error('Error loading workroom:', error);
      alert('Failed to load workroom. Please try refreshing the page.');
      navigate(createPageUrl('MyEngagements'));
    } finally {
      setIsLoading(false);
    }
  };


  const isBuyer = user?.email === transaction?.buyer_email; // Added defensive check for transaction
  const isDisputed = transaction?.status === 'disputed';
  const canReleasePayment = isBuyer && transaction?.status === 'held_in_escrow' && transaction?.amount_total > 0 && !isDisputed;
  const canLeaveReview = isBuyer && (transaction?.status === 'release_to_seller' || transaction?.status === 'completed') && !hasLeftReview && !isDisputed;
  const canRaiseDispute = !isDisputed && ['held_in_escrow', 'release_to_seller'].includes(transaction?.status);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <Link to={createPageUrl("MyEngagements")} className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Jobs
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : (
          <>
            {/* Payment Success Alert */}
            <AnimatePresence>
              {paymentSuccess &&
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6">

                  <Alert className="bg-green-500/10 border-green-500/30">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <AlertDescription className="ml-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-green-300">Payment Successful!</p>
                        <p className="text-sm text-green-200">
                          {transaction?.amount_total === 0 ? // Added defensive check
                            "You've started a free collaboration. Use the chat below to coordinate with the service provider." :
                            "Your payment has been received and is held securely in escrow. Use the chat below to coordinate with the service provider."}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPaymentSuccess(false)}
                        className="text-green-400 hover:text-green-300">

                        <X className="w-4 h-4" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              }
            </AnimatePresence>

            {/* Release Error Alert */}
            <AnimatePresence>
              {releaseError &&
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6">

                  <Alert className="bg-red-500/10 border-red-500/30">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <AlertDescription className="ml-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-red-300">Payment Release Failed</p>
                        <p className="text-sm text-red-200">{releaseError}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setReleaseError(null)}
                        className="text-red-400 hover:text-red-300">

                        <X className="w-4 h-4" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              }
            </AnimatePresence>

            {/* Review Prompt Alert */}
            <AnimatePresence>
              {canLeaveReview &&
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6">

                  <Alert className="bg-yellow-500/10 border-yellow-500/30">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <AlertDescription className="ml-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-yellow-300">Job Completed!</p>
                        <p className="text-sm text-yellow-200">
                          How was your experience? Leave a review to help other buyers and support the seller.
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowReviewModal(true)}
                        className="ml-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">

                        Leave Review
                      </Button>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              }
            </AnimatePresence>

            {/* Dispute Status Alert */}
            <AnimatePresence>
              {isDisputed &&
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6">

                  <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="p-4 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-300">Dispute In Progress</p>
                        <p className="text-sm text-red-200">This transaction is under admin review. All payouts are on hold until the dispute is resolved.</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              }
            </AnimatePresence>

            <Card className="dark-card mb-6">
              <CardHeader>
                <CardTitle className="text-white">{skill?.title || 'Service'}</CardTitle> {/* Changed to skill?.title */}
                <p className="text-gray-400">Transaction ID: {transaction?.id}</p> {/* Added defensive check */}
              </CardHeader>
            </Card>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Column - Transaction Details and Actions */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="dark-card">
                  <CardHeader><CardTitle className="text-white">Transaction Details</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Buyer</span>
                      <span className="text-white">{transaction?.buyer_name}</span> {/* Changed to transaction.buyer_name */}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Seller</span>
                      <span className="text-white">{transaction?.seller_name}</span> {/* Changed to transaction.seller_name */}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount</span>
                      <span className="text-white font-bold">
                        {transaction?.amount_total === 0 ? 'Free' : `$${transaction?.amount_total?.toFixed(2)}`} {/* Added defensive checks */}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Status</span>
                      <Badge className={`capitalize ${
                        transaction?.status === 'held_in_escrow' ? 'bg-blue-500/20 text-blue-400' :
                          transaction?.status === 'release_to_seller' ? 'bg-purple-500/20 text-purple-400' :
                            transaction?.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              transaction?.status === 'disputed' ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'}`
                      }>
                        {transaction?.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions Card */}
                <Card className="dark-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {canReleasePayment &&
                      <Button
                        onClick={handleReleasePayment}
                        disabled={isReleasingPayment || isDisputed}
                        className="w-full bg-green-600 hover:bg-green-700">

                        {isReleasingPayment ?
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </> :

                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Job as Complete
                          </>
                        }
                      </Button>
                    }

                    {canLeaveReview &&
                      <Button
                        onClick={() => setShowReviewModal(true)}
                        disabled={isDisputed}
                        variant="outline" className="bg-background text-slate-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-full border-yellow-500/30 hover:bg-yellow-500/10">


                        <Star className="w-4 h-4 mr-2" />
                        Leave a Review
                      </Button>
                    }

                    {canRaiseDispute &&
                      <Button
                        onClick={() => setShowDisputeModal(true)}
                        variant="outline"
                        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10">

                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Raise a Dispute
                      </Button>
                    }

                    {isDisputed &&
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-sm text-red-300 text-center">
                          Dispute in progress. Please wait for admin review.
                        </p>
                      </div>
                    }

                    {!isDisputed && transaction?.status === 'release_to_seller' &&
                      <Alert className="bg-purple-500/10 border-purple-500/30">
                        <CheckCircle className="w-5 h-5 text-purple-400" />
                        <AlertDescription className="ml-2 text-purple-300">
                          <p className="font-semibold">Job Marked Complete!</p>
                          <p className="text-sm">Admin is processing the payout to the seller.</p>
                        </AlertDescription>
                      </Alert>
                    }

                    {!isDisputed && transaction?.status === 'completed' &&
                      <Alert className="bg-green-500/10 border-green-500/30">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <AlertDescription className="ml-2 text-green-300">
                          <p className="font-semibold">Job Completed!</p>
                          <p className="text-sm">Payment has been processed to the seller.</p>
                        </AlertDescription>
                      </Alert>
                    }
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Chat */}
              <div className="lg:col-span-2">
                <Card className="dark-card h-[70vh] flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-white">Chat</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {messages.map((msg) => <ChatMessage key={msg.id} message={msg} isSender={msg.sender_email === user.email} />)}
                    <div ref={chatEndRef} />
                  </CardContent>
                  <div className="p-4 border-t border-purple-500/20">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        className="bg-black/20 border-purple-500/30 text-white"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(e)}
                        disabled={isSending || isDisputed} />

                      <Button onClick={handleSendMessage} disabled={isSending || isDisputed} className="bg-purple-600 hover:bg-purple-700">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Leave Review Modal */}
      <AnimatePresence>
        {showReviewModal &&
          <LeaveReviewModal
            transaction={{
              ...transaction,
              buyer_name: user.full_name, // Ensure user.full_name is passed
              buyer_avatar: user.avatar_url // Ensure user.avatar_url is passed
            }}
            onClose={() => setShowReviewModal(false)}
            onReviewSubmitted={() => {
              setHasLeftReview(true);
              loadWorkroom(); // Reload workroom data to update review status
            }} />

        }
      </AnimatePresence>

      {/* Raise Dispute Modal */}
      <AnimatePresence>
        {showDisputeModal &&
          <RaiseDisputeModal
            transaction={transaction}
            user={user}
            onClose={() => setShowDisputeModal(false)}
            onDisputeRaised={handleDisputeRaised} />

        }
      </AnimatePresence>
    </div>);
}
