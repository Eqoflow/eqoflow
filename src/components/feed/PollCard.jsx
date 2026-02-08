import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Clock, Check, BarChart3, MoreVertical, Trash2, Flag, Pin, PinOff, Users, Globe, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EqoPlusProBadge from '../identity/EqoPlusProBadge';
import EqoPlusCreatorBadge from '../identity/EqoPlusCreatorBadge';
import EqoPlusLiteBadge from '../identity/EqoPlusLiteBadge';
import CreatorBadge from '../identity/CreatorBadge';
import CoCEOBadge from '../identity/CoCEOBadge';
import CMOBadge from '../identity/CMOBadge';
import CoFounderBadge from '../identity/CoFounderBadge';
import CFOBadge from '../identity/CFOBadge';
import PioneerBadge from '../identity/PioneerBadge';
import ProfessionalBadge from '../identity/ProfessionalBadge';
import NFTBadge from './NFTBadge';
import CrossPlatformBadges from '../identity/CrossPlatformBadges';
import { filterProfanity } from '@/components/utils/profanityFilter';

const isPngImage = (url) => {
  if (!url) return false;
  return url.toLowerCase().includes('.png') || url.toLowerCase().includes('image/png');
};

const getAvatarBackgroundStyle = (avatarUrl) => {
  if (isPngImage(avatarUrl)) {
    return { background: 'linear-gradient(to right, #000000, #1a1a1a)' };
  }
  return { background: 'linear-gradient(to right, #8b5cf6, #ec4899)' };
};

export default function PollCard({ poll, user, onPollUpdate, onEdit, onDelete, onFlag, onTogglePin, index, showCommunityContext = true }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [localPoll, setLocalPoll] = useState(poll);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Debug logging
  useEffect(() => {
    console.log('PollCard received poll data:', poll);
  }, [poll]);

  useEffect(() => {
    setLocalPoll(poll);
  }, [poll]);

  // Get author data
  const getAuthorData = () => {
    if (localPoll.author) return localPoll.author;
    return {
      full_name: localPoll.author_full_name,
      username: localPoll.author_username,
      avatar_url: localPoll.author_avatar_url,
      user_email: localPoll.created_by,
      email: localPoll.created_by,
      professional_credentials: localPoll.author_professional_credentials,
      cross_platform_identity: localPoll.author_cross_platform_identity,
      custom_badges: localPoll.author_custom_badges,
      subscription_tier: localPoll.author?.subscription_tier || 'free'
    };
  };

  const currentAuthor = getAuthorData();
  const authorEmail = currentAuthor?.user_email || currentAuthor?.email || localPoll.created_by;

  // Calculate total followers
  const calculateTotalFollowers = (identity) => {
    if (!identity) return 0;
    const web2Followers = identity.web2_verifications?.reduce((sum, conn) => sum + (conn.follower_count || 0), 0) || 0;
    const web3Followers = identity.web3_connections?.reduce((sum, conn) => sum + (conn.follower_count || 0), 0) || 0;
    return web2Followers + web3Followers;
  };

  const totalFollowers = calculateTotalFollowers(currentAuthor?.cross_platform_identity);

  // Get privacy icon
  const getPrivacyIcon = () => {
    switch (localPoll.privacy_level) {
      case "public": return <Globe className="w-3 h-3" />;
      case "friends": return <Users className="w-3 h-3" />;
      case "private": return <Lock className="w-3 h-3" />;
      default: return <Globe className="w-3 h-3" />;
    }
  };

  // Calculate time remaining
  useEffect(() => {
    if (!localPoll?.end_date) {
      setTimeRemaining('No end date');
      return;
    }

    const updateTimeRemaining = () => {
      const now = new Date();
      const endDate = new Date(localPoll.end_date);
      
      if (now > endDate) {
        setTimeRemaining('Poll ended');
        return;
      }

      const distance = formatDistanceToNow(endDate, { addSuffix: true });
      setTimeRemaining(`Ends ${distance}`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [localPoll?.end_date]);

  const isPollOpen = () => {
    if (!localPoll?.end_date) return false;
    const now = new Date();
    const endDate = new Date(localPoll.end_date);
    return now <= endDate;
  };

  const hasUserVoted = () => {
    return localPoll?.voters && user?.email && localPoll.voters.includes(user.email);
  };

  const handleVote = async (optionIndex) => {
    if (!user) {
      setErrorMessage('Please log in to vote');
      return;
    }

    if (hasUserVoted()) {
      setErrorMessage('You have already voted in this poll');
      return;
    }

    if (!isPollOpen()) {
      setErrorMessage('This poll has ended');
      return;
    }

    setIsVoting(true);
    setErrorMessage(null);

    try {
      const response = await base44.functions.invoke('castVote', {
        pollId: localPoll.id,
        optionIndex
      });

      if (response.data.success) {
        const updatedPoll = {
          ...localPoll,
          votes: response.data.votes,
          total_votes: response.data.totalVotes,
          voters: [...(localPoll.voters || []), user.email]
        };
        
        setLocalPoll(updatedPoll);
        if (onPollUpdate) onPollUpdate(updatedPoll);
        setSelectedOption(optionIndex);
      }
    } catch (error) {
      console.error('Vote error:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to cast vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    try {
      // Assuming onDelete is an async function that handles API call and state update in parent
      if (onDelete) {
        await onDelete(localPoll.id);
      }
    } catch (error) {
      console.error('Error deleting poll:', error);
      setErrorMessage('Failed to delete poll. Please try again.');
    }
  };

  const handleFlag = () => {
    if (onFlag) {
      const reason = prompt('Please provide a reason for flagging this poll:');
      if (reason === null) { // User clicked cancel
        return;
      }
      if (reason.trim() === '') { // User clicked OK but provided empty reason
        alert('Reason for flagging cannot be empty.');
        return;
      }
      onFlag(localPoll.id, reason.trim()); // Pass pollId and trimmed reason
    }
  };

  const handleTogglePin = async () => {
    console.log('[PollCard] handleTogglePin called with localPoll:', localPoll);
    console.log('[PollCard] localPoll.id:', localPoll?.id);
    
    if (onTogglePin) {
      await onTogglePin(localPoll);
    }
  };

  const getVotePercentage = (optionIndex) => {
    if (!localPoll?.total_votes || localPoll.total_votes === 0) return 0;
    const votes = localPoll.votes?.[optionIndex.toString()]?.length || 0;
    return Math.round((votes / localPoll.total_votes) * 100);
  };

  const getVoteCount = (optionIndex) => {
    return localPoll?.votes?.[optionIndex.toString()]?.length || 0;
  };

  const showResults = hasUserVoted() || !isPollOpen();

  const AuthorProfileLink = ({ children }) => {
    const params = new URLSearchParams();
    const usernameToUse = localPoll.author_username;

    if (usernameToUse && usernameToUse.trim() !== '') {
      params.set('username', usernameToUse);
      const profileUrl = `${createPageUrl("PublicProfile")}?${params.toString()}`;

      return (
        <Link
          to={profileUrl}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          {children}
        </Link>
      );
    }

    return <div className="flex items-center gap-3">{children}</div>;
  };

  // Safety check - if no question or options, return null
  if (!localPoll || !localPoll.question || !localPoll.options || localPoll.options.length === 0) {
    console.error('PollCard: Invalid poll data', localPoll);
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      <Card className="dark-card hover-lift transition-all duration-300">
        {localPoll.is_pinned && (
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/30 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-purple-400">
              <Pin className="w-3 h-3" />
              <span>Pinned Poll</span>
            </div>
          </div>
        )}

        <CardContent className="bg-slate-950 p-4 md:p-6">
          {errorMessage && (
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Author Info */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <AuthorProfileLink>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={getAvatarBackgroundStyle(localPoll.author_avatar_url)}
              >
                {localPoll.author_avatar_url ? (
                  <img src={localPoll.author_avatar_url} alt="Author Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white hover:text-purple-400 transition-colors">
                    {localPoll.author_full_name || 'Anonymous'}
                  </span>
                  {totalFollowers > 0 && (
                    <div className="flex items-center gap-1 text-green-400 text-xs font-medium" title={`${totalFollowers.toLocaleString()} followers across all platforms`}>
                      <Users className="w-3 h-3" />
                      <span>{totalFollowers.toLocaleString()}</span>
                    </div>
                  )}
                  <EqoPlusProBadge user={currentAuthor} />
                  <EqoPlusCreatorBadge user={currentAuthor} />
                  <EqoPlusLiteBadge user={currentAuthor} />
                  <CreatorBadge userEmail={authorEmail} />
                  <CoCEOBadge userEmail={authorEmail} />
                  <CMOBadge userEmail={authorEmail} />
                  <CoFounderBadge userEmail={authorEmail} />
                  <CFOBadge userEmail={authorEmail} />
                  <PioneerBadge userEmail={authorEmail} />
                  <ProfessionalBadge user={{ professional_credentials: currentAuthor?.professional_credentials }} />
                  <NFTBadge user={user} />
                  <CrossPlatformBadges cross_platform_identity={currentAuthor?.cross_platform_identity} userEmail={authorEmail} />
                  <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-xs">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Poll
                  </Badge>
                  <Badge variant="secondary" className="bg-black/30 text-gray-400 text-xs border border-purple-500/20">
                    {getPrivacyIcon()}
                    <span className="ml-1">{localPoll.privacy_level || 'public'}</span>
                  </Badge>
                </div>
                <p className="text-sm text-gray-300">
                  {localPoll.created_date ? format(new Date(localPoll.created_date), "MMM d, yyyy 'at' h:mm a") : 'Just now'}
                </p>
              </div>
            </AuthorProfileLink>

            {/* Three Dots Menu */}
            {(user && (localPoll.created_by === user.email || user.role === 'admin')) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-700">
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuItem onClick={handleTogglePin} className="text-purple-400 hover:bg-purple-500/10 cursor-pointer">
                        {localPoll.is_pinned ? (
                          <>
                            <PinOff className="w-4 h-4 mr-2" />
                            Unpin Poll
                          </>
                        ) : (
                          <>
                            <Pin className="w-4 h-4 mr-2" />
                            Pin to Top
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleFlag} className="text-yellow-400 hover:!text-yellow-400 hover:!bg-yellow-500/10 cursor-pointer">
                        <Flag className="w-4 h-4 mr-2" />
                        Flag Poll
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.email === localPoll.created_by && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Poll
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Echo Content/Description (if provided) */}
          {localPoll.content && localPoll.content.trim() && (
            <p className="text-base text-gray-300 mb-4 whitespace-pre-wrap break-words">
              {filterProfanity(localPoll.content, user?.privacy_settings?.profanity_filter_enabled)}
            </p>
          )}

          {/* Poll Question */}
          <h3 className="text-lg md:text-xl font-semibold text-white mb-4">
            {filterProfanity(localPoll.question, user?.privacy_settings?.profanity_filter_enabled)}
          </h3>

          {/* Poll Options */}
          <div className="space-y-3 mb-4">
            {localPoll.options.map((option, index) => {
              const percentage = getVotePercentage(index);
              const voteCount = getVoteCount(index);
              const isSelected = selectedOption === index;

              return (
                <div key={index} className="relative">
                  {showResults ? (
                    /* Show Results */
                    <div className="relative overflow-hidden rounded-lg border border-purple-500/20 bg-black/20 p-3">
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <Check className="w-4 h-4 text-green-400" />
                          )}
                          <span className="text-sm md:text-base text-white font-medium break-words">
                            {filterProfanity(option, user?.privacy_settings?.profanity_filter_enabled)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-400">{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
                          <span className="font-bold text-purple-400">{percentage}%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Show Vote Button */
                    <Button
                      onClick={() => handleVote(index)}
                      disabled={isVoting || !isPollOpen()}
                      className="w-full bg-black/20 border border-purple-500/20 hover:bg-purple-500/10 text-white justify-start min-h-[44px] py-3"
                    >
                      <span className="font-medium">{filterProfanity(option, user?.privacy_settings?.profanity_filter_enabled)}</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Poll Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700/50 text-sm">
            <div className="flex items-center gap-2 text-gray-400 min-h-[44px]">
              <Clock className="w-5 h-5" />
              <span>{timeRemaining}</span>
            </div>
            <div className="text-purple-400 font-medium min-h-[44px] flex items-center">
              {localPoll.total_votes || 0} vote{(localPoll.total_votes || 0) !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Tags */}
          {localPoll.tags && localPoll.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {localPoll.tags.map((tag, idx) => (
                <Link key={idx} to={createPageUrl(`TagPage?tag=${encodeURIComponent(tag)}`)}>
                  <Badge
                    variant="outline"
                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 cursor-pointer bg-black/20 text-xs"
                  >
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}