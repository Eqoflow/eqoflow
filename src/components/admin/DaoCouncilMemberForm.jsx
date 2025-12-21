
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { X, Save, Crown, UploadCloud, Loader2 } from 'lucide-react';
import { UserProfileData } from '@/entities/UserProfileData';
import { UploadFile } from '@/integrations/Core';
import { debounce } from 'lodash';

export default function DaoCouncilMemberForm({ member, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    user_email: member?.user_email || '',
    display_name: member?.display_name || '', // Add display_name to state
    council_title: member?.council_title || '',
    council_bio: member?.council_bio || '', // Add bio to state
    council_image_url: member?.council_image_url || '',
    display_order: member?.display_order || 0,
    is_active: member?.is_active !== undefined ? member.is_active : true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (member?.user_email) {
      fetchUserByEmail(member.user_email);
    }
  }, [member]);

  const fetchUserByEmail = async (email) => {
    try {
      const users = await UserProfileData.filter({ user_email: email });
      if (users.length > 0) {
        setSelectedUser(users[0]);
        setSearchTerm(users[0].full_name || users[0].user_email);
      }
    } catch (error) {
      console.warn("Could not fetch user by email:", error);
    }
  };

  const debouncedSearch = debounce(async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      // Use the same approach as Discovery page
      const allProfiles = await UserProfileData.filter({}, "-updated_date", 100);

      // Filter users based on search query and exclude hidden users
      const filteredUsers = allProfiles.
      filter((profile) =>
      profile.discovery_visible !== false && (// Respect discovery visibility setting

      profile.full_name?.toLowerCase().includes(query.toLowerCase()) ||
      profile.username?.toLowerCase().includes(query.toLowerCase()) ||
      profile.user_email?.toLowerCase().includes(query.toLowerCase()))

      ).
      slice(0, 10); // Limit to 10 results

      setSearchResults(filteredUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 500);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    if (!member) {// Only search if adding a new member
      debouncedSearch(query);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setFormData((prev) => ({ ...prev, user_email: user.user_email }));
    setSearchTerm(user.full_name || user.user_email);
    setSearchResults([]); // Clear search results after selection
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData((prev) => ({ ...prev, council_image_url: file_url }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.user_email || !formData.council_title) {
      alert("User email and council title are required.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>

          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                {member ? 'Edit' : 'Add'} Council Member
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="user_email" className="text-gray-300 mb-2 block">User</Label>
                  <div className="relative">
                    <Input
                      id="user_email"
                      placeholder="Search by name, username, or email..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      disabled={!!member} // Disable search when editing
                      className="bg-black/20 border-purple-500/20 text-white"
                    />
                    {isSearching && <Loader2 className="animate-spin h-4 w-4 text-gray-400 absolute right-3 top-3" />}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full bg-slate-800 border border-purple-500/20 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map(user => (
                        <div
                          key={user.id}
                          className="p-3 hover:bg-purple-500/10 cursor-pointer text-white"
                          onClick={() => handleUserSelect(user)}
                        >
                          <p className="font-semibold">{user.full_name}</p>
                          <p className="text-sm text-gray-400">{user.user_email}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedUser && (
                    <div className="flex items-center gap-3 mt-3 p-3 bg-black/30 rounded-lg">
                      <img src={selectedUser.avatar_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/15a1336a5_user-default-avatar.png'} alt={selectedUser.full_name} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-semibold text-white">{selectedUser.full_name}</p>
                        <p className="text-sm text-gray-400">{selectedUser.user_email}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="display_name" className="text-gray-300 mb-2 block">Display Name (Optional)</Label>
                  <Input
                    id="display_name"
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
                    className="bg-black/20 border-purple-500/20 text-white"
                    placeholder="Overrides user's full name"
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave blank to use the user's actual name.</p>
                </div>

                <div>
                  <Label htmlFor="council_title" className="text-gray-300 mb-2 block">Council Title</Label>
                  <Input
                    id="council_title"
                    type="text"
                    value={formData.council_title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, council_title: e.target.value }))}
                    className="bg-black/20 border-purple-500/20 text-white"
                    placeholder="e.g., Head of Governance"
                    required />

                </div>

                {/* New Bio Textarea */}
                <div>
                  <Label htmlFor="council_bio" className="text-gray-300 mb-2 block">Council Bio</Label>
                  <Textarea
                    id="council_bio"
                    placeholder="Short description of their role on the council..."
                    value={formData.council_bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, council_bio: e.target.value }))}
                    className="bg-black/20 border-purple-500/20 text-white min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="council_image_url" className="text-gray-300 mb-2 block">Custom Council Image URL (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="council_image_url"
                        type="text"
                        value={formData.council_image_url}
                        onChange={(e) => setFormData((prev) => ({ ...prev, council_image_url: e.target.value }))}
                        className="bg-black/20 border-purple-500/20 text-white flex-1"
                        placeholder="Enter URL or upload" />

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                        accept="image/*" />

                      <Button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        disabled={isUploadingImage}
                        variant="outline" className="bg-background text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-purple-500/30 hover:bg-purple-500/10">


                        {isUploadingImage ?
                        <Loader2 className="w-4 h-4 animate-spin" /> :

                        <UploadCloud className="w-4 h-4" />
                        }
                      </Button>
                    </div>
                    {formData.council_image_url &&
                    <img
                      src={formData.council_image_url}
                      alt="Custom Council"
                      className="mt-3 w-24 h-24 object-cover rounded-md border border-purple-500/30" />

                    }
                    <p className="text-xs text-gray-400 mt-1">If left blank, user's profile avatar will be used.</p>
                  </div>

                  <div>
                    <Label htmlFor="display_order" className="text-gray-300 mb-2 block">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                      className="bg-black/20 border-purple-500/20 text-white" />

                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded" />

                  <Label htmlFor="is_active" className="text-gray-300">Active (Display on DAO page)</Label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="border-gray-600 text-gray-400">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                    <Save className="w-4 h-4 mr-2" />
                    Save Member
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>);

}
