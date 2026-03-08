import React, { useState } from 'react';
import { Hash, Volume2, ChevronDown, Mic, MicOff, PhoneOff, Plus, Users } from 'lucide-react';
import CommunityChannelChat from './CommunityChannelChat';

const DEFAULT_TEXT_CHANNELS = [
  { id: 'general', name: 'general', type: 'text' },
  { id: 'announcements', name: 'announcements', type: 'text' },
];

const DEFAULT_VOICE_CHANNELS = [
  { id: 'lounge', name: 'General Voice', type: 'voice' },
  { id: 'watch-party', name: 'Watch Party', type: 'voice' },
];

function playJoinSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

export default function CommunityDiscordView({
  community,
  user,
  isMember,
  isCreator,
  memberProfiles,
  communityPosts,
  latestActivities,
  onEditPost,
}) {
  const [activeChannel, setActiveChannel] = useState('general');
  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showMembers, setShowMembers] = useState(true);

  const textChannels = community.channels
    ? community.channels.filter((c) => c.type === 'text' || c.type === 'announcement')
    : DEFAULT_TEXT_CHANNELS;

  const voiceChannels = community.channels
    ? community.channels.filter((c) => c.type === 'voice')
    : DEFAULT_VOICE_CHANNELS;

  const handleJoinVoice = (channel) => {
    if (activeVoiceChannel?.id === channel.id) return;
    playJoinSound();
    setActiveVoiceChannel(channel);
  };

  const handleLeaveVoice = () => setActiveVoiceChannel(null);

  const activeChannelName = textChannels.find((c) => c.id === activeChannel)?.name || 'general';

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-xl overflow-hidden border border-white/10" style={{ background: '#0d1117' }}>

      {/* ── Left Sidebar ── */}
      <div className="w-52 flex-shrink-0 flex flex-col border-r border-white/5" style={{ background: '#111318' }}>
        {/* Community name */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-white font-bold text-sm truncate">{community.name}</h2>
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {/* Text Channels */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#00e5a0' }}>
                Text Channels
              </span>
              <Plus className="w-3.5 h-3.5 text-gray-500 hover:text-white cursor-pointer" />
            </div>
            {textChannels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-all duration-150 ${
                  activeChannel === ch.id
                    ? 'text-white font-medium'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Hash className="w-3.5 h-3.5 flex-shrink-0" style={{ color: activeChannel === ch.id ? '#00e5a0' : undefined }} />
                <span className="truncate">{ch.name}</span>
                {activeChannel !== ch.id && <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-gray-500" />}
              </button>
            ))}
          </div>

          {/* Voice Channels */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#00e5a0' }}>
                Voice Channels
              </span>
              <Plus className="w-3.5 h-3.5 text-gray-500 hover:text-white cursor-pointer" />
            </div>
            {voiceChannels.map((ch) => (
              <div key={ch.id}>
                <button
                  onClick={() => handleJoinVoice(ch)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-all duration-150 rounded-md mx-1 ${
                    activeVoiceChannel?.id === ch.id
                      ? 'text-white font-medium'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  style={activeVoiceChannel?.id === ch.id ? { background: 'rgba(0,229,160,0.12)' } : {}}
                >
                  <Volume2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: activeVoiceChannel?.id === ch.id ? '#00e5a0' : undefined }} />
                  <span className="truncate">{ch.name}</span>
                  <Plus className="w-3 h-3 ml-auto text-gray-500" />
                </button>
                {activeVoiceChannel?.id === ch.id && user && (
                  <div className="ml-8 flex items-center gap-2 px-2 py-1">
                    <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#00e5a0' }}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[8px] text-black font-bold flex items-center justify-center h-full">
                          {user.full_name?.[0] || '?'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 truncate">AFK {user.full_name?.split(' ')[0] || 'You'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Voice controls */}
        {activeVoiceChannel && (
          <div className="px-3 py-2 border-t border-white/5 flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs font-medium" style={{ color: '#00e5a0' }}>Connected</p>
              <p className="text-gray-500 text-[10px] truncate">{activeVoiceChannel.name}</p>
            </div>
            <button onClick={() => setIsMuted(!isMuted)} className={`p-1 rounded ${isMuted ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}>
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <button onClick={handleLeaveVoice} className="p-1 rounded text-red-400 hover:text-red-300">
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* User bar */}
        {user && (
          <div className="px-3 py-2 border-t border-white/5 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#00e5a0' }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-black font-bold flex items-center justify-center h-full">
                  {user.full_name?.[0] || '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.full_name || 'You'}</p>
              <p className="text-gray-500 text-[10px]">{isCreator ? 'Creator' : isMember ? 'Member' : ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Center ── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#13161c' }}>
        {/* Welcome banner */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center py-4 px-4 border-b border-white/5">
          <div className="border rounded-full px-6 py-2 text-center" style={{ borderColor: '#00e5a0', background: 'rgba(0,229,160,0.04)' }}>
            <h1 className="text-white font-bold text-lg leading-tight">Welcome to EqoChambers</h1>
            <p className="text-gray-400 text-xs mt-0.5">Connect, share, and build communities around your passions.</p>
          </div>
        </div>

        {/* Channel label + toggle */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Hash className="w-4 h-4" style={{ color: '#00e5a0' }} />
            <span className="text-white text-sm font-semibold">{activeChannelName}</span>
          </div>
          <button
            onClick={() => setShowMembers(!showMembers)}
            className={`p-1.5 rounded transition-colors ${showMembers ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            style={showMembers ? { color: '#00e5a0' } : {}}
          >
            <Users className="w-4 h-4" />
          </button>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <CommunityChannelChat
            community={community}
            user={user}
            channelId={activeChannel}
            channelName={activeChannelName}
          />
        </div>
      </div>

      {/* ── Right Sidebar ── */}
      {showMembers && (
        <div className="w-56 flex-shrink-0 overflow-y-auto py-3 space-y-4 border-l border-white/5" style={{ background: '#111318' }}>

          {/* Media Gallery */}
          {communityPosts?.some(p => p.media_urls?.length > 0) && (
            <div className="px-3">
              <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#00e5a0' }}>Media Gallery</p>
              <div className="grid grid-cols-2 gap-1">
                {communityPosts
                  .filter(p => p.media_urls?.length > 0)
                  .flatMap(p => p.media_urls)
                  .slice(0, 4)
                  .map((url, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-black/30">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Latest Updates */}
          {latestActivities?.length > 0 && (
            <div className="px-3">
              <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#00e5a0' }}>Latest Updates</p>
              <div className="space-y-2">
                {latestActivities.slice(0, 2).map((a, i) => (
                  <div key={i} className="rounded-lg p-2 flex items-start gap-2" style={{ background: '#1a1d24' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-300 text-[11px] leading-snug line-clamp-3">
                        <span className="text-white font-semibold">{a.name}:</span> {a.action}
                      </p>
                    </div>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(0,229,160,0.15)' }}>
                      <ChevronDown className="w-3 h-3" style={{ color: '#00e5a0' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pinned Echoes */}
          {communityPosts?.some(p => p.is_pinned) && (
            <div className="px-3">
              <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#00e5a0' }}>Pinned Echoes</p>
              <div className="space-y-2">
                {communityPosts.filter(p => p.is_pinned).slice(0, 2).map((post) => (
                  <div key={post.id} className="rounded-lg p-2 flex items-start gap-2" style={{ background: '#1a1d24' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[11px] leading-snug line-clamp-2">
                        <span className="text-white font-semibold">{post.author_full_name}:</span>{' '}
                        {post.content?.slice(0, 60)}{post.content?.length > 60 ? '…' : ''}
                      </p>
                    </div>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(139,92,246,0.2)' }}>
                      <span className="text-purple-300 text-[9px]">📌</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Active Members */}
          <div className="px-3">
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#00e5a0' }}>Recently Active Members</p>
            <div className="space-y-1">
              {memberProfiles.slice(0, 5).map((member) => (
                <div key={member.email} className="flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={{ background: '#00e5a0' }}>
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-black font-bold">{member.full_name?.[0] || '?'}</span>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border border-[#111318]" />
                  </div>
                  <span className="text-sm text-gray-300 truncate flex-1">{member.full_name || member.email.split('@')[0]}</span>
                  <span className="text-gray-600 text-xs">✏</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}