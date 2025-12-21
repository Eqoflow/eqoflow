import React, { useState, useEffect, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { UserContext } from '../components/contexts/UserContext';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Search, User as UserIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { maskEmail } from '../components/utils/maskData';

export default function Messages() {
  const { user } = useContext(UserContext);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      const interval = setInterval(() => loadMessages(selectedConversation.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const [sent, received] = await Promise.all([
        base44.entities.DirectMessage.filter({ created_by: user.email }),
        base44.entities.DirectMessage.filter({ recipient_email: user.email })
      ]);

      const allMessages = [...sent, ...received];
      const conversationMap = new Map();

      for (const msg of allMessages) {
        const otherUserEmail = msg.created_by === user.email ? msg.recipient_email : msg.created_by;
        
        if (!conversationMap.has(msg.conversation_id)) {
          // Mask the other user's email
          const maskedEmail = await maskEmail(otherUserEmail);
          
          conversationMap.set(msg.conversation_id, {
            id: msg.conversation_id,
            otherUserEmail: maskedEmail,
            lastMessage: msg.content,
            lastMessageTime: msg.created_date,
            unreadCount: 0
          });
        } else {
          const conv = conversationMap.get(msg.conversation_id);
          if (new Date(msg.created_date) > new Date(conv.lastMessageTime)) {
            conv.lastMessage = msg.content;
            conv.lastMessageTime = msg.created_date;
          }
        }

        if (msg.recipient_email === user.email && !msg.is_read) {
          conversationMap.get(msg.conversation_id).unreadCount++;
        }
      }

      const convList = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

      setConversations(convList);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const msgs = await base44.entities.DirectMessage.filter(
        { conversation_id: conversationId },
        "created_date"
      );

      // Mark messages as read
      const unreadMessages = msgs.filter(
        m => m.recipient_email === user.email && !m.is_read
      );
      
      for (const msg of unreadMessages) {
        await base44.entities.DirectMessage.update(msg.id, { 
          is_read: true, 
          read_at: new Date().toISOString() 
        });
      }

      setMessages(msgs);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setIsSending(true);
      await base44.entities.DirectMessage.create({
        recipient_email: selectedConversation.otherUserEmail,
        content: newMessage.trim(),
        conversation_id: selectedConversation.id,
        message_type: "text"
      });

      setNewMessage("");
      await loadMessages(selectedConversation.id);
      await loadConversations();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUserEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-120px)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {/* Conversations List */}
        <Card className="dark-card md:col-span-1 flex flex-col h-full">
          <CardHeader className="border-b border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                Messages
              </h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/20 border-purple-500/20 text-white"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-purple-500/10 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-purple-500/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-white truncate">
                            {conv.otherUserEmail}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-purple-600 text-white ml-2">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(conv.lastMessageTime), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages View */}
        <Card className="dark-card md:col-span-2 flex flex-col h-full">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b border-purple-500/20">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{selectedConversation.otherUserEmail}</p>
                    <p className="text-sm text-gray-400">Active now</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.created_by === user.email ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.created_by === user.email
                            ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                            : 'bg-black/40 text-white border border-purple-500/20'
                        }`}
                      >
                        <p className="break-words">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.created_by === user.email ? 'text-purple-100' : 'text-gray-500'
                        }`}>
                          {format(new Date(msg.created_date), "h:mm a")}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>

              <div className="p-4 border-t border-purple-500/20">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-black/20 border-purple-500/20 text-white"
                    disabled={isSending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="bg-gradient-to-r from-purple-600 to-pink-500"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
                <p className="text-gray-400">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}