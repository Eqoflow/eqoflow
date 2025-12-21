
import React, { useState, useEffect, useContext } from 'react';
import { SocialConnectionReview } from '@/entities/SocialConnectionReview';
import { UserContext } from '../components/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Check, X, Loader2, RefreshCw, ArrowLeft, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import { processSocialConnectionReview } from '@/functions/processSocialConnectionReview';

export default function SocialReviewDashboard() {
  const { user } = useContext(UserContext);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [userReviews, setUserReviews] = useState([]);

  const fetchPendingReviews = async () => {
    setIsLoading(true);
    try {
      const reviews = await SocialConnectionReview.filter({ status: 'pending' }, '-created_date');
      setPendingReviews(reviews);
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const handleReview = async (reviewId, decision) => {
    if (decision === 'rejected' && !adminNotes[reviewId]) {
      alert('Please provide a reason for rejection in the notes.');
      return;
    }
    setProcessingId(reviewId);
    try {
      // The backend now identifies the admin via their token, so reviewerEmail is no longer needed here.
      await processSocialConnectionReview({
        reviewId,
        decision,
        adminNotes: adminNotes[reviewId] || '',
      });
      
      // Remove from userReviews
      setUserReviews(prev => prev.filter(r => r.id !== reviewId));
      // Remove from pendingReviews
      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
      
      // If no more reviews for this user, go back to user list
      if (userReviews.length <= 1) {
        setSelectedUser(null);
        setUserReviews([]);
      }
    } catch (error) {
      console.error(`Error processing review:`, error);
      alert(`Failed to ${decision} connection.`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleNotesChange = (reviewId, value) => {
    setAdminNotes(prev => ({ ...prev, [reviewId]: value }));
  };

  const handleUserSelect = (userEmail) => {
    const reviews = pendingReviews.filter(r => r.user_email === userEmail);
    setUserReviews(reviews);
    setSelectedUser(userEmail);
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setUserReviews([]);
    setAdminNotes({});
  };

  // Group reviews by user email
  const groupedReviews = pendingReviews.reduce((acc, review) => {
    if (!acc[review.user_email]) {
      acc[review.user_email] = [];
    }
    acc[review.user_email].push(review);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        <span className="ml-3 text-lg">Loading pending reviews...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl("AdminHub")}>
          <Button
            variant="outline"
            className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Hub
          </Button>
        </Link>

        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {selectedUser && (
              <Button 
                onClick={handleBackToUsers} 
                variant="outline" 
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Users
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-cyan-400">
                {selectedUser ? `Reviews for ${selectedUser}` : 'Social Connection Review Hub'}
              </h1>
              <p className="text-gray-400">
                {selectedUser 
                  ? `Review and validate ${selectedUser}'s social media connections.`
                  : 'Review and validate user-submitted social media connections.'
                }
              </p>
            </div>
          </div>
          <Button onClick={fetchPendingReviews} variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </header>

        <AnimatePresence mode="wait">
          {!selectedUser ? (
            // User List View
            <motion.div
              key="user-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {Object.keys(groupedReviews).length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 bg-slate-950 rounded-xl">
                  <Check className="w-16 h-16 mx-auto text-green-500" />
                  <h2 className="mt-4 text-2xl font-semibold text-white">All Clear!</h2>
                  <p className="mt-2 text-gray-400">There are no pending social connection requests to review.</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(groupedReviews).map(([userEmail, reviews]) => (
                    <motion.div
                      key={userEmail}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="cursor-pointer"
                      onClick={() => handleUserSelect(userEmail)}
                    >
                      <Card className="dark-card border-cyan-500/20 hover:border-cyan-500/40 transition-colors duration-300 hover:scale-105">
                        <CardContent className="p-6 text-center">
                          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">{userEmail}</h3>
                          <div className="space-y-2">
                            <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
                              {reviews.length} Pending Review{reviews.length !== 1 ? 's' : ''}
                            </Badge>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {reviews.map((review) => (
                                <Badge key={review.id} className="text-xs bg-purple-600/20 text-purple-300 border-purple-500/30">
                                  {review.platform_label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-3">
                            Oldest: {formatDistanceToNow(new Date(reviews[0].created_date), { addSuffix: true })}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            // User's Reviews View
            <motion.div
              key="user-reviews"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userReviews.map((review) => (
                  <motion.div
                    key={review.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="dark-card border-cyan-500/20 hover:border-cyan-500/40 transition-colors duration-300">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white text-lg">{review.platform_label}</CardTitle>
                            <p className="text-sm text-gray-400">Request from: {review.user_email}</p>
                          </div>
                          <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
                            {formatDistanceToNow(new Date(review.created_date), { addSuffix: true })}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm p-3 bg-black/20 rounded-lg">
                          <p><strong className="text-white">Display Name:</strong> <span className="text-white">{review.submitted_data.display_name}</span></p>
                          <p><strong className="text-white">Username:</strong> <span className="text-white">@{review.submitted_data.username}</span></p>
                          <p><strong className="text-white">Followers:</strong> <span className="text-white">{review.submitted_data.follower_count?.toLocaleString()}</span></p>
                          <a href={review.submitted_data.profile_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-400 hover:underline">
                            Verify Profile <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div>
                          <Textarea
                            placeholder="Rejection notes (required if rejecting)"
                            value={adminNotes[review.id] || ''}
                            onChange={(e) => handleNotesChange(review.id, e.target.value)}
                            className="bg-black/20 border-gray-600 text-white placeholder-gray-400"
                            disabled={processingId === review.id}
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button
                            onClick={() => handleReview(review.id, 'rejected')}
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            disabled={processingId === review.id}
                          >
                            {processingId === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />} 
                            Reject
                          </Button>
                          <Button
                            onClick={() => handleReview(review.id, 'approved')}
                            className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
                            disabled={processingId === review.id}
                          >
                            {processingId === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />} 
                            Approve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
