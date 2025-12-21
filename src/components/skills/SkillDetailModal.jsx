
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ShoppingCart, DollarSign, Clock, MapPin, User, ExternalLink, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SkillDetailModal({ skill, onClose, onEngage, isOwner, user }) {
  const categoryColors = {
    design: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    development: "bg-green-500/20 text-green-300 border-green-500/30",
    writing: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    marketing: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    consulting: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    education: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    art: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    music: "bg-red-500/20 text-red-300 border-red-500/30",
    fitness: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    cooking: "bg-lime-500/20 text-lime-300 border-lime-500/30",
    other: "bg-gray-500/20 text-gray-300 border-gray-500/30"
  };

  // Get the display name for the seller
  const getSellerDisplayName = () => {
    if (skill.creator_profile?.business_name) {
      return skill.creator_profile.business_name;
    }
    if (skill.creator?.full_name) {
      return skill.creator.full_name;
    }
    if (skill.creator?.username) {
      return skill.creator.username;
    }
    return skill.created_by; // fallback to email
  };

  const sellerDisplayName = getSellerDisplayName();

  // Get username for URL (prefer username over email for privacy)
  const getCreatorUrlParam = () => {
    if (skill.creator?.username) {
      return skill.creator.username;
    }
    return skill.created_by; // fallback to email if no username
  };

  const creatorUrlParam = getCreatorUrlParam();

  const renderMedia = (url) => {
    if (!url) return null;
    const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('video');
    if (isVideo) {
      return (
        <video
          src={url}
          className="w-full h-full object-cover rounded-lg"
          controls
          muted
          autoPlay
          loop />);


    }
    return <img src={url} alt="Skill showcase" className="w-full h-full object-cover rounded-lg" />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-purple-500/20 shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-purple-500/20 p-6 flex items-start justify-between z-10">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{skill.title}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <User className="w-4 h-4" />
              <span>Posted by</span>
              <Link
                to={`${createPageUrl('CreatorProfile')}?creator=${creatorUrlParam}`}
                className="text-purple-400 hover:text-purple-300 hover:underline">

                {sellerDisplayName}
              </Link>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white flex-shrink-0">

            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Media Gallery */}
          {skill.media_urls && skill.media_urls.length > 0 &&
          <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Showcase</h3>
              <div className={`grid gap-4 ${skill.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {skill.media_urls.map((url, index) =>
              <div key={index} className="aspect-video bg-black/20 rounded-lg overflow-hidden">
                    {renderMedia(url)}
                  </div>
              )}
              </div>
            </div>
          }

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Description</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {skill.description}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="dark-card p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Price</p>
                  <p className="text-lg font-bold text-white">
                    {skill.price_type === 'free' ? 'Free' : `$${skill.price_amount} USD`}
                  </p>
                </div>
              </div>
            </div>

            <div className="dark-card p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Estimated Duration</p>
                  <p className="text-lg font-bold text-white">
                    {skill.duration_hours ? `${skill.duration_hours} hours` : 'Flexible'}
                  </p>
                </div>
              </div>
            </div>

            <div className="dark-card p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="text-lg font-bold text-white">
                    {skill.is_remote ? 'Remote' : 'In-Person'}
                  </p>
                </div>
              </div>
            </div>

            <div className="dark-card p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                skill.skill_type === 'offering' ? 'bg-green-500/20' : 'bg-orange-500/20'}`
                }>
                  <ExternalLink className={`w-5 h-5 ${
                  skill.skill_type === 'offering' ? 'text-green-400' : 'text-orange-400'}`
                  } />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Type</p>
                  <p className="text-lg font-bold text-white capitalize">
                    {skill.skill_type}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category and Tags */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Category & Tags</h3>
            <div className="flex flex-wrap gap-2">
              <Badge className={`${categoryColors[skill.category] || categoryColors.other} border`}>
                {skill.category}
              </Badge>
              {skill.tags && skill.tags.map((tag, index) =>
              <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                  {tag}
                </Badge>
              )}
            </div>
          </div>

          {/* Creator Info */}
          {skill.creator &&
          <div className="dark-card p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">About the {skill.skill_type === 'offering' ? 'Seller' : 'Buyer'}</h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
                  {skill.creator.avatar_url ?
                <img
                  src={skill.creator.avatar_url}
                  alt={sellerDisplayName}
                  className="w-full h-full rounded-full object-cover" /> :


                <span className="text-white text-xl font-bold">
                      {sellerDisplayName?.[0]?.toUpperCase()}
                    </span>
                }
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white mb-1">{sellerDisplayName}</p>
                  <p className="text-sm text-gray-400 mb-3">
                    {skill.creator_profile?.business_bio || skill.creator.bio || 'No bio available'}
                  </p>
                  <Link to={`${createPageUrl('CreatorProfile')}?creator=${creatorUrlParam}`}>
                    <Button variant="outline" size="sm" className="border-purple-500/30 text-white hover:bg-purple-500/10">
                      View Profile
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          }
        </div>

        {/* Footer with Action Buttons */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-purple-500/20 p-6 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="text-center sm:text-left">
            <p className="text-2xl font-bold text-green-400">
              {skill.price_type === 'free' ? 'Free' : `$${skill.price_amount}`}
            </p>
            <p className="text-sm text-gray-400">
              {skill.price_type === 'fiat' ? 'USD' : skill.price_type === 'tokens' ? '$EQOFLO Tokens' : ''}
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose} className="bg-background text-slate-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 flex-1 sm:flex-none border-gray-600 hover:bg-gray-800">


              Close
            </Button>
            {!isOwner &&
            <>
                <Button
                variant="outline"
                onClick={() => {
                  // Navigate to Skills Inbox with pre-populated conversation
                  const currentUserEmail = user?.email || 'current_user_email_placeholder';
                  const conversationId = [skill.created_by, currentUserEmail].sort().join('_');
                  const inboxUrl = createPageUrl('SkillsInbox');
                  window.location.href = `${inboxUrl}?start_chat=${skill.created_by}&skill_id=${skill.id}&skill_title=${encodeURIComponent(skill.title)}&conversation_id=${conversationId}`;
                }} className="bg-background text-slate-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 flex-1 sm:flex-none border-blue-500/30 hover:bg-blue-500/10">


                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Seller
                </Button>
                <Button
                onClick={() => {
                  onEngage(skill);
                  onClose();
                }}
                className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">

                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {skill.price_type === 'free' ? 'Start Collaboration' : 'Purchase Service'}
                </Button>
              </>
            }
          </div>
        </div>
      </motion.div>
    </div>);

}