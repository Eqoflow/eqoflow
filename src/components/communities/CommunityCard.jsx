
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Coins, ArrowRight, Zap, Crown, Pin, PinOff, Lock } from 'lucide-react';
import { User } from '@/entities/User';
import { toggleCommunityPin } from '@/functions/toggleCommunityPin';

export default function CommunityCard({ community, index }) {
  const [user, setUser] = React.useState(null);
  const [isPinning, setIsPinning] = React.useState(false);

  React.useEffect(() => {
    User.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Define creator emails for special styling
  const creatorEmails = [
  'trevorhenry20@gmail.com',
  'sirp.block.chain@gmail.com',
  'keith@quantum3.tech',
  'stokes1127@gmail.com'];


  const isCreatorCommunity = creatorEmails.includes(community.created_by?.toLowerCase());
  const isAdmin = user?.role === 'admin';
  const isPrivateCommunity = community.access_type === 'private_invite';

  const handleTogglePin = async (e) => {
    e.preventDefault(); // Prevent navigation when clicking pin button
    e.stopPropagation();

    if (!isAdmin) return;

    setIsPinning(true);
    try {
      await toggleCommunityPin({
        communityId: community.id,
        isPinned: !community.is_pinned
      });

      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error toggling community pin:', error);
    } finally {
      setIsPinning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="h-full relative">

      <Link to={`${createPageUrl("CommunityProfile")}?id=${community.id}`} className="block h-full">
        <Card className={`dark-card hover-lift transition-all duration-300 h-full flex flex-col ${
        isCreatorCommunity ? 'ring-2 ring-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : ''} ${

        community.is_pinned ? 'ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''}`
        }>
          <div className="relative">
            <div className="h-20 md:h-28 bg-gradient-to-r from-purple-900 to-pink-900 rounded-t-2xl">
              {community.banner_url &&
              <img src={community.banner_url} alt={`${community.name} banner`} className="w-full h-full object-cover rounded-t-2xl" />
              }
            </div>
            {/* Desktop logo positioning */}
            <div className="hidden md:block absolute -bottom-8 right-4 w-16 h-16 rounded-2xl bg-black border-4 border-black p-1">
               <div className="w-full h-full rounded-lg bg-black flex items-center justify-center overflow-hidden">
                {community.logo_url ?
                <img src={community.logo_url} alt={`${community.name} logo`} className="w-full h-full object-cover rounded-lg" /> :

                <span className="text-xl font-bold text-white">{community.name?.[0]}</span>
                }
               </div>
            </div>
            
            {/* Top left badges - Admin Pin Button and Pinned Badge */}
            <div className="absolute top-2 left-2 flex items-center gap-2">
              {isAdmin &&
              <Button
                onClick={handleTogglePin}
                disabled={isPinning}
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${
                community.is_pinned ?
                'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' :
                'bg-black/20 text-gray-400 hover:bg-black/40'} backdrop-blur-sm border border-white/10`
                }>

                  {isPinning ?
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> :
                community.is_pinned ?
                <PinOff className="w-4 h-4" /> :

                <Pin className="w-4 h-4" />
                }
                </Button>
              }
              
              {community.is_pinned &&
              <Badge className="bg-purple-500/20 text-slate-50 px-2.5 py-0.5 text-xs font-semibold rounded-full inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-primary/80 border-purple-500/40">
                  <Pin className="w-3 h-3 mr-1" />
                  Pinned
                </Badge>
              }
            </div>

            {isCreatorCommunity &&
            <Badge className="absolute bottom-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-yellow-500/50 shadow-[0_0_10px_rgba(250,204,21,0.5)] text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Creator
                </Badge>
            }
          </div>

          <CardContent className="pt-4 md:pt-6 px-3 md:px-4 pb-3 md:pb-4 flex-grow flex flex-col">
            <h3 className="text-base md:text-lg font-bold text-white truncate md:pr-16 mb-1">{community.name}</h3>
            <p className="text-gray-400 text-xs md:text-sm mt-1 flex-grow h-8 md:h-14 overflow-hidden line-clamp-2">
              {community.description}
            </p>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-500/20">
              <div className="flex items-center gap-2 md:gap-3 flex-1">
                {/* Mobile logo - positioned with other icons */}
                <div className="md:hidden w-8 h-8 rounded-lg bg-black border-2 border-gray-600 p-1 flex-shrink-0">
                  <div className="w-full h-full rounded bg-black flex items-center justify-center overflow-hidden">
                    {community.logo_url ?
                    <img src={community.logo_url} alt={`${community.name} logo`} className="w-full h-full object-cover rounded" /> :

                    <span className="text-xs font-bold text-white">{community.name?.[0]}</span>
                    }
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-gray-300">
                  <Users className="w-3 h-3 md:w-4 md:h-4 text-purple-400" />
                  <span className="text-xs md:text-sm font-medium">{community.member_emails?.length || 1}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-300">
                  <Coins className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                  <span className="text-xs md:text-sm font-medium truncate">{community.token_symbol}</span>
                </div>
                {/* Free badge moved to bottom */}
                {community.pricing_model === 'free' &&
                <Badge className="bg-green-500/20 text-green-300 border-green-500/40 text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Free
                  </Badge>
                }
                {/* Private badge at bottom */}
                {isPrivateCommunity &&
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    Private
                  </Badge>
                }
              </div>
              <div className="flex items-center text-purple-400 flex-shrink-0">
                <span className="text-xs md:text-sm font-semibold">View</span>
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>);

}