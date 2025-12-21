import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Info, Briefcase, Search, Star, DollarSign, TrendingUp } from 'lucide-react';

export default function SkillInfoModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-slate-800"
      >
        <Card className="dark-card neon-glow">
          <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-slate-900/50 backdrop-blur-sm z-10 p-4">
            <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
              <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
              How the Skills Marketplace Works
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                  A Peer-to-Peer Economy
                </h3>
                <p className="text-sm md:text-base text-gray-400 mb-4 leading-relaxed">
                  Directly connect with others to offer your expertise or find the skills you need. Our marketplace facilitates a true peer-to-peer economy for services and knowledge exchange.
                </p>
                <ul className="space-y-2 text-xs md:text-sm">
                  <li className="flex items-start gap-2 text-gray-300">
                    <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Offer your skills and earn directly from clients.</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <Search className="w-3 h-3 md:w-4 md:h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>Seek out professionals for any task, big or small.</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-300">
                    <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Build your reputation with ratings and completed jobs.</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                  Flexible Payments & Fair Fees
                </h3>
                <p className="text-sm md:text-base text-gray-400 mb-4 leading-relaxed">
                  We empower creators and clients with hybrid payment options and a transparent, community-focused fee structure.
                </p>
                <div className="p-3 md:p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <h4 className="font-semibold text-green-300 mb-2 text-sm md:text-base">
                    Marketplace Fee: 10%
                  </h4>
                  <p className="text-gray-400 text-xs md:text-sm mb-3 leading-relaxed">
                    A 10% fee is applied to all completed skill transactions, whether paid in crypto or fiat. This ensures the platform's growth and rewards the community.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg">
                      <span className="text-blue-300 text-xs md:text-sm">Platform Operations (7%)</span>
                      <div className="text-blue-400 font-bold text-xs md:text-sm">70%</div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-purple-500/10 rounded-lg">
                      <span className="text-purple-300 text-xs md:text-sm">DAO Treasury (3%)</span>
                      <div className="text-purple-400 font-bold text-xs md:text-sm">30%</div>
                    </div>
                  </div>
                  <div className="p-2 md:p-3 bg-black/20 rounded-lg text-center mt-3">
                    <p className="text-xs md:text-sm text-gray-300">
                      Example: On a <span className="text-white font-medium">$100 Skill</span>, the provider receives <span className="text-green-400 font-bold">$90.00</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}