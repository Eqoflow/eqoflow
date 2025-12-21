
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Post } from "@/entities/Post";
import { User } from "@/entities/User";
import PostCard from "../components/feed/PostCard";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hash, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function TagPage() {
  const [posts, setPosts] = useState([]);
  const [tag, setTag] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tagName = urlParams.get("tag");
    if (tagName) {
      setTag(tagName);
      loadData(tagName);
    } else {
      setIsLoading(false);
    }
  }, [window.location.search]);

  const loadData = async (tagName) => {
    setIsLoading(true);
    try {
      const [currentUserData, allPosts] = await Promise.all([
        User.me().catch(() => null),
        Post.list("-created_date", 200) // Fetch a broad list of recent posts
      ]);
      
      setCurrentUser(currentUserData);

      // Filter posts client-side for the specific tag
      const taggedPosts = allPosts.filter(post => 
        post.tags?.map(t => t.toLowerCase()).includes(tagName.toLowerCase())
      );
      
      setPosts(taggedPosts);
    } catch (error) {
      console.error("Error loading tagged posts:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLike = async (post) => {
    if (!currentUser) return;
    const isLiked = post.liked_by?.includes(currentUser.email);
    const updatedLikesCount = isLiked ? (post.likes_count || 0) - 1 : (post.likes_count || 0) + 1;
    const updatedLikedBy = isLiked 
      ? post.liked_by.filter(email => email !== currentUser.email)
      : [...(post.liked_by || []), currentUser.email];
      
    setPosts(posts.map(p => p.id === post.id ? { ...p, likes_count: updatedLikesCount, liked_by: updatedLikedBy } : p));
    await Post.update(post.id, { likes_count: updatedLikesCount, liked_by: updatedLikedBy });
  };

  const handleRepost = async (post) => {
    if (!currentUser) return;
    const repostData = {
      content: post.content,
      media_urls: post.media_urls || [],
      tags: post.tags || [],
      is_repost: true,
      original_post_id: post.id,
      original_author: post.created_by,
    };
    await Post.create(repostData); // Fixed typo here: repostData instead of repostaData
    loadData(tag); // Reload to show repost and updated counts
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to={createPageUrl("Feed")}>
            <Button variant="ghost" className="mb-4 text-white hover:text-purple-400 hover:bg-purple-500/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Hash className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--neon-primary), var(--neon-secondary))' }}>
              {tag}
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center pt-20">
            <div className="flex items-center gap-3 text-white">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              <span className="text-lg">Fetching posts...</span>
            </div>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-6">
            <AnimatePresence>
              {posts.map((post, index) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  user={currentUser}
                  onLike={handleLike}
                  onRepost={handleRepost}
                  onCommentAdded={() => loadData(tag)}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="dark-card rounded-2xl p-12 text-center neon-glow">
            <h3 className="text-xl font-semibold text-white mb-2">No posts found for #{tag}</h3>
            <p className="text-gray-500">Why not be the first to post about it?</p>
          </div>
        )}
      </div>
    </div>
  );
}
