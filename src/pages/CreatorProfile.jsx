
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Skill } from "@/entities/Skill";
import { SkillReview } from "@/entities/SkillReview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Mail,
  Phone,
  Globe,
  Star,
  Award,
  Clock,
  Edit,
  ArrowLeft,
  Loader2,
  MoreHorizontal, // New import
  EyeOff,         // New import
  Eye,            // New import
  Trash2          // New import
} from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import EditCreatorProfileModal from "../components/skills/EditCreatorProfileModal";
// SkillCard is no longer directly used for rendering, removed import
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"; // New imports

export default function CreatorProfile() {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [skills, setSkills] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      setAverageRating(0);

      try {
        const loggedInUser = await User.me();
        setCurrentUser(loggedInUser);

        const urlParams = new URLSearchParams(window.location.search);
        const creatorParam = urlParams.get('creator');

        if (!creatorParam) {
          setError("No creator specified");
          setIsLoading(false);
          return;
        }

        const isEmail = creatorParam.includes('@');
        
        const response = await base44.functions.invoke('getUserWithProfile', 
          isEmail ? { email: creatorParam } : { username: creatorParam }
        );

        if (!response.data?.success) {
          setError(response.data?.error || "Failed to load profile");
          setIsLoading(false);
          return;
        }

        const fetchedUser = response.data.user;
        const fetchedProfile = response.data.profile;

        if (!fetchedUser) {
          setError("User not found");
          setIsLoading(false);
          return;
        }

        setUser(fetchedUser);
        
        if (!fetchedProfile) {
          if (loggedInUser && loggedInUser.email === fetchedUser.email) {
            setShowEditModal(true);
          } else {
            setError("Creator profile not found");
          }
        } else {
          setProfile(fetchedProfile);
        }

        const userSkills = await Skill.filter({ created_by: fetchedUser.email });
        setSkills(userSkills);

        const allReviews = await SkillReview.filter({ creator_email: fetchedUser.email });
        setReviews(allReviews);

        if (allReviews.length > 0) {
          const avgRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
          setAverageRating(avgRating);
        }

        if (loggedInUser && loggedInUser.email !== fetchedUser.email && fetchedProfile) {
          try {
            await base44.functions.invoke('trackProfileView', { profileOwnerEmail: fetchedUser.email });
          } catch (error) {
            console.warn("Could not track profile view:", error);
          }
        }

      } catch (error) {
        console.error("Error loading creator profile:", error);
        setError("Failed to load creator profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [window.location.search]);

  const handleSaveProfile = async (updatedData) => {
    try {
      if (!user?.email) {
        throw new Error("User email not available for profile update.");
      }
      await base44.functions.invoke('updateCreatorProfile', { profileData: updatedData });

      const response = await base44.functions.invoke('getUserWithProfile', {
        email: user.email
      });
      const updatedProfile = response.data?.profile || {};

      setProfile(updatedProfile);
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleToggleSkillStatus = async (skillId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'inactive' ? 'deactivate' : 'reactivate';
    const confirmMessage = `Are you sure you want to ${action} this skill? It will ${newStatus === 'inactive' ? 'no longer be visible' : 'become visible'} in the marketplace.`;

    if (confirm(confirmMessage)) {
      try {
        await Skill.update(skillId, { status: newStatus });
        await new Promise((resolve) => setTimeout(resolve, 200));
        
        const userSkills = await Skill.filter({ created_by: user.email });
        setSkills(userSkills);
      } catch (error) {
        console.error(`Error toggling skill status for ${skillId}:`, error);
        alert(`Failed to ${action} skill. Please try again.`);
      }
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (confirm("Are you sure you want to delete this skill permanently? This action cannot be undone.")) {
      try {
        await Skill.delete(skillId);
        await new Promise((resolve) => setTimeout(resolve, 200));
        
        const userSkills = await Skill.filter({ created_by: user.email });
        setSkills(userSkills);
      } catch (error) {
        console.error("Error deleting skill:", error);
        alert("Failed to delete skill. Please try again.");
      }
    }
  };

  const handleEditSkill = (skillId) => {
    window.location.href = `${createPageUrl('SkillsMarket')}?edit=${skillId}`;
  };

  const isOwnProfile = currentUser && user && currentUser.email === user.email;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error || (!profile && !isOwnProfile) || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="dark-card max-w-md w-full text-center p-8">
          <div className="text-red-400 mb-4">
            <Award className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Creator Not Found</h2>
          <p className="text-gray-400 mb-6">
            {error || "The creator profile you're looking for doesn't exist or an error occurred."}
          </p>
          <Link to={createPageUrl("SkillsMarket")}>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-500">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link to={createPageUrl("SkillsMarket")} className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Skills Marketplace
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dark-card rounded-2xl p-6 mb-6 relative overflow-hidden"
      >
        {profile?.business_banner_url && (
          <div className="absolute inset-0 opacity-20">
            <img
              src={profile.business_banner_url}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500 flex-shrink-0">
            {profile?.business_avatar_url || user?.avatar_url ? (
              <img
                src={profile?.business_avatar_url || user?.avatar_url}
                alt={profile?.business_name || user?.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
                <Briefcase className="w-12 h-12 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  {profile?.business_name || user?.full_name || user?.username || 'Creator'}
                </h1>
                {profile?.tagline && (
                  <p className="text-lg text-purple-300">{profile.tagline}</p>
                )}
              </div>
              {isOwnProfile && (
                <Button
                  onClick={() => setShowEditModal(true)}
                  variant="outline"
                  className="border-purple-500/30 text-white hover:bg-purple-500/10"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>

            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1 text-white font-semibold">{averageRating.toFixed(1)}</span>
                </div>
                <span className="text-gray-400">({reviews.length} reviews)</span>
              </div>
            )}

            {profile?.business_bio && (
              <p className="text-gray-300 mb-4">{profile.business_bio}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm">
              {profile?.business_email && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{profile.business_email}</span>
                </div>
              )}
              {profile?.business_phone && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{profile.business_phone}</span>
                </div>
              )}
              {profile?.business_website && (
                <a
                  href={profile.business_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300"
                >
                  <Globe className="w-4 h-4" />
                  <span>Website</span>
                </a>
              )}
              {profile?.response_time && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Responds {profile.response_time.replace('_', ' ')}</span>
                </div>
              )}
            </div>

            {profile?.availability_status && (
              <div className="mt-4">
                <Badge
                  className={
                    profile.availability_status === 'available'
                      ? 'bg-green-500/20 text-green-300'
                      : profile.availability_status === 'busy'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : 'bg-red-500/20 text-red-300'
                  }
                >
                  {profile.availability_status.charAt(0).toUpperCase() + profile.availability_status.slice(1)}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <Card className="dark-card mb-6">
        <CardHeader>
          <CardTitle className="text-white">Services Offered</CardTitle>
        </CardHeader>
        <CardContent>
          {skills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map((skill) => (
                <Card key={skill.id} className={`dark-card hover-lift ${skill.status === 'inactive' ? 'opacity-60' : ''}`}>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white truncate">{skill.title}</h3>
                        {skill.status === 'inactive' && (
                          <Badge className="bg-gray-500/20 text-gray-400">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 capitalize">{skill.skill_type}</p>
                    </div>
                    {isOwnProfile && (
                      <div className="flex-shrink-0 ml-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                              <MoreHorizontal className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-purple-500/20 text-white">
                            <DropdownMenuItem onClick={() => handleEditSkill(skill.id)} className="cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Skill
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleSkillStatus(skill.id, skill.status)} 
                              className="cursor-pointer"
                            >
                              {skill.status === 'active' ? (
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
                            <DropdownMenuItem onClick={() => handleDeleteSkill(skill.id)} className="text-red-400 cursor-pointer focus:bg-red-500/20 focus:!text-red-300">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Skill
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4 line-clamp-3">{skill.description}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className={`${
                        skill.category === 'design' ? 'bg-blue-500/20 text-blue-300' :
                        skill.category === 'development' ? 'bg-green-500/20 text-green-300' :
                        skill.category === 'writing' ? 'bg-purple-500/20 text-purple-300' :
                        skill.category === 'marketing' ? 'bg-orange-500/20 text-orange-300' :
                        skill.category === 'consulting' ? 'bg-yellow-500/20 text-yellow-300' :
                        skill.category === 'education' ? 'bg-indigo-500/20 text-indigo-300' :
                        skill.category === 'art' ? 'bg-pink-500/20 text-pink-300' :
                        skill.category === 'music' ? 'bg-red-500/20 text-red-300' :
                        skill.category === 'fitness' ? 'bg-teal-500/20 text-teal-300' :
                        skill.category === 'cooking' ? 'bg-lime-500/20 text-lime-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {skill.category}
                      </Badge>
                      {skill.is_remote && <Badge className="bg-cyan-500/20 text-cyan-300">Remote</Badge>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-400">
                        {skill.price_type === 'free' ? 'Free' : `$${skill.price_amount}`}
                      </span>
                      {skill.duration_hours && (
                        <span className="text-sm text-gray-500">{skill.duration_hours} hrs</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No services available yet</p>
          )}
        </CardContent>
      </Card>

      {profile?.professional_skills && profile.professional_skills.length > 0 && (
        <Card className="dark-card mb-6">
          <CardHeader>
            <CardTitle className="text-white">Skills & Expertise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.professional_skills.map((skill, index) => (
                <Badge key={index} className="bg-purple-500/20 text-purple-300">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {profile?.certifications && profile.certifications.length > 0 && (
        <Card className="dark-card mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.certifications.map((cert, index) => (
                <div key={index} className="border-l-2 border-purple-500 pl-4">
                  <h4 className="font-semibold text-white">{cert.name}</h4>
                  <p className="text-gray-400 text-sm">{cert.issuer}</p>
                  {cert.date && (
                    <p className="text-gray-500 text-xs mt-1">{new Date(cert.date).getFullYear()}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {profile?.portfolio_items && profile.portfolio_items.length > 0 && (
        <Card className="dark-card mb-6">
          <CardHeader>
            <CardTitle className="text-white">Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.portfolio_items.map((item, index) => (
                <Card key={index} className="dark-card overflow-hidden hover-lift">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-white mb-2">{item.title}</h4>
                    {item.description && (
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    )}
                    {item.project_url && (
                      <a
                        href={item.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block"
                      >
                        View Project →
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reviews.length > 0 && (
        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-white">Client Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-700 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {review.reviewer_avatar && (
                        <img
                          src={review.reviewer_avatar}
                          alt={review.reviewer_name}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-white">{review.reviewer_name}</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.is_verified_purchase && (
                      <Badge className="bg-green-500/20 text-green-300">
                        Verified Purchase
                      </Badge>
                    )}
                  </div>
                  {review.review_text && (
                    <p className="text-gray-300 mb-2">{review.review_text}</p>
                  )}
                  {review.creator_response && (
                    <div className="mt-3 pl-4 border-l-2 border-purple-500">
                      <p className="text-sm text-gray-400 mb-1">Creator Response:</p>
                      <p className="text-gray-300">{review.creator_response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showEditModal && (
        <EditCreatorProfileModal
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
