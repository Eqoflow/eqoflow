
import React, { useState, useEffect } from 'react';
import { Course } from '@/entities/Course';
import { CourseEnrollment } from '@/entities/CourseEnrollment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Users,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Star,
  Calendar,
  BookOpen,
  PlayCircle,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import CourseAnalytics from './CourseAnalytics';
import EditCourseModal from './EditCourseModal';
import RateCourseModal from './RateCourseModal';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function CourseManagementDashboard({ user, onCoursesChanged }) {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [enrollmentToRate, setEnrollmentToRate] = useState(null);

  useEffect(() => {
    if (user) {
      loadMyCourses();
      loadEnrolledCourses();
    }
  }, [user]);

  const loadMyCourses = async () => {
    try {
      setIsLoading(true);
      const myCourses = await Course.filter(
        { creator_email: user.email },
        '-created_date'
      );
      setCourses(myCourses);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEnrolledCourses = async () => {
    try {
      setIsLoadingEnrolled(true);
      const enrollments = await CourseEnrollment.filter(
        { student_email: user.email },
        '-created_date'
      );
      setEnrolledCourses(enrollments);
    } catch (error) {
      console.error('Failed to load enrolled courses:', error);
    } finally {
      setIsLoadingEnrolled(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      await Course.delete(courseId);
      await loadMyCourses();
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
      }
      if (onCoursesChanged) {
        onCoursesChanged();
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowEditModal(true);
  };

  const handleCourseUpdated = async () => {
    await loadMyCourses();
    
    if (selectedCourse) {
      const updated = await Course.filter({ id: selectedCourse.id });
      if (updated.length > 0) {
        setSelectedCourse(updated[0]);
      }
    }
    
    if (onCoursesChanged) {
      onCoursesChanged();
    }
  };

  const handleContinueLearning = (enrollment) => {
    window.location.href = createPageUrl(`CourseViewer?id=${enrollment.course_id}`);
  };

  const handleRateCourse = (enrollment) => {
    setEnrollmentToRate(enrollment);
    setShowRatingModal(true);
  };

  const handleRatingSubmitted = async () => {
    await loadEnrolledCourses();
    if (onCoursesChanged) {
      onCoursesChanged();
    }
  };

  // Calculate overview stats
  const totalEnrollments = courses.reduce((sum, course) => sum + (course.enrolled_count || 0), 0);
  const totalRevenue = courses.reduce((sum, course) => {
    const revenue = (course.price_amount || 0) * (course.enrolled_count || 0);
    const platformFee = revenue * (course.platform_fee_percentage || 10) / 100;
    return sum + (revenue - platformFee);
  }, 0);
  
  // Fix: Only calculate average from courses that have ratings
  const coursesWithRatings = courses.filter(course => course.average_rating && course.average_rating > 0);
  const averageRating = coursesWithRatings.length > 0 ?
    coursesWithRatings.reduce((sum, course) => sum + course.average_rating, 0) / coursesWithRatings.length :
    0;
  
  const totalViews = courses.reduce((sum, course) => sum + (course.views_count || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // If a course is selected, show detailed analytics
  if (selectedCourse) {
    return (
      <div className="bg-[#000000] space-y-6">
        <Button
          onClick={() => setSelectedCourse(null)}
          variant="outline"
          className="bg-background text-slate-950 mb-6 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:bg-accent hover:text-accent-foreground h-10 border-purple-500/30"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Courses
        </Button>
        <CourseAnalytics course={selectedCourse} onEdit={() => handleEditCourse(selectedCourse)} />
      </div>
    );
  }

  return (
    <div className="bg-[#000000] space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Courses</p>
                <p className="text-3xl font-bold text-white mt-1">{courses.length}</p>
              </div>
              <div className="bg-purple-600/20 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Students</p>
                <p className="text-3xl font-bold text-white mt-1">{totalEnrollments}</p>
              </div>
              <div className="bg-blue-600/20 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-3xl font-bold text-white mt-1">${totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">After 10% platform fee</p>
              </div>
              <div className="bg-green-600/20 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg. Rating</p>
                <p className="text-3xl font-bold text-white mt-1">{averageRating.toFixed(1)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.round(averageRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-yellow-600/20 p-3 rounded-lg">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for My Courses and Enrolled Courses */}
      <Tabs defaultValue="my-courses" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-900/80 border border-purple-500/20">
          <TabsTrigger value="my-courses" className="text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            My Courses
          </TabsTrigger>
          <TabsTrigger value="enrolled-courses" className="text-white">
            <BookOpen className="w-4 h-4 mr-2" />
            Enrolled Courses
          </TabsTrigger>
        </TabsList>

        {/* My Courses Tab */}
        <TabsContent value="my-courses">
          <Card className="dark-card">
            <CardHeader className="bg-slate-950 p-6 flex flex-col space-y-1.5">
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                My Courses
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-slate-950 pt-0 p-6">
              {courses.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No courses yet</h3>
                  <p className="text-gray-500">Create your first course to start teaching!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                      onClick={() => setSelectedCourse(course)}
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={course.thumbnail_url || 'https://via.placeholder.com/150'}
                          alt={course.title}
                          className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-1">{course.title}</h3>
                              <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                                {course.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {course.enrolled_count || 0} students
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-400" />
                                  {course.average_rating?.toFixed(1) || '0.0'}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  {course.views_count || 0} views
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4 text-green-400" />
                                  ${course.price_amount || 0}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCourse(course);
                                }}
                                className="bg-background text-slate-950 px-3 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:bg-accent hover:text-accent-foreground h-9 border-purple-500/30"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCourse(course.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enrolled Courses Tab */}
        <TabsContent value="enrolled-courses">
          <Card className="dark-card">
            <CardHeader className="bg-slate-950 p-6 flex flex-col space-y-1.5">
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Enrolled Courses
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-slate-950 pt-0 p-6">
              {isLoadingEnrolled ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : enrolledCourses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No enrolled courses</h3>
                  <p className="text-gray-500">Browse the course catalog to start learning!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrolledCourses.map((enrollment) => (
                    <motion.div
                      key={enrollment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">{enrollment.course_title}</h3>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Enrolled {format(new Date(enrollment.created_date), 'MMM d, yyyy')}
                            </div>
                            {enrollment.completed && (
                              <div className="flex items-center gap-1 text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                Completed
                              </div>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-400">Progress</span>
                              <span className="text-white font-semibold">{enrollment.progress_percentage || 0}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${enrollment.progress_percentage || 0}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleContinueLearning(enrollment)}
                              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                            >
                              {enrollment.progress_percentage > 0 ? (
                                <>
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Continue Learning
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Start Course
                                </>
                              )}
                            </Button>

                            {enrollment.progress_percentage === 100 && !enrollment.rating && (
                              <Button
                                onClick={() => handleRateCourse(enrollment)}
                                className="bg-yellow-600 hover:bg-yellow-700"
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Rate this Course
                              </Button>
                            )}

                            {enrollment.rating && (
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Star className="w-4 h-4 fill-yellow-400" />
                                <span className="text-sm font-semibold">{enrollment.rating}/5</span>
                              </div>
                            )}

                            {enrollment.progress_percentage > 0 && (
                              <Button
                                variant="outline"
                                onClick={() => handleContinueLearning(enrollment)}
                                className="border-purple-500/30 text-white hover:bg-purple-500/10"
                              >
                                Restart
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Course Modal */}
      {showEditModal && editingCourse && (
        <EditCourseModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingCourse(null);
          }}
          course={editingCourse}
          user={user}
          onCourseUpdated={handleCourseUpdated}
        />
      )}

      {/* Rate Course Modal */}
      {showRatingModal && enrollmentToRate && (
        <RateCourseModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setEnrollmentToRate(null);
          }}
          enrollment={enrollmentToRate}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </div>
  );
}
