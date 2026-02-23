import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUser } from "@/components/contexts/UserContext";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, DollarSign, UserPlus, UserCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function PublicCreatorProfile() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const creatorEmail = searchParams.get('creator');

  const [creatorProfile, setCreatorProfile] = useState(null);
  const [creatorContent, setCreatorContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [subscriberCount, setSubscriberCount] = useState(0);

  const userColorScheme = {
    primary: user?.color_scheme ? getColorScheme(user.color_scheme).primary : '#8b5cf6',
    secondary: user?.color_scheme ? getColorScheme(user.color_scheme).secondary : '#ec4899',
    accent: user?.color_scheme ? getColorScheme(user.color_scheme).accent : '#2d1b69'
  };

  useEffect(() => {
    if (creatorEmail) {
      loadCreatorData();
    }
  }, [creatorEmail]);

  const loadCreatorData = async () => {
    if (!creatorEmail) return;

    setIsLoading(true);
    try {
      // Load creator profile
      const profiles = await base44.entities.CreatorProfile.filter({ created_by: creatorEmail });
      if (profiles.length > 0) {
        setCreatorProfile(profiles[0]);
        setSubscriberCount(profiles[0].subscriber_count || 0);
      }

      // Load creator's published content
      const content = await base44.entities.Post.filter({
        created_by: creatorEmail,
        is_creator_hub_published: true,
        blockchain_tx_id: { $ne: null }
      }, '-created_date', 50);
      setCreatorContent(content);

      // Check if current user is subscribed (placeholder - implement subscription logic)
      // const subscriptions = await base44.entities.Subscription.filter({ ... });
      // setIsSubscribed(subscriptions.length > 0);
    } catch (error) {
      console.error("Error loading creator data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!creatorProfile || !user) return;

    try {
      const newSubscribedState = !isSubscribed;
      setIsSubscribed(newSubscribedState);

      // Update subscriber count
      const newCount = newSubscribedState ? subscriberCount + 1 : subscriberCount - 1;
      setSubscriberCount(newCount);

      // Update the creator profile subscriber count
      await base44.entities.CreatorProfile.update(creatorProfile.id, {
        subscriber_count: newCount
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      // Revert on error
      setIsSubscribed(!isSubscribed);
      setSubscriberCount(newSubscribedState ? subscriberCount - 1 : subscriberCount + 1);
    }
  };

  const handleTip = async () => {
    if (!tipAmount || parseFloat(tipAmount) <= 0) {
      alert("Please enter a valid tip amount");
      return;
    }

    // Implement tipping logic
    alert(`Tip of $${tipAmount} sent! (Integration pending)`);
    setShowTipModal(false);
    setTipAmount("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/942c1cf5d_EqoFlowLogoDesign-14.png"
            alt="Loading"
            className="w-24 h-24 object-contain" />

        </div>
      </div>);

  }

  if (!creatorProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-white/70 text-lg mb-4">Creator profile not found</p>
        <Button onClick={() => navigate(createPageUrl("CreatorHub") + "?view=user")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Creator Hub
        </Button>
      </div>);

  }

  return (
    <div className="min-h-screen pb-20">
      {/* Back Button */}
      <Button
        onClick={() => navigate(createPageUrl("CreatorHub") + "?view=user")}
        variant="outline" className="bg-background text-slate-950 mb-6 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-9 border-white/20 hover:bg-white/10">

        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Creator Hub
      </Button>

      {/* Creator Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${userColorScheme.accent}E6, ${userColorScheme.primary}40)`,
          border: `2px solid ${userColorScheme.primary}60`
        }}>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                {creatorProfile.logo_url ?
                <img src={creatorProfile.logo_url} alt="Creator Logo" className="w-full h-full object-contain" /> :

                <Sparkles className="w-full h-full text-yellow-400" />
                }
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {creatorProfile.channel_name}
                </h1>
                <div className="flex items-center gap-4 text-lg text-white/60">
                  <span>{creatorContent.length} Published Content</span>
                  <span>•</span>
                  <span>{subscriberCount} Subscribers</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleSubscribe}
                className={`${isSubscribed ? 'bg-white/10' : ''}`}
                style={!isSubscribed ? {
                  background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})`
                } : {}}>
                {isSubscribed ?
                <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Subscribed
                  </> :

                <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Subscribe
                  </>
                }
              </Button>
              <Button
                onClick={() => setShowTipModal(true)}
                variant="outline" className="bg-background text-slate-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-9 border-white/20 hover:bg-white/10">

                <DollarSign className="w-4 h-4 mr-2" />
                Tip Creator
              </Button>
            </div>
          </div>

          {creatorProfile.description &&
          <p className="text-white/80 text-lg mb-4 max-w-3xl">
              {creatorProfile.description}
            </p>
          }

          {creatorProfile.social_links && creatorProfile.social_links.length > 0 &&
          <div>
              <h3 className="text-white font-semibold mb-3">Social Channels</h3>
              <div className="flex flex-wrap gap-2">
                {creatorProfile.social_links.map((link, index) =>
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 text-white text-sm transition-all duration-200 hover:scale-105 capitalize">
                    {link.platform}
                  </a>
              )}
              </div>
            </div>
          }
        </div>
      </motion.div>

      {/* Creator Content Grid */}
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Published Content</CardTitle>
        </CardHeader>
        <CardContent>
          {creatorContent.length === 0 ?
          <p className="text-white/60 text-center py-8">
              No content published yet
            </p> :

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creatorContent.map((item) =>
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/40 rounded-lg border border-white/10 overflow-hidden group hover:border-purple-500/50 transition-all">
                  
                  {item.media_urls && item.media_urls.length > 0 &&
              <div className="aspect-video bg-black/60 relative overflow-hidden">
                      {item.media_urls[0].match(/\.(jpg|jpeg|png|gif|webp)$/i) ?
                <img
                  src={item.media_urls[0]}
                  alt={item.author_full_name}
                  className="w-full h-full object-cover" /> :

                item.media_urls[0].match(/\.(mp4|webm|mov)$/i) ?
                <video
                  src={item.media_urls[0]}
                  className="w-full h-full object-cover"
                  controls /> :


                <div className="w-full h-full flex items-center justify-center">
                          <Shield className="w-12 h-12 text-white/30" />
                        </div>
                }
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                        <Shield className="w-4 h-4 text-green-400" />
                      </div>
                    </div>
              }
                  
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-1">{item.author_full_name || "Untitled"}</h3>
                    <p className="text-white/60 text-sm mb-2 line-clamp-2">{item.content || "No description"}</p>
                    <div className="text-xs text-white/40">
                      {new Date(item.created_date).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
            )}
            </div>
          }
        </CardContent>
      </Card>

      {/* Tip Modal */}
      <Dialog open={showTipModal} onOpenChange={setShowTipModal}>
        <DialogContent className="bg-black/95 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" style={{ color: userColorScheme.primary }} />
              Tip {creatorProfile.channel_name}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Support this creator with a tip
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-white text-sm mb-2 block">Amount (USD)</label>
              <Input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="5.00"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                min="0.01"
                step="0.01" />

            </div>

            <div className="flex gap-2">
              {[5, 10, 20, 50].map((amount) =>
              <Button
                key={amount}
                onClick={() => setTipAmount(amount.toString())}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10">
                  ${amount}
                </Button>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowTipModal(false)}
                className="border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button
                onClick={handleTip}
                style={{ background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})` }}>
                Send Tip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}

function getColorScheme(schemeName) {
  const colorSchemes = {
    purple: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#2d1b69' },
    blue: { primary: '#3b82f6', secondary: '#06b6d4', accent: '#1e3a8a' },
    green: { primary: '#10b981', secondary: '#059669', accent: '#064e3b' },
    orange: { primary: '#f97316', secondary: '#eab308', accent: '#92400e' },
    red: { primary: '#ef4444', secondary: '#ec4899', accent: '#991b1b' },
    pink: { primary: '#ec4899', secondary: '#f472b6', accent: '#be185d' },
    cyan: { primary: '#06b6d4', secondary: '#3b82f6', accent: '#0e7490' },
    yellow: { primary: '#eab308', secondary: '#f97316', accent: '#a16207' },
    indigo: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#4338ca' },
    emerald: { primary: '#10b981', secondary: '#059646', accent: '#065f46' }
  };
  return colorSchemes[schemeName] || colorSchemes.purple;
}