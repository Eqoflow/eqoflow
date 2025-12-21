import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Users,
  Star,
  CheckCircle,
  Target,
  BookOpen,
  ExternalLink,
  DollarSign,
  Award,
  Loader2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { CourseEnrollment } from '@/entities/CourseEnrollment';
import { Course } from '@/entities/Course';
import { User } from '@/entities/User';
import { createPageUrl } from '@/utils';

export default function CourseDetailModal({ isOpen, onClose, course, user }) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState(null);

  // Check if user is already enrolled when modal opens
  useEffect(() => {
    if (isOpen && user && course) {
      checkEnrollment();
    }
  }, [isOpen, user, course]);

  const checkEnrollment = async () => {
    try {
      if (!user || !user.email || !course || !course.id) {
        setIsEnrolled(false);
        setEnrollment(null);
        return;
      }

      const enrollments = await CourseEnrollment.filter({
        course_id: course.id,
        student_email: user.email
      });
      
      if (enrollments.length > 0) {
        setIsEnrolled(true);
        setEnrollment(enrollments[0]);
      } else {
        setIsEnrolled(false);
        setEnrollment(null);
      }
    } catch (error) {
      console.error('Failed to check enrollment:', error);
      setError('Failed to check enrollment status.');
      setIsEnrolled(false);
      setEnrollment(null);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      technology: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      business: 'bg-green-500/20 text-green-300 border-green-500/30',
      design: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      marketing: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      art: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      music: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      health: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      languages: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      personal_development: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      other: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return colors[category] || colors.other;
  };

  const getDifficultyColor = (level) => {
    const colors = {
      beginner: 'bg-green-500/20 text-green-300',
      intermediate: 'bg-yellow-500/20 text-yellow-300',
      advanced: 'bg-red-500/20 text-red-300',
      all_levels: 'bg-blue-500/20 text-blue-300'
    };
    return colors[level] || colors.all_levels;
  };

  const formatPrice = () => {
    if (course.price_amount === 0) return 'Free';
    const symbol = course.currency === 'USD' ? '$' : 
                   course.currency === 'EUR' ? '€' : 
                   course.currency === 'GBP' ? '£' : 
                   course.currency === 'QFLOW' ? '' : '';
    return course.currency === 'QFLOW' 
      ? `${course.price_amount} $EQOFLO`
      : `${symbol}${course.price_amount}`;
  };

  const handleEnroll = async () => {
    if (!user) {
      setError('Please log in to enroll in this course');
      return;
    }
    
    if (!user.email || !user.full_name) {
      setError('User information (email or name) is missing. Please ensure your profile is complete.');
      return;
    }

    try {
      setIsEnrolling(true);
      setError('');

      if (course.price_amount === 0) {
        // Free course - direct enrollment
        await CourseEnrollment.create({
          course_id: course.id,
          course_title: course.title,
          student_email: user.email,
          student_name: user.full_name,
          instructor_email: course.creator_email,
          enrollment_type: 'free',
          amount_paid: 0,
          currency: course.currency,
          payment_status: 'completed',
          completed_lessons: []
        });

        // Update course enrolled count
        await Course.update(course.id, {
          enrolled_count: (course.enrolled_count || 0) + 1
        });

        await checkEnrollment();
      } else {
        // Paid course - redirect to payment
        if (course.currency === 'QFLOW') {
          // Handle $EQOFLO payment
          if (user.token_balance === undefined || user.token_balance < course.price_amount) {
            setError(`Insufficient $EQOFLO balance. You have ${user.token_balance || 0} $EQOFLO, need ${course.price_amount}.`);
            return;
          }
          
          // Deduct tokens from user
          await base44.auth.updateMe({
            token_balance: user.token_balance - course.price_amount
          });

          // Create enrollment
          await CourseEnrollment.create({
            course_id: course.id,
            course_title: course.title,
            student_email: user.email,
            student_name: user.full_name,
            instructor_email: course.creator_email,
            enrollment_type: 'paid',
            amount_paid: course.price_amount,
            currency: course.currency,
            payment_status: 'completed',
            completed_lessons: []
          });

          // Update course enrolled count and revenue
          await Course.update(course.id, {
            enrolled_count: (course.enrolled_count || 0) + 1,
            total_revenue: (course.total_revenue || 0) + course.price_amount
          });

          // Calculate platform fee (10%) and instructor amount (90%)
          const platformFee = course.price_amount * 0.1;
          const instructorAmount = course.price_amount * 0.9;
          
          // Transfer tokens to instructor
          const instructors = await User.filter({ email: course.creator_email });
          if (instructors.length > 0) {
            const instructor = instructors[0];
            await User.update(instructor.id, {
              token_balance: (instructor.token_balance || 0) + instructorAmount
            });
          }

          // Record platform revenue
          await base44.entities.PlatformRevenue.create({
            revenue_source: 'course_fee',
            amount_usd: platformFee,
            related_transaction_id: course.id,
            creator_email: course.creator_email,
            description: `Platform fee (10%) from course: ${course.title} - Paid in $EQOFLO`
          });

          await checkEnrollment();
        } else {
          // Handle fiat payment via Stripe - Redirect to checkout
          const { data } = await base44.functions.invoke('createCourseCheckout', {
            course_id: course.id,
            student_email: user.email
          });
          
          if (data && data.url) {
            // CRITICAL: Break out of iframe to redirect to Stripe at top level
            if (window.top) {
              window.top.location.href = data.url;
            } else {
              window.location.href = data.url;
            }
          } else {
            setError('Failed to initiate payment. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('Enrollment failed:', error);
      setError('Failed to enroll. Please try again. ' + (error.message || ''));
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleAccessCourse = () => {
    // Navigate to course viewer
    window.location.href = createPageUrl(`CourseViewer?id=${course.id}`);
  };

  const handleExternalLink = () => {
    if (course.external_url) {
      window.open(course.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {course.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Thumbnail */}
          {course.thumbnail_url && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden">
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4">
                <Badge className="bg-black/80 text-white border-0 text-lg font-bold px-4 py-2">
                  {formatPrice()}
                </Badge>
              </div>
            </div>
          )}

          {/* Course Info Bar */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            {course.duration_hours && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{course.duration_hours}h</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{course.enrolled_count || 0} students</span>
            </div>
            {course.average_rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>{course.average_rating.toFixed(1)} ({course.reviews_count || 0} reviews)</span>
              </div>
            )}
            <Badge className={getDifficultyColor(course.difficulty_level)}>
              {course.difficulty_level.replace('_', ' ')}
            </Badge>
            <Badge className={getCategoryColor(course.category)}>
              {course.category.replace('_', ' ')}
            </Badge>
          </div>

          <Separator className="bg-purple-500/20" />

          {/* Description */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">About This Course</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {course.description}
            </p>
          </div>

          {/* What You'll Learn */}
          {course.what_you_will_learn && course.what_you_will_learn.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                What You'll Learn
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {course.what_you_will_learn.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {course.requirements && course.requirements.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Requirements
              </h3>
              <ul className="space-y-2">
                {course.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Target Audience */}
          {course.target_audience && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Who This Course Is For
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {course.target_audience}
              </p>
            </div>
          )}

          <Separator className="bg-purple-500/20" />

          {/* Creator Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {course.creator_avatar ? (
                <img
                  src={course.creator_avatar}
                  alt={course.creator_name}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold">
                    {course.creator_name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Instructor</p>
                <p className="text-white font-semibold">{course.creator_name || 'Anonymous'}</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-purple-500/30 text-white hover:bg-purple-500/10"
            >
              Close
            </Button>
            
            {course.external_url && !isEnrolled && (
              <Button
                onClick={handleExternalLink}
                variant="outline"
                className="flex-1 border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View External Course
              </Button>
            )}

            {isEnrolled ? (
              <Button
                onClick={handleAccessCourse}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Access Course Content
              </Button>
            ) : (
              <Button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : course.price_amount === 0 ? (
                  'Enroll for Free'
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Enroll Now - {formatPrice()}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}