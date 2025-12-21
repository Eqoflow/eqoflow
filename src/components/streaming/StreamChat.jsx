import React, { useState, useEffect, useRef } from 'react';
import { StreamChat as StreamChatEntity } from '@/entities/StreamChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, MessageCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function StreamChat({ streamId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll for new messages every 5 seconds
    return () => clearInterval(interval);
  }, [streamId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!streamId) return;
    try {
      const fetchedMessages = await StreamChatEntity.filter({ stream_id: streamId }, 'created_date', 100);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await StreamChatEntity.create({
        stream_id: streamId,
        message: newMessage,
        username: user.full_name || user.email.split('@')[0],
      });
      setNewMessage('');
      fetchMessages(); // Immediately fetch after sending
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <Card className="dark-card h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-400" />
          Live Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-2 space-y-3">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-start"
            >
              <div className="text-xs text-purple-400 font-bold mb-0.5">{msg.username}</div>
              <div className="bg-black/20 text-white p-2 rounded-lg text-sm max-w-full break-words">
                {msg.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </CardContent>
      <div className="p-4 border-t border-purple-500/20">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Send a message..."
            className="bg-black/20 border-purple-500/20 text-white"
            disabled={!user}
          />
          <Button type="submit" disabled={!user || !newMessage.trim()} className="bg-gradient-to-r from-purple-600 to-pink-500">
            <Send className="w-4 h-4" />
          </Button>
        </form>
        {!user && <p className="text-xs text-gray-500 mt-2 text-center">Please log in to chat.</p>}
      </div>
    </Card>
  );
}