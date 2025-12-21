import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Gem, 
  Crown, 
  Sparkles, 
  User as UserIcon,
  Check,
  X,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

export default function QuantumNFTManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [nftStatus, setNftStatus] = useState({}); // Track NFT distribution status
  const [notes, setNotes] = useState({}); // Track admin notes

  useEffect(() => {
    loadSubscribedUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedTier]);

  const loadSubscribedUsers = async () => {
    try {
      setIsLoading(true);
      // Get all users with paid subscriptions
      const allUsers = await User.list('-updated_date');
      const subscribedUsers = allUsers.filter(user => 
        user.subscription_tier === 'Creator' || user.subscription_tier === 'Pro'
      );
      setUsers(subscribedUsers);
    } catch (error) {
      console.error('Error loading subscribed users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedTier !== 'all') {
      filtered = filtered.filter(user => user.subscription_tier === selectedTier);
    }

    setFilteredUsers(filtered);
  };

  const markNFTAsSent = (userId, status, note = '') => {
    setNftStatus(prev => ({
      ...prev,
      [userId]: status
    }));
    
    if (note) {
      setNotes(prev => ({
        ...prev,
        [userId]: note
      }));
    }
  };

  const getTierIcon = (tier) => {
    return tier === 'Creator' ? Sparkles : Crown;
  };

  const getTierColor = (tier) => {
    return tier === 'Creator' 
      ? 'from-purple-500 to-pink-500' 
      : 'from-yellow-400 to-orange-500';
  };

  const getTierNFTDescription = (tier) => {
    return tier === 'Creator' 
      ? '1x Creator NFT from QuantumFlow' 
      : '1x Unique NFT';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
          <span className="text-lg">Loading subscription data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Quantum+ NFT Management
          </h1>
          <p className="text-gray-400">
            Manage NFT rewards for Quantum+ subscribers. Track distribution and maintain records.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="dark-card">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-400">{users.length}</div>
              <div className="text-sm text-gray-400">Total Subscribers</div>
            </CardContent>
          </Card>
          <Card className="dark-card">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-400">
                {users.filter(u => u.subscription_tier === 'Creator').length}
              </div>
              <div className="text-sm text-gray-400">Creator Subscribers</div>
            </CardContent>
          </Card>
          <Card className="dark-card">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-400">
                {users.filter(u => u.subscription_tier === 'Pro').length}
              </div>
              <div className="text-sm text-gray-400">Pro Subscribers</div>
            </CardContent>
          </Card>
          <Card className="dark-card">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-400">
                {Object.values(nftStatus).filter(status => status === 'sent').length}
              </div>
              <div className="text-sm text-gray-400">NFTs Distributed</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="dark-card mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/20 border-purple-500/20 text-white"
                  />
                </div>
              </div>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="px-4 py-2 bg-black/20 border border-purple-500/20 rounded-md text-white"
              >
                <option value="all">All Tiers</option>
                <option value="Creator">Creator Only</option>
                <option value="Pro">Pro Only</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* User List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => {
            const TierIcon = getTierIcon(user.subscription_tier);
            const userNftStatus = nftStatus[user.id] || 'pending';
            const userNotes = notes[user.id] || '';

            return (
              <Card key={user.id} className="dark-card">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-500"
                      >
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-white">{user.full_name || 'Anonymous'}</h3>
                          <Badge className={`bg-gradient-to-r ${getTierColor(user.subscription_tier)} text-white font-bold px-2 py-1`}>
                            <TierIcon className="w-3 h-3 mr-1" />
                            {user.subscription_tier}
                          </Badge>
                          {userNftStatus === 'sent' && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <Check className="w-3 h-3 mr-1" />
                              NFT Sent
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{user.email}</p>
                        {user.updated_date && (
                          <p className="text-xs text-gray-500">
                            Subscribed: {format(new Date(user.updated_date), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* NFT Info & Actions */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:min-w-[400px]">
                      <div className="flex-1">
                        <div className="text-sm text-gray-400 mb-1">Entitled NFT:</div>
                        <div className="text-white font-medium">
                          {getTierNFTDescription(user.subscription_tier)}
                        </div>
                        {user.solana_wallet_address && (
                          <div className="text-xs text-purple-400 mt-1">
                            Wallet: {user.solana_wallet_address.substring(0, 8)}...{user.solana_wallet_address.substring(-6)}
                          </div>
                        )}
                        {!user.solana_wallet_address && (
                          <div className="text-xs text-yellow-400 mt-1">
                            ⚠️ No wallet connected
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {userNftStatus === 'pending' && (
                          <>
                            <Button
                              onClick={() => markNFTAsSent(user.id, 'sent')}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Mark as Sent
                            </Button>
                            <Button
                              onClick={() => markNFTAsSent(user.id, 'not_eligible')}
                              size="sm"
                              variant="outline"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Mark Ineligible
                            </Button>
                          </>
                        )}
                        {userNftStatus === 'sent' && (
                          <Button
                            onClick={() => markNFTAsSent(user.id, 'pending')}
                            size="sm"
                            variant="outline"
                            className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
                          >
                            Reset Status
                          </Button>
                        )}
                        {userNftStatus === 'not_eligible' && (
                          <Button
                            onClick={() => markNFTAsSent(user.id, 'pending')}
                            size="sm"
                            variant="outline"
                            className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
                          >
                            Reset Status
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <Textarea
                      placeholder="Add notes about this NFT distribution..."
                      value={userNotes}
                      onChange={(e) => setNotes(prev => ({ ...prev, [user.id]: e.target.value }))}
                      className="bg-black/20 border-gray-600/20 text-white text-sm"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredUsers.length === 0 && !isLoading && (
          <Card className="dark-card">
            <CardContent className="p-12 text-center">
              <Gem className="w-16 h-16 mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No subscribers found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedTier !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No users have upgraded to paid Quantum+ subscriptions yet.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}