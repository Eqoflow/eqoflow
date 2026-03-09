import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, RefreshCw, ExternalLink } from 'lucide-react';

const NEWS_TYPE_CONFIG = {
  breaking: { label: 'Breaking', color: 'text-red-400', bg: 'bg-red-500/20' },
  trending: { label: 'Trending', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  update:   { label: 'Update',   color: 'text-blue-400',  bg: 'bg-blue-500/20'   },
};

function NewsCard({ article }) {
  const typeConfig = NEWS_TYPE_CONFIG[article.news_type] || NEWS_TYPE_CONFIG.update;

  const content = (
    <div className="bg-black/40 rounded-xl border border-white/5 overflow-hidden hover:border-white/15 transition-all group cursor-pointer">
      {article.image_url && (
        <div className="h-20 overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-2.5 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeConfig.bg} ${typeConfig.color}`}>
            {typeConfig.label}
          </span>
          <div className="flex items-center gap-1">
            {article.is_paid_placement && (
              <span className="text-[9px] text-gray-600">Sponsored</span>
            )}
            {article.full_article_url && (
              <ExternalLink className="w-2.5 h-2.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
            )}
          </div>
        </div>
        <p className="text-white text-xs font-semibold leading-tight line-clamp-2">
          {article.title}
        </p>
        <p className="text-gray-500 text-[10px] leading-relaxed line-clamp-2">
          {article.content_snippet}
        </p>
        <p className="text-gray-600 text-[10px]">{article.author_name}</p>
      </div>
    </div>
  );

  if (article.full_article_url) {
    return (
      <a href={article.full_article_url} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  return content;
}

export default function NewsAndUpdatesWidget() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const now = new Date().toISOString();
      const data = await base44.entities.NewsArticle.list('-created_date', 10);
      // Sort: active paid placements first, then by date
      const sorted = [...data].sort((a, b) => {
        const aActive = a.is_paid_placement && (!a.paid_until || a.paid_until > now);
        const bActive = b.is_paid_placement && (!b.paid_until || b.paid_until > now);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return 0;
      });
      setArticles(sorted);
    } catch (e) {
      console.error('Failed to load news articles:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-shrink-0 border-t border-white/5 flex flex-col" style={{ maxHeight: '45%' }}>
      <div className="px-4 py-3 flex-shrink-0 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-white font-semibold text-sm">News & Updates</h2>
        <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
      </div>

      <div className="overflow-y-auto p-3 space-y-2.5">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <RefreshCw className="w-4 h-4 text-gray-600 animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-4">No news yet</p>
        ) : (
          articles.map(article => (
            <NewsCard key={article.id} article={article} />
          ))
        )}
      </div>
    </div>
  );
}