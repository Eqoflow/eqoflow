import React, { useState } from 'react';
import { Hash, Volume2, Users, ChevronDown, Mic, MicOff, PhoneOff } from 'lucide-react';
import CommunityChannelChat from './CommunityChannelChat';

const DEFAULT_TEXT_CHANNELS = [
  { id: 'general', name: 'general', type: 'text' },
  { id: 'announcements', name: 'announcements', type: 'text' },
];

const DEFAULT_VOICE_CHANNELS = [
  { id: 'lounge', name: 'Lounge', type: 'voice' },
  { id: 'gaming', name: 'Gaming', type: 'voice' },
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
  } catch (e) {
    // silently fail if audio not supported
  }
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

  const handleLeaveVoice = () => {
    setActiveVoiceChannel(null);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-xl overflow-hidden border border-white/10 bg-[#1e1f22]">
      {/* Channel Sidebar */}
      <div className="w-60 flex-shrink-0 bg-[#2b2d31] flex flex-col">
        {/* Server Name */}
        <div className="px-4 py-3 border-b border-black/30 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
          <h2 className="text-white font-semibold text-sm truncate">{community.name}</h2>
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Text Channels */}
          <div className="mb-2">
            <div className="px-4 py-1 flex items-center gap-1">
              <ChevronDown className="w-3 h-3 text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Text Channels</span>
            </div>
            {textChannels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 mx-1 rounded text-sm transition-colors ${
                  activeChannel === ch.id
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Hash className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>

          {/* Voice Channels */}
          <div>
            <div className="px-4 py-1 flex items-center gap-1">
              <ChevronDown className="w-3 h-3 text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Voice Channels</span>
            </div>
            {voiceChannels.map((ch) => (
              <div key={ch.id}>
                <button
                  onClick={() => handleJoinVoice(ch)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 mx-1 rounded text-sm transition-colors ${
                    activeVoiceChannel?.id === ch.id
                      ? 'bg-white/10 text-green-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <Volume2 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{ch.name}</span>
                </button>
                {/* Show user avatar in voice channel when joined */}
                {activeVoiceChannel?.id === ch.id && user && (
                  <div className="ml-8 mb-1 flex items-center gap-2 px-2 py-1">
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-white font-bold">
                          {user.full_name?.[0] || '?'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-green-400 truncate">
                      {user.full_name || 'You'}
                    </span>
                    {isMuted && <MicOff className="w-3 h-3 text-red-400 flex-shrink-0" />}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Voice Controls (when in a voice channel) */}
        {activeVoiceChannel && (
          <div className="bg-[#232428] px-3 py-2 flex items-center gap-2 border-t border-black/30">
            <div className="flex-1">
              <p className="text-green-400 text-xs font-medium">Voice Connected</p>
              <p className="text-gray-400 text-[11px] truncate">{activeVoiceChannel.name}</p>
            </div>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 rounded transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10 text-gray-400'}`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLeaveVoice}
              className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User info bar */}
        {user && (
          <div className="bg-[#232428] px-3 py-2 flex items-center gap-2 border-t border-black/30">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-white font-bold">{user.full_name?.[0] || '?'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.full_name || 'You'}</p>
              <p className="text-gray-400 text-[10px]">{isMember ? 'Member' : isCreator ? 'Creator' : ''}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#313338] overflow-hidden">
        {/* Channel Header */}
        <div className="px-4 py-3 border-b border-black/30 flex items-center gap-2 flex-shrink-0">
          <Hash className="w-5 h-5 text-gray-400" />
          <span className="text-white font-semibold">
            {textChannels.find((c) => c.id === activeChannel)?.name || 'general'}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`p-1.5 rounded transition-colors ${showMembers ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <CommunityChannelChat
            community={community}
            user={user}
            channelId={activeChannel}
            channelName={textChannels.find((c) => c.id === activeChannel)?.name || 'general'}
          />
        </div>
      </div>

      {/* Right Sidebar */}
      {showMembers && (
        <div className="w-56 flex-shrink-0 bg-[#2b2d31] overflow-y-auto py-3 space-y-3">

          {/* Media Gallery */}
          {communityPosts?.some(p => p.media_urls?.length > 0) && (
            <div className="px-3">
              <p className="text-[11px] font-semibold text-[#00e5a0] uppercase tracking-wider mb-2">Media Gallery</p>
              <div className="grid grid-cols-2 gap-1">
                {communityPosts
                  .filter(p => p.media_urls?.length > 0)
                  .flatMap(p => p.media_urls)
                  .slice(0, 4)
                  .map((url, i) => (
                    <div key={i} className="aspect-square rounded overflow-hidden bg-black/30">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Latest Updates */}
          {latestActivities?.length > 0 && (
            <div className="px-3">
              <p className="text-[11px] font-semibold text-[#00e5a0] uppercase tracking-wider mb-2">Latest Updates</p>
              <div className="space-y-2">
                {latestActivities.slice(0, 2).map((a, i) => (
                  <div key={i} className="bg-[#1e1f22] rounded-lg p-2 flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-300 text-[11px] leading-snug line-clamp-3">
                        <span className="text-white font-medium">{a.name}:</span> {a.action}
                      </p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#00e5a0]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#00e5a0] text-[9px]">↓</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pinned Echoes */}
          {communityPosts?.some(p => p.is_pinned) && (
            <div className="px-3">
              <p className="text-[11px] font-semibold text-[#00e5a0] uppercase tracking-wider mb-2">Pinned Echoes</p>
              <div className="space-y-2">
                {communityPosts.filter(p => p.is_pinned).slice(0, 2).map((post) => (
                  <div key={post.id} className="bg-[#1e1f22] rounded-lg p-2 flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[11px] leading-snug line-clamp-2">
                        <span className="text-white font-medium">{post.author_full_name}:</span>{' '}
                        {post.content?.slice(0, 60)}{post.content?.length > 60 ? '…' : ''}
                      </p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-300 text-[9px]">📌</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Active Members */}
          <div className="px-3">
            <p className="text-[11px] font-semibold text-[#00e5a0] uppercase tracking-wider mb-2">Recently Active Members</p>
            <div className="space-y-1">
              {memberProfiles.slice(0, 5).map((member) => (
                <div key={member.email} className="flex items-center gap-2 py-1 hover:bg-white/5 rounded px-1 transition-colors">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center overflow-hidden">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-white font-bold">{member.full_name?.[0] || '?'}</span>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-[#2b2d31]" />
                  </div>
                  <span className="text-sm text-gray-300 truncate flex-1">{member.full_name || member.email.split('@')[0]}</span>
                  <span className="text-gray-500 text-xs">✏</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}