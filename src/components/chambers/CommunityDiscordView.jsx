import React, { useState } from 'react';
import {
  Hash, Volume2, ChevronDown, ChevronRight,
  Mic, MicOff, PhoneOff, PanelLeft,
  Home, MessageSquare, Settings, Layers,
  Plus, Pencil, Check, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import CommunityChannelChat from './CommunityChannelChat';
import VoiceChannelRoom from './VoiceChannelRoom';

const DEFAULT_TEXT_CHANNELS = [
  { id: 'general', name: 'general', type: 'text' },
  { id: 'announcements', name: 'announcements', type: 'text' },
];
const DEFAULT_VOICE_CHANNELS = [
  { id: 'lounge', name: 'General Voice', type: 'voice' },
  { id: 'watch-party', name: 'Watch Party', type: 'voice' },
];

const NAV_ITEMS = [
  { label: 'Home',     icon: Home,            page: 'Communities' },
  { label: 'Chambers', icon: Layers,          page: 'Communities', highlight: true },
  { label: 'DMs',      icon: MessageSquare,   page: 'Messages' },
  { label: 'Settings', icon: Settings,        page: 'Profile' },
];

function playJoinSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

export default function CommunityDiscordView({
  community, user, isMember, isCreator,
  memberProfiles, communityPosts, latestActivities,
  onUpdateChannels,
}) {
  const [activeChannel, setActiveChannel]       = useState('general');
  const [activeVoice, setActiveVoice]           = useState(null);
  const [isMuted, setIsMuted]                   = useState(false);
  const [panelOpen, setPanelOpen]               = useState(true);
  const [updatesOpen, setUpdatesOpen]           = useState(false);
  const [membersOpen, setMembersOpen]           = useState(false);

  // Channel management state
  const [editingChannelId, setEditingChannelId] = useState(null);
  const [editingChannelName, setEditingChannelName] = useState('');
  const [addingType, setAddingType]             = useState(null); // 'text' | 'voice'
  const [newChannelName, setNewChannelName]     = useState('');

  const canManageChannels = isCreator || user?.role === 'admin';

  const allChannels = community.channels && community.channels.length > 0
    ? community.channels
    : [...DEFAULT_TEXT_CHANNELS, ...DEFAULT_VOICE_CHANNELS];

  const textChannels = allChannels.filter(c => c.type === 'text' || c.type === 'announcement');
  const voiceChannels = allChannels.filter(c => c.type === 'voice');

  const activeChannelName = textChannels.find(c => c.id === activeChannel)?.name || 'general';

  const handleJoinVoice = (ch) => {
    if (activeVoice?.id === ch.id) return;
    playJoinSound();
    setActiveVoice(ch);
  };

  const handleStartEdit = (ch, e) => {
    e.stopPropagation();
    setEditingChannelId(ch.id);
    setEditingChannelName(ch.name);
  };

  const handleSaveEdit = async (e) => {
    e?.stopPropagation();
    const name = editingChannelName.trim();
    if (!name) { setEditingChannelId(null); return; }
    const updated = allChannels.map(c => c.id === editingChannelId ? { ...c, name } : c);
    setEditingChannelId(null);
    await onUpdateChannels(updated);
  };

  const handleAddChannel = async () => {
    const name = newChannelName.trim();
    if (!name) return;
    const newCh = { id: `${addingType}-${Date.now()}`, name, type: addingType };
    await onUpdateChannels([...allChannels, newCh]);
    setAddingType(null);
    setNewChannelName('');
  };

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{ height: 'calc(100vh - 120px)', background: '#0a0c10', border: '1px solid rgba(255,255,255,0.05)' }}
    >

      {/* ── Global Top Navigation Bar ── */}
      <header
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{ height: '48px', background: '#09090d', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Panel toggle */}
        <button
          onClick={() => setPanelOpen(v => !v)}
          title="Toggle panel"
          className="p-1.5 rounded-md transition-colors flex-shrink-0"
          style={{ color: panelOpen ? '#00e5a0' : '#4b5563' }}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold text-white">{community.name}</span>
          <ChevronRight className="w-3.5 h-3.5" style={{ color: '#2d3748' }} />
          <Hash className="w-3.5 h-3.5" style={{ color: '#00e5a0' }} />
          <span style={{ color: '#6b7280' }}>{activeChannelName}</span>
        </div>

        {/* Global Nav — right-aligned */}
        <nav className="ml-auto flex items-center gap-1">
          {NAV_ITEMS.map(({ label, icon: Icon, page, highlight }) => (
            highlight ? (
              <Link
                key={label}
                to={createPageUrl(page)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  color: '#00e5a0',
                  background: 'rgba(0,229,160,0.1)',
                  border: '1px solid rgba(0,229,160,0.32)',
                  boxShadow: '0 0 14px rgba(0,229,160,0.14), inset 0 0 8px rgba(0,229,160,0.06)',
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ) : (
              <Link
                key={label}
                to={createPageUrl(page)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ color: '#4b5563' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            )
          ))}
        </nav>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Panel ── */}
        {panelOpen && (
          <aside
            className="flex flex-col flex-shrink-0 overflow-y-auto"
            style={{ width: '205px', background: '#0c0e14', borderRight: '1px solid rgba(255,255,255,0.05)' }}
          >
            {/* Chamber identity */}
            <div className="px-3 pt-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.18)' }}
                >
                  {community.logo_url ? (
                    <img src={community.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold" style={{ color: '#00e5a0' }}>
                      {community.name?.[0]}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold truncate leading-tight">{community.name}</p>
                  <p className="text-[10px]" style={{ color: '#374151' }}>
                    {memberProfiles.length} members
                  </p>
                </div>
              </div>
            </div>

            {/* Text Channels */}
            <div className="px-2 pt-3 pb-1">
              <div className="flex items-center gap-2 px-2 mb-2">
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <p className="text-[9px] font-bold tracking-widest uppercase flex-shrink-0" style={{ color: '#2d3748' }}>Text</p>
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
                {canManageChannels && (
                  <button onClick={() => { setAddingType('text'); setNewChannelName(''); }} className="flex-shrink-0" title="Add text channel">
                    <Plus className="w-3 h-3" style={{ color: '#00e5a0' }} />
                  </button>
                )}
              </div>
              {textChannels.map(ch => (
                <div key={ch.id} className="group/ch relative mb-0.5">
                  {editingChannelId === ch.id ? (
                    <div className="flex items-center gap-1 px-2 py-1">
                      <Hash className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00e5a0' }} />
                      <input
                        autoFocus
                        value={editingChannelName}
                        onChange={e => setEditingChannelName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingChannelId(null); }}
                        className="flex-1 bg-transparent text-xs text-white outline-none border-b"
                        style={{ borderColor: '#00e5a0' }}
                      />
                      <button onClick={handleSaveEdit}><Check className="w-3 h-3 text-green-400" /></button>
                      <button onClick={() => setEditingChannelId(null)}><X className="w-3 h-3 text-red-400" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveChannel(ch.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all duration-150 text-left"
                      style={{
                        background: activeChannel === ch.id ? 'rgba(0,229,160,0.09)' : 'transparent',
                        color:      activeChannel === ch.id ? '#e5e7eb' : '#4b5563',
                        fontWeight: activeChannel === ch.id ? 500 : 400,
                        outline:    activeChannel === ch.id ? '1px solid rgba(0,229,160,0.2)' : '1px solid transparent',
                      }}
                    >
                      <Hash className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: activeChannel === ch.id ? '#00e5a0' : '#2d3748' }} />
                      <span className="truncate flex-1">{ch.name}</span>
                      {canManageChannels && (
                        <button
                          onClick={e => handleStartEdit(ch, e)}
                          className="opacity-0 group-hover/ch:opacity-100 transition-opacity"
                          title="Rename channel"
                        >
                          <Pencil className="w-2.5 h-2.5" style={{ color: '#6b7280' }} />
                        </button>
                      )}
                    </button>
                  )}
                </div>
              ))}
              {addingType === 'text' && (
                <div className="flex items-center gap-1 px-2 py-1">
                  <Hash className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00e5a0' }} />
                  <input
                    autoFocus
                    value={newChannelName}
                    onChange={e => setNewChannelName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddChannel(); if (e.key === 'Escape') setAddingType(null); }}
                    placeholder="channel-name"
                    className="flex-1 bg-transparent text-xs text-white outline-none border-b placeholder-gray-600"
                    style={{ borderColor: '#00e5a0' }}
                  />
                  <button onClick={handleAddChannel}><Check className="w-3 h-3 text-green-400" /></button>
                  <button onClick={() => setAddingType(null)}><X className="w-3 h-3 text-red-400" /></button>
                </div>
              )}
            </div>

            {/* Voice Channels */}
            <div className="px-2 pt-2 pb-1">
              <div className="flex items-center gap-2 px-2 mb-2">
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <p className="text-[9px] font-bold tracking-widest uppercase flex-shrink-0" style={{ color: '#2d3748' }}>Voice</p>
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
                {canManageChannels && (
                  <button onClick={() => { setAddingType('voice'); setNewChannelName(''); }} className="flex-shrink-0" title="Add voice channel">
                    <Plus className="w-3 h-3" style={{ color: '#00e5a0' }} />
                  </button>
                )}
              </div>
              {voiceChannels.map(ch => (
                <div key={ch.id} className="group/ch">
                  {editingChannelId === ch.id ? (
                    <div className="flex items-center gap-1 px-2 py-1">
                      <Volume2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00e5a0' }} />
                      <input
                        autoFocus
                        value={editingChannelName}
                        onChange={e => setEditingChannelName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingChannelId(null); }}
                        className="flex-1 bg-transparent text-xs text-white outline-none border-b"
                        style={{ borderColor: '#00e5a0' }}
                      />
                      <button onClick={handleSaveEdit}><Check className="w-3 h-3 text-green-400" /></button>
                      <button onClick={() => setEditingChannelId(null)}><X className="w-3 h-3 text-red-400" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoinVoice(ch)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all duration-150 text-left mb-0.5"
                      style={{
                        background: activeVoice?.id === ch.id ? 'rgba(0,229,160,0.09)' : 'transparent',
                        color:      activeVoice?.id === ch.id ? '#e5e7eb' : '#4b5563',
                        outline:    activeVoice?.id === ch.id ? '1px solid rgba(0,229,160,0.2)' : '1px solid transparent',
                      }}
                    >
                      <Volume2 className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: activeVoice?.id === ch.id ? '#00e5a0' : '#2d3748' }} />
                      <span className="truncate flex-1">{ch.name}</span>
                      {canManageChannels && (
                        <button
                          onClick={e => handleStartEdit(ch, e)}
                          className="opacity-0 group-hover/ch:opacity-100 transition-opacity"
                          title="Rename channel"
                        >
                          <Pencil className="w-2.5 h-2.5" style={{ color: '#6b7280' }} />
                        </button>
                      )}
                    </button>
                  )}
                  {activeVoice?.id === ch.id && user && editingChannelId !== ch.id && (
                    <div className="ml-6 flex items-center gap-1.5 px-2 py-0.5">
                      <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0"
                        style={{ background: '#00e5a0' }}>
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-[8px] text-black font-bold flex items-center justify-center h-full">{user.full_name?.[0]}</span>}
                      </div>
                      <span className="text-[10px]" style={{ color: '#4b5563' }}>
                        {user.full_name?.split(' ')[0]}
                      </span>
                      {isMuted && <MicOff className="w-2.5 h-2.5 text-red-400" />}
                    </div>
                  )}
                </div>
              ))}
              {addingType === 'voice' && (
                <div className="flex items-center gap-1 px-2 py-1">
                  <Volume2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00e5a0' }} />
                  <input
                    autoFocus
                    value={newChannelName}
                    onChange={e => setNewChannelName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddChannel(); if (e.key === 'Escape') setAddingType(null); }}
                    placeholder="channel-name"
                    className="flex-1 bg-transparent text-xs text-white outline-none border-b placeholder-gray-600"
                    style={{ borderColor: '#00e5a0' }}
                  />
                  <button onClick={handleAddChannel}><Check className="w-3 h-3 text-green-400" /></button>
                  <button onClick={() => setAddingType(null)}><X className="w-3 h-3 text-red-400" /></button>
                </div>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1 min-h-[16px]" />

            {/* Collapsible: Latest Updates */}
            {latestActivities?.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <button
                  onClick={() => setUpdatesOpen(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2 text-[9px] font-bold tracking-widest uppercase transition-colors"
                  style={{ color: updatesOpen ? '#00e5a0' : '#2d3748' }}
                >
                  <span>Latest Updates</span>
                  {updatesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                {updatesOpen && (
                  <div className="px-2 pb-2 space-y-1">
                    {latestActivities.slice(0, 3).map((a, i) => (
                      <div key={i} className="px-2 py-1.5 rounded-md text-[11px]"
                        style={{ background: '#111318' }}>
                        <span className="font-semibold text-white">{a.name}: </span>
                        <span style={{ color: '#6b7280' }}>{a.action}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Collapsible: Active Members */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <button
                onClick={() => setMembersOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2 text-[9px] font-bold tracking-widest uppercase transition-colors"
                style={{ color: membersOpen ? '#00e5a0' : '#2d3748' }}
              >
                <span>Active Members</span>
                {membersOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              {membersOpen && (
                <div className="px-2 pb-2 space-y-0.5">
                  {memberProfiles.slice(0, 6).map(m => (
                    <div key={m.email}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors hover:bg-white/5">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0"
                        style={{ background: '#00e5a0' }}>
                        {m.avatar_url
                          ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-[9px] text-black font-bold flex items-center justify-center h-full">{m.full_name?.[0]}</span>}
                        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-green-400 rounded-full"
                          style={{ border: '1.5px solid #0c0e14' }} />
                      </div>
                      <span className="text-xs truncate" style={{ color: '#9ca3af' }}>
                        {m.full_name || m.email.split('@')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Voice controls strip */}
            {activeVoice && (
              <div
                className="px-3 py-2 flex items-center gap-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: '#080a0e' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium" style={{ color: '#00e5a0' }}>In Voice</p>
                  <p className="text-[10px] truncate" style={{ color: '#374151' }}>{activeVoice.name}</p>
                </div>
                <button onClick={() => setIsMuted(v => !v)} className="p-1 rounded"
                  style={{ color: isMuted ? '#ef4444' : '#4b5563' }}>
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setActiveVoice(null)} className="p-1 rounded"
                  style={{ color: '#ef4444' }}>
                  <PhoneOff className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* User identity */}
            {user && (
              <div
                className="px-3 py-2 flex items-center gap-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: '#080a0e' }}
              >
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0"
                  style={{ background: '#00e5a0' }}>
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-xs text-black font-bold flex items-center justify-center h-full">{user.full_name?.[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate leading-tight">{user.full_name || 'You'}</p>
                  <p className="text-[10px]" style={{ color: '#374151' }}>
                    {isCreator ? 'Creator' : isMember ? 'Member' : ''}
                  </p>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* ── Main Canvas ── */}
        <main className="flex-1 flex flex-col overflow-hidden" style={{ background: '#11141b' }}>
          {/* Channel context strip */}
          <div
            className="flex items-center px-5 py-2.5 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            <Hash className="w-4 h-4 mr-1.5 flex-shrink-0" style={{ color: '#00e5a0' }} />
            <span className="text-sm font-semibold text-white">{activeChannelName}</span>
            <span className="mx-2 text-xs" style={{ color: '#1f2937' }}>|</span>
            <span className="text-xs truncate" style={{ color: '#374151' }}>
              {community.description?.slice(0, 80) || `Welcome to ${community.name}`}
            </span>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <CommunityChannelChat
              community={community}
              user={user}
              channelId={activeChannel}
              channelName={activeChannelName}
            />
          </div>
        </main>
      </div>
    </div>
  );
}