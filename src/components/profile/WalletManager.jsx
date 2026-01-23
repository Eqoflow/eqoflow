import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, Coins } from 'lucide-react';
import TokenBalanceCard from './TokenBalanceCard';
import FiatPaymentManager from './FiatPaymentManager';
import StripeConnectManager from './StripeConnectManager';
import { useWallet } from '@solana/wallet-adapter-react';

export default function WalletManager({ user, onUpdate }) {
  const { connect, disconnect, publicKey, connected, wallet, select, wallets } = useWallet();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isConnecting, setIsConnecting] = useState(false);

  // Safety check: if user is null or undefined, show loading state
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <p className="text-gray-400">Loading wallet...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalBalance = (user.token_balance || 0) + (user.tokens_on_hold || 0);

  // Handle wallet connection success
  useEffect(() => {
    const linkWallet = async () => {
      if (connected && publicKey && !user.solana_wallet_address && !isConnecting) {
        setIsConnecting(true);
        try {
          const { linkSolanaWallet } = await import('@/functions/linkSolanaWallet');
          await linkSolanaWallet({ publicKey: publicKey.toString() });
          if (onUpdate) await onUpdate();
        } catch (error) {
          console.error('Error linking wallet:', error);
          alert('Connected but failed to save wallet address. Please try again.');
        } finally {
          setIsConnecting(false);
        }
      }
    };
    
    linkWallet();
  }, [connected, publicKey, user.solana_wallet_address]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setSelectedTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === 'overview'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedTab('payouts')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === 'payouts'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Payout Methods
        </button>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          <TokenBalanceCard user={user} onUpdate={onUpdate} />
          
          {/* Phantom Wallet Connection */}
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-400" />
                Phantom Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.solana_wallet_address ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-600/10 border border-green-500/20 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Connected Wallet</p>
                      <p className="text-white font-mono text-sm">
                        {user.solana_wallet_address.slice(0, 8)}...{user.solana_wallet_address.slice(-8)}
                      </p>
                    </div>
                    <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                      Connected
                    </Badge>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        // Disconnect wallet adapter first
                        if (connected) {
                          await disconnect();
                        }

                        // Then update backend
                        const { unlinkSolanaWallet } = await import('@/functions/unlinkSolanaWallet');
                        await unlinkSolanaWallet();

                        // Refresh user data
                        if (onUpdate) await onUpdate();
                      } catch (error) {
                        console.error('Error disconnecting wallet:', error);
                        alert('Failed to disconnect wallet. Please try again.');
                      }
                    }}
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Disconnect Phantom Wallet
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Connect your Phantom wallet to receive $EQOFLO tokens and participate in the ecosystem.
                  </p>
                  <Button
                    onClick={async () => {
                      if (isConnecting) return;

                      setIsConnecting(true);
                      try {
                        // Find and select Phantom wallet
                        const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
                        if (phantomWallet) {
                          select(phantomWallet.adapter.name);
                          // Wait a bit for selection to register
                          await new Promise(resolve => setTimeout(resolve, 100));
                        }

                        await connect();
                      } catch (error) {
                        console.error('Error connecting wallet:', error);
                        alert('Failed to connect wallet. Please try again and approve the connection in Phantom.');
                        setIsConnecting(false);
                      }
                    }}
                    disabled={isConnecting}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    {isConnecting ? 'Connecting...' : 'Connect Phantom Wallet'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="dark-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Balance</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {totalBalance.toLocaleString()} $EQOFLO
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Available</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">
                      {(user.token_balance || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Locked</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">
                      {(user.tokens_on_hold || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Payout Methods Tab */}
      {selectedTab === 'payouts' && (
        <div className="space-y-6">
          <Card className="dark-card">
            <CardHeader>
              <CardTitle className="text-white">Payout Methods</CardTitle>
              <p className="text-sm text-gray-400 mt-2">
                Connect your payment accounts to receive payouts from the marketplace
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stripe Connect Manager */}
              <StripeConnectManager user={user} onUpdate={onUpdate} />
              
              {/* Existing Fiat Payment Manager */}
              <FiatPaymentManager user={user} onUpdate={onUpdate} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}