import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Info, Coins, TrendingUp, Shield, Zap, Users, DollarSign } from 'lucide-react';

export default function CommunityInfoModal({ onClose }) {
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
              How Hybrid Tokenized Communities Work
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-white mb-3">What Are Tokenized Communities?</h3>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4">
                  Each community has its own unique token that represents membership, governance rights, and economic value. 
                  The revolutionary part? You can fund and participate using either cryptocurrency OR traditional fiat currency.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-400 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                    <span className="text-xs md:text-sm text-gray-300">Build a unique economy around your content and services</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-400 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                    <span className="text-xs md:text-sm text-gray-300">Accept both $EQOFLO payments and credit card payments</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-400 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                    <span className="text-xs md:text-sm text-gray-300">Members earn tokens through participation regardless of payment method</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base md:text-lg font-semibold text-white mb-3">Key Features & Benefits</h3>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Coins className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm md:text-base text-white font-medium">Hybrid Payment Options</p>
                      <p className="text-xs md:text-sm text-gray-400">Members can join with $EQOFLO tokens or credit cards</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm md:text-base text-white font-medium">Flexible Monetization</p>
                      <p className="text-xs md:text-sm text-gray-400">Creators earn from both crypto-native and traditional users</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm md:text-base text-white font-medium">Governance Rights</p>
                      <p className="text-xs md:text-sm text-gray-400">All members get voting power based on token holdings, regardless of how they paid</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-3 h-3 md:w-4 md:h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm md:text-base text-white font-medium">Seamless Experience</p>
                      <p className="text-xs md:text-sm text-gray-400">No need to understand crypto - pay how you prefer</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-purple-500/20">
              <h3 className="text-base md:text-lg font-semibold text-white mb-4 text-center">Community Payment Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="p-3 md:p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                    <h4 className="text-sm md:text-base font-medium text-purple-300">$EQOFLO Payments</h4>
                  </div>
                  <p className="text-xs md:text-sm text-gray-400 mb-3">
                    Pay with $EQOFLO tokens for instant, transparent transactions.
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-300">Instant transactions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-300">Lower fees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-300">Full transparency</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 md:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                    <h4 className="text-sm md:text-base font-medium text-blue-300">Traditional Payments</h4>
                  </div>
                  <p className="text-xs md:text-sm text-gray-400 mb-3">
                    Pay with credit cards, debit cards, or bank transfers - no crypto knowledge required.
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-300">Familiar payment methods</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-300">No wallet required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-300">Automatic token conversion</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 md:p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                    <h4 className="text-sm md:text-base font-medium text-green-300">Flexible Membership</h4>
                  </div>
                  <p className="text-xs md:text-sm text-gray-400 mb-3">
                    Mix and match payment methods, or let members choose their preference.
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-300">Multiple pricing tiers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-300">Subscription options</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs text-gray-300">Member rewards</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-purple-500/20">
              <h3 className="text-base md:text-lg font-semibold text-white mb-4 text-center">Fair & Transparent Fee Structure</h3>
              <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <h4 className="text-sm md:text-base font-semibold text-blue-300 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                      Community Transaction Fee: 15%
                    </h4>
                    <p className="text-xs md:text-sm text-gray-400 mb-4">
                      We charge a competitive 15% fee on all community transactions to maintain and improve the platform.
                    </p>
                    
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between p-2 md:p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div>
                          <p className="text-blue-300 font-medium text-xs md:text-sm">Platform Operations (9%)</p>
                          <p className="text-gray-400 text-[10px] md:text-xs">Infrastructure, development, support</p>
                        </div>
                        <div className="text-blue-400 font-bold text-sm md:text-base">60%</div>
                      </div>
                      
                      <div className="flex items-center justify-between p-2 md:p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <div>
                          <p className="text-purple-300 font-medium text-xs md:text-sm">DAO Treasury (6%)</p>
                          <p className="text-gray-400 text-[10px] md:text-xs">Community ownership & rewards</p>
                        </div>
                        <div className="text-purple-400 font-bold text-sm md:text-base">40%</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm md:text-base font-semibold text-green-300 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 md:w-5 md:h-5" />
                      Example: $10 Community Membership
                    </h4>
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg">
                        <span className="text-gray-300 text-xs md:text-sm">Creator Receives</span>
                        <span className="text-green-400 font-bold text-sm md:text-base">$8.50</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg">
                        <span className="text-gray-300 text-xs md:text-sm">Platform Fee</span>
                        <span className="text-blue-400 font-bold text-sm md:text-base">$0.90</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-purple-500/10 rounded-lg">
                        <span className="text-gray-300 text-xs md:text-sm">DAO Treasury</span>
                        <span className="text-purple-400 font-bold text-sm md:text-base">$0.60</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 md:mt-4 p-2 md:p-3 bg-green-600/10 border border-green-500/20 rounded-lg">
                      <p className="text-green-400 text-[10px] md:text-xs">
                        <strong>Why 15%?</strong> Lower than most competitors (Patreon: 12%, OnlyFans: 20%) while ensuring platform sustainability and community rewards.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-300 text-xs md:text-sm">
                <strong>Creator Benefits:</strong> Accept payments from both crypto enthusiasts and traditional users. 
                We handle the conversion automatically, so you get the full value regardless of how your members prefer to pay.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}