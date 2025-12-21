import React, { useState, useEffect } from 'react';
import { PublicUserDirectory } from '@/entities/PublicUserDirectory';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Search, ArrowLeft } from 'lucide-react';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminUsernames() {
  const [usersWithoutUsernames, setUsersWithoutUsernames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUsername, setNewUsername] = useState({}); // { userId: username }
  const [savingState, setSavingState] = useState({}); // { userId: boolean }
  
  // Search functionality
  const [searchEmail, setSearchEmail] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedUserNewUsername, setSearchedUserNewUsername] = useState('');
  const [isSavingSearchedUser, setIsSavingSearchedUser] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const allUsers = await PublicUserDirectory.list();
      const filteredUsers = allUsers.filter(u => !u.username || u.username.trim() === '');
      setUsersWithoutUsernames(filteredUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Could not load users. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUsernameChange = (userId, value) => {
    setNewUsername(prev => ({ ...prev, [userId]: value }));
  };

  const handleSaveUsername = async (userToUpdate) => {
    const username = newUsername[userToUpdate.id]?.trim();
    if (!username) {
      toast({
        title: "Validation Error",
        description: "Username cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setSavingState(prev => ({ ...prev, [userToUpdate.id]: true }));

    try {
      // 1. Check if username already exists
      const existingUser = await PublicUserDirectory.filter({ username: username });
      if (existingUser.length > 0 && existingUser[0].id !== userToUpdate.id) {
        throw new Error(`Username "${username}" is already taken.`);
      }

      // 2. Update the PublicUserDirectory record
      await PublicUserDirectory.update(userToUpdate.id, { username });

      // 3. Find and update the core User record
      const coreUsers = await User.filter({ email: userToUpdate.user_email });
      if (coreUsers.length > 0) {
        const coreUserId = coreUsers[0].id;
        await User.update(coreUserId, { username });
      } else {
        console.warn(`Could not find core User record for email: ${userToUpdate.user_email}`);
      }
      
      toast({
        title: "Success!",
        description: `Username for ${userToUpdate.full_name} has been set to "${username}".`,
        className: "bg-green-600 text-white",
      });

      // 4. Remove the user from the list
      setUsersWithoutUsernames(prev => prev.filter(u => u.id !== userToUpdate.id));

    } catch (error) {
      console.error("Failed to save username:", error);
      toast({
        title: "Error Saving Username",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setSavingState(prev => ({ ...prev, [userToUpdate.id]: false }));
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address to search.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const directoryUsers = await PublicUserDirectory.filter({ user_email: searchEmail.toLowerCase().trim() });
      
      if (directoryUsers.length > 0) {
        const user = directoryUsers[0];
        setSearchedUser(user);
        setSearchedUserNewUsername(user.username || '');
        toast({
          title: "User Found",
          description: `Found user: ${user.full_name}`,
          className: "bg-green-600 text-white",
        });
      } else {
        setSearchedUser(null);
        toast({
          title: "Not Found",
          description: "No user found with that email address.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error searching for user:", error);
      toast({
        title: "Error",
        description: "Failed to search for user.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveSearchedUserUsername = async () => {
    const username = searchedUserNewUsername.trim();
    if (!username) {
      toast({
        title: "Validation Error",
        description: "Username cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingSearchedUser(true);

    try {
      // 1. Check if username already exists
      const existingUser = await PublicUserDirectory.filter({ username: username });
      if (existingUser.length > 0 && existingUser[0].id !== searchedUser.id) {
        throw new Error(`Username "${username}" is already taken.`);
      }

      // 2. Update the PublicUserDirectory record
      await PublicUserDirectory.update(searchedUser.id, { username });

      // 3. Find and update the core User record
      const coreUsers = await User.filter({ email: searchedUser.user_email });
      if (coreUsers.length > 0) {
        const coreUserId = coreUsers[0].id;
        await User.update(coreUserId, { username });
      } else {
        console.warn(`Could not find core User record for email: ${searchedUser.user_email}`);
      }
      
      toast({
        title: "Success!",
        description: `Username for ${searchedUser.full_name} has been updated to "${username}".`,
        className: "bg-green-600 text-white",
      });

      // Update the searched user state
      setSearchedUser(prev => ({ ...prev, username }));

    } catch (error) {
      console.error("Failed to save username:", error);
      toast({
        title: "Error Saving Username",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSearchedUser(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <QuantumFlowLoader message="Finding users without usernames..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 text-white">
      {/* Back Button */}
      <Link to={createPageUrl("AdminHub")}>
        <Button
          variant="outline"
          className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Hub
        </Button>
      </Link>

      <h1 className="text-3xl font-bold mb-2">Username Management</h1>
      <p className="text-gray-400 mb-6">
        Assign or update usernames for platform users.
      </p>

      {/* Search Section */}
      <Card className="dark-card mb-6">
        <CardHeader>
          <CardTitle className="text-white">Search User by Email</CardTitle>
          <CardDescription className="text-gray-400">
            Find any user by their email address to view or update their username.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Enter user email..."
                className="bg-slate-950 border-purple-500/30 text-white pl-10"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
                disabled={isSearching}
              />
            </div>
            <Button
              onClick={handleSearchUser}
              disabled={isSearching}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {searchedUser && (
            <Card className="dark-card mt-4">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
                    {searchedUser.avatar_url ? (
                      <img src={searchedUser.avatar_url} alt={searchedUser.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">{searchedUser.full_name?.[0]?.toUpperCase() || '?'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold">{searchedUser.full_name}</h3>
                    <p className="text-gray-400 text-sm">{searchedUser.user_email}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Current Username: {searchedUser.username ? `@${searchedUser.username}` : 'Not set'}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                      <Input
                        placeholder="Enter new username..."
                        className="bg-slate-950 border-purple-500/30 text-white"
                        value={searchedUserNewUsername}
                        onChange={(e) => setSearchedUserNewUsername(e.target.value)}
                        disabled={isSavingSearchedUser}
                      />
                      <Button
                        onClick={handleSaveSearchedUserUsername}
                        disabled={isSavingSearchedUser || !searchedUserNewUsername.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isSavingSearchedUser ? 'Saving...' : 'Update Username'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Users Without Usernames Section */}
      <h2 className="text-2xl font-bold mb-4">Users Without Usernames</h2>
      {usersWithoutUsernames.length === 0 ? (
        <Card className="dark-card text-center">
          <CardContent className="p-10">
            <h2 className="text-2xl font-bold text-green-400">All Set!</h2>
            <p className="text-gray-300 mt-2">There are no users who need a username assigned.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {usersWithoutUsernames.map(user => (
            <Card key={user.id} className="dark-card">
              <CardHeader>
                <CardTitle className="text-white">{user.full_name}</CardTitle>
                <CardDescription className="text-gray-400">{user.user_email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Enter new username..."
                    className="bg-slate-950 border-purple-500/30 text-white"
                    value={newUsername[user.id] || ''}
                    onChange={(e) => handleUsernameChange(user.id, e.target.value)}
                    disabled={savingState[user.id]}
                  />
                  <Button
                    onClick={() => handleSaveUsername(user)}
                    disabled={savingState[user.id] || !newUsername[user.id]}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {savingState[user.id] ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}