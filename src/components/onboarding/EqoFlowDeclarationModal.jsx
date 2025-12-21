
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, CheckCircle } from 'lucide-react';

export default function EqoFlowDeclarationModal({ onClose, onAgree }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [requiredChecks, setRequiredChecks] = useState({
    ageRequirement: false,
    termsPrivacy: false,
    betaUnderstanding: false,
    aiBlockchainUnderstanding: false
  });
  const [optionalChecks, setOptionalChecks] = useState({
    updates: false
  });
  const scrollRef = useRef();

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setScrolledToBottom(true);
    }
  };

  const allRequiredChecked = Object.values(requiredChecks).every(Boolean);

  const handleRequiredCheck = (key, value) => {
    setRequiredChecks((prev) => ({ ...prev, [key]: value }));
  };

  const handleOptionalCheck = (key, value) => {
    setOptionalChecks((prev) => ({ ...prev, [key]: value }));
  };

  const handleAgreeClick = () => {
    if (allRequiredChecked && scrolledToBottom) {
      onAgree(optionalChecks);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-green-500/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
      >
        <header className="p-6 border-b border-green-500/20 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <h2 className="text-xl font-bold text-white">EqoFlow Declaration</h2>
              <p className="text-sm text-gray-400">One final step to join the network.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </Button>
        </header>

        <main className="p-6 overflow-y-auto min-h-0" onScroll={handleScroll} ref={scrollRef}>
          <div className="prose prose-invert prose-sm max-w-none text-gray-300 space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">The EqoFlow Declaration</h2>
              <p className="text-lg text-gray-300">Building the Future of Decentralized Social Networks</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Our Vision</h3>
              <p>EqoFlow represents a new paradigm in social networking—one built on principles of decentralization, user empowerment, and authentic community building. We believe that the future of social media should be owned and controlled by its users, not by centralized corporations seeking to extract value from personal data and attention.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Core Principles</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-green-400">1. User Ownership & Control</h4>
                  <p>Every user maintains true ownership of their content, data, and digital identity. Your creative work belongs to you, and you decide how it's shared and monetized.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-green-400">2. Fair Value Distribution</h4>
                  <p>Creators and active community members should be rewarded for their contributions. Our tokenized ecosystem ensures that value flows directly to those who create, engage, and build the platform.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-green-400">3. Transparent Governance</h4>
                  <p>Platform decisions are made collectively through decentralized governance mechanisms. Token holders have a voice in shaping the future of EqoFlow through democratic processes.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-green-400">4. Privacy by Design</h4>
                  <p>Your privacy is not a product to be sold. We implement privacy-preserving technologies and give you full control over your personal information.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-green-400">5. Authentic Community</h4>
                  <p>We foster genuine connections and meaningful conversations. Our algorithms prioritize engagement quality over quantity, promoting healthy discourse and community building.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">The EqoFlow Ecosystem</h3>
              <p>EqoFlow is more than a social platform—it's a comprehensive ecosystem featuring:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Social Fabric:</strong> Connect, share, and engage with like-minded individuals</li>
                <li><strong>Creator Economy:</strong> Monetize your skills, content, and expertise</li>
                <li><strong>Skills Marketplace:</strong> Buy and sell services within the community</li>
                <li><strong>Live Streaming:</strong> Broadcast and interact in real-time</li>
                <li><strong>NFT Integration:</strong> Showcase and trade digital collectibles</li>
                <li><strong>DAO Governance:</strong> Participate in platform decision-making</li>
                <li><strong>Virtual Spaces:</strong> Meet and collaborate in immersive environments</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Commitment to Innovation</h3>
              <p>We're committed to pushing the boundaries of what's possible in social technology. Through continuous research and development, we integrate cutting-edge innovations including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>AI-powered content discovery and moderation</li>
                <li>Blockchain technology for transparency and ownership</li>
                <li>Advanced privacy-preserving protocols</li>
                <li>Cross-platform identity verification</li>
                <li>Decentralized storage solutions</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Community Guidelines</h3>
              <p>EqoFlow is built on mutual respect and authentic engagement. We expect all community members to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Treat others with respect and dignity</li>
                <li>Share authentic, original content</li>
                <li>Engage constructively in discussions</li>
                <li>Respect intellectual property rights</li>
                <li>Report harmful or inappropriate behavior</li>
                <li>Contribute positively to the ecosystem</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">The Path Forward</h3>
              <p>EqoFlow is in continuous evolution, guided by our community's needs and technological advancement. We're building not just for today, but for a decentralized future where users have true digital sovereignty.</p>
              <p>By joining EqoFlow, you become part of this revolutionary movement towards a more equitable, user-centric internet. Together, we're creating the social infrastructure for the next generation of digital interaction.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Your Role in the Network</h3>
              <p>As a member of EqoFlow, you are not just a user—you are a stakeholder, contributor, and co-creator of this decentralized social fabric. Your voice matters, your content has value, and your participation shapes the platform's evolution.</p>
              <p className="text-green-400 font-medium">Welcome to the future of social networking. Welcome to EqoFlow.</p>
            </div>

            {/* Agreement Checkboxes */}
            <div className="mt-8 space-y-4 border-t border-gray-700 pt-6">
              <p className="text-gray-400">To create an account and join EqoFlow, please confirm the following:</p>
              
              <div className="space-y-4">
                <div className="space-y-3 p-4 bg-black/20 rounded-lg border border-purple-500/20">
                  <h4 className="text-white font-semibold">Required:</h4>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="ageRequirement"
                      checked={requiredChecks.ageRequirement}
                      onCheckedChange={(checked) => handleRequiredCheck('ageRequirement', checked)}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-2 border-green-500 bg-slate-800 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <label
                      htmlFor="ageRequirement"
                      className="text-sm text-white leading-relaxed cursor-pointer"
                    >
                      I am at least 13 years old or meet the minimum age requirement in my jurisdiction.
                    </label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="termsPrivacy"
                      checked={requiredChecks.termsPrivacy}
                      onCheckedChange={(checked) => handleRequiredCheck('termsPrivacy', checked)}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-2 border-green-500 bg-slate-800 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <label
                      htmlFor="termsPrivacy"
                      className="text-sm text-white leading-relaxed cursor-pointer"
                    >
                      I have read and agree to the Terms of Service and Privacy Policy.
                    </label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="betaUnderstanding"
                      checked={requiredChecks.betaUnderstanding}
                      onCheckedChange={(checked) => handleRequiredCheck('betaUnderstanding', checked)}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-2 border-green-500 bg-slate-800 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <label
                      htmlFor="betaUnderstanding"
                      className="text-sm text-white leading-relaxed cursor-pointer"
                    >
                      I understand that the platform is currently under Beta development and some platform features may be missing or not working as intended and will not hold EqoFlow Technologies LLC liable for any repercussions due to missing or malfunctioning services.
                    </label>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="aiBlockchainUnderstanding"
                      checked={requiredChecks.aiBlockchainUnderstanding}
                      onCheckedChange={(checked) => handleRequiredCheck('aiBlockchainUnderstanding', checked)}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-2 border-green-500 bg-slate-800 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <label
                      htmlFor="aiBlockchainUnderstanding"
                      className="text-sm text-white leading-relaxed cursor-pointer"
                    >
                      I understand that some optional features use AI and blockchain technology and I am responsible for how I use them.
                    </label>
                  </div>

                </div>

                <div className="space-y-3 p-4 bg-black/20 rounded-lg border border-blue-500/20">
                  <h4 className="text-white font-semibold">Optional:</h4>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="updates"
                      checked={optionalChecks.updates}
                      onCheckedChange={(checked) => handleOptionalCheck('updates', checked)}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-2 border-blue-500 bg-slate-800 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label
                      htmlFor="updates"
                      className="text-sm text-white leading-relaxed cursor-pointer"
                    >
                      I would like to receive updates about EqoFlow features and announcements.
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="p-6 flex justify-end flex-shrink-0 border-t border-green-500/20">
          {!scrolledToBottom && (
            <p className="text-xs text-gray-400 mr-4 self-center">Please scroll to the bottom to continue</p>
          )}
          <Button
            onClick={handleAgreeClick}
            disabled={!allRequiredChecked || !scrolledToBottom}
            className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 disabled:opacity-50 disabled:bg-gray-500 text-white px-8 py-3"
          >
            Agree & Continue
          </Button>
        </footer>
      </motion.div>
    </div>
  );
}
