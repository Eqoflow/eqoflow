
import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { UserProfileData } from '@/entities/UserProfileData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Star,
  Crown,
  Shield,
  Heart,
  Trophy,
  Zap,
  Award,
  Gem,
  Target,
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  Megaphone,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';
import { assignCustomBadge } from '@/functions/assignCustomBadge';

// Executive role definitions
const executiveRoles = {
  'co-ceo': {
    title: 'Co-CEO',
    emails: ['sirp.block.chain@gmail.com', 'trevorhenry20@gmail.com'],
    icon: Crown,
    color: 'text-red-400'
  },
  'cmo': {
    title: 'CMO',
    emails: ['stokes1127@gmail.com'],
    icon: Megaphone,
    color: 'text-purple-400'
  },
  'cfo': {
    title: 'CFO',
    emails: ['keith@quantum3.tech'],
    icon: DollarSign,
    color: 'text-green-400'
  }
};

const availableIcons = [
  { name: 'Star', component: Star },
  { name: 'Crown', component: Crown },
  { name: 'Shield', component: Shield },
  { name: 'Heart', component: Heart },
  { name: 'Trophy', component: Trophy },
  { name: 'Zap', component: Zap },
  { name: 'Award', component: Award },
  { name: 'Gem', component: Gem },
  { name: 'Target', component: Target }
];


const availableColors = [
  { name: 'Purple', value: 'bg-purple-600', text: 'text-white', border: 'border-purple-500/50' },
  { name: 'Blue', value: 'bg-blue-600', text: 'text-white', border: 'border-blue-500/50' },
  { name: 'Green', value: 'bg-green-600', text: 'text-white', border: 'border-green-500/50' },
  { name: 'Red', value: 'bg-red-600', text: 'text-white', border: 'border-red-500/50' },
  { name: 'Yellow', value: 'bg-yellow-500', text: 'text-black', border: 'border-yellow-400/50' },
  { name: 'Pink', value: 'bg-pink-600', text: 'text-white', border: 'border-pink-500/50' },
  { name: 'Orange', value: 'bg-orange-600', text: 'text-white', border: 'border-orange-500/50' },
  { name: 'Indigo', value: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-500/50' },
  { name: 'Teal', value: 'bg-teal-600', text: 'text-white', border: 'border-teal-500/50' },
  { name: 'Emerald', value: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-500/50' }
];


export default function BadgeManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Badge creation form
  const [badgeName, setBadgeName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Star');
  const [selectedColor, setSelectedColor] = useState('bg-purple-600');
  const [badgeDescription, setBadgeDescription] = useState('');

  // Executive management
  const [executiveUsers, setExecutiveUsers] = useState([]);
  const [loadingExecutives, setLoadingExecutives] = useState(false);

  // NEW: Additional state for executive user management
  const [executiveSearchTerm, setExecutiveSearchTerm] = useState('');
  const [executiveSearchResults, setExecutiveSearchResults] = useState([]);
  const [isExecutiveSearching, setIsExecutiveSearching] = useState(false);
  // This will store objects like { email: 'user@example.com', customTitle: 'Advisor' }
  const [customExecutiveUserEmails, setCustomExecutiveUserEmails] = useState([]);
  // This will store the fully hydrated User objects for display
  const [processedCustomExecutiveUsers, setProcessedCustomExecutiveUsers] = useState([]);


  useEffect(() => {
    loadExecutiveUsers();
    loadCustomExecutiveUsers(); // NEW: Load custom added executives
  }, []);

  // NEW: Load custom executive users that were manually added
  const loadCustomExecutiveUsers = async () => {
    try {
      const stored = localStorage.getItem('customExecutiveUserEmails');
      if (stored) {
        const storedEmails = JSON.parse(stored);
        setCustomExecutiveUserEmails(storedEmails);

        if (storedEmails.length > 0) {
          const emailsToFetch = storedEmails.map(item => item.email);

          const [users, profiles] = await Promise.all([
            User.filter({}).then((users) =>
              users.filter((u) => emailsToFetch.includes(u.email))
            ),
            UserProfileData.filter({}).then((profiles) =>
              profiles.filter((p) => emailsToFetch.includes(p.user_email))
            )
          ]);

          const processedUsers = users.map((user) => {
            const profile = profiles.find((p) => p.user_email === user.email);
            const customInfo = storedEmails.find(item => item.email === user.email);

            return {
              ...user,
              display_name: profile?.full_name || user.full_name || user.email,
              display_username: profile?.username || user.username,
              display_avatar: profile?.avatar_url || user.avatar_url,
              custom_badges: user.custom_badges || [],
              executive_role: 'custom', // Indicate this is a custom executive
              customTitle: customInfo?.customTitle || 'Executive' // Use stored custom title
            };
          });
          setProcessedCustomExecutiveUsers(processedUsers);
        } else {
          setProcessedCustomExecutiveUsers([]);
        }
      }
    } catch (error) {
      console.error('Error loading custom executive users:', error);
      setCustomExecutiveUserEmails([]);
      setProcessedCustomExecutiveUsers([]);
    }
  };

  const loadExecutiveUsers = async () => {
    setLoadingExecutives(true);
    try {
      // Get all executive emails
      const allExecutiveEmails = Object.values(executiveRoles).flatMap((role) => role.emails);

      // Fetch users and profiles for these emails
      const [users, profiles] = await Promise.all([
        User.filter({}).then((users) =>
          users.filter((u) => allExecutiveEmails.includes(u.email))
        ),
        UserProfileData.filter({}).then((profiles) =>
          profiles.filter((p) => allExecutiveEmails.includes(p.user_email))
        )
      ]);

      // Merge and organize by role
      const organized = users.map((user) => {
        const profile = profiles.find((p) => p.user_email === user.email);
        const role = Object.entries(executiveRoles).find(([key, roleData]) =>
          roleData.emails.includes(user.email)
        );

        return {
          ...user,
          display_name: profile?.full_name || user.full_name || user.email,
          display_username: profile?.username || user.username,
          display_avatar: profile?.avatar_url || user.avatar_url,
          custom_badges: user.custom_badges || [],
          executive_role: role ? role[0] : null,
          role_title: role ? role[1].title : null,
          role_icon: role ? role[1].icon : Users,
          role_color: role ? role[1].color : 'text-gray-400'
        };
      });

      setExecutiveUsers(organized);
    } catch (error) {
      console.error('Error loading executive users:', error);
    } finally {
      setLoadingExecutives(false);
    }
  };

  // NEW: Search for users to add to executive management
  const handleExecutiveSearch = async () => {
    if (!executiveSearchTerm.trim()) return;

    setIsExecutiveSearching(true);
    try {
      // Search both User and UserProfileData
      const [users, profiles] = await Promise.all([
        User.filter({}).then((users) =>
          users.filter((u) =>
            u.email?.toLowerCase().includes(executiveSearchTerm.toLowerCase()) ||
            u.full_name?.toLowerCase().includes(executiveSearchTerm.toLowerCase()) ||
            u.username?.toLowerCase().includes(executiveSearchTerm.toLowerCase())
          )
        ),
        UserProfileData.filter({}).then((profiles) =>
          profiles.filter((p) =>
            p.user_email?.toLowerCase().includes(executiveSearchTerm.toLowerCase()) ||
            p.full_name?.toLowerCase().includes(executiveSearchTerm.toLowerCase()) ||
            p.username?.toLowerCase().includes(executiveSearchTerm.toLowerCase())
          )
        )
      ]);

      // Merge results
      const merged = users.map((user) => {
        const profile = profiles.find((p) => p.user_email === user.email);
        return {
          ...user,
          display_name: profile?.full_name || user.full_name || user.email,
          display_username: profile?.username || user.username,
          display_avatar: profile?.avatar_url || user.avatar_url,
          custom_badges: user.custom_badges || []
        };
      });

      // Filter out users already in predefined executive roles or custom executives
      const filteredMerged = merged.filter(user =>
        !executiveUsers.some(eu => eu.email === user.email) &&
        !customExecutiveUserEmails.some(ceu => ceu.email === user.email)
      );

      setExecutiveSearchResults(filteredMerged);
    } catch (error) {
      console.error('Executive search error:', error);
    } finally {
      setIsExecutiveSearching(false);
    }
  };

  // NEW: Add user to custom executives list
  const addToCustomExecutives = async (user) => {
    const newCustomExecutiveEntry = {
      email: user.email,
      customTitle: 'Executive', // Default title, can be customized later if needed
      addedAt: new Date().toISOString()
    };

    const updatedEmails = [...customExecutiveUserEmails, newCustomExecutiveEntry];
    setCustomExecutiveUserEmails(updatedEmails);

    localStorage.setItem('customExecutiveUserEmails', JSON.stringify(updatedEmails));

    // Refresh the displayed custom executives
    await loadCustomExecutiveUsers();

    // Clear search
    setExecutiveSearchTerm('');
    setExecutiveSearchResults([]);

    alert('User added to Custom Executive Members successfully!');
  };

  // NEW: Remove user from custom executives
  const removeFromCustomExecutives = (userEmail) => {
    if (!confirm('Are you sure you want to remove this user from custom executives?')) {
      return;
    }
    const updatedEmails = customExecutiveUserEmails.filter(item => item.email !== userEmail);
    setCustomExecutiveUserEmails(updatedEmails);
    localStorage.setItem('customExecutiveUserEmails', JSON.stringify(updatedEmails));

    // Refresh the displayed custom executives
    loadCustomExecutiveUsers();

    // If the removed user was the selected one, deselect them
    if (selectedUser?.email === userEmail) {
      setSelectedUser(null);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      // Search both User and UserProfileData
      const [users, profiles] = await Promise.all([
        User.filter({}).then((users) =>
          users.filter((u) =>
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        ),
        UserProfileData.filter({}).then((profiles) =>
          profiles.filter((p) =>
            p.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.username?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      ]);

      // Merge results, preferring UserProfileData for display info
      const merged = users.map((user) => {
        const profile = profiles.find((p) => p.user_email === user.email);
        return {
          ...user,
          display_name: profile?.full_name || user.full_name || user.email,
          display_username: profile?.username || user.username,
          display_avatar: profile?.avatar_url || user.avatar_url,
          custom_badges: user.custom_badges || []
        };
      });

      setSearchResults(merged);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssignBadge = async (targetUser = null) => {
    const userToUpdate = targetUser || selectedUser;

    if (!userToUpdate || !badgeName.trim() || !selectedIcon || !selectedColor) {
      alert('Please fill in all badge details');
      return;
    }

    setIsAssigning(true);
    try {
      const colorObj = availableColors.find((c) => c.value === selectedColor);

      const badgeData = {
        name: badgeName.trim(),
        description: badgeDescription.trim() || badgeName.trim(),
        icon: selectedIcon,
        color: selectedColor,
        textColor: colorObj.text,
        borderColor: colorObj.border,
        assignedAt: new Date().toISOString(),
        assignedBy: 'admin'
      };

      const response = await assignCustomBadge({
        userEmail: userToUpdate.email,
        badgeData: badgeData
      });

      if (response.data?.success) {
        alert('Badge assigned successfully!');
        // Reset form
        setBadgeName('');
        setBadgeDescription('');
        setSelectedIcon('Star');
        setSelectedColor('bg-purple-600');
        // Refresh data
        handleSearch(); // Refresh general search results
        loadExecutiveUsers(); // Refresh predefined executives
        loadCustomExecutiveUsers(); // Refresh custom executives
      } else {
        alert('Failed to assign badge: ' + (response.data?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Badge assignment error:', error);
      alert('Error assigning badge: ' + error.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveBadge = async (user, badgeIndex) => {
    if (!user || typeof badgeIndex !== 'number') {
      console.warn("Invalid user or badgeIndex provided for removal.");
      return;
    }

    if (!confirm('Are you sure you want to remove this badge?')) {
      return;
    }

    setIsAssigning(true);
    try {
      const response = await assignCustomBadge({
        userEmail: user.email,
        removeBadgeIndex: badgeIndex
      });

      if (response.data?.success) {
        alert('Badge removed successfully!');
        loadExecutiveUsers(); // Refresh predefined executives
        loadCustomExecutiveUsers(); // Refresh custom executives

        // If the removed badge belonged to the currently selected user, clear selection
        if (selectedUser && selectedUser.email === user.email) {
          setSelectedUser(null);
        }
      } else {
        alert('Failed to remove badge: ' + (response.data?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Badge removal error:', error);
      alert('Error removing badge: ' + error.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const renderBadgePreview = () => {
    const IconComponent = availableIcons.find((i) => i.name === selectedIcon)?.component || Star;
    const colorObj = availableColors.find((c) => c.value === selectedColor);

    return (
      <Badge className={`${selectedColor} ${colorObj.text} ${colorObj.border} shadow-md`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {badgeName || 'Preview'}
      </Badge>
    );
  };

  const allExecutiveUsers = [...executiveUsers, ...processedCustomExecutiveUsers];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("AdminHub")}>
            <Button variant="outline" className="bg-background text-slate-950 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-amber-500/30 hover:bg-amber-500/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Hub
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-500">
              Badge Manager
            </h1>
            <p className="text-gray-400 mt-2">
              Assign custom badges to users on the platform
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700 grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="general" className="text-white data-[state=active]:bg-amber-600">
              General Badge Manager
            </TabsTrigger>
            <TabsTrigger value="executives" className="text-white data-[state=active]:bg-amber-600">
              Executive Badge Manager
            </TabsTrigger>
          </TabsList>

          {/* General Badge Manager Tab */}
          <TabsContent value="general">
            <div className="bg-slate-950 grid lg:grid-cols-2 gap-6">
              {/* User Search */}
              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Find User
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by email, name, or username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-black/30 border-gray-700 text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />


                    <Button onClick={handleSearch} disabled={isSearching}>
                      {isSearching ? <QuantumFlowLoader size="sm" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Search Results */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((user) =>
                      <div
                        key={user.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedUser?.id === user.id ?
                            'bg-amber-500/10 border-amber-500' :
                            'bg-black/20 border-gray-700 hover:border-gray-600'}`
                        }
                        onClick={() => setSelectedUser(user)}>

                        <div className="flex items-center gap-3">
                          <img
                            src={user.display_avatar || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/15a1336a5_user-default-avatar.png'}
                            alt={user.display_name}
                            className="w-10 h-10 rounded-full object-cover" />

                          <div className="flex-1">
                            <p className="font-medium text-white">{user.display_name}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                            {user.display_username &&
                              <p className="text-xs text-gray-500">@{user.display_username}</p>
                            }
                          </div>
                        </div>

                        {/* Show current custom badges */}
                        {user.custom_badges && user.custom_badges.length > 0 &&
                          <div className="mt-2 flex flex-wrap gap-1">
                            {user.custom_badges.map((badge, index) => {
                              const IconComponent = availableIcons.find((i) => i.name === badge.icon)?.component || Star;
                              return (
                                <div key={index} className="flex items-center gap-1">
                                  <Badge className={`${badge.color} ${badge.textColor} ${badge.borderColor} text-xs`}>
                                    <IconComponent className="w-3 h-3 mr-1" />
                                    {badge.name}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="p-1 h-auto text-red-400 hover:text-red-300"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveBadge(user, index);
                                    }}
                                    disabled={isAssigning}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>);

                            })}
                          </div>
                        }
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Badge Creation */}
              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create Badge
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedUser ?
                    <div className="text-center py-8">
                      <Star className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                      <p className="text-gray-400">Select a user to assign a badge</p>
                    </div> :

                    <>
                      <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-3">
                        <p className="text-amber-400 text-sm">Assigning badge to:</p>
                        <p className="text-white font-medium">{selectedUser.display_name}</p>
                        <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Badge Name</label>
                        <Input
                          placeholder="e.g., Community Champion"
                          value={badgeName}
                          onChange={(e) => setBadgeName(e.target.value)}
                          className="bg-black/30 border-gray-700 text-white" />

                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                        <Select value={selectedIcon} onValueChange={setSelectedIcon}>
                          <SelectTrigger className="bg-black/30 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            {availableIcons.map((icon) => {
                              const IconComponent = icon.component;
                              return (
                                <SelectItem key={icon.name} value={icon.name} className="text-white hover:bg-gray-800">
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="w-4 h-4" />
                                    {icon.name}
                                  </div>
                                </SelectItem>);

                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                        <Select value={selectedColor} onValueChange={setSelectedColor}>
                          <SelectTrigger className="bg-black/30 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            {availableColors.map((color) =>
                              <SelectItem key={color.value} value={color.value} className="text-white hover:bg-gray-800">
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded ${color.value}`}></div>
                                  {color.name}
                                </div>
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                        <Input
                          placeholder="Badge description or tooltip"
                          value={badgeDescription}
                          onChange={(e) => setBadgeDescription(e.target.value)}
                          className="bg-black/30 border-gray-700 text-white" />

                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Preview</label>
                        <div className="p-3 bg-black/20 rounded-lg">
                          {renderBadgePreview()}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleAssignBadge()}
                        disabled={isAssigning || !badgeName.trim()}
                        className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600">

                        {isAssigning ?
                          <>
                            <QuantumFlowLoader size="sm" className="mr-2" />
                            Assigning Badge...
                          </> :

                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Assign Badge
                          </>
                        }
                      </Button>
                    </>
                  }
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Executive Badge Manager Tab */}
          <TabsContent value="executives">
            <Card className="dark-card">
              <CardHeader className="bg-slate-950 p-6 flex flex-col space-y-1.5">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Executive Badge Manager
                </CardTitle>
                <p className="text-gray-400 text-sm mt-2">
                  Manage badges for executives and leadership team members
                </p>
              </CardHeader>
              <CardContent className="bg-slate-950 pt-0 p-6">
                {loadingExecutives ? (
                  <div className="flex justify-center py-8">
                    <QuantumFlowLoader size="lg" message="Loading executives..." />
                  </div>
                ) : (
                  <div className="space-y-6">

                    {/* NEW: Add User to Executives Section */}
                    <div className="p-4 bg-purple-600/10 border border-purple-500/20 rounded-lg">
                      <h4 className="text-lg font-semibold text-white mb-4">Add User to Executive Management</h4>

                      <div className="flex gap-2 mb-4">
                        <Input
                          placeholder="Search by email, name, or username..."
                          value={executiveSearchTerm}
                          onChange={(e) => setExecutiveSearchTerm(e.target.value)}
                          className="bg-black/30 border-gray-700 text-white"
                          onKeyPress={(e) => e.key === 'Enter' && handleExecutiveSearch()}
                        />
                        <Button onClick={handleExecutiveSearch} disabled={isExecutiveSearching}>
                          {isExecutiveSearching ? <QuantumFlowLoader size="sm" /> : <Search className="w-4 h-4" />}
                        </Button>
                      </div>

                      {/* Search Results */}
                      {executiveSearchResults.length > 0 && (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          <p className="text-sm text-gray-300 mb-2">Search Results:</p>
                          {executiveSearchResults.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                              <div className="flex items-center gap-3">
                                <img
                                  src={user.display_avatar || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/15a1336a5_user-default-avatar.png'}
                                  alt={user.display_name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <div>
                                  <p className="font-medium text-white text-sm">{user.display_name}</p>
                                  <p className="text-xs text-gray-400">{user.email}</p>
                                </div>
                              </div>
                              <Button
                                onClick={() => addToCustomExecutives(user)}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Predefined Executive Roles */}
                    {Object.entries(executiveRoles).map(([roleKey, roleData]) => {
                      const roleUsers = executiveUsers.filter((user) => user.executive_role === roleKey);
                      const RoleIcon = roleData.icon;

                      return (
                        <div key={roleKey} className="space-y-4">
                          <div className="flex items-center gap-3 pb-3 border-b border-gray-700">
                            <RoleIcon className={`w-6 h-6 ${roleData.color}`} />
                            <h3 className="text-xl font-bold text-white">{roleData.title} Members</h3>
                          </div>

                          {roleUsers.length === 0 ? (
                            <p className="text-gray-400 py-4 italic">No {roleData.title} members found</p>
                          ) : (
                            <div className="grid gap-4">
                              {roleUsers.map((user) => (
                                <div key={user.id} className="p-4 bg-black/20 rounded-lg border border-gray-700">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                      <img
                                        src={user.display_avatar || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/15a1336a5_user-default-avatar.png'}
                                        alt={user.display_name}
                                        className="w-12 h-12 rounded-full object-cover" />

                                      <div>
                                        <div className="flex items-center gap-3">
                                          <h4 className="font-semibold text-white">{user.display_name}</h4>
                                          <Badge className={`${roleData.color} border-current/30 bg-current/10`}>
                                            <RoleIcon className="w-3 h-3 mr-1" />
                                            {roleData.title}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-400">{user.email}</p>
                                        {user.display_username &&
                                          <p className="text-xs text-gray-500">@{user.display_username}</p>
                                        }
                                      </div>
                                    </div>

                                    <Button
                                      onClick={() => setSelectedUser(user)}
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700 text-white">

                                      <Plus className="w-4 h-4 mr-2" />
                                      Add Badge
                                    </Button>
                                  </div>

                                  {/* Current custom badges with remove buttons */}
                                  {user.custom_badges && user.custom_badges.length > 0 &&
                                    <div className="mt-4 pt-3 border-t border-gray-700">
                                      <p className="text-sm text-gray-300 mb-2">Custom Badges:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {user.custom_badges.map((badge, index) => {
                                          const IconComponent = availableIcons.find((i) => i.name === badge.icon)?.component || Star;
                                          return (
                                            <div key={index} className="flex items-center gap-1">
                                              <Badge className={`${badge.color} ${badge.textColor} ${badge.borderColor}`}>
                                                <IconComponent className="w-3 h-3 mr-1" />
                                                {badge.name}
                                              </Badge>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="p-1 h-auto text-red-400 hover:text-red-300"
                                                onClick={() => handleRemoveBadge(user, index)}
                                                disabled={isAssigning}>

                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </div>);

                                        })}
                                      </div>
                                    </div>
                                  }
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* NEW: Custom Added Executives */}
                    {processedCustomExecutiveUsers.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-700">
                          <Users className="w-6 h-6 text-purple-400" />
                          <h3 className="text-xl font-bold text-white">Custom Executive Members</h3>
                        </div>

                        <div className="grid gap-4">
                          {processedCustomExecutiveUsers.map((user) => (
                            <div key={user.id} className="p-4 bg-black/20 rounded-lg border border-gray-700">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                  <img
                                    src={user.display_avatar || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/15a1336a5_user-default-avatar.png'}
                                    alt={user.display_name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                  <div>
                                    <div className="flex items-center gap-3">
                                      <h4 className="font-semibold text-white">{user.display_name}</h4>
                                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
                                        <Users className="w-3 h-3 mr-1" />
                                        {user.customTitle || 'Executive'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400">{user.email}</p>
                                    {user.display_username && (
                                      <p className="text-xs text-gray-500">@{user.display_username}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => setSelectedUser(user)}
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Badge
                                  </Button>
                                  <Button
                                    onClick={() => removeFromCustomExecutives(user.email)}
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>

                              {/* Current custom badges */}
                              {user.custom_badges && user.custom_badges.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-gray-700">
                                  <p className="text-sm text-gray-300 mb-2">Custom Badges:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {user.custom_badges.map((badge, index) => {
                                      const IconComponent = availableIcons.find((i) => i.name === badge.icon)?.component || Star;
                                      return (
                                        <div key={index} className="flex items-center gap-1">
                                          <Badge className={`${badge.color} ${badge.textColor} ${badge.borderColor}`}>
                                            <IconComponent className="w-3 h-3 mr-1" />
                                            {badge.name}
                                          </Badge>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="p-1 h-auto text-red-400 hover:text-red-300"
                                            onClick={() => handleRemoveBadge(user, index)}
                                            disabled={isAssigning}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Badge Assignment for Selected Executive */}
                    {selectedUser && allExecutiveUsers.some((u) => u.email === selectedUser.email) && (
                      <div className="mt-8 p-6 bg-purple-600/10 border border-purple-500/20 rounded-lg">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Add Badge for {selectedUser.display_name}
                        </h4>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Badge Name</label>
                            <Input
                              placeholder="e.g., Leadership Award"
                              value={badgeName}
                              onChange={(e) => setBadgeName(e.target.value)}
                              className="bg-black/30 border-gray-700 text-white" />

                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                            <Select value={selectedIcon} onValueChange={setSelectedIcon}>
                              <SelectTrigger className="bg-black/30 border-gray-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-gray-700">
                                {availableIcons.map((icon) => {
                                  const IconComponent = icon.component;
                                  return (
                                    <SelectItem key={icon.name} value={icon.name} className="text-white hover:bg-gray-800">
                                      <div className="flex items-center gap-2">
                                        <IconComponent className="w-4 h-4" />
                                        {icon.name}
                                      </div>
                                    </SelectItem>);

                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                            <Select value={selectedColor} onValueChange={setSelectedColor}>
                              <SelectTrigger className="bg-black/30 border-gray-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-gray-700">
                                {availableColors.map((color) =>
                                  <SelectItem key={color.value} value={color.value} className="text-white hover:bg-gray-800">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded ${color.value}`}></div>
                                      {color.name}
                                    </div>
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-end">
                            <Button
                              onClick={() => handleAssignBadge()}
                              disabled={isAssigning || !badgeName.trim()}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white">

                              {isAssigning ?
                                <QuantumFlowLoader size="sm" /> :

                                <>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Assign Badge
                                </>
                              }
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                          <Input
                            placeholder="Badge description"
                            value={badgeDescription}
                            onChange={(e) => setBadgeDescription(e.target.value)}
                            className="bg-black/30 border-gray-700 text-white" />

                        </div>

                        {badgeName &&
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Preview</label>
                            <div className="p-3 bg-black/20 rounded-lg">
                              {renderBadgePreview()}
                            </div>
                          </div>
                        }

                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(null);
                              setBadgeName('');
                              setBadgeDescription('');
                              setSelectedIcon('Star');
                              setSelectedColor('bg-purple-600');
                            }} className="bg-background text-slate-950 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-gray-600 hover:bg-gray-700">

                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
