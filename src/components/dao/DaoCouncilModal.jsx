import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Users, Crown, Loader2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DaoCouncilMember } from '@/entities/DaoCouncilMember';
import { User } from '@/entities/User';

export default function DaoCouncilModal({ isOpen, onClose }) {
  const [councilMembers, setCouncilMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCouncilMembers();
    }
  }, [isOpen]);

  const loadCouncilMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!DaoCouncilMember) {
          throw new Error("DAO Council Member entity is not available. Please try refreshing the page.");
      }
      const fetchedMembers = await DaoCouncilMember.filter({ is_active: true }, 'display_order');

      if (fetchedMembers.length > 0) {
        const memberEmails = [...new Set(fetchedMembers.map(m => m.user_email))].filter(Boolean);
        
        if (memberEmails.length === 0) {
            setCouncilMembers([]);
        } else {
            try {
                const userProfiles = await User.filter({ email: { $in: memberEmails } });

                const userMap = userProfiles.reduce((acc, user) => {
                  acc[user.email] = user;
                  return acc;
                }, {});

                const enrichedMembers = fetchedMembers.map(member => {
                  const userData = userMap[member.user_email];
                  return {
                    ...member,
                    full_name: member.display_name || userData?.full_name || member.user_email.split('@')[0],
                    username: userData?.username || null, // Get username for profile URL
                    avatar_url: member.council_image_url || userData?.avatar_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/15a1336a5_user-default-avatar.png'
                  };
                });
                setCouncilMembers(enrichedMembers);
            } catch (profileError) {
                console.warn("Could not fetch user profiles, using fallback data:", profileError);
                // Fallback: just use the council member data without user profiles
                const fallbackMembers = fetchedMembers.map((member) => ({
                  ...member,
                  full_name: member.display_name || member.user_email.split('@')[0],
                  username: null,
                  avatar_url: member.council_image_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/15a1336a5_user-default-avatar.png'
                }));
                setCouncilMembers(fallbackMembers);
            }
        }
      } else {
        setCouncilMembers([]);
      }
    } catch (err) {
      console.error("Error loading DAO Council members:", err);
      setError("Failed to load council members. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                DAO Council Members
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
                  <span className="ml-3 text-gray-400">Loading council members...</span>
                </div>
              ) : error ? (
                <div className="text-center text-red-400 py-8">{error}</div>
              ) : councilMembers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Users className="w-12 h-12 mx-auto mb-4" />
                  <p>No council members listed yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {councilMembers.map(member => (
                    <div key={member.id} className="flex items-start gap-4 p-4 bg-black/20 rounded-lg border border-purple-500/10">
                      <div className="flex-shrink-0">
                        <img
                          src={member.avatar_url}
                          alt={member.full_name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{member.full_name}</h3>
                        <p className="text-sm text-yellow-400 mb-2">{member.council_title}</p>
                        {/* Display Bio */}
                        <p className="text-xs text-gray-300 mb-3">{member.council_bio}</p>
                        <Link
                          to={createPageUrl('PublicProfile', { 
                            username: member.username || member.user_email.split('@')[0] 
                          })}
                          className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Profile
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}