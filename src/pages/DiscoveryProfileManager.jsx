
import React, { useState, useEffect } from 'react';
import { UserProfileData } from '@/entities/UserProfileData';
import { PublicUserDirectory } from "@/entities/PublicUserDirectory"; // Added import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, Eye, EyeOff, Search, RefreshCw, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Helper function to get avatar background style
const getAvatarBackgroundStyle = (avatarUrl) => {
  if (avatarUrl && avatarUrl.toLowerCase().includes('.png')) {
    return { background: 'linear-gradient(to right, #000000, #1a1a1a)' };
  }
  return { background: 'linear-gradient(to right, #8b5cf6, #ec4899)' };
};

export default function DiscoveryProfileManager() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(new Set());
  const [updateStatus, setUpdateStatus] = useState({}); // To provide feedback

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const allProfiles = await UserProfileData.filter({}, "-updated_date", 200);
      setUsers(allProfiles);
      setFilteredUsers(allProfiles);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDiscoveryVisibility = async (user) => {
    const userId = user.id;
    setUpdating(prev => new Set(prev.add(userId)));
    setUpdateStatus(prev => ({ ...prev, [userId]: null })); // Clear previous status
    
    try {
      // Correctly toggle the visibility status
      // If it's explicitly false, make it true. Otherwise (if true or undefined), make it false.
      const newVisibility = user.discovery_visible === false ? true : false;
      
      // Update UserProfileData
      await UserProfileData.update(userId, {
        discovery_visible: newVisibility
      });
      
      // **CRITICAL FIX**: Also update PublicUserDirectory to keep it in sync
      // Find the corresponding PublicUserDirectory entry
      const directoryEntries = await PublicUserDirectory.filter({ user_email: user.user_email });
      
      if (directoryEntries.length > 0) {
        // Update the is_public field to match the discovery_visible setting
        await PublicUserDirectory.update(directoryEntries[0].id, {
          is_public: newVisibility
        });
      } else {
        // If no directory entry exists, we may need to create one
        // This shouldn't normally happen, but let's be defensive
        console.warn(`No PublicUserDirectory entry found for ${user.user_email}. This user may not appear in Discovery until directory is refreshed.`);
      }
      
      // Update local state to immediately reflect the change
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, discovery_visible: newVisibility } : u
      ));
      
      // Show success message
      setUpdateStatus(prev => ({ ...prev, [userId]: { status: 'success', message: newVisibility ? 'User is now visible in Discovery.' : 'User is now hidden from Discovery.' } }));
      
    } catch (error) {
      console.error('Error updating discovery visibility:', error);
      // Show error message
      setUpdateStatus(prev => ({ ...prev, [userId]: { status: 'error', message: 'Update failed. Please try again.' } }));
    } finally {
      // Stop the loader
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      // Clear the message after 3 seconds
      setTimeout(() => setUpdateStatus(prev => ({ ...prev, [userId]: null })), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <QuantumFlowLoader message="Loading Discovery Profiles..." size="lg" />
      </div>
    );
  }

  return (
    <div className="p-0 md:p-6 bg-black min-h-full">
      {/* Back Button */}
      <Link to={createPageUrl("AdminHub")}>
        <Button
          variant="outline"
          className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Hub
        </Button>
      </Link>

      <Card className="dark-card p-4 sm:p-6 bg-slate-950/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-white">Discovery Profile Manager</CardTitle>
              <p className="text-gray-400 mt-1">
                Manage which users appear in the Discovery tab. Users with discovery visibility disabled won't show up for other users.
              </p>
            </div>
            <Button onClick={loadUsers} variant="outline" className="border-purple-500/30 text-white hover:bg-purple-500/10">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search users by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 bg-black/30 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="dark-card hover-lift">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={getAvatarBackgroundStyle(user.avatar_url)}
                      >
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.full_name} 
                            className="w-full h-full object-cover rounded-full" 
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">
                          {user.full_name || 'Anonymous User'}
                        </h3>
                        {user.username && (
                          <p className="text-sm text-gray-400 truncate">@{user.username}</p>
                        )}
                        <p className="text-xs text-gray-500 truncate">{user.user_email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={
                        user.discovery_visible !== false 
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }>
                        {user.discovery_visible !== false ? "Visible" : "Hidden"}
                      </Badge>
                      {user.skills?.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {user.skills.length} skills
                        </Badge>
                      )}
                    </div>

                    {user.bio && (
                      <p className="text-sm text-gray-300 mb-3 line-clamp-2">{user.bio}</p>
                    )}

                    <Button
                      onClick={() => toggleDiscoveryVisibility(user)}
                      disabled={updating.has(user.id)}
                      variant={user.discovery_visible !== false ? "destructive" : "default"}
                      className={`w-full ${
                        user.discovery_visible !== false 
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {updating.has(user.id) ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : user.discovery_visible !== false ? (
                        <EyeOff className="w-4 h-4 mr-2" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      {updating.has(user.id) 
                        ? "Updating..." 
                        : user.discovery_visible !== false 
                          ? "Hide from Discovery" 
                          : "Show in Discovery"
                      }
                    </Button>
                    {updateStatus[user.id] && (
                      <p className={`text-xs mt-2 text-center font-medium ${
                        updateStatus[user.id].status === 'success' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {updateStatus[user.id].message}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">No Users Found</h3>
              <p className="text-gray-400">
                {searchTerm ? "No users match your search criteria." : "No user profiles found."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
