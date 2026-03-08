import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
}

export default function TrendingCirclesSection({ communities }) {
  const top5 = [...communities]
    .sort((a, b) => (b.member_emails?.length || 0) - (a.member_emails?.length || 0))
    .slice(0, 5);

  if (top5.length === 0) return null;

  // Sizes: smaller on edges, larger in center
  const sizes = ['w-14 h-14', 'w-16 h-16', 'w-24 h-24', 'w-16 h-16', 'w-14 h-14'];
  const centerIndex = Math.floor(top5.length / 2);

  return (
    <div className="bg-black/50 rounded-2xl p-6 border border-white/5">
      <div className="flex items-end justify-center gap-6">
        {top5.map((community, i) => {
          const isCenter = i === centerIndex;
          const sizeClass = sizes[i] || 'w-14 h-14';
          const memberCount = community.member_emails?.length || 0;

          return (
            <Link
              key={community.id}
              to={`${createPageUrl("CommunityProfile")}?id=${community.id}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className={`relative ${sizeClass} rounded-full overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105 ${
                  isCenter
                    ? 'ring-4 ring-purple-500/80 shadow-[0_0_30px_rgba(139,92,246,0.6)]'
                    : 'ring-1 ring-white/10'
                } bg-gray-800 flex items-center justify-center`}
              >
                {community.logo_url ? (
                  <img
                    src={community.logo_url}
                    alt={community.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #4c1d95, #831843)' }}
                  >
                    <span className="text-white font-bold text-lg">
                      {community.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Decorative dot for center */}
                {isCenter && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 border-2 border-black" />
                )}
              </div>

              <div className="text-center">
                <p className="text-white text-xs font-medium max-w-[80px] truncate">
                  {community.name}
                </p>
                <p className="text-gray-500 text-xs">
                  {formatCount(memberCount)} {memberCount === 1 ? 'member' : 'members'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {top5[centerIndex] && (
        <p className="text-center text-gray-600 text-xs mt-4">
          {formatCount(top5[centerIndex].member_emails?.length || 0)} views
        </p>
      )}
    </div>
  );
}