import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Send,
  Globe,
  Users,
  Lock,
  X,
  Zap,
  Shield,
  Plus,
  Image,
  Video,
  Mic,
  FileText,
  Loader2,
  AlertTriangle,
  BookMarked,
  BarChart3,
  Coins } from
"lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadFile } from "@/integrations/Core";
import NFTGateSetup from "../nft/NFTGateSetup";
import { Community } from '@/entities/Community';
import { getYoutubeVideoDetails } from '@/functions/getYoutubeVideoDetails';
import GiphyPicker from "./GiphyPicker";
import { base44 } from "@/api/base44Client";
import { FileKey } from "lucide-react";
import { useWallet } from '@solana/wallet-adapter-react';
import { useBlockchainTimestamp } from '../blockchain/useBlockchainTimestamp';

// Helper function to detect if an image is PNG
const isPngImage = (url) => {
  if (!url) return false;
  return url.toLowerCase().includes('.png') || url.toLowerCase().includes('image/png');
};

// Helper function to get avatar background style
const getAvatarBackgroundStyle = (avatarUrl) => {
  if (isPngImage(avatarUrl)) {
    return { background: 'linear-gradient(to right, #000000, #1a1a1a)' };
  }
  return { background: 'linear-gradient(to right, #8b5cf6, #ec4899)' };
};

export default function CreatePost({ onSubmit, user, communityId = null, isCreatorOfCommunity = false, initialContent = "", articleTitle = "" }) {
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState("public");
  const [nftGateSettings, setNftGateSettings] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNFTGate, setShowNFTGate] = useState(false);

  const [mediaFiles, setMediaFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [showMediaWarning, setShowMediaWarning] = useState(false);
  const [mediaUploadAcceptType, setMediaUploadAcceptType] = useState(null);

  const [errorMessage, setErrorMessage] = useState(null);
  const [tagError, setTagError] = useState(null);

  const [userCommunities, setUserCommunities] = useState([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [shareToMainFeed, setShareToMainFeed] = useState(true);

  const [youtubeVideoDetails, setYoutubeVideoDetails] = useState(null);
  const [isFetchingYTDetails, setIsFetchingYTDetails] = useState(false);
  const debounceTimeoutRef = useRef(null);

  // Poll state
  const [showPollInputs, setShowPollInputs] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState('24');

  // X cross-posting state
  const [postToX, setPostToX] = useState(false);

  // Giphy picker state
  const [showGiphyPicker, setShowGiphyPicker] = useState(false);

  // Content License state
  const [selectedLicenseIds, setSelectedLicenseIds] = useState([]);
  const [availableLicenses, setAvailableLicenses] = useState([]);
  const [enableBlockchainTimestamp, setEnableBlockchainTimestamp] = useState(false);

  // $eqoflo Gated Content state
  const [enableGatedContent, setEnableGatedContent] = useState(false);
  const [eqofloPrice, setEqofloPrice] = useState(250);
  const [gatedContentTitle, setGatedContentTitle] = useState("");

  // Sell to Brands state
  const [enableBrandContent, setEnableBrandContent] = useState(false);
  const [brandContentPrice, setBrandContentPrice] = useState(500);
  const [brandContentTitle, setBrandContentTitle] = useState("");

  // Solana wallet state
  const { publicKey, connected, connect, connecting } = useWallet();
  const { timestampContent, isProcessing: isTimestamping } = useBlockchainTimestamp();
  const isWalletConnected = connected && publicKey;

  // Auto-connect wallet when blockchain timestamp is enabled
  const handleBlockchainToggle = (checked) => {
    setEnableBlockchainTimestamp(checked);
  };

  const fetchUserCommunities = useCallback(async () => {
    if (user && user.email && !communityId) {
      try {
        const communities = await Community.filter({ created_by: user.email });
        setUserCommunities(communities);
      } catch (error) {
        console.error("Failed to fetch user communities:", error);
      }
    }
  }, [user, communityId]);

  useEffect(() => {
    fetchUserCommunities();
    loadLicenses();
  }, [fetchUserCommunities]);

  const loadLicenses = async () => {
    try {
      const licenses = await base44.entities.ContentLicense.filter({ is_active: true }, 'sort_order');
      setAvailableLicenses(licenses);
      
      const defaultLicense = licenses.find(l => l.is_default);
      if (defaultLicense) {
        setSelectedLicenseIds([defaultLicense.id]);
      }
    } catch (error) {
      console.error("Failed to load licenses:", error);
    }
  };

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!showPollInputs) {
      debounceTimeoutRef.current = setTimeout(() => {
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = content.match(youtubeRegex);
        const videoId = match ? match[1] : null;

        if (videoId && youtubeVideoDetails?.videoId !== videoId) {
          setIsFetchingYTDetails(true);
          getYoutubeVideoDetails({ videoId }).
          then((response) => {
            if (response.data) {
              setYoutubeVideoDetails({
                videoId: videoId,
                thumbnail: response.data.thumbnail_url,
                title: response.data.title
              });
            } else {
              setYoutubeVideoDetails(null);
            }
          }).
          catch((error) => {
            console.error("Error fetching YouTube details:", error);
            setYoutubeVideoDetails(null);
          }).
          finally(() => {
            setIsFetchingYTDetails(false);
          });
        } else if (!videoId && youtubeVideoDetails) {
          setYoutubeVideoDetails(null);
        }
      }, 500);
    } else {
      setYoutubeVideoDetails(null);
      setIsFetchingYTDetails(false);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [content, youtubeVideoDetails, showPollInputs]);

  const showErrorMessage = (error, context = '') => {
    console.error(`${context} error:`, error);

    let message = "Something went wrong. EqoFlow is in beta and we're working to improve stability. Please try again in a moment.";

    if (error?.response?.status === 429) {
      message = "Too many requests. We're in beta and optimizing our systems. Please wait before trying again.";
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      message = "Network issue detected. EqoFlow is in beta - please check your connection and retry.";
    }

    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  const handleIconClick = (acceptType) => {
    if (acceptType.includes('image/') || acceptType.includes('video/')) {
      setMediaUploadAcceptType(acceptType);
      setShowMediaWarning(true);
    } else {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      let fileType = 'file';
      if (file.type.startsWith('image/')) fileType = 'image';
      if (file.type.startsWith('video/')) fileType = 'video';
      if (file.type.startsWith('audio/')) fileType = 'audio';
      if (file.type === 'application/pdf') fileType = 'pdf';

      setMediaFiles([...mediaFiles, { url: file_url, type: fileType, name: file.name }]);
    } catch (error) {
      showErrorMessage(error, 'Uploading file');
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const removeMediaFile = (indexToRemove) => {
    setMediaFiles(mediaFiles.filter((_, index) => index !== indexToRemove));
  };

  const addPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const togglePollInputs = () => {
    const newShowPoll = !showPollInputs;
    setShowPollInputs(newShowPoll);

    if (newShowPoll) {
      setMediaFiles([]);
      setYoutubeVideoDetails(null);
    }

    if (!newShowPoll) {
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollDuration('24');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);

    const getAuthorFullName = () => {
      if (user?.full_name && user.full_name.trim() !== '' && !user.full_name.includes('@')) {
        return user.full_name;
      }
      if (user?.name && user.name.trim() !== '' && !user.name.includes('@')) {
        return user.name;
      }
      if (user?.username && user.username.trim() !== '' && !user.username.includes('@')) {
        return user.username;
      }
      if (user?.email && user.email.includes('@')) {
        return user.email.split('@')[0];
      }
      return 'Anonymous User';
    };

    const getAuthorUsername = () => {
      if (user?.username && user.username.trim() !== '' && !user.username.includes('@')) {
        return user.username;
      }
      if (user?.email && user.email.includes('@')) {
        return user.email.split('@')[0];
      }
      return 'unknown';
    };

    const authorFullName = getAuthorFullName();
    const authorUsername = getAuthorUsername();

    // Check if this is a poll submission
    if (showPollInputs) {
      if (!pollQuestion.trim()) {
        setErrorMessage('Please enter a poll question.');
        setIsSubmitting(false);
        return;
      }

      const validOptions = pollOptions.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        setErrorMessage('Please provide at least 2 poll options.');
        setIsSubmitting(false);
        return;
      }

      try {
        const endDate = new Date();
        endDate.setHours(endDate.getHours() + parseInt(pollDuration));

        const pollData = {
          content: content.trim(),
          question: pollQuestion.trim(),
          options: validOptions,
          end_date: endDate.toISOString(),
          votes: {},
          voters: [],
          total_votes: 0,
          author_full_name: authorFullName,
          author_username: authorUsername,
          author_avatar_url: user?.avatar_url,
          privacy_level: privacyLevel,
          tags,
          isPoll: true,
          moderation_status: 'approved'
        };

        if (communityId) {
          pollData.community_id = communityId;
          if (isCreatorOfCommunity && shareToMainFeed) {
            pollData.share_to_main_feed = true;
          } else {
            pollData.share_to_main_feed = false;
          }
        } else if (selectedCommunityId && selectedCommunityId !== '') {
          pollData.community_id = selectedCommunityId;
          pollData.share_to_main_feed = true;
        }

        await onSubmit(pollData);

        setContent("");
        setPollQuestion('');
        setPollOptions(['', '']);
        setPollDuration('24');
        setTags([]);
        setCurrentTag("");
        setPrivacyLevel('public');
        setSelectedCommunityId('');
        setShareToMainFeed(true);
        setShowPollInputs(false);
      } catch (error) {
        showErrorMessage(error, 'Creating poll');
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    // Regular post logic
    const textContent = content.trim();
    const hasContent = textContent || mediaFiles.length > 0 || youtubeVideoDetails;

    if (!hasContent) {
      setErrorMessage('Please add some content, media, or a YouTube link to your post.');
      setIsSubmitting(false);
      return;
    }

    // Handle blockchain timestamp - must connect and approve BEFORE posting
    if (enableBlockchainTimestamp) {
      if (!isWalletConnected) {
        try {
          await connect();
          // Wait for connection to establish
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Verify connection succeeded
          if (!publicKey) {
            setErrorMessage('Wallet connection required for blockchain timestamping. Please try again.');
            setIsSubmitting(false);
            return;
          }
        } catch (err) {
          console.error('Wallet connection error:', err);
          setErrorMessage('Failed to connect wallet. Post will be created without blockchain timestamp.');
          setEnableBlockchainTimestamp(false);
        }
      }
    }

    const postData = {
      content: textContent,
      media_urls: mediaFiles.map((f) => f.url),
      tags,
      privacy_level: privacyLevel,
      nft_gate_settings: nftGateSettings,
      post_to_x: postToX,
      author_full_name: authorFullName,
      author_username: authorUsername,
      author_avatar_url: user?.avatar_url,
      author_banner_url: user?.banner_url,
      author_follower_count: user?.followers?.length || 0,
      author_professional_credentials: user?.professional_credentials,
      author_cross_platform_identity: user?.cross_platform_identity,
      is_nft_gated: !!nftGateSettings,
      isPoll: false,
      moderation_status: 'approved',
      youtube_video_id: youtubeVideoDetails?.videoId || null,
      youtube_thumbnail_url: youtubeVideoDetails?.thumbnail || null,
      youtube_video_title: youtubeVideoDetails?.title || null,
      license_id: selectedLicenseIds.length > 0 ? selectedLicenseIds[0] : null,
      eqoflo_price: enableGatedContent ? eqofloPrice : null,
      gated_content_title: enableGatedContent && gatedContentTitle.trim() ? gatedContentTitle.trim() : null,
      brand_content_price: enableBrandContent ? brandContentPrice : null,
      brand_content_title: enableBrandContent && brandContentTitle.trim() ? brandContentTitle.trim() : null
    };

    if (communityId) {
      postData.community_id = communityId;
      if (isCreatorOfCommunity && shareToMainFeed) {
        postData.share_to_main_feed = true;
      } else {
        postData.share_to_main_feed = false;
      }
    } else if (selectedCommunityId && selectedCommunityId !== '') {
      postData.community_id = selectedCommunityId;
      postData.share_to_main_feed = true;
    }

    try {
      const newPost = await onSubmit(postData);

      // Handle blockchain timestamping if enabled
      if (enableBlockchainTimestamp && newPost?.id && newPost?.content_hash && isWalletConnected) {
        try {
          const result = await timestampContent(newPost.content_hash, newPost.id);
          if (result.success) {
            setErrorMessage('Post echoed and blockchain timestamp confirmed! ✓');
            setTimeout(() => setErrorMessage(null), 4000);
          }
        } catch (timestampError) {
          console.error('Blockchain timestamp error:', timestampError);
          setErrorMessage('Post created, but blockchain timestamp failed: ' + timestampError.message);
          setTimeout(() => setErrorMessage(null), 6000);
        }
      }

      setContent("");
      setMediaFiles([]);
      setTags([]);
      setCurrentTag("");
      setPrivacyLevel("public");
      setNftGateSettings(null);
      setShowNFTGate(false);
      setSelectedCommunityId('');
      setShareToMainFeed(true);
      setYoutubeVideoDetails(null);
      setPostToX(false);
      setEnableBlockchainTimestamp(false);
      setEnableGatedContent(false);
      setEqofloPrice(250);
      setGatedContentTitle("");
      setEnableBrandContent(false);
      setBrandContentPrice(500);
      setBrandContentTitle("");
    } catch (error) {
      showErrorMessage(error, 'Creating post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    const trimmedTag = currentTag.trim().toLowerCase();
    setTagError(null);

    if (trimmedTag && !tags.includes(trimmedTag)) {
      if (trimmedTag.length > 20) {
        setTagError("Tags cannot be longer than 20 characters.");
        return;
      }
      setTags([...tags, trimmedTag]);
      setCurrentTag("");
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleNFTGateSetup = (gateSettings) => {
    setNftGateSettings(gateSettings);
    setShowNFTGate(false);
  };

  const handleProceedWithUpload = () => {
    setShowMediaWarning(false);
    if (mediaUploadAcceptType) {
      fileInputRef.current.accept = mediaUploadAcceptType;
      fileInputRef.current.click();
      setMediaUploadAcceptType(null);
    }
  };

  const handleCancelUpload = () => {
    setShowMediaWarning(false);
    setMediaUploadAcceptType(null);
  };

  const handleGiphySelect = (gifUrl) => {
    setMediaFiles(prevFiles => {
      const newFiles = [...prevFiles, { url: gifUrl, type: 'image', name: 'giphy.gif' }];
      return newFiles;
    });
    
    setTimeout(() => {
      setShowGiphyPicker(false);
    }, 100);
  };

  return (
    <Card className="dark-card neon-glow max-h-[90vh] flex flex-col">
      <CardHeader className="bg-[#000000] pb-3 p-6 flex flex-col space-y-1.5 md:pb-4 flex-shrink-0">
        <CardTitle className="text-white flex items-center gap-2 text-base md:text-lg">
          <Zap className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
          {articleTitle ? `Share "${articleTitle}"` : "Create New Echo"}
        </CardTitle>
      </CardHeader>

      <AnimatePresence>
        {errorMessage &&
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mx-4 mt-4 flex-shrink-0">
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      <CardContent className="bg-[#000000] p-4 md:p-6 overflow-y-auto flex-1">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-3 md:gap-4">
            <div
              className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={getAvatarBackgroundStyle(user?.avatar_url)}>
              {user?.avatar_url ?
              <img src={user.avatar_url} alt="Your avatar" className="w-full h-full object-cover rounded-full" /> :

              <span className="text-white font-bold text-sm md:text-base">
                  {user?.full_name?.[0] || "U"}
                </span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={showPollInputs ? "Add your thoughts about this poll (optional)..." : articleTitle ? "Add your thoughts about this article..." : "Broadcast an echo to the network..."}
                className="min-h-[80px] md:min-h-[100px] bg-transparent border-0 p-0 resize-none text-base md:text-lg placeholder:text-gray-500 focus-visible:ring-0 text-white" />

            </div>
          </div>

          {/* Poll Inputs Section */}
          <AnimatePresence>
            {showPollInputs &&
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 p-4 bg-purple-600/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-purple-400 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Poll Settings
                  </h4>
                  <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={togglePollInputs}
                  className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <Input
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Enter your poll question..."
                className="bg-black/20 border-purple-500/20 text-white placeholder:text-gray-400 text-sm md:text-base" />


                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pollOptions.map((option, index) =>
                <div key={index} className="flex gap-2 items-center">
                      <Input
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 bg-black/20 border-purple-500/20 text-white placeholder:text-gray-400 text-sm md:text-base" />

                      {pollOptions.length > 2 &&
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePollOption(index)}
                    className="text-red-400 hover:text-red-300">
                          <X className="w-4 h-4" />
                        </Button>
                  }
                    </div>
                )}

                  {pollOptions.length < 5 &&
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPollOption}
                  className="border-purple-500/30 text-white hover:bg-purple-500/10 w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option (Max 5)
                    </Button>
                }
                </div>

                <div>
                  <label htmlFor="poll-duration" className="text-sm text-gray-400 mb-2 block">
                    Poll Duration
                  </label>
                  <Select value={pollDuration} onValueChange={setPollDuration}>
                    <SelectTrigger id="poll-duration" className="bg-black/20 border-purple-500/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-500/20">
                      <SelectItem value="1" className="text-white">1 hour</SelectItem>
                      <SelectItem value="6" className="text-white">6 hours</SelectItem>
                      <SelectItem value="12" className="text-white">12 hours</SelectItem>
                      <SelectItem value="24" className="text-white">24 hours</SelectItem>
                      <SelectItem value="72" className="text-white">3 days</SelectItem>
                      <SelectItem value="168" className="text-white">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            }
          </AnimatePresence>

          {/* YouTube Preview Section */}
          {!showPollInputs && isFetchingYTDetails &&
          <div className="flex items-center gap-2 p-3 bg-black/20 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              <span className="text-sm text-gray-400">Fetching video preview...</span>
            </div>
          }
          <AnimatePresence>
            {!showPollInputs && youtubeVideoDetails &&
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-3 bg-black/20 rounded-lg border border-purple-500/20">
                <div className="flex items-start gap-3">
                  <img src={youtubeVideoDetails.thumbnail} alt="YouTube Preview" className="w-24 h-14 object-cover rounded-md flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">Video Preview</p>
                    <p className="text-sm font-medium text-white truncate">{youtubeVideoDetails.title}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white -mr-2 -mt-2 flex-shrink-0" onClick={() => setYoutubeVideoDetails(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            }
          </AnimatePresence>

          {/* Media Files Section */}
          <AnimatePresence>
            {!showPollInputs && mediaFiles.length > 0 &&
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid gap-2 md:gap-3 grid-cols-2 md:grid-cols-4">
                {mediaFiles.map((file, index) =>
              <div key={index} className="relative group aspect-square bg-black/20 rounded-lg overflow-hidden">
                    {file.type === 'image' && <img src={file.url} alt="upload preview" className="w-full h-full object-cover" />}
                    {file.type === 'video' && <video src={file.url} className="w-full h-full object-cover" controls />}
                    {file.type === 'audio' &&
                <div className="p-2 flex flex-col items-center justify-center h-full">
                        <Mic className="w-6 h-6 md:w-8 md:h-8 text-purple-400 mb-2" />
                        <p className="text-xs text-center text-gray-400 truncate w-full">{file.name}</p>
                      </div>
                }
                    {file.type === 'pdf' &&
                <div className="p-2 flex flex-col items-center justify-center h-full">
                        <FileText className="w-6 h-6 md:w-8 md:h-8 text-purple-400 mb-2" />
                        <p className="text-xs text-center text-gray-400 truncate w-full">{file.name}</p>
                      </div>
                }
                    <button
                  type="button"
                  onClick={() => removeMediaFile(index)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
              )}
              </motion.div>
            }
          </AnimatePresence>

          {/* Tags Section */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1 md:gap-2">
              {tags.map((tag, index) =>
              <Badge
                key={index}
                variant="secondary"
                className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-xs">
                  #{tag}
                  <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-1 text-purple-300 hover:text-purple-100">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={currentTag}
                onChange={(e) => {
                  setCurrentTag(e.target.value);
                  if (tagError) setTagError(null);
                }}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tags..."
                className={`flex-1 bg-black/20 border-purple-500/20 text-white placeholder:text-gray-400 text-sm md:text-base ${tagError ? 'border-red-500/50 focus-visible:ring-red-500' : ''}`} />

              <Button type="button" onClick={addTag} size="sm" variant="outline" className="border-purple-500/30 text-white hover:bg-purple-500/10 flex-shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tagError && <p className="text-xs text-red-400 mt-1">{tagError}</p>}
          </div>

          {/* Community Tagging Section */}
          {!communityId && userCommunities.length > 0 &&
          <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Tag a Community (Optional)</span>
              </div>
              <Select value={selectedCommunityId} onValueChange={setSelectedCommunityId}>
                <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                  <SelectValue placeholder="Select one of your communities to tag..." />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/20">
                  <SelectItem value={null} className="text-white hover:bg-purple-500/10">
                    No community tag
                  </SelectItem>
                  {userCommunities.map((community) =>
                <SelectItem key={community.id} value={community.id} className="text-white hover:bg-purple-500/10">
                      {community.name}
                    </SelectItem>
                )}
                </SelectContent>
              </Select>
              {selectedCommunityId &&
            <div className="text-xs text-purple-400 bg-purple-600/10 border border-purple-500/20 rounded-lg p-2">
                  This post will appear on your community page and drive traffic to "{userCommunities.find((c) => c.id === selectedCommunityId)?.name}"
                </div>
            }
            </div>
          }

          {/* Share to Main Feed Option */}
          {communityId && isCreatorOfCommunity &&
          <div className="flex items-center justify-between p-3 bg-purple-600/10 border border-purple-500/20 rounded-lg">
              <div>
                <p className="font-medium text-white">Share to Main Feed</p>
                <p className="text-sm text-gray-400">Also show this post on the main EqoFlow feed</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                type="checkbox"
                checked={shareToMainFeed}
                onChange={(e) => setShareToMainFeed(e.target.checked)}
                className="sr-only peer" />

                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          }

          {/* NFT Gate Settings Display */}
          <AnimatePresence>
            {nftGateSettings &&
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-purple-600/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-400">NFT Gate Active</span>
                  </div>
                  <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNftGateSettings(null)}
                  className="text-red-400 hover:text-red-300">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Only holders of selected NFTs can access this content
                </p>
              </motion.div>
            }
          </AnimatePresence>

          {/* Content License Selection */}
          {!showPollInputs && availableLicenses.length > 0 &&
          <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileKey className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Content Licenses</span>
                <span className="text-xs text-gray-400">(select one or more)</span>
              </div>
              <div className="space-y-2 bg-black/20 border border-purple-500/20 rounded-lg p-3">
                {availableLicenses.map((license) =>
                  <label key={license.id} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-purple-500/10 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedLicenseIds.includes(license.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLicenseIds([...selectedLicenseIds, license.id]);
                        } else {
                          setSelectedLicenseIds(selectedLicenseIds.filter(id => id !== license.id));
                        }
                      }}
                      className="mt-1 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm">{license.name}</span>
                        <span className="text-xs text-gray-400">({license.short_code})</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{license.description}</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          }

          {/* Monetize with $eqoflo */}
          {!showPollInputs &&
          <div className="space-y-3">
            <div className="space-y-3 p-4 bg-gradient-to-r from-amber-600/10 to-orange-600/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <Label htmlFor="gated-content" className="text-sm font-medium text-white cursor-pointer">
                      Unlock Premium Access
                    </Label>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Set a price for users to unlock this content</p>
                </div>
                <Switch
                id="gated-content"
                checked={enableGatedContent}
                onCheckedChange={setEnableGatedContent} />
              </div>

              {enableGatedContent &&
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3">
                  <div>
                    <Label className="text-sm text-white">Content Title *</Label>
                    <Input
                      type="text"
                      value={gatedContentTitle}
                      onChange={(e) => setGatedContentTitle(e.target.value)}
                      placeholder="e.g., Exclusive Trading Strategy, Premium Tutorial..."
                      className="bg-black/20 border-amber-500/20 text-white mt-1"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      This title will be shown to users before they unlock your content
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-white">Price (min 250 $eqoflo = $5)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min="250"
                        step="50"
                        value={eqofloPrice}
                        onChange={(e) => setEqofloPrice(Math.max(250, parseInt(e.target.value) || 250))}
                        className="bg-black/20 border-amber-500/20 text-white"
                      />
                      <span className="text-sm text-gray-400 whitespace-nowrap">
                        ≈ ${(eqofloPrice * 0.02).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-amber-400">
                    Platform fee: 7% • You earn: {Math.round(eqofloPrice * 0.93)} $eqoflo per unlock
                  </p>
                </motion.div>
              }
            </div>

            <div className="space-y-3 p-4 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 border border-violet-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-violet-400" />
                    <Label htmlFor="brand-content" className="text-sm font-medium text-white cursor-pointer">
                      Sell your content to brands
                    </Label>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Allow brands to purchase distribution rights (ARR waived)</p>
                </div>
                <Switch
                id="brand-content"
                checked={enableBrandContent}
                onCheckedChange={setEnableBrandContent} />
              </div>

              {enableBrandContent &&
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3">
                  <div>
                    <Label className="text-sm text-white">Content Package Title *</Label>
                    <Input
                      type="text"
                      value={brandContentTitle}
                      onChange={(e) => setBrandContentTitle(e.target.value)}
                      placeholder="e.g., Q1 Marketing Campaign Content, Brand Asset Bundle..."
                      className="bg-black/20 border-violet-500/20 text-white mt-1"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Buyers get full distribution rights with no legal restrictions (ARR waived)
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-white">Price (min 500 $eqoflo = $10)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min="500"
                        step="100"
                        value={brandContentPrice}
                        onChange={(e) => setBrandContentPrice(Math.max(500, parseInt(e.target.value) || 500))}
                        className="bg-black/20 border-violet-500/20 text-white"
                      />
                      <span className="text-sm text-gray-400 whitespace-nowrap">
                        ≈ ${(brandContentPrice * 0.02).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-violet-400">
                    Platform fee: 7% • You earn: {Math.round(brandContentPrice * 0.93)} $eqoflo per purchase
                  </p>
                </motion.div>
              }
            </div>
          </div>
          }

          {/* Blockchain Timestamping Toggle */}
          {!showPollInputs &&
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <Label htmlFor="blockchain-timestamp" className="text-sm font-medium text-white cursor-pointer">
                    Blockchain Timestamp
                  </Label>
                  <Badge className="bg-purple-600/20 text-purple-300 text-xs">3 $eqoflo</Badge>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {connecting 
                    ? 'Connecting to Phantom wallet...'
                    : isWalletConnected 
                      ? 'Immutable proof of creation on Solana blockchain'
                      : 'Toggle to connect Phantom wallet and enable'
                  }
                </p>
              </div>
              <Switch
              id="blockchain-timestamp"
              checked={enableBlockchainTimestamp}
              onCheckedChange={handleBlockchainToggle}
              disabled={connecting} />

            </div>
          }

          {/* X (Twitter) Cross-Posting Toggle */}
          {user?.x_access_token &&
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <div>
                  <Label htmlFor="post-to-x" className="text-sm font-medium text-white cursor-pointer">
                    Also post to X (Twitter)
                  </Label>
                  <p className="text-xs text-gray-400">Share this post to your connected X account</p>
                </div>
              </div>
              <Switch
              id="post-to-x"
              checked={postToX}
              onCheckedChange={setPostToX} />

            </div>
          }

          {/* Footer with Media Icons and Submit */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 border-t border-purple-500/20 gap-4">
            <div className="flex items-center gap-1 md:gap-2 flex-wrap">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

              {/* Media Upload Buttons - Disabled if poll is active */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleIconClick('image/png, image/jpeg, image/webp')}
                className="text-gray-400 hover:text-purple-400 h-10 w-10"
                title="Upload Images"
                disabled={showPollInputs}>
                <Image className="w-4 h-4 md:w-5 md:h-5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleIconClick('image/gif')}
                className="text-gray-400 hover:text-purple-400 px-2 text-xs font-bold h-10"
                title="Upload GIF"
                disabled={showPollInputs}>
                GIF
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowGiphyPicker(true)}
                className="text-gray-400 hover:text-purple-400 px-2 text-xs font-bold h-10"
                title="Search Giphy"
                disabled={showPollInputs}>
                <span className="text-[10px]">GIPHY</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleIconClick('video/mp4')}
                className="text-gray-400 hover:text-purple-400 h-10 w-10"
                disabled={showPollInputs}>
                <Video className="w-4 h-4 md:w-5 md:h-5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleIconClick('audio/mpeg')}
                className="text-gray-400 hover:text-purple-400 h-10 w-10"
                disabled={showPollInputs}>
                <Mic className="w-4 h-4 md:w-5 md:h-5" />
              </Button>

              {/* Poll Button - Disabled if media is present */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={togglePollInputs}
                className={`h-10 w-10 ${showPollInputs ? 'text-purple-400 bg-purple-500/10' : 'text-gray-400 hover:text-purple-400'}`}
                title="Create Poll"
                disabled={mediaFiles.length > 0 || youtubeVideoDetails}>
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
              </Button>

              <div className="hidden md:block h-6 border-l border-purple-500/20 mx-2"></div>

              {/* Privacy and NFT Gate */}
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <Select value={privacyLevel} onValueChange={setPrivacyLevel}>
                  <SelectTrigger className="w-24 md:w-32 bg-black/20 border-purple-500/20 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-purple-500/20">
                    <SelectItem value="public" className="text-white hover:bg-purple-500/10">
                      <div className="flex items-center gap-2 text-white">
                        <Globe className="w-4 h-4" />
                        <span className="hidden md:inline">Public</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="friends" className="text-white hover:bg-purple-500/10">
                      <div className="flex items-center gap-2 text-white">
                        <Users className="w-4 h-4" />
                        <span className="hidden md:inline">Friends Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private" className="text-white hover:bg-purple-500/10">
                      <div className="flex items-center gap-2 text-white">
                        <Lock className="w-4 h-4" />
                        <span className="hidden md:inline">Private</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!showPollInputs &&
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNFTGate(true)}
                className="border-purple-500/30 text-white hover:bg-purple-500/10 h-10">
                  <Shield className="w-4 h-4 mr-1 md:mr-2 text-white" />
                  <span className="text-white text-xs md:text-sm">NFT Gate</span>
                </Button>
              }
            </div>

            <Button
              type="submit"
              disabled={
              showPollInputs && (!pollQuestion.trim() || pollOptions.filter((opt) => opt.trim()).length < 2) ||
              !showPollInputs && !content.trim() && mediaFiles.length === 0 && !youtubeVideoDetails ||
              enableGatedContent && !gatedContentTitle.trim() ||
              enableBrandContent && !brandContentTitle.trim() ||
              isSubmitting ||
              isUploading ||
              isTimestamping ||
              !!tagError
              }
              className="bg-gradient-to-r from-purple-600 to-pink-500 neon-glow hover:from-purple-700 hover:to-pink-600 text-white w-full md:w-auto">
              {isSubmitting || isTimestamping ?
              <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-white">{isTimestamping ? 'Timestamping...' : 'Broadcasting...'}</span>
                </div> :
              isUploading ?
              <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-white">Uploading...</span>
                </div> :

              <div className="flex items-center gap-2">
                  {showPollInputs ? <BarChart3 className="w-4 h-4 text-white" /> : <Send className="w-4 h-4 text-white" />}
                  <span className="text-white">{showPollInputs ? 'Create Poll' : 'Echo'}</span>
                </div>
              }
            </Button>
          </div>
        </form>
      </CardContent>

      <AnimatePresence>
        {showNFTGate &&
        <NFTGateSetup
          onSetup={handleNFTGateSetup}
          onCancel={() => setShowNFTGate(false)} />

        }
      </AnimatePresence>

      <GiphyPicker
        isOpen={showGiphyPicker}
        onClose={() => setShowGiphyPicker(false)}
        onSelect={handleGiphySelect} />

      {/* Media Upload Warning Modal */}
      <AnimatePresence>
        {showMediaWarning &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}>
              <Card className="dark-card border-yellow-500/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-yellow-400">
                    <AlertTriangle className="w-6 h-6" />
                    Content Warning & Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 leading-relaxed">
                    Please follow community guidelines and do not post any explicit images or pornographic content.
                  </p>
                  <p className="text-red-400 font-semibold">
                    If you are found doing so, your account will be permanently banned and you will forfeit your tokens.
                  </p>
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
                    <Button
                    variant="outline"
                    onClick={handleCancelUpload}
                    className="bg-background text-slate-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-gray-500/30 hover:bg-gray-500/10">
                      Cancel
                    </Button>
                    <Button onClick={handleProceedWithUpload} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                      I Understand & Proceed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </Card>);

}