import React, { useState } from 'react';
import { X, Plus, Trash2, Rss, Loader2, Globe, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { pollRSSFeeds } from '@/functions/pollRSSFeeds';

export default function RSSSettingsModal({ community, onClose, onSave }) {
  const [rssEnabled, setRssEnabled] = useState(community.rss_enabled || false);
  const [rssSources, setRssSources] = useState(community.rss_sources || []);
  const [rssMode, setRssMode] = useState(community.rss_mode || 'auto');
  const [rssMaxPerDay, setRssMaxPerDay] = useState(community.rss_max_per_day || 24);
  const [rssChannelId, setRssChannelId] = useState(community.rss_channel_id || 'general');
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollResult, setPollResult] = useState(null);

  const channels = (community.channels || []).filter(c => c.type === 'text' || c.type === 'announcement');

  const handleAddSource = () => {
    const url = newUrl.trim();
    const name = newName.trim();
    if (!url) return;
    setRssSources(prev => [...prev, { url, name: name || url, enabled: true }]);
    setNewUrl('');
    setNewName('');
  };

  const handleRemoveSource = (idx) => {
    setRssSources(prev => prev.filter((_, i) => i !== idx));
  };

  const handleToggleSource = (idx) => {
    setRssSources(prev => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updatedCommunity = {
      rss_enabled: rssEnabled,
      rss_sources: rssSources,
      rss_mode: rssMode,
      rss_max_per_day: Number(rssMaxPerDay),
      rss_channel_id: rssChannelId,
      // Auto-tag with #rss
      tags: rssEnabled
        ? [...new Set([...(community.tags || []), 'rss'])]
        : (community.tags || []).filter(t => t !== 'rss'),
    };
    await onSave(updatedCommunity);
    setIsSaving(false);
    onClose();
  };

  const handlePollNow = async () => {
    setIsPolling(true);
    setPollResult(null);
    try {
      const { data } = await pollRSSFeeds({ community_id: community.id });
      const result = data?.results?.[0];
      setPollResult(result ? `Fetched ${result.new_items} new item(s)` : 'No new items found');
    } catch (e) {
      setPollResult('Poll failed: ' + e.message);
    } finally {
      setIsPolling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <Rss className="w-5 h-5" style={{ color: '#f97316' }} />
            <h2 className="text-white font-semibold text-base">RSS Feed Settings</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-white text-sm font-medium">Enable RSS Auto-population</p>
              <p className="text-gray-500 text-xs mt-0.5">Automatically post articles from RSS feeds to this chamber</p>
            </div>
            <button
              onClick={() => setRssEnabled(v => !v)}
              className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
              style={{ background: rssEnabled ? '#f97316' : '#374151' }}
            >
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: rssEnabled ? '22px' : '2px' }} />
            </button>
          </div>

          {rssEnabled && (
            <>
              {/* Sources list */}
              <div>
                <p className="text-white text-sm font-medium mb-3">RSS Sources</p>
                <div className="space-y-2">
                  {rssSources.map((src, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#f97316' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{src.name}</p>
                        <p className="text-gray-500 text-[10px] truncate">{src.url}</p>
                      </div>
                      <button
                        onClick={() => handleToggleSource(idx)}
                        className="text-xs px-2 py-0.5 rounded-full transition-colors flex-shrink-0"
                        style={{ background: src.enabled !== false ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.05)', color: src.enabled !== false ? '#f97316' : '#6b7280' }}
                      >
                        {src.enabled !== false ? 'On' : 'Off'}
                      </button>
                      <button onClick={() => handleRemoveSource(idx)} className="text-red-400 hover:text-red-300 flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add source */}
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Source name (e.g. BBC News)"
                    className="w-full bg-transparent text-sm text-white placeholder-gray-600 outline-none px-3 py-2 rounded-lg"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUrl}
                      onChange={e => setNewUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddSource()}
                      placeholder="RSS feed URL (https://...)"
                      className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none px-3 py-2 rounded-lg"
                      style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <button
                      onClick={handleAddSource}
                      className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 flex-shrink-0"
                      style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mode */}
              <div>
                <p className="text-white text-sm font-medium mb-2">Posting Mode</p>
                <div className="grid grid-cols-2 gap-2">
                  {[['auto', 'Auto', 'Items post immediately'], ['moderated', 'Moderated', 'Items wait for approval']].map(([val, label, desc]) => (
                    <button
                      key={val}
                      onClick={() => setRssMode(val)}
                      className="p-3 rounded-xl text-left transition-all"
                      style={{
                        background: rssMode === val ? 'rgba(249,115,22,0.1)' : '#1a1d24',
                        border: `1px solid ${rssMode === val ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      <p className="text-white text-xs font-medium">{label}</p>
                      <p className="text-gray-500 text-[10px] mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Max per day */}
              <div>
                <p className="text-white text-sm font-medium mb-2">Max Posts Per Day</p>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={rssMaxPerDay}
                  onChange={e => setRssMaxPerDay(e.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none px-3 py-2 rounded-lg"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Target channel */}
              {channels.length > 0 && (
                <div>
                  <p className="text-white text-sm font-medium mb-2">Target Channel</p>
                  <select
                    value={rssChannelId}
                    onChange={e => setRssChannelId(e.target.value)}
                    className="w-full bg-[#1a1d24] text-sm text-white outline-none px-3 py-2 rounded-lg"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="general">general</option>
                    {channels.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Poll now */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePollNow}
                  disabled={isPolling}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {isPolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Fetch Now
                </button>
                {pollResult && <p className="text-xs" style={{ color: pollResult.includes('failed') ? '#ef4444' : '#00e5a0' }}>{pollResult}</p>}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 text-white transition-colors"
            style={{ background: '#f97316' }}
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}