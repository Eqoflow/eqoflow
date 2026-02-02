import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Calendar as CalendarIcon, Plus, Clock, Edit, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format, addYears, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import CreatePost from "../feed/CreatePost";

export default function ScheduledPostsTab({ user }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [editingScheduledPost, setEditingScheduledPost] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const maxDate = addYears(new Date(), 3);

  useEffect(() => {
    loadScheduledPosts();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadScheduledPosts = async () => {
    try {
      setIsLoading(true);
      const posts = await base44.entities.ScheduledPost.filter(
        { created_by: user.email, status: "scheduled" },
        "scheduled_date"
      );
      setScheduledPosts(posts);
    } catch (error) {
      console.error("Error loading scheduled posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  const handleSchedulePost = async (postData) => {
    try {
      const scheduledDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const scheduledPostData = {
        content: postData.content,
        media_urls: postData.media_urls || [],
        tags: postData.tags || [],
        scheduled_date: scheduledDateTime.toISOString(),
        timezone: getUserTimezone(),
        status: "scheduled",
        privacy_level: postData.privacy_level || "public",
        community_id: postData.community_id || null,
        share_to_main_feed: postData.share_to_main_feed || false,
        nft_gate_settings: postData.nft_gate_settings || null,
        youtube_video_id: postData.youtube_video_id || null,
        youtube_thumbnail_url: postData.youtube_thumbnail_url || null,
        youtube_video_title: postData.youtube_video_title || null,
        license_id: postData.license_id || null,
        eqoflo_price: postData.eqoflo_price || null,
        gated_content_title: postData.gated_content_title || null,
        brand_content_price: postData.brand_content_price || null,
        brand_content_title: postData.brand_content_title || null,
        post_to_x: postData.post_to_x || false
      };

      if (editingScheduledPost) {
        await base44.entities.ScheduledPost.update(editingScheduledPost.id, scheduledPostData);
      } else {
        await base44.entities.ScheduledPost.create(scheduledPostData);
      }

      await loadScheduledPosts();
      setShowCreateModal(false);
      setEditingScheduledPost(null);
    } catch (error) {
      console.error("Error scheduling post:", error);
      throw error;
    }
  };

  const handleDeleteScheduled = async (postId) => {
    if (!confirm("Are you sure you want to delete this scheduled post?")) return;

    try {
      await base44.entities.ScheduledPost.delete(postId);
      await loadScheduledPosts();
    } catch (error) {
      console.error("Error deleting scheduled post:", error);
      alert("Failed to delete scheduled post");
    }
  };

  const handleEditScheduled = (post) => {
    setEditingScheduledPost(post);
    if (post.scheduled_date) {
      const schedDate = new Date(post.scheduled_date);
      if (!isNaN(schedDate.getTime())) {
        setSelectedDate(schedDate);
        setSelectedTime(format(schedDate, "HH:mm"));
      }
    }
    setShowCreateModal(true);
  };

  const getPostsForDate = (date) => {
    return scheduledPosts.filter(post => {
      if (!post.scheduled_date) return false;
      const postDate = new Date(post.scheduled_date);
      if (isNaN(postDate.getTime())) return false;
      return isSameDay(postDate, date);
    });
  };

  const hasPostsOnDate = (date) => {
    return getPostsForDate(date).length > 0;
  };

  const postsOnSelectedDate = getPostsForDate(selectedDate);

  return (
    <div className="space-y-6">
      <Card className="dark-card">
        <CardHeader className="bg-[#000000] p-6">
          <CardTitle className="text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-purple-400" />
            Scheduled Posts
          </CardTitle>
          <p className="text-sm text-gray-400 mt-2">
            Schedule your echoes up to 3 years in advance. Posts will automatically publish at your chosen time.
          </p>
        </CardHeader>
        <CardContent className="bg-[#000000] p-6 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Calendar View */}
            <div className="space-y-4">
              <div className="bg-black/20 border border-purple-500/20 rounded-lg p-4">
                <style>{`
                  .rdp {
                    --rdp-cell-size: 40px;
                    --rdp-accent-color: #8b5cf6;
                    --rdp-background-color: rgba(139, 92, 246, 0.1);
                  }
                  .rdp button,
                  .rdp-day,
                  .rdp-day button,
                  .rdp-button {
                    color: white !important;
                  }
                  .rdp-day_selected,
                  .rdp-day_selected button {
                    background-color: #8b5cf6 !important;
                    color: white !important;
                  }
                  .rdp-day:hover,
                  .rdp-day button:hover {
                    background-color: rgba(139, 92, 246, 0.2) !important;
                    color: white !important;
                  }
                  .rdp-head_cell {
                    color: white !important;
                    font-weight: 600;
                  }
                  .rdp-caption_label {
                    color: white !important;
                    font-weight: 600;
                  }
                  .rdp-nav_button,
                  .rdp-nav button {
                    color: white !important;
                  }
                  .rdp-nav_button:hover,
                  .rdp-nav button:hover {
                    background-color: rgba(139, 92, 246, 0.2) !important;
                  }
                  .rdp-day_outside,
                  .rdp-day_outside button {
                    color: rgba(255, 255, 255, 0.3) !important;
                  }
                  .rdp-day_disabled,
                  .rdp-day_disabled button {
                    color: rgba(255, 255, 255, 0.2) !important;
                  }
                `}</style>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  fromDate={new Date()}
                  toDate={maxDate}
                  className="rounded-md border-0"
                  modifiers={{
                    hasPost: (date) => hasPostsOnDate(date)
                  }}
                  modifiersStyles={{
                    hasPost: {
                      backgroundColor: 'rgba(139, 92, 246, 0.3)',
                      fontWeight: 'bold',
                      border: '2px solid #8b5cf6',
                      color: 'white'
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-3 h-3 bg-purple-600/30 border-2 border-purple-600 rounded"></div>
                <span>Days with scheduled posts</span>
              </div>
            </div>

            {/* Selected Date Posts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {selectedDate && !isNaN(selectedDate.getTime()) 
                    ? format(selectedDate, "MMMM d, yyyy")
                    : "Select a date"}
                </h3>
                <Button
                  onClick={() => {
                    setEditingScheduledPost(null);
                    setShowCreateModal(true);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Post
                </Button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                </div>
              ) : postsOnSelectedDate.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {postsOnSelectedDate.map((post) => (
                    <Card key={post.id} className="dark-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium text-white">
                              {post.scheduled_date && !isNaN(new Date(post.scheduled_date).getTime()) 
                                ? format(new Date(post.scheduled_date), "h:mm:ss a")
                                : "Invalid time"}
                            </span>
                            <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-xs">
                              {post.status}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditScheduled(post)}
                              className="h-8 w-8 text-gray-400 hover:text-white"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteScheduled(post.id)}
                              className="h-8 w-8 text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm line-clamp-3">
                          {post.content}
                        </p>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {post.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {post.media_urls && post.media_urls.length > 0 && (
                          <div className="mt-3 flex gap-2">
                            {post.media_urls.slice(0, 3).map((url, idx) => (
                              <img key={idx} src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                            ))}
                            {post.media_urls.length > 3 && (
                              <div className="w-16 h-16 bg-black/40 rounded-lg flex items-center justify-center text-xs text-gray-400">
                                +{post.media_urls.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-black/20 border border-purple-500/20 rounded-lg">
                  <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No posts scheduled for this date</p>
                  <Button
                    onClick={() => {
                      setEditingScheduledPost(null);
                      setShowCreateModal(true);
                    }}
                    variant="outline"
                    className="mt-4 border-purple-500/30 text-white hover:bg-purple-500/10"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule a Post
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark-card">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {scheduledPosts.length}
            </div>
            <div className="text-gray-400 text-sm">Total Scheduled</div>
          </CardContent>
        </Card>
        <Card className="dark-card">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {scheduledPosts.filter(p => p.status === "published").length}
            </div>
            <div className="text-gray-400 text-sm">Published</div>
          </CardContent>
        </Card>
        <Card className="dark-card">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {scheduledPosts.filter(p => 
                new Date(p.scheduled_date) > new Date() && p.status === "scheduled"
              ).length}
            </div>
            <div className="text-gray-400 text-sm">Upcoming</div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowCreateModal(false);
              setEditingScheduledPost(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="dark-card">
                <CardHeader className="bg-[#000000] border-b border-purple-500/20">
                  <CardTitle className="text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-purple-400" />
                    {editingScheduledPost ? "Edit Scheduled Post" : "Schedule New Post"}
                  </CardTitle>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Scheduled Date</label>
                      <div className="flex items-center gap-2 text-white">
                        <CalendarIcon className="w-4 h-4 text-purple-400" />
                        <span>
                          {selectedDate && !isNaN(selectedDate.getTime()) 
                            ? format(selectedDate, "MMMM d, yyyy")
                            : "No date selected"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Current Time</label>
                      <div className="flex items-center gap-2 text-green-400 font-mono">
                        <Clock className="w-4 h-4" />
                        <span>{format(currentTime, "h:mm:ss a")}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Scheduled Time ({getUserTimezone()})</label>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="bg-black/20 border border-purple-500/20 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="bg-[#000000] p-0">
                  <CreatePost
                    onSubmit={handleSchedulePost}
                    user={user}
                    initialContent={editingScheduledPost?.content || ""}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}