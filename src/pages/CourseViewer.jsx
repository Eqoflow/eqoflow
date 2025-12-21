
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Course } from '@/entities/Course';
import { CourseEnrollment } from '@/entities/CourseEnrollment';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle,
  PlayCircle,
  ExternalLink,
  Loader2,
  FileText,
  Video,
  AlertTriangle
} from 'lucide-react';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';
import { createPageUrl } from '@/utils';

export default function CourseViewer() {
  const location = useLocation();
  const [course, setCourse] = useState(null);
  const [user, setUser] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);

  const courseId = new URLSearchParams(location.search).get('id');

  const loadCourseData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!courseId) {
      setError('Course ID is missing from the URL.');
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await User.me();
      if (!currentUser) {
        setError('You must be logged in to view courses.');
        setIsLoading(false);
        return;
      }
      setUser(currentUser);

      const fetchedCourse = await Course.get(courseId);
      if (!fetchedCourse) {
        setError('Course not found.');
        setIsLoading(false);
        return;
      }
      setCourse(fetchedCourse);

      const enrollments = await CourseEnrollment.filter({
        course_id: courseId,
        student_email: currentUser.email
      });

      if (enrollments.length === 0) {
        setError('You are not enrolled in this course.');
        setIsLoading(false);
        return;
      }
      setEnrollment(enrollments[0]);

      // Determine initial active lesson
      const allLessons = generateLessonList(fetchedCourse);
      if (allLessons.length > 0) {
        const completedLessons = enrollments[0].completed_lessons || [];
        // Set active lesson to the first incomplete, or the first one if all complete
        const firstIncomplete = allLessons.find(lesson => !completedLessons.includes(lesson.id));
        setActiveLesson(firstIncomplete || allLessons[0]);
      } else {
        setError('No lessons available for this course.');
      }

    } catch (err) {
      console.error('Failed to load course viewer data:', err);
      setError(`Failed to load course: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  const generateLessonList = (course) => {
    const lessons = [];
    if (course.external_url) {
      lessons.push({
        id: 'external-link',
        title: 'Go to External Course',
        type: 'external',
        url: course.external_url,
        icon: <ExternalLink className="w-4 h-4" />
      });
    }
    (course.internal_media_urls || []).forEach((url, index) => {
      const mediaType = getMediaType(url);
      lessons.push({
        id: `internal-media-${index}`,
        title: `Lesson ${index + 1}: ${url.substring(url.lastIndexOf('/') + 1).split('?')[0]}`,
        type: mediaType,
        url: url,
        icon: mediaType === 'video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />
      });
    });
    return lessons;
  };

  const getMediaType = (url) => {
    const extension = url.split('.').pop().split('?')[0].toLowerCase();
    if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) return 'video';
    if (['pdf'].includes(extension)) return 'pdf';
    return 'unknown';
  };

  const isLessonCompleted = (lessonId) => {
    return enrollment?.completed_lessons?.includes(lessonId);
  };

  const handleMarkComplete = async (lessonId) => {
    if (!enrollment || !user || !course) return;

    try {
      setIsLoading(true);
      const updatedCompletedLessons = [...(enrollment.completed_lessons || [])];
      if (!updatedCompletedLessons.includes(lessonId)) {
        updatedCompletedLessons.push(lessonId);
      }

      const allLessons = generateLessonList(course);
      const newProgressPercentage = (updatedCompletedLessons.length / allLessons.length) * 100;
      const isCourseCompleted = updatedCompletedLessons.length === allLessons.length;

      const updateData = {
        completed_lessons: updatedCompletedLessons,
        progress_percentage: newProgressPercentage,
        last_accessed: new Date().toISOString(),
        completed: isCourseCompleted,
        completed_at: isCourseCompleted ? new Date().toISOString() : null
      };

      await CourseEnrollment.update(enrollment.id, updateData);
      setEnrollment(prev => ({ ...prev, ...updateData }));
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to mark lesson complete:', err);
      setError('Failed to update progress. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading && !course && !error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <QuantumFlowLoader message="Loading course content..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white">
        <Card className="dark-card p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h2 className="text-xl font-bold text-white mb-2">Error Accessing Course</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => window.location.href = createPageUrl('KnowledgeHub')} className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Knowledge Hub
          </Button>
        </Card>
      </div>
    );
  }

  if (!course || !enrollment) {
    return null; // Should be handled by error state, but as a fallback
  }

  const allLessons = generateLessonList(course);
  const courseProgress = enrollment?.progress_percentage?.toFixed(0) || 0;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Sidebar for Lessons */}
        <Card className="dark-card lg:w-1/3 flex-shrink-0">
          <CardHeader>
            <Button
              onClick={() => window.location.href = createPageUrl('KnowledgeHub')}
              variant="outline"
              className="w-full border-purple-500/30 text-white hover:bg-purple-500/10 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              {course.title}
            </CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Your Progress: {courseProgress}%
              <div className="w-full bg-slate-800 rounded-full h-2.5 mt-2">
                <div
                  className="bg-purple-500 h-2.5 rounded-full"
                  style={{ width: `${courseProgress}%` }}
                ></div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Separator className="bg-purple-500/20" />
            <h3 className="text-lg font-semibold text-white">Lessons</h3>
            {allLessons.length === 0 && (
              <p className="text-gray-500">No lessons available.</p>
            )}
            {allLessons.map((lesson, index) => (
              <Button
                key={lesson.id}
                variant="ghost"
                onClick={() => setActiveLesson(lesson)}
                className={`w-full justify-start text-left p-3 rounded-lg hover:bg-slate-800/50 transition-colors ${
                  activeLesson?.id === lesson.id ? 'bg-slate-800/70 text-white' : 'text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 w-full min-w-0">
                  {isLessonCompleted(lesson.id) ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <span className="flex-shrink-0">
                      {lesson.icon || <PlayCircle className="w-4 h-4 text-purple-400" />}
                    </span>
                  )}
                  <span className="flex-1 truncate min-w-0">{lesson.title}</span>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white text-2xl">
                {activeLesson ? activeLesson.title : 'Select a Lesson'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeLesson ? (
                <div className="space-y-4">
                  {activeLesson.type === 'external' && (
                    <div className="p-6 bg-slate-800/50 rounded-lg text-center">
                      <p className="text-lg text-gray-300 mb-4">
                        This lesson is hosted externally. Click the button below to access it.
                      </p>
                      <Button
                        onClick={() => window.open(activeLesson.url, '_blank')}
                        className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Go to External Course
                      </Button>
                    </div>
                  )}
                  {activeLesson.type === 'video' && (
                    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                      <video controls src={activeLesson.url} className="w-full h-full" />
                    </div>
                  )}
                  {activeLesson.type === 'pdf' && (
                    <div className="w-full h-[600px] bg-slate-800/50 rounded-lg overflow-hidden">
                      <iframe src={activeLesson.url} className="w-full h-full" title={activeLesson.title} />
                    </div>
                  )}
                  {activeLesson.type === 'unknown' && (
                    <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                      <p className="text-lg text-yellow-300 mb-4">
                        This lesson's content type is not directly viewable in the app.
                      </p>
                      <Button
                        onClick={() => window.open(activeLesson.url, '_blank')}
                        variant="outline"
                        className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Lesson in New Tab
                      </Button>
                    </div>
                  )}

                  {!isLessonCompleted(activeLesson.id) && (
                    <Button
                      onClick={() => handleMarkComplete(activeLesson.id)}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 mt-4"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Marking...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Complete
                        </>
                      )}
                    </Button>
                  )}
                  {isLessonCompleted(activeLesson.id) && (
                    <Button
                      disabled
                      variant="outline"
                      className="w-full border-green-500/30 text-green-300 mt-4 cursor-default"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Lesson Completed!
                    </Button>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <PlayCircle className="w-16 h-16 mx-auto mb-4" />
                  <p>Select a lesson from the sidebar to begin.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
