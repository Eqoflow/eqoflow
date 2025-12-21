import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { ArrowRight, MoreHorizontal, Edit, Trash2, ShoppingCart, Eye, MessageSquare, EyeOff } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import SkillDetailModal from "./SkillDetailModal";
import EditSkillModal from "./EditSkillModal";
import { base44 } from "@/api/base44Client";

export default function SkillCard({ skill, currentUser, index, isOwner, onDelete, onEngage }) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [localSkill, setLocalSkill] = useState(skill);

  const categoryColors = {
    design: "bg-blue-500/20 text-blue-300",
    development: "bg-green-500/20 text-green-300",
    writing: "bg-purple-500/20 text-purple-300",
    marketing: "bg-orange-500/20 text-orange-300",
    consulting: "bg-yellow-500/20 text-yellow-300",
    education: "bg-indigo-500/20 text-indigo-300",
    art: "bg-pink-500/20 text-pink-300",
    music: "bg-red-500/20 text-red-300",
    fitness: "bg-teal-500/20 text-teal-300",
    cooking: "bg-lime-500/20 text-lime-300",
    other: "bg-gray-500/20 text-gray-300"
  };

  const handleEngageClick = () => {
    if (onEngage) {
      onEngage(localSkill);
    } else {
      alert("Purchase functionality coming soon! This will initiate the payment and create your workroom.");
    }
  };

  const handleMessageSeller = () => {
    const conversationId = [localSkill.created_by, currentUser.email].sort().join('_');
    const inboxUrl = createPageUrl('SkillsInbox');
    window.location.href = `${inboxUrl}?start_chat=${localSkill.created_by}&skill_id=${localSkill.id}&skill_title=${encodeURIComponent(localSkill.title)}&conversation_id=${conversationId}`;
  };

  const handleSaveEdit = async (skillId, updatedData) => {
    try {
      await base44.entities.Skill.update(skillId, updatedData);
      setLocalSkill({ ...localSkill, ...updatedData });
      setShowEditModal(false);
      alert("Skill updated successfully!");
    } catch (error) {
      console.error("Error updating skill:", error);
      alert("Failed to update skill. Please try again.");
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = localSkill.status === 'active' ? 'inactive' : 'active';
    const confirmMessage = newStatus === 'inactive' 
      ? "Are you sure you want to deactivate this skill? It will be hidden from the marketplace."
      : "Are you sure you want to reactivate this skill? It will be visible in the marketplace again.";
    
    if (!confirm(confirmMessage)) return;

    setIsDeactivating(true);
    try {
      await base44.entities.Skill.update(localSkill.id, { status: newStatus });
      setLocalSkill({ ...localSkill, status: newStatus });
      alert(newStatus === 'active' ? "Skill reactivated successfully!" : "Skill deactivated successfully!");
    } catch (error) {
      console.error("Error toggling skill status:", error);
      alert("Failed to update skill status. Please try again.");
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="h-full">

        <Card className={`dark-card h-full flex flex-col hover-lift ${localSkill.status === 'inactive' ? 'opacity-60' : ''}`}>
          <CardHeader className="flex flex-row justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white truncate">{localSkill.title}</h3>
                {localSkill.status === 'inactive' && (
                  <Badge className="bg-gray-500/20 text-gray-400">Inactive</Badge>
                )}
              </div>
              <p className="text-sm text-gray-400 capitalize">{localSkill.skill_type}</p>
            </div>
             {isOwner &&
            <div className="flex-shrink-0 ml-2">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" disabled={isDeactivating}>
                              <MoreHorizontal className="w-5 h-5" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-purple-500/20 text-white">
                          <DropdownMenuItem onClick={() => setShowEditModal(true)} className="cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Skill
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={handleToggleStatus} 
                            className="cursor-pointer"
                            disabled={isDeactivating}
                          >
                              {localSkill.status === 'active' ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Reactivate
                                </>
                              )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem onClick={() => onDelete(localSkill.id)} className="text-red-400 cursor-pointer focus:bg-red-500/20 focus:text-red-300">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Skill
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            }
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-between">
            <div>
              <p className="text-gray-300 mb-4 line-clamp-3">{localSkill.description}</p>
              <div className="flex items-center gap-2 mb-4">
                <Badge className={categoryColors[localSkill.category] || categoryColors.other}>
                  {localSkill.category}
                </Badge>
                {localSkill.is_remote && <Badge className="bg-cyan-500/20 text-cyan-300">Remote</Badge>}
              </div>
            </div>
            <div className="mt-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-green-400">
                  {localSkill.price_type === 'free' ? 'Free' : `$${localSkill.price_amount}`}
                </span>
                <span className="text-sm text-gray-500">
                  {localSkill.duration_hours ? `${localSkill.duration_hours} hrs` : ''}
                </span>
              </div>
              
              {/* View Details Button */}
              <Button
                onClick={() => setShowDetailModal(true)}
                variant="outline"
                className="w-full border-purple-500/30 text-white hover:bg-purple-500/10 mb-2">

                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>

              {/* Different action buttons based on ownership and status */}
              {isOwner ?
              <Link to={`${createPageUrl('CreatorProfile')}?creator=${localSkill.created_by}`}>
                  <Button variant="outline" className="bg-background text-slate-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-full border-gray-600 hover:bg-gray-800">
                    View Your Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link> :

              localSkill.status === 'active' ? (
                <>
                  <Button
                  onClick={handleMessageSeller}
                  variant="outline" className="bg-background text-slate-950 mb-2 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-full border-blue-500/30 hover:bg-blue-500/10">

                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message Seller
                  </Button>
                  
                  <Button
                  onClick={handleEngageClick}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {localSkill.price_type === 'free' ? 'Start Collaboration' : 'Purchase Service'}
                  </Button>
                </>
              ) : (
                <Badge className="w-full justify-center py-3 bg-gray-500/20 text-gray-400">
                  This skill is currently unavailable
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Skill Detail Modal */}
      <AnimatePresence>
        {showDetailModal &&
        <SkillDetailModal
          skill={localSkill}
          onClose={() => setShowDetailModal(false)}
          onEngage={handleEngageClick}
          isOwner={isOwner} />

        }
      </AnimatePresence>

      {/* Edit Skill Modal */}
      <AnimatePresence>
        {showEditModal &&
        <EditSkillModal
          skill={localSkill}
          onSave={handleSaveEdit}
          onClose={() => setShowEditModal(false)} />

        }
      </AnimatePresence>
    </>);

}