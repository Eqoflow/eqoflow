import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getSharedPost } from "@/functions/getSharedPost";
import PostCard from "../components/feed/PostCard";
import QuantumFlowLoader from "../components/layout/QuantumFlowLoader";
import { motion } from "framer-motion";

export default function SharedEcho() {
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSharedPost = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('postId');

        if (!postId) {
          setError('No post ID provided');
          setIsLoading(false);
          return;
        }

        const { data } = await getSharedPost({ postId });
        
        if (data && data.post) {
          setPost(data.post);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Error loading shared post:', err);
        setError('Failed to load echo');
      } finally {
        setIsLoading(false);
      }
    };

    loadSharedPost();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <QuantumFlowLoader />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Echo Not Found</h2>
          <p className="text-gray-400 mb-6">This echo may have been deleted or the link is invalid.</p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
            Go to EqoFlow
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Banner for non-logged in users */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/d31ff4d3d_1000044465.png"
                alt="EqoFlow Logo"
                className="h-12 md:h-16 object-contain"
              />
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white">Welcome to EqoFlow</h2>
                <p className="text-sm text-gray-300">Join to explore more content & earn rewards</p>
              </div>
            </div>
            <Button
              onClick={() => window.location.href = 'https://app.eqoflow.app/login?from_url=https://app.eqoflow.app/Feed&app_id=687e8a7d9ad971203c39d072'}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-6 py-2.5 whitespace-nowrap">
              Sign Up / Login
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Post Display */}
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <PostCard
          post={post}
          currentUser={null}
          author={post.author}
          index={0}
          showCommunityContext={false}
        />
        
        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl text-center">
          <h3 className="text-xl font-bold text-white mb-3">Want to see more?</h3>
          <p className="text-gray-300 mb-4">Join EqoFlow to discover amazing content, connect with creators, and earn engagement points.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.location.href = 'https://app.eqoflow.app/login?from_url=https://app.eqoflow.app/Feed&app_id=687e8a7d9ad971203c39d072'}
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-6 py-3">
              Sign Up Free
            </Button>
            <Button
              onClick={() => window.location.href = 'https://eqoflow.app'}
              variant="outline"
              className="border-purple-500/30 text-black bg-white hover:bg-gray-100 px-6 py-3">
              Learn More
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}