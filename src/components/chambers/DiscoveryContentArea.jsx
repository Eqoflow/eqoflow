import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MoreHorizontal, Users, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import TrendingCirclesSection from './TrendingCirclesSection';
import NewsAndUpdatesWidget from './NewsAndUpdatesWidget';

export default function DiscoveryContentArea({ communities, isLoading }) {
  const trendingCommunities = [...communities]
    .sort((a, b) => (b.member_emails?.length || 0) - (a.member_emails?.length || 0));

  const featuredCommunities = communities.filter(c => c.banner_url).slice(0, 2);
  const exploreCommunities = communities;

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-40" />
          <div className="h-48 bg-white/5 rounded-2xl" />
          <div className="h-6 bg-white/10 rounded w-40" />
          <div className="h-40 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-w-0">
      <div className="p-6 flex gap-6">
      <div className="flex-1 space-y-6 min-w-0">

        {/* Trending Topic — circles section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-5 rounded-full border-2 border-teal-400 flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
            </div>
            <h2 className="text-white font-semibold text-base">Trending Topic</h2>
          </div>
          <TrendingCirclesSection communities={trendingCommunities} />
        </div>

        {/* Trending Topic — image cards */}
        {featuredCommunities.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-base">Trending Topic</h2>
              <button className="text-gray-500 hover:text-gray-300 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-black/50 rounded-2xl overflow-hidden border border-white/5">
              <div className={`grid gap-0.5 ${featuredCommunities.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {featuredCommunities.map(community => (
                  <Link
                    key={community.id}
                    to={`${createPageUrl("CommunityProfile")}?id=${community.id}`}
                    className="relative overflow-hidden group block"
                    style={{ aspectRatio: '16/9' }}
                  >
                    <img
                      src={community.banner_url}
                      alt={community.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <p className="text-white text-sm font-medium drop-shadow">{community.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Explore by category */}
        <div>
          <h2 className="text-white font-semibold text-base mb-4">Explore by category</h2>

          {exploreCommunities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No communities found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {exploreCommunities.map((community, i) => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={`${createPageUrl("CommunityProfile")}?id=${community.id}`}
                    className="relative rounded-xl overflow-hidden group block border border-white/5 hover:border-purple-500/30 transition-all"
                    style={{ aspectRatio: '16/9' }}
                  >
                    {community.banner_url ? (
                      <img
                        src={community.banner_url}
                        alt={community.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: 'linear-gradient(135deg, #1e1b4b, #4a1942)' }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />

                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex items-center gap-1.5">
                        {community.access_type === 'private_invite' && (
                          <Lock className="w-2.5 h-2.5 text-purple-300 flex-shrink-0" />
                        )}
                        <p className="text-white text-xs font-medium truncate">{community.name}</p>
                      </div>
                      <p className="text-gray-400 text-xs">
                        {community.member_emails?.length || 0} members
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Right column: News & Updates fills the empty black space */}
      <div className="w-[220px] flex-shrink-0 hidden lg:block">
        <NewsAndUpdatesWidget />
      </div>

      </div>
    </div>
  );
}