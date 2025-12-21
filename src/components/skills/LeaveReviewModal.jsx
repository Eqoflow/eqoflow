import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function LeaveReviewModal({ transaction, onClose, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a star rating');
      return;
    }

    if (!reviewText.trim()) {
      alert('Please write a review');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.SkillReview.create({
        transaction_id: transaction.id,
        skill_id: transaction.item_id,
        creator_email: transaction.seller_email,
        reviewer_email: transaction.buyer_email,
        reviewer_name: transaction.buyer_name || 'Anonymous',
        reviewer_avatar: transaction.buyer_avatar || '',
        rating,
        review_text: reviewText.trim(),
        is_verified_purchase: true
      });

      alert('✅ Review submitted successfully! Thank you for your feedback.');
      onReviewSubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl">

        <Card className="dark-card border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Leave a Review</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">{transaction.item_title}</h4>
              <p className="text-gray-400 text-sm">How was your experience with this service?</p>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Rating *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) =>
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110">

                    <Star
                    className={`w-8 h-8 ${
                    star <= (hoveredRating || rating) ?
                    'fill-yellow-400 text-yellow-400' :
                    'text-gray-600'}`
                    } />

                  </button>
                )}
                {rating > 0 &&
                <span className="ml-2 text-gray-300 self-center">
                    {rating} {rating === 1 ? 'star' : 'stars'}
                  </span>
                }
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Review *
              </label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this service. What did you like? What could be improved?"
                className="bg-black/20 border-purple-500/30 text-white min-h-[150px]"
                maxLength={1000} />

              <p className="text-xs text-gray-500 mt-1">
                {reviewText.length}/1000 characters
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                💡 Your review will be publicly visible and help other buyers make informed decisions.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting} className="bg-background text-slate-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-gray-600 hover:bg-gray-700">


                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0 || !reviewText.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">

                {isSubmitting ?
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </> :

                'Submit Review'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>);

}