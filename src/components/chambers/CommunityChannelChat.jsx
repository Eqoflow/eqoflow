import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Mic, X } from 'lucide-react';
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
        if (event.type === 'create') setMessages((prev) => [...prev, event.data]);
        else if (event.type === 'delete') setMessages((prev) => prev.filter((m) => m.id !== event.id));
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

  const getDateLabel = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isAnnouncement = channelName === 'announcements';
  const isOwnMessage = (msg) => msg.author_email === user?.email;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#00e5a0' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)' }}>
              <span className="text-xl" style={{ color: '#00e5a0' }}>#</span>
            </div>
            <h3 className="text-white font-bold text-base mb-1">Start the conversation</h3>
            <p className="text-gray-500 text-sm">Be the first to say something in #{channelName}</p>
          </div>
        ) : (
          <>
            {groupedMessages.reduce((acc, msg, i) => {
              const prev = groupedMessages[i - 1];
              if (!prev || new Date(msg.created_date).toDateString() !== new Date(prev.created_date).toDateString()) {
                acc.push(
                  <div key={`divider-${i}`} className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <span className="text-[10px] px-2.5 py-1 rounded-full flex-shrink-0 font-medium"
                      style={{ background: '#13151c', color: '#4b5563', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {getDateLabel(msg.created_date)}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                );
              }

              const own = isOwnMessage(msg);

              if (isAnnouncement) {
                acc.push(
                  <div key={msg.id}
                    className={`rounded-xl px-4 py-3 ${msg.isGrouped ? 'mt-1' : 'mt-3'}`}
                    style={{ background: '#12151f', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #00e5a0' }}>
                    {!msg.isGrouped && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#00e5a0' }}>
                          {msg.author_avatar_url
                            ? <img src={msg.author_avatar_url} alt="" className="w-full h-full object-cover" />
                            : <span className="text-[8px] text-black font-bold">{msg.author_name?.[0]}</span>}
                        </div>
                        <span className="text-white text-xs font-semibold">{msg.author_name}</span>
                        <span className="text-gray-600 text-[10px]">{formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}</span>
                      </div>
                    )}
                    {msg.media_url && <img src={msg.media_url} alt="attachment" className="rounded-xl mb-2 max-w-xs" />}
                    <p className="text-sm leading-relaxed" style={{ color: '#c9d1d9' }}>{msg.content}</p>
                  </div>
                );
              } else {
                acc.push(
                  <div key={msg.id} className={`flex items-end gap-3 ${msg.isGrouped ? 'mt-0.5' : 'mt-4'}`}>
                    {!msg.isGrouped ? (
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#00e5a0' }}>
                        {msg.author_avatar_url
                          ? <img src={msg.author_avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-sm text-black font-bold">{msg.author_name?.[0]?.toUpperCase() || '?'}</span>}
                      </div>
                    ) : (
                      <div className="w-9 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 max-w-[75%]">
                      {!msg.isGrouped && (
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-white text-xs font-semibold">{msg.author_name}</span>
                          {own && <span className="text-[9px] px-1.5 py-0.5 rounded-full leading-none" style={{ background: 'rgba(0,229,160,0.1)', color: '#00e5a0' }}>you</span>}
                          <span className="text-gray-600 text-[10px]">{formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}</span>
                        </div>
                      )}
                      {msg.media_url && <img src={msg.media_url} alt="attachment" className="rounded-xl mb-1.5 max-w-xs" />}
                      <div
                        className="inline-block px-4 py-2 rounded-2xl rounded-bl-sm text-sm leading-relaxed break-words"
                        style={{
                          background: own ? '#141e2e' : '#1e2129',
                          color: own ? '#c8ddf0' : '#e2e8f0',
                          border: own ? '1px solid rgba(59,130,246,0.12)' : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              }

              return acc;
            }, [])}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 flex-shrink-0 space-y-2">
        {/* Text input */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-gray-500 text-xs font-medium flex-shrink-0">GIF</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`# ${channelName}...`}
            className="flex-1 bg-transparent text-gray-200 text-sm outline-none placeholder-gray-600"
            disabled={!user}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending || !user}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30"
            style={{ background: '#00e5a0' }}
          >
            <Plus className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Voice bar */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-gray-500 text-xs truncate flex-1">Message # {channelName}...</span>
          {/* Waveform decoration */}
          <div className="flex items-center gap-px flex-shrink-0">
            {[3, 5, 8, 5, 9, 4, 7, 5, 3, 6, 4, 8, 3].map((h, i) => (
              <div
                key={i}
                className="w-0.5 rounded-full"
                style={{ height: `${h}px`, background: '#00e5a0', opacity: 0.6 }}
              />
            ))}
          </div>
          <button className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ml-1" style={{ background: '#00e5a0' }}>
            <Mic className="w-3.5 h-3.5 text-black" />
          </button>
          <button className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.2)' }}>
            <X className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}