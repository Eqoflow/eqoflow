import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Image as ImageIcon, Smile } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommunityChannelChat({ community, user, channelId, channelName }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = async () => {
    try {
      const msgs = await base44.entities.CommunityMessage.filter(
        { community_id: community.id, channel_id: channelId },
        'created_date',
        50
      );
      setMessages(msgs);
    } catch (e) {
      console.error('Error loading messages:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadMessages();

    const unsubscribe = base44.entities.CommunityMessage.subscribe((event) => {
      if (event.data?.community_id === community.id && event.data?.channel_id === channelId) {
        if (event.type === 'create') {
          setMessages((prev) => [...prev, event.data]);
        } else if (event.type === 'delete') {
          setMessages((prev) => prev.filter((m) => m.id !== event.id));
        }
      }
    });

    return unsubscribe;
  }, [community.id, channelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isSending || !user) return;

    setIsSending(true);
    setInputValue('');
    try {
      await base44.entities.CommunityMessage.create({
        community_id: community.id,
        channel_id: channelId,
        content: trimmed,
        author_email: user.email,
        author_name: user.full_name || user.email.split('@')[0],
        author_avatar_url: user.avatar_url || null,
      });
    } catch (e) {
      console.error('Error sending message:', e);
      setInputValue(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group consecutive messages from same author
  const groupedMessages = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const isGrouped =
      prev &&
      prev.author_email === msg.author_email &&
      new Date(msg.created_date) - new Date(prev.created_date) < 5 * 60 * 1000;
    acc.push({ ...msg, isGrouped });
    return acc;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">#</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Welcome to #{channelName}!</h3>
            <p className="text-gray-400 text-sm">This is the start of the #{channelName} channel.</p>
          </div>
        ) : (
          groupedMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 group hover:bg-white/[0.02] rounded px-2 py-0.5 ${
                msg.isGrouped ? 'mt-0.5' : 'mt-3'
              }`}
            >
              {/* Avatar or spacer */}
              {!msg.isGrouped ? (
                <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0 mt-0.5">
                  {msg.author_avatar_url ? (
                    <img src={msg.author_avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm text-white font-bold">
                      {msg.author_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-9 flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                {!msg.isGrouped && (
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-white text-sm font-semibold hover:underline cursor-pointer">
                      {msg.author_name}
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                    </span>
                  </div>
                )}
                {msg.media_url && (
                  <img
                    src={msg.media_url}
                    alt="attachment"
                    className="max-w-xs rounded-lg mb-1 mt-1"
                  />
                )}
                <p className="text-gray-200 text-sm leading-relaxed break-words">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#383a40] rounded-lg px-3 py-2.5">
          <button className="text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0">
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channelName}`}
            className="flex-1 bg-transparent text-gray-200 text-sm outline-none placeholder-gray-500"
            disabled={!user}
          />
          <button className="text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0">
            <Smile className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending || !user}
            className="text-gray-400 hover:text-purple-400 transition-colors flex-shrink-0 disabled:opacity-40"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}