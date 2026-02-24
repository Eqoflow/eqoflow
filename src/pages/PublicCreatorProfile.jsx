import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUser } from "@/components/contexts/UserContext";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, DollarSign, UserPlus, UserCheck, Sparkles, Heart, MessageSquare, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function PublicCreatorProfile() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const creatorEmail = searchParams.get('creator');

  const [creatorProfile, setCreatorProfile] = useState(null);
  const [creatorContent, setCreatorContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [contentFilter, setContentFilter] = useState("all");

  const userColorScheme = {
    primary: user?.color_scheme ? getColorScheme(user.color_scheme).primary : '#8b5cf6',
    secondary: user?.color_scheme ? getColorScheme(user.color_scheme).secondary : '#ec4899',
    accent: user?.color_scheme ? getColorScheme(user.color_scheme).accent : '#2d1b69'
  };

  useEffect(() => {
    if (creatorEmail) {
      loadCreatorData();
    }
  }, [creatorEmail]);

  const loadCreatorData = async () => {
    if (!creatorEmail) return;

    setIsLoading(true);
    try {
      // Load creator profile
      const profiles = await base44.entities.CreatorProfile.filter({ created_by: creatorEmail });
      if (profiles.length > 0) {
        setCreatorProfile(profiles[0]);
        setSubscriberCount(profiles[0].subscriber_count || 0);
      }

      // Load creator's published content
      const content = await base44.entities.Post.filter({
        created_by: creatorEmail,
        is_creator_hub_published: true,
        blockchain_tx_id: { $ne: null }
      }, '-created_date', 50);
      setCreatorContent(content);

      // Check if current user is subscribed (placeholder - implement subscription logic)
      // const subscriptions = await base44.entities.Subscription.filter({ ... });
      // setIsSubscribed(subscriptions.length > 0);
    } catch (error) {
      console.error("Error loading creator data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!creatorProfile || !user) return;

    try {
      const newSubscribedState = !isSubscribed;
      setIsSubscribed(newSubscribedState);

      // Update subscriber count
      const newCount = newSubscribedState ? subscriberCount + 1 : subscriberCount - 1;
      setSubscriberCount(newCount);

      // Update the creator profile subscriber count
      await base44.entities.CreatorProfile.update(creatorProfile.id, {
        subscriber_count: newCount
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      // Revert on error
      setIsSubscribed(!isSubscribed);
      setSubscriberCount(newSubscribedState ? subscriberCount - 1 : subscriberCount + 1);
    }
  };

  const handleTip = async () => {
    if (!tipAmount || parseFloat(tipAmount) <= 0) {
      alert("Please enter a valid tip amount");
      return;
    }

    // Implement tipping logic
    alert(`Tip of $${tipAmount} sent! (Integration pending)`);
    setShowTipModal(false);
    setTipAmount("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/942c1cf5d_EqoFlowLogoDesign-14.png"
            alt="Loading"
            className="w-24 h-24 object-contain" />

        </div>
      </div>);

  }

  if (!creatorProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-white/70 text-lg mb-4">Creator profile not found</p>
        <Button onClick={() => navigate(createPageUrl("CreatorHub") + "?view=user")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Creator Hub
        </Button>
      </div>);

  }

  const filteredContent = creatorContent.filter((item) => {
    if (contentFilter === "all") return true;
    if (contentFilter === "video") {
      return item.media_urls && item.media_urls.length > 0 && item.media_urls[0].match(/\.(mp4|webm|mov)$/i);
    }
    if (contentFilter === "image") {
      return item.media_urls && item.media_urls.length > 0 && item.media_urls[0].match(/\.(jpg|jpeg|png|gif|webp)$/i);
    }
    return true;
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Back Button */}
      <Button
        onClick={() => navigate(createPageUrl("CreatorHub") + "?view=user")}
        variant="ghost"
        className="mb-6 text-white/60 hover:text-white hover:bg-white/5">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Creator Header & Social Channels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Creator Header - Takes 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-2xl p-6 bg-gradient-to-br from-gray-900/80 to-black/60 border border-white/10">
          
          <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-cyan-500/20 rounded-2xl p-2 border-2 border-cyan-500/50 flex-shrink-0">
                {creatorProfile.logo_url ?
                <img src={creatorProfile.logo_url} alt="Creator Logo" className="w-full h-full object-contain" /> :

                <Sparkles className="w-full h-full text-cyan-400" />
                }
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-1">
                  {creatorProfile.channel_name}
                </h1>
                <div className="flex items-center gap-3 text-sm text-white/60 mb-2">
                  <span>{creatorContent.length} Published Content</span>
                  <span>•</span>
                  <span>{subscriberCount} Subscriber{subscriberCount !== 1 ? 's' : ''}</span>
                </div>
                {creatorProfile.description &&
                <p className="text-white/70 text-sm mt-2 line-clamp-2">
                    {creatorProfile.description}
                  </p>
                }
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleSubscribe}
              className={`${isSubscribed ? 'bg-white/10 text-white' : 'bg-cyan-500 hover:bg-cyan-600 text-black'} font-medium`}>
              {isSubscribed ?
              <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Subscribed
                </> :

              <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Subscribe
                </>
              }
            </Button>
            <Button
              onClick={() => setShowTipModal(true)}
              variant="outline" className="bg-background text-slate-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-9 border-white/20 hover:bg-white/10">

              <DollarSign className="w-4 h-4 mr-2" />
              Tip Creator
            </Button>
          </div>
        </motion.div>

        {/* Social Channels - Takes 1 column */}
        {creatorProfile.social_links && creatorProfile.social_links.length > 0 &&
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 bg-gradient-to-br from-gray-900/80 to-black/60 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-white font-semibold">Social channels</h3>
            </div>
            <div className="space-y-2">
              {creatorProfile.social_links.map((link, index) =>
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg border border-white/10 text-white text-sm transition-all duration-200 capitalize">
                  {link.platform}
                </a>
            )}
            </div>
          </motion.div>
        }
      </div>

      {/* Published Content Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">Published content</h2>
        
        {/* Content Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setContentFilter("all")}
            variant={contentFilter === "all" ? "default" : "ghost"}
            className={`${contentFilter === "all" ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
            All Video
          </Button>
          <Button
            onClick={() => setContentFilter("image")}
            variant={contentFilter === "image" ? "default" : "ghost"}
            className={`${contentFilter === "image" ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
            Image
          </Button>
          <Button
            onClick={() => setContentFilter("video")}
            variant={contentFilter === "video" ? "default" : "ghost"}
            className={`${contentFilter === "video" ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
            Thread
          </Button>
        </div>

        {/* Content Grid */}
        {filteredContent.length === 0 ?
        <p className="text-white/60 text-center py-8">
            No content published yet
          </p> :

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredContent.map((item) =>
          <ContentCard
            key={item.id}
            item={item}
            user={user}
            userColorScheme={userColorScheme}
            onUpdate={loadCreatorData} />

          )}
          </div>
        }
      </div>

      {/* Tip Modal */}
      <Dialog open={showTipModal} onOpenChange={setShowTipModal}>
        <DialogContent className="bg-black/95 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" style={{ color: userColorScheme.primary }} />
              Tip {creatorProfile.channel_name}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Support this creator with a tip
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-white text-sm mb-2 block">Amount (USD)</label>
              <Input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="5.00"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                min="0.01"
                step="0.01" />

            </div>

            <div className="flex gap-2">
              {[5, 10, 20, 50].map((amount) =>
              <Button
                key={amount}
                onClick={() => setTipAmount(amount.toString())}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10">
                  ${amount}
                </Button>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowTipModal(false)}
                className="border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button
                onClick={handleTip}
                style={{ background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})` }}>
                Send Tip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}

function ContentCard({ item, user, userColorScheme, onUpdate }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(item.comments_count || 0);
  const [viewsCount, setViewsCount] = useState(item.impressions_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRecordedView, setHasRecordedView] = useState(false);

  useEffect(() => {
    if (user && item.liked_by) {
      setIsLiked(item.liked_by.includes(user.email));
    }
    setLikesCount(item.likes_count || 0);
    setCommentsCount(item.comments_count || 0);
    setViewsCount(item.impressions_count || 0);
  }, [item, user]);

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const recordView = async () => {
    if (hasRecordedView) return;

    try {
      setHasRecordedView(true);
      const currentViews = item.impressions_count || 0;
      const newViewsCount = currentViews + 1;
      await base44.entities.Post.update(item.id, {
        impressions_count: newViewsCount
      });
      setViewsCount(newViewsCount);
    } catch (error) {
      console.error("Error recording view:", error);
    }
  };

  const loadComments = async () => {
    try {
      const postComments = await base44.entities.Comment.filter({ post_id: item.id }, '-created_date', 50);
      setComments(postComments);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const currentLikedBy = item.liked_by || [];
      const newIsLiked = !isLiked;

      let updatedLikedBy;
      let newLikesCount;

      if (newIsLiked) {
        updatedLikedBy = [...currentLikedBy, user.email];
        newLikesCount = likesCount + 1;
      } else {
        updatedLikedBy = currentLikedBy.filter((email) => email !== user.email);
        newLikesCount = Math.max(0, likesCount - 1);
      }

      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);

      await base44.entities.Post.update(item.id, {
        liked_by: updatedLikedBy,
        likes_count: newLikesCount
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error liking post:", error);
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount + 1 : likesCount - 1);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await base44.entities.Comment.create({
        post_id: item.id,
        content: newComment.trim(),
        author_full_name: user.full_name,
        author_avatar_url: user.avatar_url,
        author_username: user.username
      });

      const newCommentsCount = commentsCount + 1;
      setCommentsCount(newCommentsCount);

      await base44.entities.Post.update(item.id, {
        comments_count: newCommentsCount
      });

      setNewComment("");
      await loadComments();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVideo = item.media_urls && item.media_urls.length > 0 && item.media_urls[0].match(/\.(mp4|webm|mov)$/i);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-gray-900/80 to-black/60 rounded-xl border border-white/10 overflow-hidden group hover:border-cyan-500/50 transition-all">
      
      {item.media_urls && item.media_urls.length > 0 &&
      <div className="aspect-video bg-black/60 relative overflow-hidden">
          {item.media_urls[0].match(/\.(jpg|jpeg|png|gif|webp)$/i) ?
        <img
          src={item.media_urls[0]}
          alt={item.author_full_name}
          className="w-full h-full object-cover cursor-pointer"
          onClick={recordView} /> :

        isVideo ?
        <>
              <video
            src={item.media_urls[0]}
            className="w-full h-full object-cover"
            controls
            onPlay={recordView} />

              {!hasRecordedView &&
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1" />
                  </div>
                </div>
          }
            </> :

        <div className="w-full h-full flex items-center justify-center">
              <Shield className="w-12 h-12 text-white/30" />
            </div>
        }
          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-white/80">
            On-chain
          </div>
        </div>
      }
      
      <div className="p-4">
        <h3 className="text-white font-semibold mb-1 line-clamp-1">{item.content || "Untitled"}</h3>
        <p className="text-white/50 text-xs mb-3 line-clamp-2">{item.author_full_name}</p>
        
        <div className="text-xs text-white/40">
          {new Date(item.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </motion.div>);

}

function getColorScheme(schemeName) {
  const colorSchemes = {
    purple: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#2d1b69' },
    blue: { primary: '#3b82f6', secondary: '#06b6d4', accent: '#1e3a8a' },
    green: { primary: '#10b981', secondary: '#059669', accent: '#064e3b' },
    orange: { primary: '#f97316', secondary: '#eab308', accent: '#92400e' },
    red: { primary: '#ef4444', secondary: '#ec4899', accent: '#991b1b' },
    pink: { primary: '#ec4899', secondary: '#f472b6', accent: '#be185d' },
    cyan: { primary: '#06b6d4', secondary: '#3b82f6', accent: '#0e7490' },
    yellow: { primary: '#eab308', secondary: '#f97316', accent: '#a16207' },
    indigo: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#4338ca' },
    emerald: { primary: '#10b981', secondary: '#059646', accent: '#065f46' }
  };
  return colorSchemes[schemeName] || colorSchemes.purple;
}