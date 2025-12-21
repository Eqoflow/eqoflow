
import React, { useState, useEffect } from "react";
import { Comment } from "@/entities/Comment";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import {
  FileText,
  MessageCircle,
  Repeat,
  Calendar,
  Heart,
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare // Added MessageSquare for empty state icon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function ProfileHistory({ user, posts, onEditPost, onDeletePost }) {
  // Existing state for user's own comments (for the "Comments" tab)
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // General loading for user activity (comments)

  // NEW: States for lazy-loaded comments for individual posts
  const [commentsData, setCommentsData] = useState({}); // Stores comments for each post by postId
  const [loadingComments, setLoadingComments] = useState({}); // Tracks loading state for comments of specific posts
  const [loadedComments, setLoadedComments] = useState(new Set()); // Keeps track of which post comments have been loaded

  useEffect(() => {
    if (user) {
      loadUserActivity();
    }
  }, [user]);

  const loadUserActivity = async () => {
    try {
      // Load user's comments (for the "Comments" tab)
      const userComments = await Comment.filter({ created_by: user.email }, "-created_date", 20);
      setComments(userComments);
    } catch (error) {
      console.error("Error loading user activity:", error);
    }
    setIsLoading(false);
  };

  // NEW: Function to lazy-load comments for a specific post
  const loadCommentsForPost = async (postId) => {
    if (loadedComments.has(postId) || loadingComments[postId]) {
      return; // Already loaded or currently loading
    }

    setLoadingComments((prev) => ({ ...prev, [postId]: true }));

    try {
      // Fetch comments for the given post_id, ordered by creation date, limit to 10
      const comments = await Comment.filter({ post_id: postId }, "-created_date", 10);
      setCommentsData((prev) => ({ ...prev, [postId]: comments }));
      setLoadedComments((prev) => new Set([...prev, postId]));
    } catch (error) {
      console.error(`Error loading comments for post ${postId}:`, error);
      setCommentsData((prev) => ({ ...prev, [postId]: [] })); // Set to empty array on error
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const totalLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
  const totalReposts = posts.reduce((sum, post) => sum + (post.reposts_count || 0), 0);

  // NEW: PostHistoryCard component for individual post display and lazy-loaded comments
  const PostHistoryCard = ({ post, onEditPost, onDeletePost }) => {
    const [showComments, setShowComments] = useState(false);

    // Handle comment section toggle with lazy loading
    const handleToggleComments = () => {
      if (!showComments && !loadedComments.has(post.id)) {
        loadCommentsForPost(post.id); // Lazy load comments when first opened
      }
      setShowComments(!showComments);
    };

    return (
      <Card className="dark-card hover-lift transition-all duration-300">
        <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5"> {/* Adjusted padding for better spacing */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-slate-50 text-sm">
                {format(new Date(post.created_date), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            {/* Dropdown Menu for Edit/Delete */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 dark-card border-gray-700">
                <DropdownMenuItem
                  onClick={() => onEditPost && onEditPost(post)}
                  className="text-gray-200 focus:bg-gray-800 cursor-pointer">

                  <Edit className="mr-2 h-4 w-4" />
                  Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeletePost && onDeletePost(post.id)}
                  className="text-red-400 focus:bg-red-900/20 cursor-pointer">

                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Moved original stats here as per outline's implicit CardHeader usage */}
          <div className="text-slate-50 mb-3 text-sm flex items-center justify-end gap-4">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {post.likes_count || 0}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {post.comments_count || 0}
            </div>
            <div className="flex items-center gap-1">
              <Repeat className="w-4 h-4" />
              {post.reposts_count || 0}
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-[#000000] p-6"> {/* Adjusted padding */}
          <p className="text-gray-200 leading-relaxed mb-3">
            {post.content.length > 200 ?
            `${post.content.substring(0, 200)}...` :
            post.content
            }
          </p>
          {post.tags && post.tags.length > 0 &&
          <div className="flex flex-wrap gap-1 mb-4"> {/* Added mb-4 for spacing */}
              {post.tags.map((tag, idx) =>
            <Badge key={idx} variant="outline" className="text-xs text-purple-400 border-purple-500/30 bg-black/20">
                  #{tag}
                </Badge>
            )}
            </div>
          }

          {/* Post Actions (from outline) */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors">
                <Heart className="w-4 h-4" />
                <span className="text-sm">{post.likes_count || 0}</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors">
                <Repeat className="w-4 h-4" />
                <span className="text-sm">{post.reposts_count || 0}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleComments} // Updated to use new handler
                className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">

                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">{post.comments_count || 0}</span>
              </Button>
            </div>
          </div>

          {/* Comments Section (from outline) */}
          <AnimatePresence>
            {showComments &&
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-gray-700/30">

                {loadingComments[post.id] ?
              <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                    <span className="ml-2 text-sm text-gray-400">Loading comments...</span>
                  </div> :

              <div className="space-y-3">
                    {commentsData[post.id]?.length > 0 ?
                commentsData[post.id].map((comment) =>
                <div key={comment.id} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg">
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            {comment.author_avatar_url ?
                    <img src={comment.author_avatar_url} alt="Commenter avatar" className="w-full h-full rounded-full object-cover" /> :

                    <span className="text-xs text-white">{comment.author_full_name?.[0] || "U"}</span>
                    }
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white">
                                {comment.author_full_name || "Anonymous"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(comment.created_date), "MMM d, yyyy")}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300">{comment.content}</p>
                          </div>
                        </div>
                ) :

                <p className="text-center text-gray-500 text-sm py-4">No comments yet</p>
                }
                  </div>
              }
              </motion.div>
            }
          </AnimatePresence>
        </CardContent>
      </Card>);

  };

  return (
    <div className="bg-[#000000] space-y-6">
      {/* Activity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">{posts.length}</div>
            <div className="text-sm text-gray-400">Posts</div>
          </CardContent>
        </Card>
        <Card className="dark-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">{comments.length}</div>
            <div className="text-sm text-gray-400">Comments</div>
          </CardContent>
        </Card>
        <Card className="dark-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">{totalLikes}</div>
            <div className="text-sm text-gray-400">Likes Received</div>
          </CardContent>
        </Card>
        <Card className="dark-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">{totalReposts}</div>
            <div className="text-sm text-gray-400">Reposts</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Tabs */}
      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 dark-card p-1.5 rounded-2xl">
          <TabsTrigger value="posts" className="text-slate-50 px-3 py-1.5 text-sm font-medium rounded-xl inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500">
            <FileText className="w-4 h-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="comments" className="text-slate-50 px-3 py-1.5 text-sm font-medium rounded-xl inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500">
            <MessageCircle className="w-4 h-4 mr-2" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="reposts" className="text-slate-50 px-3 py-1.5 text-sm font-medium rounded-xl inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500">
            <Repeat className="w-4 h-4 mr-2" />
            Reposts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="bg-slate-950 mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-4">
          {/* Removed global isLoading check here as posts prop should be available */}
          {posts.length > 0 ?
          <AnimatePresence>
              {posts.map((post, index) =>
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}>
                  <PostHistoryCard post={post} onEditPost={onEditPost} onDeletePost={onDeletePost} />
                </motion.div>
            )}
            </AnimatePresence> :

          <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No posts yet</h3>
              <p className="text-gray-500">Start creating content to see your post history here.</p>
            </div>
          }
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {isLoading ? // This isLoading pertains to the general user comments
          <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4" />
              <p className="text-gray-400">Loading comments...</p>
            </div> :
          comments.length > 0 ?
          <AnimatePresence>
                {comments.map((comment, index) =>
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}>
                    <Card className="dark-card hover-lift transition-all duration-300">
                      <CardContent className="bg-slate-950 p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageCircle className="w-4 h-4 text-blue-400" />
                          <span className="text-slate-50 text-sm">
                            {format(new Date(comment.created_date), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <p className="text-gray-200 leading-relaxed">
                          {comment.content}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
            )}
              </AnimatePresence> :

          <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-500">No comments yet</p>
              </div>
          }
        </TabsContent>

        <TabsContent value="reposts" className="space-y-4">
          <div className="text-center py-12">
            <Repeat className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-500">Repost history coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>);

}