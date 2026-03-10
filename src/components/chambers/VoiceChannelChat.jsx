import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

export default function VoiceChannelChat({ user, allParticipants, memberProfiles }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [mentionQuery, setMentionQuery] = useState(null); // null or string
  const [mentionStart, setMentionStart] = useState(-1);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const localProfile = memberProfiles.find(p => p.email === user.email);
  const senderName = localProfile?.full_name || user.full_name || 'Anonymous';

  // All mentionable names derived from participants
  const mentionableNames = allParticipants.map(p => p.name).filter(Boolean);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    // Detect @ mention
    const cursorPos = e.target.selectionStart;
    const textUpToCursor = val.slice(0, cursorPos);
    const atIdx = textUpToCursor.lastIndexOf('@');

    if (atIdx !== -1) {
      const query = textUpToCursor.slice(atIdx + 1);
      // Only show suggestions if no space after @
      if (!query.includes(' ')) {
        setMentionQuery(query);
        setMentionStart(atIdx);
        return;
      }
    }
    setMentionQuery(null);
    setMentionStart(-1);
  };

  const filteredMentions = mentionQuery !== null
    ? mentionableNames.filter(name =>
        name.toLowerCase().startsWith(mentionQuery.toLowerCase()) && name !== senderName
      )
    : [];

  const handleSelectMention = (name) => {
    const before = inputValue.slice(0, mentionStart);
    const after = inputValue.slice(mentionStart + 1 + mentionQuery.length);
    const newVal = `${before}@${name} ${after}`;
    setInputValue(newVal);
    setMentionQuery(null);
    setMentionStart(-1);
    inputRef.current?.focus();
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    const msg = {
      id: Date.now(),
      sender: senderName,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, msg]);
    setInputValue('');
    setMentionQuery(null);
    setMentionStart(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      setMentionQuery(null);
    }
  };

  // Render message text with highlighted @mentions
  const renderText = (text) => {
    const parts = text.split(/(@\S+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} style={{ color: '#00e5a0', fontWeight: 600 }}>{part}</span>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Toggle button — top right, only visible when sharing/video */}
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 20,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: isOpen ? 'rgba(0,229,160,0.2)' : 'rgba(255,255,255,0.07)',
          border: `1px solid ${isOpen ? 'rgba(0,229,160,0.5)' : 'rgba(255,255,255,0.1)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        title={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen
          ? <X style={{ width: 15, height: 15, color: '#00e5a0' }} />
          : <MessageSquare style={{ width: 15, height: 15, color: '#9ca3af' }} />
        }
        {!isOpen && messages.length > 0 && (
          <div style={{
            position: 'absolute', top: -3, right: -3,
            width: 8, height: 8, borderRadius: '50%',
            background: '#00e5a0',
          }} />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 60,
            zIndex: 20,
            width: 260,
            height: 380,
            display: 'flex',
            flexDirection: 'column',
            background: '#0c0e14',
            border: '1px solid rgba(0,229,160,0.15)',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <MessageSquare style={{ width: 12, height: 12, color: '#00e5a0' }} />
            <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Channel Chat
            </span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {messages.length === 0 && (
              <p style={{ color: '#374151', fontSize: 11, textAlign: 'center', marginTop: 16 }}>
                No messages yet. Say hello!
              </p>
            )}
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ color: '#00e5a0', fontSize: 11, fontWeight: 700 }}>{msg.sender}</span>
                  <span style={{ color: '#374151', fontSize: 9 }}>{msg.time}</span>
                </div>
                <span style={{ color: '#d1d5db', fontSize: 12, lineHeight: 1.4 }}>
                  {renderText(msg.text)}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Mention suggestions */}
          {filteredMentions.length > 0 && (
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: '#0a0c10',
              maxHeight: 100,
              overflowY: 'auto',
            }}>
              {filteredMentions.map(name => (
                <button
                  key={name}
                  onClick={() => handleSelectMention(name)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '5px 10px',
                    fontSize: 11,
                    color: '#9ca3af',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,160,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: '#00e5a0', fontSize: 10 }}>@</span>
                  <span>{name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '6px 8px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message... (@ to mention)"
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: 11,
                color: '#e5e7eb',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: inputValue.trim() ? 'rgba(0,229,160,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${inputValue.trim() ? 'rgba(0,229,160,0.3)' : 'rgba(255,255,255,0.05)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'default',
                flexShrink: 0,
              }}
            >
              <Send style={{ width: 12, height: 12, color: inputValue.trim() ? '#00e5a0' : '#374151' }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}