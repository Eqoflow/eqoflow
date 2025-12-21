
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Info, Target, Gift, Coins, Clock, Shield, Users, DollarSign, TrendingUp } from 'lucide-react';

export default function CrowdsourcingInfoModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-slate-800"
      >
        <Card className="dark-card neon-glow">
          <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-slate-900/50 backdrop-blur-sm z-10 p-4">
            <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
              <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
              How Hybrid On-Chain Crowdsourcing Works
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Two Types of Projects</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Fundraising</p>
                      <p className="text-gray-400 text-sm">Raise $EQOFLO tokens or traditional currency to fund your project or startup.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Gift className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Bounties</p>
                      <p className="text-gray-400 text-sm">Post tasks and reward completion with tokens or cash payments.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Key Features</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Coins className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Hybrid Payment Support</p>
                      <p className="text-gray-400 text-sm">Accept both $EQOFLO tokens and traditional fiat currency.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Milestone-Based</p>
                      <p className="text-gray-400 text-sm">Fund projects in transparent, trackable milestones.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Transparent Funding</p>
                      <p className="text-gray-400 text-sm">All contributions are publicly visible regardless of payment method.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Community Governance</p>
                      <p className="text-gray-400 text-sm">Token holders vote on project approvals and fund releases.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-purple-500/20">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">Flexible Funding Options</h3>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-5 h-5 text-purple-400" />
                    <h4 className="font-medium text-purple-300">Crypto Funding</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Accept $EQOFLO and other community tokens for instant, transparent funding.</p>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <h4 className="font-medium text-blue-300">Traditional Funding</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Accept credit cards and bank transfers, making it accessible to everyone.</p>
                </div>
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <h4 className="font-medium text-green-300">Mixed Funding</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Let backers choose their preferred payment method for maximum reach.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-purple-500/20">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">Ultra-Low Fee Structure</h3>
              <div className="bg-gradient-to-r from-green-600/10 to-blue-600/10 border border-green-500/20 rounded-xl p-6">
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div>
                    <h4 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Crowdsourcing Platform Fee: 5%
                    </h4>
                    <p className="text-gray-400 text-sm mb-4">
                      We charge just 5% on successful funding to keep more money in creators' hands. This is significantly lower than Kickstarter (8-10%) and Indiegogo (8%).
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-300"><strong>3%</strong> goes to platform operations (hosting, payments, support).</p>
                      <p className="text-xs text-gray-300"><strong>2%</strong> goes to the DAO Treasury to fund community initiatives.</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Example: $1,000 Project Funding
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg text-sm">
                        <span className="text-gray-300">Creator Receives</span>
                        <span className="text-green-400 font-bold">$950</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg text-sm">
                        <span className="text-gray-300">Platform Fee</span>
                        <span className="text-blue-400 font-bold">$30</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-purple-500/10 rounded-lg text-sm">
                        <span className="text-gray-300">DAO Treasury</span>
                        <span className="text-purple-400 font-bold">$20</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-300">
                <strong>For Creators:</strong> Launch projects, offer token rewards, and build a community around your vision using any payment method.
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300">
                <strong>For Backers:</strong> Support projects with crypto or traditional payments, earn rewards, and gain early access to innovations.
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
