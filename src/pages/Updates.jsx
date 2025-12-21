
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BlogArticle } from "@/entities/BlogArticle";
import { User } from "@/entities/User"; // Assuming User entity is imported from here
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Eye, Heart, MessageCircle, Search, Tag, User as UserIcon, Megaphone } from "lucide-react"; // Renamed Lucide User to UserIcon to avoid conflict
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function UpdatesPage() {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [allTags, setAllTags] = useState([]);
  const [user, setUser] = useState(null); // Added user state
  const [isUserLoading, setIsUserLoading] = useState(true); // Add loading state for user check

  useEffect(() => {
    loadArticles();
    loadUser(); // Call loadUser when component mounts
  }, []);

  useEffect(() => {
    // Filter articles directly in useEffect to avoid dependency issues
    let filtered = articles;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter((article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter((article) =>
      article.tags && article.tags.includes(selectedTag)
      );
    }

    setFilteredArticles(filtered);
  }, [articles, searchTerm, selectedTag]);

  const loadUser = async () => {
    setIsUserLoading(true); // Start loading user
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      // User is not logged in or API call failed
      console.warn("User not logged in or failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsUserLoading(false); // End user loading regardless of success or failure
    }
  };

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      // Only fetch published articles for public viewing
      const fetchedArticles = await BlogArticle.filter({ is_published: true }, "-publish_date");
      setArticles(fetchedArticles);

      // Extract all unique tags
      const tags = [...new Set(fetchedArticles.flatMap((article) => article.tags || []))];
      setAllTags(tags);
    } catch (error) {
      console.error("Failed to load blog articles:", error);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSkeleton = () =>
  <div className="grid gap-6 md:gap-8">
      {[...Array(6)].map((_, index) =>
    <Card key={index} className="dark-card animate-pulse">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gray-700 rounded-lg flex-shrink-0"></div>
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-700 rounded w-16"></div>
                  <div className="h-6 bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-700 rounded w-4/6"></div>
            </div>
          </CardContent>
        </Card>
    )}
    </div>;


  return (
    <div className="min-h-screen bg-black p-4 md:p-6 pt-8 md:pt-12">
      <div className="max-w-4xl mx-auto">
        {/* Top Banner for Non-Logged Users */}
        {!isUserLoading && !user &&
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-xl">

            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Welcome to EqoFlow Updates
              </h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Stay informed with the latest developments, feature releases, and insights from the EqoFlow ecosystem. Join our community to be part of the future of decentralized social media.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 px-8 py-3 text-lg font-semibold">

                  Join EqoFlow Today
                </Button>
                <Button
                variant="outline"
                onClick={() => window.location.href = createPageUrl("Discovery")}
                className="border-purple-500/30 text-white hover:bg-purple-500/10 px-8 py-3 text-lg font-semibold">

                  Explore Platform
                </Button>
              </div>
            </div>
          </motion.div>
        }

        {/* Header */}
        <div className="text-center mb-12 mt-4 md:mt-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
            EqoUpdates
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mt-4">
            Stay informed with the latest developments, features, and insights from the EqoFlow team.
          </motion.p>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col md:flex-row gap-4 mb-8">

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black/20 border-purple-500/20 text-white placeholder:text-gray-400" />

          </div>

          {allTags.length > 0 &&
          <div className="flex flex-wrap gap-2">
              <Button
              variant={selectedTag === "" ? "default" : "outline"}
              onClick={() => setSelectedTag("")}
              className="text-sm">

                All Topics
              </Button>
              {allTags.slice(0, 5).map((tag) =>
            <Button
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)} className="bg-background text-slate-950 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10">


                  {tag}
                </Button>
            )}
            </div>
          }
        </motion.div>

        {/* Articles Grid */}
        <AnimatePresence mode="wait">
          {isLoading ?
          renderSkeleton() :
          filteredArticles.length > 0 ?
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 md:space-y-8">

              {filteredArticles.map((article, index) =>
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}>

                  <Card className="dark-card hover-lift transition-all duration-300 group">
                    <Link to={`${createPageUrl("ArticleDetail")}?slug=${article.slug}`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start gap-4 md:gap-6">
                          {article.featured_image_url &&
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                          src={article.featured_image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />

                            </div>
                      }
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-white group-hover:text-purple-400 transition-colors text-lg md:text-xl mb-3 line-clamp-2">
                              {article.title}
                            </CardTitle>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                              <div className="flex items-center gap-1">
                                <UserIcon className="w-4 h-4" />
                                <span>{article.author_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{format(new Date(article.publish_date), "MMM d, yyyy")}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{article.view_count || 0} views</span>
                              </div>
                            </div>

                            {article.tags && article.tags.length > 0 &&
                        <div className="flex flex-wrap gap-1 mb-3">
                                {article.tags.slice(0, 3).map((tag) =>
                          <Badge key={tag} variant="outline" className="text-xs bg-purple-600/10 border-purple-500/30 text-purple-400">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                  </Badge>
                          )}
                                {article.tags.length > 3 &&
                          <Badge variant="outline" className="text-xs bg-gray-600/10 border-gray-500/30 text-gray-400">
                                    +{article.tags.length - 3} more
                                  </Badge>
                          }
                              </div>
                        }
                          </div>
                        </div>
                      </CardHeader>

                      {article.excerpt &&
                  <CardContent className="pt-0">
                          <p className="text-gray-300 leading-relaxed line-clamp-3">
                            {article.excerpt}
                          </p>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700/50">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                <span>{article.likes_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{article.comments_count || 0}</span>
                              </div>
                            </div>

                            <Button
                        variant="ghost"
                        className="text-purple-400 hover:text-purple-300 p-0 h-auto font-semibold">

                              Read More →
                            </Button>
                          </div>
                        </CardContent>
                  }
                    </Link>
                  </Card>
                </motion.div>
            )}
            </motion.div> :

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12">

              <Megaphone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {searchTerm || selectedTag ? "No articles found" : "No updates yet"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedTag ?
              "Try adjusting your search or filter criteria." :
              "Check back soon for the latest EqoFlow updates and insights."
              }
              </p>
              {(searchTerm || selectedTag) &&
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedTag("");
              }}
              variant="outline"
              className="border-purple-500/30 text-white hover:bg-purple-500/10">

                  Clear Filters
                </Button>
            }
            </motion.div>
          }
        </AnimatePresence>
      </div>
    </div>);

}
