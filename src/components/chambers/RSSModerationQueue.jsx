import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { approveRSSPost } from '@/functions/approveRSSPost';
import { CheckCircle, XCircle, ExternalLink, Rss, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function RSSModerationQueue({ communityId, onClose }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioning, setActioning] = useState(null);

  const loadQueue = async () => {
    setIsLoading(true);
    const pending = await base44.entities.RSSFeedPost.filter(
      { community_id: communityId, status: 'pending' },
      '-created_date',
      50
    );
    setItems(pending);
    setIsLoading(false);
  };

  useEffect(() => { loadQueue(); }, [communityId]);

  const handleAction = async (item, action) => {
    setActioning(item.id);
    try {
      await approveRSSPost({ rss_post_id: item.id, action });
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (e) {
      console.error('Action failed:', e);
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <Rss className="w-5 h-5" style={{ color: '#f97316' }} />
            <h2 className="text-white font-semibold text-base">RSS Moderation Queue</h2>
            {items.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                {items.length} pending
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-sm">Close</button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#f97316' }} />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#00e5a0' }} />
              <p className="text-white font-medium">Queue is clear</p>
              <p className="text-gray-500 text-sm mt-1">No RSS items awaiting review</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="p-4 rounded-xl" style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(249,115,22,0.15)' }}>
                    <Rss className="w-3.5 h-3.5" style={{ color: '#f97316' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>
                        {item.source_name || 'RSS'}
                      </span>
                      <span className="text-gray-600 text-[10px]">
                        {item.created_date ? formatDistanceToNow(new Date(item.created_date), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    <p className="text-white text-sm font-medium leading-snug mb-1">{item.title}</p>
                    {item.excerpt && <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{item.excerpt}</p>}
                    {item.article_url && (
                      <a href={item.article_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs mt-2 transition-colors"
                        style={{ color: '#60a5fa' }}>
                        <ExternalLink className="w-3 h-3" />
                        Read article
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(item, 'approve')}
                      disabled={actioning === item.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: 'rgba(0,229,160,0.1)', color: '#00e5a0', border: '1px solid rgba(0,229,160,0.2)' }}
                    >
                      {actioning === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(item, 'reject')}
                      disabled={actioning === item.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      <XCircle className="w-3 h-3" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}