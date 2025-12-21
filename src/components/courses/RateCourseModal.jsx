import React, { useState } from 'react';
import { CourseEnrollment } from '@/entities/CourseEnrollment';
import { Course } from '@/entities/Course';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';

export default function RateCourseModal({ isOpen, onClose, enrollment, onRatingSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Update the enrollment with rating and review
      await CourseEnrollment.update(enrollment.id, {
        rating: rating,
        review: review.trim() || null,
        completed: true,
        completed_at: new Date().toISOString()
      });

      // Get the course to update its ratings
      const courses = await Course.list();
      const course = courses.find(c => c.id === enrollment.course_id);
      
      if (course) {
        // Get all enrollments for this course that have ratings
        const allEnrollments = await CourseEnrollment.list();
        const courseEnrollments = allEnrollments.filter(e => e.course_id === enrollment.course_id);
        
        const ratedEnrollments = courseEnrollments.filter(e => e.rating && e.rating > 0);
        const totalRatings = ratedEnrollments.length;
        const sumRatings = ratedEnrollments.reduce((sum, e) => sum + (e.rating || 0), 0);
        const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

        // Update the course with new average rating and review count
        await Course.update(course.id, {
          average_rating: averageRating,
          reviews_count: totalRatings
        });
      }

      if (onRatingSubmitted) {
        onRatingSubmitted();
      }

      onClose();
    } catch (error) {
      console.error('Failed to submit rating:', error);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md dark-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Rate This Course</DialogTitle>
          <DialogDescription className="text-gray-400">
            Share your experience with {enrollment?.course_title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div>
            <label className="text-white font-medium mb-3 block">Your Rating</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-gray-400 mt-2 text-sm">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div>
            <label className="text-white font-medium mb-2 block">
              Your Review (Optional)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts about this course..."
              rows={4}
              className="bg-slate-800/50 border-purple-500/30 text-white"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-purple-500/30 text-slate-900 bg-white hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-500"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}