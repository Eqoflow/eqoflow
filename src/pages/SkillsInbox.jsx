
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { User } from '@/entities/User';
// Added for fetching user profile details
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ArrowLeft,
  Send,
  Shield,
  AlertTriangle,
  MessageSquare,
  Search,
  ShoppingBag, // For buyer icon
  Briefcase, // For seller icon
  ArrowRight, // For skill card link
  ShoppingCart, // For purchase button
  Plus // For adding skill cards
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SkillsInbox() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSkillSelector, setShowSkillSelector] = useState(false);
  const [sellerSkills, setSellerSkills] = useState([]);
  const [currentSkillDetails, setCurrentSkillDetails] = useState(null);

  const chatEndRef = useRef(null);

  // Optimized getUserDisplayName with proper priority
  const displayNameCache = useRef(new Map());

  // Helper function to get display name and avatar for a user
  const getUserDisplayName = async (email) => {
    // Check cache first
    if (displayNameCache.current.has(email)) {
      return displayNameCache.current.get(email);
    }

    try {
      // Priority 1: Check CreatorProfile for business_name
      const creatorProfiles = await base44.entities.CreatorProfile.filter({ user_email: email });
      if (creatorProfiles.length > 0 && creatorProfiles[0].business_name && creatorProfiles[0].business_name.trim() !== '') {
        const result = {
          name: creatorProfiles[0].business_name,
          avatar: creatorProfiles[0].business_avatar_url || null
        };
        displayNameCache.current.set(email, result);
        return result;
      }

      // Priority 2: Check UserProfileData for full_name
      const profileData = await base44.entities.UserProfileData.filter({ user_email: email });
      if (profileData.length > 0) {
        if (profileData[0].full_name && profileData[0].full_name.trim() !== '') {
          const result = {
            name: profileData[0].full_name,
            avatar: profileData[0].avatar_url || null
          };
          displayNameCache.current.set(email, result);
          return result;
        }
        // Priority 3: Check UserProfileData for username
        if (profileData[0].username && profileData[0].username.trim() !== '') {
          const result = {
            name: profileData[0].username,
            avatar: profileData[0].avatar_url || null
          };
          displayNameCache.current.set(email, result);
          return result;
        }
      }

      // Priority 4: Check User entity for full_name
      const users = await base44.entities.User.filter({ email: email });
      if (users.length > 0) {
        if (users[0].full_name && users[0].full_name.trim() !== '') {
          const result = {
            name: users[0].full_name,
            avatar: users[0].avatar_url || null
          };
          displayNameCache.current.set(email, result);
          return result;
        }
        // Priority 5: Check User entity for username
        if (users[0].username && users[0].username.trim() !== '') {
          const result = {
            name: users[0].username,
            avatar: users[0].avatar_url || null
          };
          displayNameCache.current.set(email, result);
          return result;
        }
      }

      // Priority 6: Final fallback to email prefix
      const fallback = {
        name: email.split('@')[0],
        avatar: null
      };
      displayNameCache.current.set(email, fallback);
      return fallback;
    } catch (error) {
      console.error('[SkillsInbox] getUserDisplayName Error:', email, error);
      const fallback = {
        name: email.split('@')[0],
        avatar: null
      };
      displayNameCache.current.set(email, fallback);
      return fallback;
    }
  };

  // Optimized helper function with rate limiting
  const fetchAndProcessConversations = async (currentUser) => {
    console.log('[SkillsInbox] Fetching conversations for:', currentUser.email);

    try {
      // Get ALL messages from the system (up to a limit), then filter client-side
      const allMessages = await base44.entities.SkillsMarketplaceMessage.list('-created_date', 500);

      console.log('[SkillsInbox] Total messages in system:', allMessages.length);

      // Filter messages where user is sender OR recipient
      const userMessages = allMessages.filter(msg =>
        msg.sender_email === currentUser.email || msg.recipient_email === currentUser.email
      );

      console.log('[SkillsInbox] Messages for current user:', userMessages.length);

      if (userMessages.length === 0) {
        return [];
      }

      // Group by conversation_id
      const conversationsMap = new Map();

      for (const msg of userMessages) {
        if (!conversationsMap.has(msg.conversation_id)) {
          const otherUserEmail = msg.sender_email === currentUser.email
            ? msg.recipient_email
            : msg.sender_email;

          // Fetch display name and avatar
          const { name: otherUserName, avatar: otherUserAvatar } = await getUserDisplayName(otherUserEmail);

          // Initialize with defaults
          let buyerEmail = null;
          let sellerEmail = null;

          // Only fetch transaction if we have a skill_id
          if (msg.skill_id) {
            try {
              const transactions = await base44.entities.MarketplaceTransaction.filter({
                item_id: msg.skill_id
              }, '-created_date', 5); // Limit to 5 most recent

              if (transactions.length > 0) {
                const relevantTransaction = transactions.find(t =>
                  (t.buyer_email === currentUser.email && t.seller_email === otherUserEmail) ||
                  (t.buyer_email === otherUserEmail && t.seller_email === currentUser.email)
                );

                if (relevantTransaction) {
                  buyerEmail = relevantTransaction.buyer_email;
                  sellerEmail = relevantTransaction.seller_email;
                }
              }
            } catch (error) {
              console.warn('[SkillsInbox] Error fetching transaction:', error);
              // Continue without transaction data
            }
          }

          conversationsMap.set(msg.conversation_id, {
            conversation_id: msg.conversation_id,
            other_user_email: otherUserEmail,
            other_user_name: otherUserName,
            other_user_avatar: otherUserAvatar,
            skill_id: msg.skill_id,
            skill_title: msg.skill_title,
            lastMessage: msg.message_content,
            lastMessageTime: msg.created_date,
            unreadCount: 0,
            buyer_email: buyerEmail,
            seller_email: sellerEmail
          });
        }

        const conv = conversationsMap.get(msg.conversation_id);
        // Count unread messages for the current user
        if (msg.recipient_email === currentUser.email && !msg.is_read) {
          conv.unreadCount++;
        }

        if (new Date(msg.created_date) > new Date(conv.lastMessageTime)) {
          conv.lastMessage = msg.message_content;
          conv.lastMessageTime = msg.created_date;
        }
      }

      const conversationsList = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

      console.log('[SkillsInbox] Processed conversations:', conversationsList.length);
      return conversationsList;
    } catch (error) {
      console.error('[SkillsInbox] Error in fetchAndProcessConversations:', error);
      throw error;
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUserData = await User.me();
      console.log('[SkillsInbox] User loaded:', currentUserData.email);

      // Get current user's display name and avatar using the helper
      const { name: currentUserName, avatar: currentUserAvatar } = await getUserDisplayName(currentUserData.email);
      const userWithDisplayInfo = {
        ...currentUserData,
        displayName: currentUserName,
        displayAvatar: currentUserAvatar,
      };
      setUser(userWithDisplayInfo);

      const convs = await fetchAndProcessConversations(userWithDisplayInfo);
      setConversations(convs);
      console.log('[SkillsInbox] Conversations loaded:', convs.length);

      if (selectedConversation) {
        const updatedSelected = convs.find(c => c.conversation_id === selectedConversation.conversation_id);
        if (updatedSelected) {
          setSelectedConversation(updatedSelected);
        }
      }
    } catch (error) {
      console.error('[SkillsInbox] Error loading inbox:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!user) {
      console.warn("[SkillsInbox] Cannot load conversations: User not available.");
      return;
    }
    try {
      const convs = await fetchAndProcessConversations(user);
      setConversations(convs);
      if (selectedConversation) {
        const updatedSelected = convs.find(c => c.conversation_id === selectedConversation.conversation_id);
        if (updatedSelected) {
          setSelectedConversation(updatedSelected);
        } else {
          // If the selected conversation somehow disappeared or was altered significantly
          setSelectedConversation(null);
        }
      }
    } catch (error) {
      console.error('[SkillsInbox] Error reloading conversations:', error);
    }
  };

  const loadCurrentSkillDetails = async (skillId) => {
    if (!skillId) {
      setCurrentSkillDetails(null);
      return;
    }

    try {
      const skill = await base44.entities.Skill.get(skillId);
      setCurrentSkillDetails(skill);
    } catch (error) {
      console.error('[SkillsInbox] Error loading skill details:', error);
      setCurrentSkillDetails(null);
    }
  };

  const loadSellerSkills = async () => {
    if (!user) {
      setSellerSkills([]);
      return;
    }
    try {
      const skills = await base44.entities.Skill.filter({ 
        created_by: user.email,
        status: 'active'
      });
      setSellerSkills(skills);
    } catch (error) {
      console.error('[SkillsInbox] Error loading seller skills:', error);
      setSellerSkills([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedConversation && user) {
      loadMessages(selectedConversation.conversation_id);
      markMessagesAsRead(selectedConversation.conversation_id);
      loadCurrentSkillDetails(selectedConversation.skill_id);
      loadSellerSkills();
    }
  }, [selectedConversation, user]);

  // Effect to auto-scroll to the bottom of the chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling for new messages in the currently open conversation
  useEffect(() => {
    const interval = setInterval(() => {
      // Only poll if a conversation is selected and the browser tab is visible
      if (selectedConversation && document.visibilityState === 'visible') {
        loadMessages(selectedConversation.conversation_id);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval); // Clear interval on component unmount or selectedConversation change
  }, [selectedConversation]);

  // Handle deep linking from "Message Seller" button
  useEffect(() => {
    if (user && conversations.length >= 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const startChatWith = urlParams.get('start_chat');
      const conversationId = urlParams.get('conversation_id');
      const skillId = urlParams.get('skill_id');
      const skillTitle = urlParams.get('skill_title');

      if (startChatWith && conversationId) {
        const existingConv = conversations.find(c => c.conversation_id === conversationId);

        if (existingConv) {
          setSelectedConversation(existingConv);
        } else {
          const loadNewConversation = async () => {
            // Use the new helper function for consistency
            const { name: otherUserName, avatar: otherUserAvatar } = await getUserDisplayName(startChatWith);

            // Try to pre-fetch buyer/seller info for new conversation if skillId is present
            let buyerEmail = null;
            let sellerEmail = null;
            if (skillId) {
                try {
                    const transactions = await base44.entities.MarketplaceTransaction.filter({
                        item_id: skillId
                    });
                    const relevantTransaction = transactions.find(t =>
                        (t.buyer_email === user.email && t.seller_email === startChatWith) ||
                        (t.buyer_email === startChatWith && t.seller_email === user.email)
                    );
                    if (relevantTransaction) {
                        buyerEmail = relevantTransaction.buyer_email;
                        sellerEmail = relevantTransaction.seller_email;
                    }
                } catch (error) {
                    console.error('[SkillsInbox] Error pre-fetching transaction for new conversation:', error);
                }
            }

            const newConv = {
              conversation_id: conversationId,
              other_user_email: startChatWith,
              other_user_name: otherUserName,
              other_user_avatar: otherUserAvatar,
              skill_id: skillId,
              skill_title: skillTitle ? decodeURIComponent(skillTitle) : null,
              lastMessage: '',
              lastMessageTime: new Date().toISOString(),
              unreadCount: 0,
              buyer_email: buyerEmail,
              seller_email: sellerEmail
            };
            setSelectedConversation(newConv);
          };

          loadNewConversation();
        }

        window.history.replaceState({}, '', createPageUrl('SkillsInbox'));
      }
    }
  }, [user, conversations]); // getUserDisplayName removed from dependencies as it's a stable ref

  const loadMessages = async (conversationId) => {
    if (!conversationId) return;

    try {
      console.log('[SkillsInbox] Loading messages for conversation:', conversationId);
      const conversationMessages = await base44.entities.SkillsMarketplaceMessage.filter(
        { conversation_id: conversationId },
        'created_date',
        500
      );
      // Sort messages by created_date to ensure correct order
      conversationMessages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      console.log('[SkillsInbox] Messages loaded:', conversationMessages.length);
      setMessages(conversationMessages);
    } catch (error) {
      console.error('[SkillsInbox] Error loading messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId) => {
    if (!user || !conversationId) return;

    // Filter messages only if `messages` array is loaded for the selected conversation
    const unreadMessages = messages.filter(
      msg => msg.recipient_email === user.email && !msg.is_read && msg.conversation_id === conversationId
    );

    if (unreadMessages.length === 0) return;

    try {
      for (const msg of unreadMessages) {
        await base44.entities.SkillsMarketplaceMessage.update(msg.id, {
          is_read: true,
          read_at: new Date().toISOString()
        });
      }

      // Optimistically update the local conversations list for unread count
      setConversations(prev => prev.map(conv =>
        conv.conversation_id === conversationId
          ? { ...conv, unreadCount: 0 }
          : conv
      ));

      // Update the messages state to reflect changes without reloading all messages
      setMessages(prev => prev.map(msg =>
        (msg.recipient_email === user.email && msg.conversation_id === conversationId && !msg.is_read)
          ? { ...msg, is_read: true, read_at: new Date().toISOString() }
          : msg
      ));

    } catch (error) {
      console.error('[SkillsInbox] Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    console.log('[SkillsInbox] Sending message');

    setIsSending(true);
    try {
      // Use the pre-computed display name and avatar from the `user` state
      const messageData = {
        sender_email: user.email,
        recipient_email: selectedConversation.other_user_email,
        conversation_id: selectedConversation.conversation_id,
        skill_id: selectedConversation.skill_id,
        skill_title: selectedConversation.skill_title,
        message_content: newMessage.trim(),
        sender_name: user.displayName,
        sender_avatar: user.displayAvatar,
        recipient_name: selectedConversation.other_user_name,
        recipient_avatar: selectedConversation.other_user_avatar
      };

      const newMsg = await base44.entities.SkillsMarketplaceMessage.create(messageData);
      console.log('[SkillsInbox] Message created:', newMsg.id);

      // Send notification to recipient - use username or full_name, fallback to email
      const displayNameForNotification = user.displayName || user.email.split('@')[0];
      console.log('[SkillsInbox] Sending notification to:', selectedConversation.other_user_email);

      try {
        const notificationResult = await base44.functions.invoke('sendMarketplaceNotification', {
          recipientEmail: selectedConversation.other_user_email,
          type: 'message',
          title: 'New Skills Marketplace Message',
          message: `${displayNameForNotification} sent you a message about "${selectedConversation.skill_title}"`,
          relatedContentId: selectedConversation.skill_id,
          relatedContentType: 'skill',
          actionUrl: `/SkillsInbox?conversation_id=${selectedConversation.conversation_id}`,
          metadata: {
            message_preview: newMessage.trim().substring(0, 100),
            conversation_id: selectedConversation.conversation_id
          }
        });

        console.log('[SkillsInbox] Notification result:', notificationResult.data);

        if (notificationResult.data && notificationResult.data.success) {
          console.log('[SkillsInbox] Notification sent successfully!');
        } else {
          console.error('[SkillsInbox] Notification failed:', notificationResult.data);
        }
      } catch (notifError) {
        console.error('[SkillsInbox] Failed to send notification:', notifError);
        console.error('[SkillsInbox] Notification error details:', notifError.response?.data);
        // Don't fail the message send if notification fails
      }

      setNewMessage('');
      await loadMessages(selectedConversation.conversation_id);
      await loadConversations(); // Reload conversations to update last message and time
    } catch (error) {
      console.error('[SkillsInbox] Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendSkillCard = async (skill) => {
    if (!selectedConversation || isSending) return;

    setIsSending(true);
    try {
      const skillCardMessage = `📦 Service Offering: ${skill.title}\n\n${skill.description}\n\n💰 Price: ${skill.price_type === 'free' ? 'Free' : `$${skill.price_amount}`}\n⏱️ Duration: ${skill.duration_hours || 'Flexible'} hours\n\n[SKILL_CARD:${skill.id}]`;

      const messageData = {
        sender_email: user.email,
        recipient_email: selectedConversation.other_user_email,
        conversation_id: selectedConversation.conversation_id,
        skill_id: skill.id,
        skill_title: skill.title,
        message_content: skillCardMessage,
        sender_name: user.displayName,
        sender_avatar: user.displayAvatar,
        recipient_name: selectedConversation.other_user_name,
        recipient_avatar: selectedConversation.other_user_avatar
      };

      await base44.entities.SkillsMarketplaceMessage.create(messageData);

      try {
        await base44.functions.invoke('sendMarketplaceNotification', {
          recipientEmail: selectedConversation.other_user_email,
          type: 'message',
          title: 'Service Offering Shared',
          message: `${user.displayName} shared a service offering: "${skill.title}"`,
          relatedContentId: skill.id,
          relatedContentType: 'skill',
          actionUrl: `/SkillsInbox?conversation_id=${selectedConversation.conversation_id}`,
          metadata: {
            skill_id: skill.id,
            conversation_id: selectedConversation.conversation_id
          }
        });
      } catch (notifError) {
        console.error('[SkillsInbox] Failed to send notification:', notifError);
      }

      setShowSkillSelector(false);
      await loadMessages(selectedConversation.conversation_id);
      await loadConversations();
    } catch (error) {
      console.error('[SkillsInbox] Error sending skill card:', error);
      alert('Failed to send service offering. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePurchaseFromInbox = async (skillId) => {
    try {
      console.log('[SkillsInbox] Starting purchase for skill:', skillId);

      const loadingToast = document.createElement('div');
      loadingToast.className = 'fixed top-4 right-4 bg-purple-600/90 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
      loadingToast.innerHTML = `
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span>Processing payment...</span>
      `;
      document.body.appendChild(loadingToast);

      const response = await base44.functions.invoke('createSkillCheckout', { skillId });

      if (loadingToast && document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast);
      }

      if (!response || !response.data) {
        throw new Error('No response data from checkout');
      }

      const { data } = response;

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.isFree) {
        // Use window.top to break out of iframe
        window.top.location.href = `${createPageUrl('SkillWorkroom')}?transactionId=${data.transactionId}&payment_success=true`;
      } else if (data.checkoutUrl) {
        // Use window.top to break out of iframe for Stripe Checkout
        window.top.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL or transaction ID returned');
      }
    } catch (error) {
      console.error('[SkillsInbox] Error initiating purchase:', error);
      alert(error.message || 'Failed to initiate purchase. Please try again.');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    return (
      conv.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.other_user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.skill_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const renderMessage = (msg) => {
    if (!user || !selectedConversation) return null;

    const isCurrentUser = msg.sender_email === user.email;

    // Determine if the sender of this specific message is the buyer or seller
    const senderIsBuyer = msg.sender_email === selectedConversation.buyer_email;
    const senderIsSeller = msg.sender_email === selectedConversation.seller_email;

    // Fallback if buyer/seller info isn't available for the conversation
    // This could happen if the message is unrelated to a transaction or transaction data isn't loaded yet.
    let roleLabel = 'User';
    if (senderIsBuyer) {
        roleLabel = 'Buyer';
    } else if (senderIsSeller) {
        roleLabel = 'Seller';
    } else if (msg.sender_email === user.email) {
        // If current user sent message, but we don't have buyer/seller info for them in this conversation context
        roleLabel = 'You';
    }

    // Check if this is a skill card message
    const isSkillCard = msg.message_content.includes('[SKILL_CARD:');
    const skillIdMatch = msg.message_content.match(/\[SKILL_CARD:(.+?)\]/);
    const skillCardId = skillIdMatch ? skillIdMatch[1] : null;

    if (isSkillCard && skillCardId) {
      // Extract details from the message content
      const lines = msg.message_content.split('\n\n');
      const titleLine = lines[0] || '';
      const descriptionLine = lines[1] || '';
      // Assuming Price and Duration are always on lines 2 and 3 after splitting by '\n\n'
      // Example: "💰 Price: $100" and "⏱️ Duration: 5 hours"
      const priceLine = lines.find(line => line.includes('💰 Price:')) || '';
      const durationLine = lines.find(line => line.includes('⏱️ Duration:')) || '';

      const title = titleLine.replace('📦 Service Offering: ', '');
      const description = descriptionLine;


      return (
        <div key={msg.id} className={`flex gap-3 mb-4 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            senderIsBuyer
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
              : 'bg-gradient-to-r from-purple-500 to-pink-500'
          }`}>
            {senderIsBuyer ? (
              <ShoppingBag className="w-4 h-4 text-white" />
            ) : (
              <Briefcase className="w-4 h-4 text-white" />
            )}
          </div>

          <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
            <span className={`text-xs mb-1 ${
              senderIsBuyer ? 'text-blue-400' : 'text-purple-400'
            }`}>
              {roleLabel}
            </span>

            <Card className="dark-card border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Briefcase className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">
                      {title}
                    </h4>
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                  <span>{priceLine.includes('Free') ? 'Free' : priceLine.match(/\$(\d+(\.\d{1,2})?)/)?.[0]}</span>
                  {durationLine.match(/(\d+(\.\d{1,2})?)\s*(hours|hrs)/)?.[0] && (
                    <span>{durationLine.match(/(\d+(\.\d{1,2})?)\s*(hours|hrs)/)?.[0]}</span>
                  )}
                </div>
                {!isCurrentUser && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handlePurchaseFromInbox(skillCardId)}
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Purchase
                    </Button>
                    <Button
                      onClick={() => window.open(`${createPageUrl('SkillsMarket')}?skill=${skillCardId}`, '_blank')}
                      size="sm"
                      variant="outline"
                      className="border-purple-500/30 text-white hover:bg-purple-500/10"
                    >
                      View Details
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <p className="text-xs text-gray-400 mt-1">
              {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`flex gap-3 mb-4 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          senderIsBuyer
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
            : 'bg-gradient-to-r from-purple-500 to-pink-500'
        }`}>
          {senderIsBuyer ? (
            <ShoppingBag className="w-4 h-4 text-white" />
          ) : (
            <Briefcase className="w-4 h-4 text-white" />
          )}
        </div>

        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
          <span className={`text-xs mb-1 ${
            senderIsBuyer ? 'text-blue-400' : 'text-purple-400'
          }`}>
            {roleLabel}
          </span>

          <div className={`p-3 rounded-lg ${isCurrentUser ? 'bg-purple-600' : 'bg-gray-700'}`}>
            <p className="text-white text-sm whitespace-pre-wrap break-words">
              {msg.message_content}
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
          </p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <QuantumFlowLoader message="Loading inbox..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <Link to={createPageUrl('SkillsMarket')}>
              <Button variant="outline" className="mb-2 border-purple-500/30 text-white hover:bg-purple-500/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Skills Market
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-purple-400" />
              Skills Marketplace Inbox
            </h1>
            <p className="text-gray-400 mt-1">Connect with buyers and sellers</p>
          </div>
        </div>

        {/* Warning Alerts */}
        <div className="space-y-3 mb-6">
          <Alert className="bg-blue-900/20 border-blue-500/30">
            <Shield className="w-5 h-5 text-yellow-400" />
            <AlertDescription className="text-blue-200 ml-2">
              <strong>Monitored for Your Safety:</strong> All conversations in the Skills Marketplace are monitored by EqoFlow
              administrators to prevent fraud and protect both buyers and sellers.
            </AlertDescription>
          </Alert>

          <Alert className="bg-red-900/20 border-red-500/30">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <AlertDescription className="text-red-200 ml-2">
              <strong>Payment Warning:</strong> NEVER send payment outside of EqoFlow! All transactions must go through our secure
              escrow system. If a seller requests payment via external methods (PayPal, Venmo, crypto wallets, etc.), it is likely a scam.
              EqoFlow holds no responsibility for payments made outside our platform.
            </AlertDescription>
          </Alert>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="dark-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Conversations</span>
                {conversations.length > 0 && (
                  <Badge className="bg-purple-500">{conversations.length}</Badge>
                )}
              </CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/30 border-gray-700 text-white"
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto space-y-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Start chatting with sellers!</p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div
                    key={conv.conversation_id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 rounded-lg cursor-pointer border transition-all ${
                      selectedConversation?.conversation_id === conv.conversation_id
                        ? 'bg-purple-500/10 border-purple-500'
                        : 'border-gray-700 hover:border-purple-600 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {conv.other_user_avatar ? (
                        <img
                          src={conv.other_user_avatar}
                          alt={conv.other_user_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                          {conv.other_user_name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white truncate">
                            {conv.other_user_name || conv.other_user_email}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white ml-2">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>

                        {conv.skill_title && (
                          <p className="text-xs text-purple-400 truncate">
                            Re: {conv.skill_title}
                          </p>
                        )}

                        <p className="text-sm text-gray-400 truncate mt-1">
                          {conv.lastMessage}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {conv.lastMessageTime ? format(new Date(conv.lastMessageTime), 'MMM d, h:mm a') : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Messages View */}
          <Card className="dark-card lg:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    {selectedConversation.other_user_avatar ? (
                      <img
                        src={selectedConversation.other_user_avatar}
                        alt={selectedConversation.other_user_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {selectedConversation.other_user_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {selectedConversation.other_user_name || selectedConversation.other_user_email}
                      </h3>
                      {selectedConversation.skill_title && (
                        <p className="text-sm text-purple-400">
                          Regarding: {selectedConversation.skill_title}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Current Skill Info Card */}
                  {currentSkillDetails && (
                    <Card className="mt-4 border-purple-500/30 bg-purple-500/5">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">{currentSkillDetails.title}</h4>
                            <p className="text-sm text-gray-300 line-clamp-2 mb-2">{currentSkillDetails.description}</p>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-green-400 font-semibold">
                                {currentSkillDetails.price_type === 'free' ? 'Free' : `$${currentSkillDetails.price_amount}`}
                              </span>
                              {currentSkillDetails.duration_hours && (
                                <span className="text-gray-400">{currentSkillDetails.duration_hours} hrs</span>
                              )}
                            </div>
                          </div>
                          {user.email !== currentSkillDetails.created_by && (
                            <Button
                              onClick={() => handlePurchaseFromInbox(currentSkillDetails.id)}
                              size="sm"
                              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 flex-shrink-0"
                            >
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Purchase
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardHeader>

                <CardContent className="h-[500px] flex flex-col p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(renderMessage)}
                    <div ref={chatEndRef} /> {/* For auto-scrolling to bottom */}
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-gray-700 p-4">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      {selectedConversation && sellerSkills.length > 0 && (
                        <Button
                          type="button"
                          onClick={() => setShowSkillSelector(true)}
                          variant="outline"
                          size="icon"
                          className="border-purple-500/30 text-white hover:bg-purple-500/10"
                          title="Share a service offering"
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      )}
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-black/30 border-gray-700 text-white"
                        disabled={isSending}
                      />
                      <Button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isSending ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-white mb-2">Select a Conversation</h3>
                  <p>Choose a conversation from the left to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Skill Selector Dialog */}
      <Dialog open={showSkillSelector} onOpenChange={setShowSkillSelector}>
        <DialogContent className="dark-card max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Share a Service Offering</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 mt-4">
            {sellerSkills.map((skill) => (
              <Card
                key={skill.id}
                className="dark-card border-purple-500/30 cursor-pointer hover:border-purple-500/50 transition-all"
                onClick={() => handleSendSkillCard(skill)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{skill.title}</h4>
                      <p className="text-sm text-gray-300 line-clamp-2 mb-2">{skill.description}</p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-green-400 font-semibold">
                          {skill.price_type === 'free' ? 'Free' : `$${skill.price_amount}`}
                        </span>
                        {skill.duration_hours && (
                          <span className="text-gray-400">{skill.duration_hours} hrs</span>
                        )}
                        <Badge className="bg-purple-500/20 text-purple-300">{skill.category}</Badge>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
