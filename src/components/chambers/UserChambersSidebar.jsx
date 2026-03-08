import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function UserChambersSidebar({ joinedCommunities, onHomeClick }) {
  return (
    <div className="w-[60px] flex-shrink-0 bg-black border-r border-white/5 flex flex-col items-center py-3 gap-2 overflow-y-auto">
      {/* EqoFlow platform home icon */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onHomeClick}
            className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-purple-500/60 hover:ring-purple-400 transition-all flex-shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.4)]"
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/942c1cf5d_EqoFlowLogoDesign-14.png"
              alt="EqoFlow"
              className="w-full h-full object-cover"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-black/90 border-white/10 text-white">
          EqoFlow Home
        </TooltipContent>
      </Tooltip>

      {/* Divider */}
      <div className="w-8 h-px bg-white/10 my-1 flex-shrink-0" />

      {/* Joined communities */}
      {joinedCommunities.map(community => (
        <Tooltip key={community.id}>
          <TooltipTrigger asChild>
            <Link to={`${createPageUrl("CommunityProfile")}?id=${community.id}`}>
              <div className="w-11 h-11 rounded-full overflow-hidden hover:ring-2 hover:ring-purple-500/60 transition-all flex-shrink-0 bg-gray-800 flex items-center justify-center cursor-pointer">
                {community.logo_url ? (
                  <img
                    src={community.logo_url}
                    alt={community.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {community.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-black/90 border-white/10 text-white">
            {community.name}
          </TooltipContent>
        </Tooltip>
      ))}

      {joinedCommunities.length === 0 && (
        <div className="flex flex-col items-center gap-1 px-1">
          <div className="w-11 h-11 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
            <span className="text-white/20 text-xs">+</span>
          </div>
        </div>
      )}
    </div>
  );
}