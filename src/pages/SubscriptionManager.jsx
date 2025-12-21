
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User } from '@/entities/User';
import { UserProfileData } from '@/entities/UserProfileData';
import { processSubscriptionBenefits } from '@/functions/processSubscriptionBenefits';
import { Search, Crown, Sparkles, Check, AlertTriangle, Trash2, ArrowUp, ArrowDown, User as UserIcon, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SubscriptionManager() {
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activeTab, setActiveTab] = useState('creator');
  const [subscribedUsers, setSubscribedUsers] = useState({ creator: [], pro: [] });
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    loadSubscribedUsers();
  }, []);

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const loadSubscribedUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const allUsers = await User.list('-created_date', 1000);

      const creatorUsers = [];
      const proUsers = [];

      for (const user of allUsers) {
        if (user.subscription_tier === 'Creator' || user.subscription_tier === 'Pro') {
          const profileData = await UserProfileData.filter({ user_email: user.email });
          // Prioritize UserProfileData fields over User entity fields
          const mergedUser = profileData.length > 0 ? { ...user, ...profileData[0] } : user;

          if (user.subscription_tier === 'Creator') {
            creatorUsers.push(mergedUser);
          } else if (user.subscription_tier === 'Pro') {
            proUsers.push(mergedUser);
          }
        }
      }

      setSubscribedUsers({
        creator: creatorUsers,
        pro: proUsers
      });
    } catch (error) {
      console.error('Error loading subscribed users:', error);
      showMessage('Error loading subscribed users', 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const searchUser = async () => {
    if (!searchEmail.trim()) return;

    setIsSearching(true);
    try {
      const users = await User.filter({ email: searchEmail.toLowerCase().trim() });
      if (users.length > 0) {
        const profileData = await UserProfileData.filter({ user_email: users[0].email });
        // Prioritize UserProfileData fields over User entity fields
        const mergedUser = profileData.length > 0 ? { ...users[0], ...profileData[0] } : users[0];
        setFoundUser(mergedUser);
        showMessage(`Found user: ${mergedUser.full_name || mergedUser.email}`, 'success');
      } else {
        setFoundUser(null);
        showMessage('User not found', 'error');
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      showMessage('Error searching for user', 'error');
      setFoundUser(null);
    } finally {
      setIsSearching(false);
    }
  };

  const updateSubscription = async (userEmail, tier) => {
    setIsUpdating(true);
    try {
      const { data: responseData } = await processSubscriptionBenefits({
        userEmail: userEmail,
        subscriptionTier: tier,
        paymentConfirmed: true
      });

      if (!responseData || !responseData.success) {
        throw new Error(responseData.error || 'Failed to update subscription on the backend.');
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reload all users
      await loadSubscribedUsers();

      // If this was the searched user, refresh their data
      if (foundUser && foundUser.email === userEmail) {
        const updatedUsers = await User.filter({ email: userEmail });
        if (updatedUsers.length > 0) {
          const profileData = await UserProfileData.filter({ user_email: updatedUsers[0].email });
          // Prioritize UserProfileData fields over User entity fields
          const mergedUser = profileData.length > 0 ? { ...updatedUsers[0], ...profileData[0] } : updatedUsers[0];
          setFoundUser(mergedUser);
        }
      }

      showMessage(`Successfully updated subscription to ${tier}`, 'success');
    } catch (error) {
      console.error('Error updating subscription:', error);
      showMessage(error.message || 'An unexpected error occurred while updating the subscription.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Pro': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black';
      case 'Creator': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const SubscriberCard = ({ user }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dark-card p-4 rounded-lg">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
              {user.avatar_url ?
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" /> :

                <UserIcon className="w-6 h-6 text-white" />
              }
            </div>
            <div>
              <h3 className="font-semibold text-white">{user.full_name || user.email}</h3>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.subscription_tier === 'Creator' &&
              <>
                <Button
                  onClick={() => updateSubscription(user.email, 'Pro')}
                  disabled={isUpdating}
                  size="sm"
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black">

                  <ArrowUp className="w-4 h-4 mr-1" />
                  Upgrade to Pro
                </Button>
                <Button
                  onClick={() => updateSubscription(user.email, 'Standard')}
                  disabled={isUpdating}
                  size="sm"
                  variant="destructive">

                  <Trash2 className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </>
            }
            {user.subscription_tier === 'Pro' &&
              <>
                <Button
                  onClick={() => updateSubscription(user.email, 'Creator')}
                  disabled={isUpdating}
                  size="sm"
                  variant="outline" className="bg-background text-slate-50 px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 rounded-md border-purple-500/30 hover:bg-purple-500/10">


                  <ArrowDown className="w-4 h-4 mr-1" />
                  Downgrade to Creator
                </Button>
                <Button
                  onClick={() => updateSubscription(user.email, 'Standard')}
                  disabled={isUpdating}
                  size="sm"
                  variant="destructive">

                  <Trash2 className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </>
            }
          </div>
        </div>
      </motion.div>);

  };

  return (
    <div className="p-6 bg-black min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <Link to={createPageUrl("AdminHub")}>
          <Button
            variant="outline"
            className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Hub
          </Button>
        </Link>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Subscription Manager</h1>
          <p className="text-gray-400">Manage user subscription tiers and benefits</p>
        </div>

        <AnimatePresence>
          {message &&
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-3 rounded-lg border flex items-center gap-2 ${messageType === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                  messageType === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    'bg-blue-500/10 border-blue-500/30 text-blue-400'}`
              }>

              {messageType === 'success' ? <Check className="w-4 h-4" /> :
                messageType === 'error' ? <AlertTriangle className="w-4 h-4" /> :
                  <AlertTriangle className="w-4 h-4" />}
              {message}
            </motion.div>
          }
        </AnimatePresence>

        {/* Search User */}
        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="w-5 h-5" />
              Find Specific User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Enter user email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                className="bg-slate-900 border-purple-500/30 text-white" />

              <Button
                onClick={searchUser}
                disabled={isSearching || !searchEmail.trim()}
                className="bg-purple-600 hover:bg-purple-700">

                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Details */}
        {foundUser &&
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}>

            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white">User Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
                    {foundUser.avatar_url ?
                      <img src={foundUser.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" /> :

                      <span className="text-white text-xl font-bold">
                        {(foundUser.full_name || foundUser.email)?.[0]?.toUpperCase()}
                      </span>
                    }
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {foundUser.full_name || foundUser.email}
                    </h3>
                    <p className="text-gray-400">{foundUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-300">Current Tier:</span>
                      <Badge className={getTierColor(foundUser.subscription_tier || 'Standard')}>
                        {foundUser.subscription_tier || 'Standard'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-gray-700">
                  <Button
                    onClick={() => updateSubscription(foundUser.email, 'Standard')}
                    disabled={isUpdating}
                    variant={foundUser.subscription_tier === 'Standard' ? 'default' : 'outline'}
                    className="w-full">

                    Standard (Free)
                  </Button>
                  <Button
                    onClick={() => updateSubscription(foundUser.email, 'Creator')}
                    disabled={isUpdating}
                    className={`w-full ${foundUser.subscription_tier === 'Creator' ?
                        'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                        'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30'}`}>

                    <Sparkles className="w-4 h-4 mr-2" />
                    Creator
                  </Button>
                  <Button
                    onClick={() => updateSubscription(foundUser.email, 'Pro')}
                    disabled={isUpdating}
                    className={`w-full ${foundUser.subscription_tier === 'Pro' ?
                        'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' :
                        'bg-gradient-to-r from-yellow-400/20 to-orange-500/20 text-yellow-400 border-yellow-500/30'}`}>

                    <Crown className="w-4 h-4 mr-2" />
                    Pro
                  </Button>
                </div>

                {isUpdating &&
                  <div className="text-center text-purple-400">
                    Updating subscription and processing benefits...
                  </div>
                }
              </CardContent>
            </Card>
          </motion.div>
        }

        {/* Subscribed Users List */}
        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-white">All Subscribed Users</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <Button
                onClick={() => setActiveTab('creator')}
                className={`flex-1 ${activeTab === 'creator' ?
                  'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                  'bg-slate-800 text-gray-400'}`}>

                <Sparkles className="w-4 h-4 mr-2" />
                Creator ({subscribedUsers.creator.length})
              </Button>
              <Button
                onClick={() => setActiveTab('pro')}
                className={`flex-1 ${activeTab === 'pro' ?
                  'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' :
                  'bg-slate-800 text-gray-400'}`}>

                <Crown className="w-4 h-4 mr-2" />
                Pro ({subscribedUsers.pro.length})
              </Button>
            </div>

            {/* Users List */}
            {isLoadingUsers ?
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading subscribed users...</p>
              </div> :

              <div className="space-y-3">
                {activeTab === 'creator' && (
                  subscribedUsers.creator.length > 0 ?
                    subscribedUsers.creator.map((user) =>
                      <SubscriberCard key={user.email} user={user} />
                    ) :

                    <p className="text-center text-gray-400 py-8">No Creator subscribers yet</p>)

                }
                {activeTab === 'pro' && (
                  subscribedUsers.pro.length > 0 ?
                    subscribedUsers.pro.map((user) =>
                      <SubscriberCard key={user.email} user={user} />
                    ) :

                    <p className="text-center text-gray-400 py-8">No Pro subscribers yet</p>)

                }
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>);

}
