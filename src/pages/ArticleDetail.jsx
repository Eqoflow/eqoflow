
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BlogArticle } from "@/entities/BlogArticle";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Eye, 
  Heart, 
  MessageCircle, 
  Tag, 
  User as UserIcon, 
  ArrowLeft,
  Share2,
  BookOpen,
  Sparkles,
  FileText,
  Rss // Added Rss icon for share to feed
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import CreatePostModal from "../components/feed/CreatePostModal"; // Import CreatePostModal
import { Post } from "@/entities/Post"; // Import Post entity

export default function ArticleDetailPage() {
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showShareToFeedModal, setShowShareToFeedModal] = useState(false); // New state for share modal

  useEffect(() => {
    loadArticle();
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      // User not logged in - that's okay for public articles
      setUser(null);
    }
  };

  const loadArticle = async () => {
    try {
      setIsLoading(true);
      const urlParams = new URLSearchParams(window.location.search);
      const slug = urlParams.get('slug');
      
      if (!slug) {
        setError('Article not found');
        return;
      }

      const articles = await BlogArticle.filter({ 
        slug: slug, 
        is_published: true 
      });

      if (articles.length === 0) {
        setError('Article not found');
        return;
      }

      const foundArticle = articles[0];
      setArticle(foundArticle);

      // Increment view count
      try {
        await BlogArticle.update(foundArticle.id, {
          view_count: (foundArticle.view_count || 0) + 1
        });
      } catch (viewError) {
        console.warn('Could not update view count:', viewError);
      }

    } catch (error) {
      console.error("Failed to load article:", error);
      setError('Failed to load article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: article.title,
      text: article.excerpt || `Read "${article.title}" on EqoFlow Updates`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // You could add a toast notification here
        alert('Article link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // New function to handle sharing to EqoFlow feed
  const handleShareToFeed = async (postData) => {
    try {
      // Add article reference to the post data
      const sharePostData = {
        ...postData,
        shared_article_id: article.id
      };
      
      await Post.create(sharePostData);
      setShowShareToFeedModal(false);
      // Could show a success message here if desired, e.g., using a toast
      alert("Article shared to your EqoFlow feed!");
    } catch (error) {
      console.error("Error sharing article to feed:", error);
      alert("Failed to share article to feed. Please try again.");
    }
  };

  // New function to pre-fill content for the share modal
  const getPrefilledContent = () => {
    if (!article) return "";
    const articleUrl = window.location.href;
    return `Check out this article: "${article.title}"\n\n${articleUrl}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            {/* Back button skeleton */}
            <div className="mb-8">
              <div className="h-10 bg-gray-700 rounded w-32"></div>
            </div>
            
            {/* Header skeleton */}
            <div className="mb-8 space-y-4">
              <div className="h-8 bg-gray-700 rounded w-3/4"></div>
              <div className="flex gap-4 flex-wrap">
                <div className="h-4 bg-gray-700 rounded w-24"></div>
                <div className="h-4 bg-gray-700 rounded w-24"></div>
                <div className="h-4 bg-gray-700 rounded w-24"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-700 rounded w-16"></div>
                <div className="h-6 bg-gray-700 rounded w-16"></div>
              </div>
            </div>

            {/* Featured image skeleton */}
            <div className="h-64 bg-gray-700 rounded-lg mb-8"></div>

            {/* Content skeleton */}
            <Card className="dark-card">
              <CardContent className="p-6 md:p-8">
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-700 rounded w-full"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-black p-4 md:p-6">
        <div className="max-w-4xl mx-auto text-center py-16">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-400 mb-4">Article Not Found</h2>
          <p className="text-gray-500 mb-8">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link to={createPageUrl("Updates")}>
            <Button variant="outline" className="border-purple-500/30 text-white hover:bg-purple-500/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Updates
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Back Button */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl("Updates")}>
            <Button 
              variant="outline" 
              className="border-purple-500/30 text-white hover:bg-purple-500/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Updates
            </Button>
          </Link>
        </motion.div>

        {/* Article Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            {article.title}
          </h1>
          
          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-6">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>{article.author_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(article.publish_date), "MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{article.view_count || 0} views</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>{article.likes_count || 0} likes</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>{article.comments_count || 0} comments</span>
            </div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="bg-purple-600/10 border-purple-500/30 text-purple-400">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Share Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleShare}
              variant="outline"
              className="border-purple-500/30 text-white hover:bg-purple-500/10"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            
            {user && ( // Only show "Share to EqoFlow" button if user is logged in
              <Button
                onClick={() => setShowShareToFeedModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
              >
                <Rss className="w-4 h-4 mr-2" />
                Share to EqoFlow
              </Button>
            )}
          </div>
        </motion.div>

        {/* Featured Image */}
        {article.featured_image_url && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <img 
                src={article.featured_image_url} 
                alt={article.title}
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>
        )}

        {/* Article Content or PDF Download */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="dark-card mb-8">
            <CardContent className="p-6 md:p-8">
              {article.content_type === 'pdf' ? (
                // PDF Download Section
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                      <FileText className="w-10 h-10 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">PDF Document</h3>
                      <p className="text-gray-400 mb-6">This content is available as a downloadable PDF document.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        asChild 
                        className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 px-8 py-3"
                      >
                        <a 
                          href={article.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          download
                        >
                          <FileText className="w-5 h-5 mr-2" />
                          Download PDF
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Regular Article Content
                <div 
                  className="prose prose-lg prose-invert max-w-none text-gray-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Comments Section Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="dark-card">
            <CardContent className="p-6 md:p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Comments Coming Soon</h3>
              <p className="text-gray-500 mb-4">
                Join the conversation! Comments and engagement features will be available in the next update.
              </p>
              {!user && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Sign up to be the first to comment when this feature launches.</p>
                  <Button 
                    onClick={() => window.location.href = '/'}
                    className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                  >
                    Join EqoFlow
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Call to Action for Non-logged Users */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center p-8 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-xl"
          >
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">
              Enjoyed this article?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join EqoFlow to engage with our content, earn rewards for your participation, and be part of the decentralized social revolution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 px-8 py-3 text-lg font-semibold"
              >
                Sign Up Free
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = createPageUrl("Discovery")}
                className="border-purple-500/30 text-white hover:bg-purple-500/10 px-8 py-3 text-lg font-semibold"
              >
                Explore More
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Share to EqoFlow Modal */}
      {showShareToFeedModal && article && user && ( // Ensure article and user exist before rendering
        <CreatePostModal
          isOpen={showShareToFeedModal}
          onClose={() => setShowShareToFeedModal(false)}
          onSubmit={handleShareToFeed}
          user={user}
          initialContent={getPrefilledContent()}
          articleTitle={article.title} // Pass article title for potential use in modal
        />
      )}
    </div>
  );
}
