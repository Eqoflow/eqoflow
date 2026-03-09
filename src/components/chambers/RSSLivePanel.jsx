import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Rss, ExternalLink, RefreshCw, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function RSSItem({ item }) {
  return (
    <div className="p-3 rounded-xl space-y-1.5 group" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(249,115,22,0.08)' }}>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wide uppercase" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
          {item.rss_source_name || item.community_name || 'RSS'}
        </span>
        <span className="text-gray-600 text-[9px]">
          {item.created_date ? formatDistanceToNow(new Date(item.created_date), { addSuffix: true }) : ''}
        </span>
      </div>
      <p className="text-white text-xs font-medium leading-snug line-clamp-2">
        {item.rss_title || item.content?.split('\n')[0]?.replace(/\*\*/g, '') || 'Untitled'}
      </p>
      {item.rss_excerpt && (
        <p className="text-gray-500 text-[10px] leading-relaxed line-clamp-2">{item.rss_excerpt}</p>
      )}
      <div className="flex items-center justify-between">
        {item.community_name && (
          <span className="text-[9px] text-gray-600">{item.community_name}</span>
        )}
        {item.rss_article_url && (
          <a
            href={item.rss_article_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] transition-colors opacity-0 group-hover:opacity-100"
            style={{ color: '#60a5fa' }}
          >
            <ExternalLink className="w-2.5 h-2.5" />
            Read
          </a>
        )}
      </div>
    </div>
  );
}

export default function RSSLivePanel() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [communities, setCommunities] = useState({});

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get RSS-enabled communities
      const rssCommunities = await base44.entities.Community.filter({ rss_enabled: true });
      const commMap = {};
      rssCommunities.forEach(c => { commMap[c.id] = c.name; });
      setCommunities(commMap);

      if (rssCommunities.length === 0) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      // Get latest approved RSS messages across those communities
      const communityIds = rssCommunities.map(c => c.id);
      const msgs = await base44.entities.CommunityMessage.filter(
        { is_rss: true, community_id: { $in: communityIds } },
        '-created_date',
        20
      );
      const enriched = msgs.map(m => ({
        ...m,
        community_name: commMap[m.community_id] || '',
      }));
      setItems(enriched);
    } catch (e) {
      console.error('RSSLivePanel load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-[280px] flex-shrink-0 flex flex-col overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.15)' }}>
            <Rss className="w-3.5 h-3.5" style={{ color: '#f97316' }} />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Live News Feed</p>
            <p className="text-gray-600 text-[10px]">From RSS Chambers</p>
          </div>
        </div>
        <button onClick={loadData} className="text-gray-600 hover:text-gray-400 transition-colors" title="Refresh">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#f97316' }} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Rss className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: '#f97316' }} />
            <p className="text-gray-600 text-xs">No RSS chambers yet.</p>
            <p className="text-gray-700 text-[10px] mt-1">Chamber owners can enable RSS in their settings.</p>
          </div>
        ) : (
          items.map(item => <RSSItem key={item.id} item={item} />)
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Link
          to={createPageUrl('Communities') + '?filter=rss'}
          className="flex items-center justify-between text-xs transition-colors"
          style={{ color: '#f97316' }}
        >
          <span>Browse RSS Chambers</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}