
import React, { useState, useEffect, useCallback } from 'react';
import { Post } from '@/entities/Post';
import { PublicUserDirectory } from '@/entities/PublicUserDirectory'; // Import PublicUserDirectory
import { Loader2 } from 'lucide-react';
import PostCard from '../feed/PostCard';
import CreatePost from '../feed/CreatePost';

export default function CommunityFeed({ community, user, isCreator, isMember, onEditPost }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    if (!community?.id) return;
    setIsLoading(true);
    try {
      const fetchedPosts = await Post.filter(
        { community_id: community.id },
        '-created_date',
        50
      );

      let enrichedPosts = fetchedPosts;
      if (fetchedPosts.length > 0) {
        const authorEmails = [...new Set(fetchedPosts.map((p) => p.created_by).filter(Boolean))];
        if (authorEmails.length > 0) {
          const authorsData = await PublicUserDirectory.filter({ user_email: { $in: authorEmails } });
          const authorsMap = authorsData.reduce((acc, author) => {
            acc[author.user_email] = {
              full_name: author.full_name,
              username: author.username,
              avatar_url: author.avatar_url,
              user_email: author.user_email,
              professional_credentials: author.professional_credentials,
              cross_platform_identity: author.cross_platform_identity,
              custom_badges: author.custom_badges
            };
            return acc;
          }, {});

          enrichedPosts = fetchedPosts.map((post) => ({
            ...post,
            author: authorsMap[post.created_by] || null, // Attach full author object
            // Fallback for older posts that might not have author data stored
            author_full_name: authorsMap[post.created_by]?.full_name || post.author_full_name,
            author_avatar_url: authorsMap[post.created_by]?.avatar_url || post.author_avatar_url
          }));
        }
      }

      // Sort posts so pinned posts appear first, then by creation date
      const sortedPosts = enrichedPosts.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;

        const dateA = new Date(a.created_date);
        const dateB = new Date(b.created_date);
        return dateB.getTime() - dateA.getTime();
      });

      setPosts(sortedPosts);
    } catch (error) {
      console.error("Failed to load community posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [community?.id]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleNewPost = async (postData) => {
    if (!user || !community) return;
    try {
      await Post.create(postData);
      loadPosts(); // Refresh feed after posting
    } catch (error) {
      console.error("Failed to create community post:", error);
    }
  };

  // The onPostUpdate function is not directly used by PostCard anymore for edit actions
  // as onEditPost is passed directly. This function would still be called if something internal
  // to CommunityFeed needed to trigger a refresh after an edit, but the intent seems to be
  // that the parent component handles the edit flow via onEditPost.
  const onPostUpdate = () => {
    loadPosts(); // Refresh posts on edit
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Are you sure you want to permanently delete this echo?")) {
      try {
        await Post.delete(postId);
        loadPosts(); // Refresh the feed to remove the deleted post
      } catch (error) {
        console.error("Failed to delete post:", error);
        // Optionally show an error message to the user
        alert("Failed to delete the post. Please try again.");
      }
    }
  };

  const onCommentAdded = (updatedPost) => {
    setPosts((currentPosts) => currentPosts.map((p) => p.id === updatedPost.id ? updatedPost : p));
  };

  const onReactionChange = (updatedPost) => {
    setPosts((currentPosts) => currentPosts.map((p) => p.id === updatedPost.id ? updatedPost : p));
  };

  return (
    <div className="bg-slate-950 space-y-6">
      {isMember &&
      <CreatePost
        onSubmit={handleNewPost}
        user={user}
        communityId={community.id}
        isCreatorOfCommunity={isCreator} />

      }
      
      {isLoading ?
      <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div> :
      posts.length > 0 ?
      <div className="space-y-6">
          {posts.map((post, index) =>
        <PostCard
          key={post.id}
          post={post}
          user={user}
          author={post.author} // Pass the enriched author object
          onEdit={onEditPost} // Changed from onPostUpdate to onEditPost
          onDelete={handleDeletePost} // Pass the new delete handler
          onCommentAdded={onCommentAdded}
          onReactionChange={onReactionChange}
          showCommunityContext={false} // Don't show "From Community" tag inside the community
          index={index} />

        )}
        </div> :

      <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">This community is quiet so far...</p>
          <p>Be the first to create an echo!</p>
        </div>
      }
    </div>);

}