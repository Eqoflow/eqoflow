import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UserContext } from '../contexts/UserContext';
import { SocialConnectionReview } from '@/entities/SocialConnectionReview';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe, Shield, Link as LinkIcon, Check, Youtube, Facebook, Instagram, Bot, Star,
  Loader2, ExternalLink, Trash2, Zap, ShieldCheck, Info } from
"lucide-react";
import ManualConnectionModal from "./ManualConnectionModal";
import { initiateXOAuth } from "@/functions/initiateXOAuth";
import { disconnectX } from "@/functions/disconnectX";

// Helper to render icons based on type (URL string or React component)
const renderPlatformIcon = (platformId, iconClassName) => {
  const iconDef = platformIcons[platformId];
  if (!iconDef) return null;

  if (typeof iconDef === 'string') {// It's an image URL
    return <img src={iconDef} alt={`${platformId} icon`} className={iconClassName} />;
  } else {// It's a React component (like Lucide icon)
    const IconComponent = iconDef;
    return <IconComponent className={iconClassName} />;
  }
};

const platformIcons = {
  github: "https://img.icons8.com/material-outlined/48/github.png",
  twitter: "https://img.icons8.com/color/48/twitterx.png",
  linkedin: "https://img.icons8.com/fluency/48/linkedin.png",
  youtube: Youtube,
  facebook: Facebook,
  instagram: Instagram
};

const web3Icons = {
  lens: Globe,
  farcaster: Bot,
  nostr: Shield,
  bluesky: Star,
  mastodon: LinkIcon
};

const availableWeb2Platforms = [
{ id: 'github', name: 'GitHub', requires_manual_verification: false },
{ id: 'twitter', name: 'X (Twitter)', requires_manual_verification: false },
{ id: 'linkedin', name: 'LinkedIn', requires_manual_verification: false },
{ id: 'youtube', name: 'YouTube', requires_manual_verification: false },
{ id: 'facebook', name: 'Facebook', requires_manual_verification: false },
{ id: 'instagram', name: 'Instagram', requires_manual_verification: false }];


const availableWeb3Protocols = [
{ id: 'lens', name: 'Lens Protocol' },
{ id: 'farcaster', name: 'Farcaster' },
{ id: 'nostr', name: 'Nostr' },
{ id: 'bluesky', name: 'Bluesky' },
{ id: 'mastodon', name: 'Mastodon' }];


export default function IdentityHub({ user, onUpdate }) {
  const { refreshUser } = useContext(UserContext);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingPlatforms, setConnectingPlatforms] = useState({});
  const [error, setError] = useState('');

  const web2Connections = user?.cross_platform_identity?.web2_verifications || [];
  const web3Connections = user?.cross_platform_identity?.web3_connections || [];

  const fetchPending = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const reviews = await SocialConnectionReview.filter({ user_email: user.email, status: 'pending' });
      setPendingReviews(reviews);
    } catch (error) {
      console.error("Error fetching pending reviews", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleAddAccount = async (platform, type) => {
    // Special handling for X (Twitter) OAuth
    if (platform.id === 'twitter') {
      setConnectingPlatforms((prev) => ({ ...prev, [platform.id]: true }));
      setError('');

      try {
        const { data } = await initiateXOAuth();
        if (data?.authUrl) {
          // Open OAuth in new tab
          const popup = window.open(data.authUrl, '_blank', 'width=600,height=700');

          // Listen for completion
          const checkConnect = setInterval(() => {
            try {
              if (popup && popup.closed) {
                clearInterval(checkConnect);
                setConnectingPlatforms((prev) => ({ ...prev, [platform.id]: false }));
                // Refresh to check if connection succeeded
                onUpdate({ ...user });
              }
            } catch (e) {









              // Ignore cross-origin errors
            }}, 500);} else {throw new Error('Failed to get authorization URL');}} catch (err) {console.error('Error initiating X OAuth:', err);setError('Failed to connect to X. Please try again.');setConnectingPlatforms((prev) => ({ ...prev, [platform.id]: false }));}
      return;
    }

    // For other platforms, use manual modal
    setSelectedPlatform({ ...platform, type });
    setShowManualModal(true);
  };

  const handleDisconnect = async (platformId, type) => {
    if (!confirm(`Are you sure you want to disconnect your ${platformId} account?`)) {
      return;
    }

    setConnectingPlatforms((prev) => ({ ...prev, [platformId]: true }));
    setError('');

    try {
      // Special handling for X (Twitter) OAuth
      if (platformId === 'twitter') {
        await disconnectX();
        await refreshUser();
        setConnectingPlatforms((prev) => ({ ...prev, [platformId]: false }));
        return;
      }

      let updatedIdentity = { ...user.cross_platform_identity };
      if (type === 'web2') {
        updatedIdentity.web2_verifications = web2Connections.filter((c) => c.platform !== platformId);
      } else {
        updatedIdentity.web3_connections = web3Connections.filter((c) => c.protocol !== platformId);
      }

      await onUpdate({ cross_platform_identity: updatedIdentity });
    } catch (err) {
      console.error(`Error disconnecting ${platformId}:`, err);
      setError(`Failed to disconnect ${platformId}. Please try again.`);
    } finally {
      setConnectingPlatforms((prev) => ({ ...prev, [platformId]: false }));
    }
  };

  const getConnectionStatus = (platformId, type) => {
    // Special handling for X (Twitter) - check x_username field
    if (platformId === 'twitter' && user?.x_username) {
      return 'approved';
    }

    if (type === 'web2') {
      if (web2Connections.some((c) => c.platform === platformId)) return 'approved';
      if (pendingReviews.some((r) => r.platform === platformId)) return 'pending';
    } else {// web3
      if (web3Connections.some((c) => c.protocol === platformId)) return 'approved';
    }
    return 'disconnected';
  };

  // Calculate totals for overview
  const totalFollowers = web2Connections.reduce((sum, conn) => sum + (conn.follower_count || 0), 0) +
  web3Connections.reduce((sum, conn) => sum + (conn.follower_count || 0), 0);
  const totalConnectedAccounts = web2Connections.length + web3Connections.length;
  const verificationLevel = user?.professional_credentials?.is_verified ? 'PROFESSIONAL' : 'BASIC';

  return (
    <>
      <div className="bg-[#000000] space-y-6 md:bg-black md:p-4 md:rounded-xl">
        {/* Identity Overview Section */}
        <Card className="dark-card">
          <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Identity Overview
              <Info className="w-4 h-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-[#000000] pt-0 p-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-400 mb-1">{totalFollowers.toLocaleString()}</div>
                <div className="text-sm text-white font-medium">Total Followers</div>
                <div className="text-xs text-gray-400">Across all platforms</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-cyan-400 mb-1">{totalConnectedAccounts}</div>
                <div className="text-sm text-white font-medium">Connected Accounts</div>
                <div className="text-xs text-gray-400">Web2 + Web3 platforms</div>
              </div>
              <div>
                <Badge className={`text-sm px-3 py-1 ${
                verificationLevel === 'PROFESSIONAL' ?
                'bg-green-600/20 text-green-400 border-green-500/30' :
                'bg-blue-600/20 text-blue-400 border-blue-500/30'}`
                }>
                  {verificationLevel}
                </Badge>
                <div className="text-sm text-white font-medium mt-1">Verification Level</div>
                <div className="text-xs text-gray-400">Current status</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Web2 Social Connections */}
        <Card className="dark-card">
          <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5">
            <CardTitle className="text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-purple-400" />
              Web2 Platform Verifications
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-[#000000] pt-0 p-6 space-y-4">
            <p className="text-gray-400 text-sm">
              Connect your social media accounts to build credibility and import your real follower counts.
            </p>

            {/* Connected Accounts Section */}
            {(web2Connections.length > 0 || user?.x_username) &&
            <div className="space-y-3">
                <h4 className="text-white font-medium">Connected Accounts</h4>
                
                {/* X (Twitter) Connection - Show if connected */}
                {user?.x_username &&
              <div className="flex items-center justify-between p-3 bg-green-600/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      {renderPlatformIcon('twitter', "w-5 h-5 text-green-400 fill-current")}
                      <div>
                        <div className="text-white font-medium">@{user.x_username}</div>
                        <div className="text-sm text-gray-400">X (Twitter)</div>
                      </div>
                      <Badge className="bg-green-600/20 text-green-400 border-green-500/30 text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://twitter.com/${user.x_username}`, '_blank')}
                    className="text-gray-400 hover:text-white">

                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect('twitter', 'web2')}
                    className="text-red-400 hover:text-red-300">

                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
              }
                
                {web2Connections.map((connection, index) => {
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-600/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        {renderPlatformIcon(connection.platform, "w-5 h-5 text-green-400 fill-current")}
                        <div>
                          <div className="text-white font-medium">{connection.display_name}</div>
                          <div className="text-sm text-gray-400">{connection.follower_count?.toLocaleString() || 0} followers</div>
                        </div>
                        <Badge className="bg-green-600/20 text-green-400 border-green-500/30 text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(connection.profile_url, '_blank')}
                        className="text-gray-400 hover:text-white">

                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(connection.platform, 'web2')}
                        className="text-red-400 hover:text-red-300">

                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>);

              })}
              </div>
            }

            {error &&
            <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-300 rounded-lg text-sm">
                Error: {error}
              </div>
            }

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableWeb2Platforms.map((platform) => {
                const status = getConnectionStatus(platform.id, 'web2');
                const isConnecting = connectingPlatforms[platform.id];

                const baseButtonClass = 'group h-auto p-4 flex flex-col items-center justify-center gap-1 text-white transition-all duration-200 w-full text-center';
                let buttonClass, iconClass, textClass;

                switch (status) {
                  case 'approved':
                    return null; // Don't show connected platforms in the grid
                  case 'pending':
                    buttonClass = 'bg-yellow-600/10 border border-yellow-500/20 cursor-not-allowed';
                    iconClass = 'text-yellow-400';
                    textClass = 'text-yellow-400';
                    break;
                  default: // disconnected
                    buttonClass = 'bg-black/20 hover:bg-purple-500/10 border border-purple-500/20';
                    iconClass = 'text-white';
                    textClass = '';
                    break;
                }

                return (
                  <Button
                    key={platform.id}
                    onClick={() => status === 'disconnected' && handleAddAccount(platform, 'web2')}
                    disabled={status === 'pending' || isConnecting}
                    className={`${baseButtonClass} ${buttonClass}`}>

                    {isConnecting ?
                    <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm font-medium">Connecting...</span>
                      </> :

                    <>
                        {renderPlatformIcon(platform.id, `w-6 h-6 transition-colors ${iconClass}`)}
                        <span className={`text-sm font-medium transition-colors ${textClass}`}>
                          {status === 'pending' ? 'Pending Review' : `Connect ${platform.name}`}
                        </span>
                        <span className={`text-xs text-gray-400 transition-colors ${textClass}`}>
                            {status === 'pending' ? 'Under Review' : ''}
                        </span>
                      </>
                    }
                  </Button>);

              })}
            </div>
          </CardContent>
        </Card>

        {/* Web3 Protocol Connections */}
        <Card className="dark-card">
          <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5">
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Web3 Protocol Connections
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-[#000000] pt-0 p-6 space-y-4">
            <p className="text-gray-400 text-sm">
              Add other Web3 social protocols to import your decentralized identity and reputation.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableWeb3Protocols.map((protocol) => {
                const Icon = web3Icons[protocol.id];
                const status = getConnectionStatus(protocol.id, 'web3');
                const connectionData = web3Connections.find((conn) => conn.protocol === protocol.id);
                const isConnecting = connectingPlatforms[protocol.id];

                const baseButtonClass = 'group h-auto p-4 flex flex-col items-center justify-center gap-1 text-white transition-all duration-200 w-full text-center';
                let buttonClass, iconClass, textClass;

                if (status === 'approved') {
                  buttonClass = 'bg-cyan-600/20 border border-cyan-500/30 hover:bg-red-500/10 hover:border-red-500/30';
                  iconClass = 'text-cyan-400 group-hover:text-red-400';
                  textClass = 'group-hover:text-red-400';
                } else {// disconnected
                  buttonClass = 'bg-black/20 hover:bg-cyan-500/10 border border-cyan-500/20';
                  iconClass = 'text-white';
                  textClass = '';
                }

                return (
                  <Button
                    key={protocol.id}
                    onClick={() => status === 'approved' ? handleDisconnect(protocol.id, 'web3') : handleAddAccount(protocol, 'web3')}
                    disabled={isConnecting}
                    className={`${baseButtonClass} ${buttonClass}`}>

                    {isConnecting ?
                    <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm font-medium">Connecting...</span>
                      </> :

                    <>
                        <Icon className={`w-6 h-6 transition-colors ${iconClass}`} />
                        <span className={`text-sm font-medium transition-colors ${textClass}`}>
                          {status === 'approved' ?
                        connectionData?.handle || `Connected ${protocol.name}` :
                        `Add ${protocol.name}`}
                        </span>
                        {status === 'approved' &&
                      <span className="text-xs text-gray-400 group-hover:text-red-400 transition-colors">
                            Click to disconnect
                          </span>
                      }
                      </>
                    }
                  </Button>);

              })}
            </div>
          </CardContent>
        </Card>

        {/* Verifiable Credentials Link */}
        <Card className="dark-card">
          <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5">
            <CardTitle className="text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              Professional & Verifiable Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-[#000000] pt-0 p-6 space-y-4">
            <p className="text-gray-400 text-sm">
              Add and manage your professional qualifications, licenses, and other verifiable credentials to build trust and unlock new opportunities on the platform.
            </p>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-500 w-full">
              <Link to={createPageUrl("Profile?section=professional")}>
                Manage Credentials
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {showManualModal &&
      <ManualConnectionModal
        platform={selectedPlatform}
        type={selectedPlatform.type}
        onClose={() => setShowManualModal(false)}
        onConnectionSubmitted={() => {
          fetchPending();
          refreshUser();
        }} />

      }
    </>);

}