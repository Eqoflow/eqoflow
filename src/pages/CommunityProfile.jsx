import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User as UserIcon, Plus, ArrowLeft, Edit3, Lock, X, Check, Info, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import EditCommunityModal from '../components/communities/EditCommunityModal';
import CommunityPaymentModal from '../components/communities/CommunityPaymentModal';
import KickBanModal from '../components/communities/KickBanModal';
import EditPostModal from '../components/feed/EditPostModal';
import CommunityDiscordView from '../components/chambers/CommunityDiscordView';

export default function CommunityProfilePage() {
  const [community, setCommunity] = useState(null);
  const [user, setUser] = useState(null);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showKickBanModal, setShowKickBanModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteCodeError, setInviteCodeError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [communityPosts, setCommunityPosts] = useState([]);
  const [relatedCommunities, setRelatedCommunities] = useState([]);
  const [latestActivities, setLatestActivities] = useState([]);


  const location = useLocation();

  const loadData = async (communityId, urlInviteCode = null) => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Fetch user and community in parallel
      const [currentUser, fetchedCommunity] = await Promise.all([
        base44.auth.me(),
        base44.entities.Community.get(communityId)
      ]);
      
      setUser(currentUser);
      setCommunity(fetchedCommunity);

      const isUserCreator = fetchedCommunity.created_by === currentUser?.email;
      setIsCreator(isUserCreator);
      
      const isUserMember = fetchedCommunity.member_emails?.includes(currentUser?.email);
      setIsMember(isUserMember);

      const isPrivate = fetchedCommunity.access_type === 'private_invite';

      // Handle private community access
      if (isPrivate && !isUserMember && !isUserCreator) {
        if (urlInviteCode && urlInviteCode === fetchedCommunity.invite_code) {
          setShowInviteCodeModal(false);
          setInviteCodeError('');
        } else {
          setShowInviteCodeModal(true);
          if (urlInviteCode && urlInviteCode !== fetchedCommunity.invite_code) {
            setInviteCodeError('Invalid invite code provided in the URL. Please enter the correct code.');
          }
        }
      }

      // Prepare parallel data fetching
      const dataPromises = [];

      // 1. Fetch creator info
      if (fetchedCommunity.created_by) {
        dataPromises.push(
          base44.entities.PublicUserDirectory.filter({ user_email: fetchedCommunity.created_by })
            .then(creatorData => {
              if (creatorData && creatorData.length > 0) {
                setCreatorInfo(creatorData[0]);
              }
            })
            .catch(error => {
              console.error("Error loading creator info:", error);
              setCreatorInfo(null);
            })
        );
      }

      // 2. Fetch member profiles in ONE batch query (MAJOR OPTIMIZATION)
      if (fetchedCommunity.member_emails && fetchedCommunity.member_emails.length > 0) {
        const activeMemberEmails = fetchedCommunity.member_emails.filter(
          (email) => !fetchedCommunity.banned_emails?.includes(email)
        );

        if (activeMemberEmails.length > 0) {
          dataPromises.push(
            // Batch fetch all member profiles at once using $in operator
            base44.entities.PublicUserDirectory.filter({ 
              user_email: { $in: activeMemberEmails } 
            })
              .then(publicProfiles => {
                // Create a map for quick lookup
                const profilesMap = {};
                publicProfiles.forEach(profile => {
                  profilesMap[profile.user_email] = {
                    email: profile.user_email,
                    full_name: profile.full_name || profile.user_email.split('@')[0],
                    avatar_url: profile.avatar_url
                  };
                });
                
                // Fill in missing profiles
                const allProfiles = activeMemberEmails.map(email => 
                  profilesMap[email] || {
                    email,
                    full_name: email.split('@')[0],
                    avatar_url: null
                  }
                );
                
                setMemberProfiles(allProfiles);
              })
              .catch(error => {
                console.error("Error loading member profiles:", error);
                // Fallback to basic profiles
                setMemberProfiles(
                  activeMemberEmails.map(email => ({
                    email,
                    full_name: email.split('@')[0],
                    avatar_url: null
                  }))
                );
              })
          );
        } else {
          setMemberProfiles([]); // No active members
        }
      } else {
        setMemberProfiles([]); // No members at all
      }

      // 3. Fetch posts
      dataPromises.push(
        base44.entities.Post.filter({ community_id: communityId }, '-created_date', 20)
          .then(posts => {
            setCommunityPosts(posts);
            
            // Generate activities from posts
            const activities = posts.map(post => ({
              name: post.author_full_name || 'Anonymous',
              avatar: post.author_avatar_url,
              action: 'posted an update',
              timestamp: post.created_date
            }));
            setLatestActivities(activities);
          })
          .catch(error => {
            console.error("Error loading posts:", error);
            setCommunityPosts([]);
            setLatestActivities([]);
          })
      );

      // 4. Fetch related communities (optimized query)
      if (fetchedCommunity.tags && fetchedCommunity.tags.length > 0) {
        dataPromises.push(
          base44.entities.Community.filter(
            { 
              id: { $ne: communityId },
              tags: { $in: fetchedCommunity.tags }
            },
            '-created_date',
            5
          )
            .then(related => setRelatedCommunities(related))
            .catch(error => {
              console.error("Error loading related communities:", error);
              setRelatedCommunities([]);
            })
        );
      } else {
        dataPromises.push(
          base44.entities.Community.list('-created_date', 5)
            .then(allCommunities => {
              setRelatedCommunities(allCommunities.filter(c => c.id !== communityId));
            })
            .catch(error => {
              console.error("Error loading communities:", error);
              setRelatedCommunities([]);
            })
        );
      }

      // Wait for all parallel operations to complete
      await Promise.all(dataPromises);

    } catch (error) {
      console.error("Error loading community profile:", error);
      setCommunity(null);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const communityId = searchParams.get('id');
    const inviteCodeParam = searchParams.get('inviteCode');
    const paymentSuccess = searchParams.get("payment_success");
    const paymentCancelled = searchParams.get("payment_cancelled");

    if (communityId) {
      loadData(communityId, inviteCodeParam);
    }

    if (paymentSuccess === 'true') {
      setSuccessMessage("Welcome! Your membership is now active. 🎉");
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("payment_success");
      window.history.replaceState({}, '', newUrl.toString());

      setTimeout(() => {
        loadData(communityId, inviteCodeParam);
      }, 2000);
    }

    if (paymentCancelled === 'true') {
      setErrorMessage("Payment was cancelled. You can try again when you're ready.");
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("payment_cancelled");
      window.history.replaceState({}, '', newUrl.toString());
    }

  }, [location.search]);

  const handleVerifyInviteCode = () => {
    if (inviteCodeInput.trim() === community.invite_code) {
      setShowInviteCodeModal(false);
      setInviteCodeError('');
      setInviteCodeInput('');
      loadData(community.id, community.invite_code);
    } else {
      setInviteCodeError('Incorrect invite code. Please try again.');
    }
  };

  const handleJoinCommunity = async () => {
    if (!community || !user) return;

    if (community.banned_emails?.includes(user.email)) {
      alert("You have been banned from this community and cannot join.");
      return;
    }

    const isPrivate = community.access_type === 'private_invite';
    const hasInviteCode = community.invite_code;

    if (isPrivate && !isMember && !isCreator && hasInviteCode && inviteCodeInput !== community.invite_code) {
      setShowInviteCodeModal(true);
      setInviteCodeError('Please enter a valid invite code to join this private community.');
      return;
    }

    if (community.pricing_model === 'paid' && community.membership_fee > 0) {
      setShowPaymentModal(true);
      return;
    }

    try {
      const updatedMembers = new Set(community.member_emails || []);
      updatedMembers.add(user.email);
      const newMemberEmails = Array.from(updatedMembers);

      await base44.entities.Community.update(community.id, { member_emails: newMemberEmails });

      await loadData(community.id, new URLSearchParams(location.search).get('inviteCode'));
    } catch (error) {
      console.error("Error joining community:", error);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!community || !user) return;

    try {
      const updatedMembers = (community.member_emails || []).filter(
        (email) => email !== user.email
      );

      await base44.entities.Community.update(community.id, { member_emails: updatedMembers });

      await loadData(community.id, new URLSearchParams(location.search).get('inviteCode'));
    } catch (error) {
      console.error("Error leaving community:", error);
    }
  };

  const handleUpdateCommunity = async (updatedData) => {
    try {
      await base44.entities.Community.update(community.id, updatedData);
      setShowEditModal(false);
      await loadData(community.id, new URLSearchParams(location.search).get('inviteCode'));
    } catch (error) {
      console.error("Error updating community:", error);
    }
  };

  const handleOpenKickBanModal = (member) => {
    setSelectedMember(member);
    setShowKickBanModal(true);
  };

  const handleKickOrBan = async (action) => {
    if (!community || !isCreator || !selectedMember) return;

    let currentMembers = new Set(community.member_emails || []);
    let currentBanned = new Set(community.banned_emails || []);

    currentMembers.delete(selectedMember.email);

    if (action === 'ban') {
      currentBanned.add(selectedMember.email);
    }

    try {
      await base44.entities.Community.update(community.id, {
        member_emails: Array.from(currentMembers),
        banned_emails: Array.from(currentBanned)
      });
      setShowKickBanModal(false);
      setSelectedMember(null);
      await loadData(community.id, new URLSearchParams(location.search).get('inviteCode'));
    } catch (error) {
      console.error(`Failed to ${action} member:`, error);
      alert(`An error occurred. Could not ${action} the member.`);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSuccessMessage("Welcome! Your membership is now active. 🎉");
    setTimeout(() => {
      loadData(community.id, new URLSearchParams(location.search).get('inviteCode'));
    }, 1000);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowEditPostModal(true);
  };

  const handleSaveEditedPost = async (postId, updatedData) => {
    try {
      await base44.entities.Post.update(postId, updatedData);
      setShowEditPostModal(false);
      setEditingPost(null);
      await loadData(community.id, new URLSearchParams(location.search).get('inviteCode'));
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };


  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="flex items-center gap-3 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
          <span className="text-lg">Loading Community...</span>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="dark-card p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Community Not Found</h2>
          <p className="text-gray-400">This community does not exist or has been removed.</p>
        </Card>
      </div>
    );
  }

  const isPrivateCommunity = community.access_type === 'private_invite';
  const canViewCommunity = !isPrivateCommunity || isMember || isCreator || !showInviteCodeModal;
  const isBanned = community?.banned_emails?.includes(user?.email);

  const defaultPerks = [
    {
      title: "Connect & Engage",
      description: "Join conversations, share ideas, and build meaningful connections with like-minded members."
    },
    {
      title: "Grow Together",
      description: "Access exclusive content, resources, and opportunities curated by community leaders."
    },
    {
      title: "Exclusive Benefits",
      description: "Get access to member-only content, events, and perks designed for this community."
    }
  ];

  const displayPerks = community.landing_page_perks && community.landing_page_perks.length > 0 
    ? community.landing_page_perks 
    : defaultPerks;

  // Landing page view for non-members
  if (!isMember && !isCreator && canViewCommunity) {
    return (
      <div className="min-h-screen bg-black text-white">
        {(successMessage || errorMessage) && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm"
            >
              {successMessage && (
                <Card className="dark-card p-4 flex items-center gap-3 border-green-500/50 bg-green-900/20 text-green-300">
                  <Check className="w-5 h-5" />
                  <span>{successMessage}</span>
                  <Button variant="ghost" size="icon" onClick={() => setSuccessMessage('')} className="ml-auto text-green-300 hover:bg-green-500/10">
                    <X className="w-4 h-4" />
                  </Button>
                </Card>
              )}
              {errorMessage && (
                <Card className="dark-card p-4 flex items-center gap-3 border-red-500/50 bg-red-900/20 text-red-300">
                  <Info className="w-5 h-5" />
                  <span>{errorMessage}</span>
                  <Button variant="ghost" size="icon" onClick={() => setErrorMessage('')} className="ml-auto text-red-300 hover:bg-red-500/10">
                    <X className="w-4 h-4" />
                  </Button>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        <div className="max-w-6xl mx-auto p-6">
          <Link to={createPageUrl("Communities")} className="block mb-6">
            <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-800/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Communities
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="relative h-96 rounded-3xl overflow-hidden mb-8">
              {community.banner_url ? (
                <img src={community.banner_url} alt={community.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900" />
              )}
              <div className="absolute inset-0 bg-black/40" />
              
              <div className="absolute bottom-8 left-8">
                <div className="flex items-end gap-6">
                  <div className="w-32 h-32 rounded-3xl bg-black border-4 border-black p-3">
                    <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center overflow-hidden">
                      {community.logo_url ? (
                        <img src={community.logo_url} alt={community.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <span className="text-5xl font-bold text-white">{community.name?.[0]}</span>
                      )}
                    </div>
                  </div>
                  <div className="mb-4">
                    <h1 className="text-5xl font-bold text-white mb-2">{community.name}</h1>
                    <div className="flex items-center gap-3">
                      {isPrivateCommunity && (
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
                          <Lock className="w-3 h-3 mr-1" />
                          Private
                        </Badge>
                      )}
                      {community.pricing_model === 'free' ? (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/40">
                          Free
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40">
                          {community.currency === 'QFLOW' ? '$EQOFLO' : community.currency} {community.membership_fee} / {community.subscription_type === 'monthly' ? 'month' : community.subscription_type === 'yearly' ? 'year' : 'one-time'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center max-w-3xl mx-auto mb-12">
              <p className="text-xl text-gray-300 leading-relaxed mb-8">
                {community.description}
              </p>
              <Button
                onClick={handleJoinCommunity}
                disabled={isBanned || !user}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-12 py-6 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                {isBanned ? 'Banned from Community' : 
                 community.pricing_model === 'paid' && community.membership_fee > 0 ? 
                 `Join for ${community.currency === 'QFLOW' ? '' : community.currency === 'USD' ? '$' : community.currency === 'GBP' ? '£' : '€'}${community.membership_fee}${community.currency === 'QFLOW' ? ' $EQOFLO' : ''}` : 
                 'Join Community'}
              </Button>
            </div>
          </motion.div>

          <div className={`grid md:grid-cols-${Math.min(displayPerks.length, 3)} gap-6 mb-12`}>
            {displayPerks.map((perk, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
              >
                <Card className="dark-card border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{perk.title}</h3>
                    <p className="text-gray-400">
                      {perk.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {community.landing_page_images && community.landing_page_images.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Community Showcase</h2>
              <div className={`grid ${community.landing_page_images.length === 1 ? 'grid-cols-1' : community.landing_page_images.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
                {community.landing_page_images.map((imageUrl, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="aspect-square rounded-xl overflow-hidden border border-purple-500/20"
                  >
                    <img src={imageUrl} alt={`Showcase ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <Card className="dark-card mb-8">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-purple-400 mb-2">
                    {community.member_emails?.length || 0}
                  </div>
                  <div className="text-gray-400">Members</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-pink-400 mb-2">
                    {creatorInfo?.full_name || 'Creator'}
                  </div>
                  <div className="text-gray-400">Founded By</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-cyan-400 mb-2">
                    {community.access_type === 'public' ? 'Public' : 'Private'}
                  </div>
                  <div className="text-gray-400">Access Type</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white text-2xl">About {community.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{community.description}</p>
              
              {community.tags && community.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {community.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-purple-300 border-purple-500/30 bg-purple-900/20">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {creatorInfo && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Created by</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      {creatorInfo.avatar_url ? (
                        <img src={creatorInfo.avatar_url} alt={creatorInfo.full_name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <UserIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <Link to={`${createPageUrl("PublicProfile")}?username=${creatorInfo.username}`} className="font-medium text-white hover:text-purple-400">
                      {creatorInfo.full_name}
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <AnimatePresence>
          {showInviteCodeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="w-full max-w-md"
              >
                <Card className="dark-card p-6">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-purple-400" />
                    </div>
                    <CardTitle className="text-white text-xl">Private Community</CardTitle>
                    <p className="text-gray-400 text-sm mt-2">
                      This is a private community. Please enter the invite code to access.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Input
                        type="text"
                        placeholder="Enter invite code"
                        value={inviteCodeInput}
                        onChange={(e) => {
                          setInviteCodeInput(e.target.value);
                          setInviteCodeError('');
                        }}
                        className="bg-black/20 border-purple-500/20 text-white"
                        onKeyPress={(e) => e.key === 'Enter' && handleVerifyInviteCode()}
                      />
                      {inviteCodeError && (
                        <p className="text-red-400 text-sm mt-2">{inviteCodeError}</p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-500/30 text-gray-300 hover:bg-gray-500/10"
                        onClick={() => window.history.back()}
                      >
                        Go Back
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                        onClick={handleVerifyInviteCode}
                        disabled={!inviteCodeInput.trim()}
                      >
                        Verify Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {showPaymentModal && (
            <CommunityPaymentModal
              community={community}
              user={user}
              onClose={() => setShowPaymentModal(false)}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full community profile for members and creators — Discord-style
  return (
    <div className="min-h-screen bg-black text-white">
      {(successMessage || errorMessage) && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm"
          >
            {successMessage && (
              <Card className="dark-card p-4 flex items-center gap-3 border-green-500/50 bg-green-900/20 text-green-300">
                <Check className="w-5 h-5" />
                <span>{successMessage}</span>
                <Button variant="ghost" size="icon" onClick={() => setSuccessMessage('')} className="ml-auto text-green-300 hover:bg-green-500/10">
                  <X className="w-4 h-4" />
                </Button>
              </Card>
            )}
            {errorMessage && (
              <Card className="dark-card p-4 flex items-center gap-3 border-red-500/50 bg-red-900/20 text-red-300">
                <Info className="w-5 h-5" />
                <span>{errorMessage}</span>
                <Button variant="ghost" size="icon" onClick={() => setErrorMessage('')} className="ml-auto text-red-300 hover:bg-red-500/10">
                  <X className="w-4 h-4" />
                </Button>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <div className="p-2 md:p-4">
        <div className="flex items-center justify-between mb-3">
          <Link to={createPageUrl("Communities")}>
            <Button variant="outline" className="border-purple-500/30 text-white hover:bg-purple-500/10 text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          {isCreator && (
            <Button
              variant="outline"
              className="border-purple-500/30 text-white hover:bg-purple-500/10 text-sm"
              onClick={() => setShowEditModal(true)}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Community
            </Button>
          )}
        </div>

        <CommunityDiscordView
          community={community}
          user={user}
          isMember={isMember}
          isCreator={isCreator}
          memberProfiles={memberProfiles}
          communityPosts={communityPosts}
          latestActivities={latestActivities}
          onEditPost={handleEditPost}
        />
      </div>

      <AnimatePresence>
        {showEditModal && (
          <EditCommunityModal
            community={community}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleUpdateCommunity}
            onCommunityUpdated={() => loadData(community.id, new URLSearchParams(location.search).get('inviteCode'))}
          />
        )}
        {showKickBanModal && selectedMember && (
          <KickBanModal
            communityName={community.name}
            member={selectedMember}
            onClose={() => { setShowKickBanModal(false); setSelectedMember(null); }}
            onAction={handleKickOrBan}
          />
        )}
        {showPaymentModal && (
          <CommunityPaymentModal
            community={community}
            user={user}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={handlePaymentSuccess}
          />
        )}
        {showEditPostModal && editingPost && (
          <EditPostModal
            post={editingPost}
            user={user}
            onSave={handleSaveEditedPost}
            onClose={() => {
              setShowEditPostModal(false);
              setEditingPost(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}