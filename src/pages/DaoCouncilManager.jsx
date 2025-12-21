
import React, { useState, useEffect } from 'react';
import { DaoCouncilMember } from '@/entities/DaoCouncilMember';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Edit, Trash2, Crown, Users, ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import DaoCouncilMemberForm from '../components/admin/DaoCouncilMemberForm';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DaoCouncilManager() {
  const [councilMembers, setCouncilMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  useEffect(() => {
    loadCouncilMembers();
  }, []);

  const loadCouncilMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!DaoCouncilMember) {
        throw new Error("DAO Council Member entity is not available. Please try refreshing the page.");
      }
      const fetchedMembers = await DaoCouncilMember.list('display_order');
      if (fetchedMembers.length > 0) {
        const memberEmails = [...new Set(fetchedMembers.map((m) => m.user_email))].filter(Boolean);

        if (memberEmails.length > 0) {
            // Fetch from the main User entity to get the most up-to-date names
            const userProfiles = await User.filter({ email: { $in: memberEmails } });
            const userMap = userProfiles.reduce((acc, user) => {
              acc[user.email] = user;
              return acc;
            }, {});

            const enrichedMembers = fetchedMembers.map((member) => {
              const userData = userMap[member.user_email];
              return {
                ...member,
                full_name: member.display_name || userData?.full_name || member.user_email.split('@')[0],
                avatar_url: member.council_image_url || userData?.avatar_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/15a1336a5_user-default-avatar.png'
              };
            });
            setCouncilMembers(enrichedMembers);
        } else {
          setCouncilMembers([]);
        }
      } else {
        setCouncilMembers([]);
      }
    } catch (err) {
      console.error("Error loading DAO Council members for admin:", err);
      setError("Failed to load council members. " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (memberData) => {
    try {
      if (editingMember) {
        await DaoCouncilMember.update(editingMember.id, memberData);
      } else {
        await DaoCouncilMember.create(memberData);
      }
      setShowFormModal(false);
      setEditingMember(null);
      loadCouncilMembers();
    } catch (err) {
      console.error("Error saving DAO Council member:", err);
      alert("Failed to save council member: " + err.message);
    }
  };

  const handleDelete = async (memberId) => {
    if (window.confirm("Are you sure you want to remove this council member?")) {
      try {
        await DaoCouncilMember.delete(memberId);
        loadCouncilMembers();
      } catch (err) {
        console.error("Error deleting DAO Council member:", err);
        alert("Failed to delete council member: " + err.message);
      }
    }
  };

  const openEditForm = (member) => {
    setEditingMember(member);
    setShowFormModal(true);
  };

  const openAddForm = () => {
    setEditingMember(null);
    setShowFormModal(true);
  };

  return (
    <div className="p-6 min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl("AdminHub")}>
          <Button
            variant="outline"
            className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Hub
          </Button>
        </Link>

        <Card className="dark-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              DAO Council Management
            </CardTitle>
            <Button onClick={openAddForm} className="bg-gradient-to-r from-purple-600 to-pink-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ?
            <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
                <span className="ml-3 text-gray-400">Loading...</span>
              </div> :
            error ?
            <div className="text-center text-red-400 py-8">{error}</div> :
            councilMembers.length === 0 ?
            <div className="text-center text-gray-500 py-8">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <p>No council members added yet.</p>
                <Button onClick={openAddForm} variant="outline" className="bg-sky-950 text-white mt-4 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:bg-accent hover:text-accent-foreground h-10 border-purple-500/30">
                  Add First Member
                </Button>
              </div> :

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {councilMembers.map((member) =>
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-purple-500/10">

                    <div className="flex items-center gap-4">
                      <img
                    src={member.avatar_url}
                    alt={member.full_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-purple-500" />

                      <div>
                        <h3 className="font-semibold text-white">{member.full_name}</h3>
                        <p className="text-sm text-yellow-400">{member.council_title}</p>
                        <p className="text-xs text-gray-400">{member.user_email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => openEditForm(member)} size="sm" variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => handleDelete(member.id)} size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
              )}
              </div>
            }
          </CardContent>
        </Card>
      </div>
      <AnimatePresence>
        {showFormModal &&
        <DaoCouncilMemberForm
          member={editingMember}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleFormSubmit} />

        }
      </AnimatePresence>
    </div>);

}
