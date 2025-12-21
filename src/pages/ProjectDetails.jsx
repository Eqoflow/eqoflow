
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { CrowdProject } from "@/entities/CrowdProject";
import { User } from "@/entities/User";
import { Community } from "@/entities/Community";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Target,
  Gift,
  Calendar,
  Users,
  Coins,
  DollarSign,
  FileText,
  Share2,
  HeartHandshake,
  ExternalLink,
  User as UserIcon,
  TrendingUp,
  CheckCircle2,
  Circle,
  Edit, // Added Edit icon
  X // Added X icon for dismiss button
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { createProjectContributionPayment } from "@/functions/createProjectContributionPayment"; // New import
import EditProjectModal from "../components/crowdsourcing/EditProjectModal";

export default function ProjectDetails() {
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [community, setCommunity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contributionAmount, setContributionAmount] = useState('');
  const [isContributing, setIsContributing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState(null); // New state for payment status
  const [showEditModal, setShowEditModal] = useState(false); // New state for edit modal

  const location = useLocation();
  const projectId = new URLSearchParams(location.search).get('id');

  const loadProjectData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userData, projectData] = await Promise.all([
        User.me().catch(() => null),
        CrowdProject.get(projectId)
      ]);

      setUser(userData);
      setProject(projectData);

      // Load community data if project has one
      if (projectData.community_id) {
        try {
          const communityData = await Community.get(projectData.community_id);
          setCommunity(communityData);
        } catch (error) {
          console.error("Error loading community:", error);
        }
      }
    } catch (error) {
      console.error("Error loading project:", error);
      setProject(null);
    }
    setIsLoading(false);
  }, [projectId]); // projectId is a dependency for this useCallback

  useEffect(() => {
    if (projectId) {
      loadProjectData();
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        setPaymentStatus('success');
        // Clean the URL to prevent re-showing the message on refresh
        const newUrl = window.location.pathname + `?id=${projectId}`;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [projectId, loadProjectData]);

  const handleContribute = async () => {
    if (!user || !contributionAmount || !project) return;

    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid contribution amount.");
      return;
    }

    setIsContributing(true);
    try {
      const { data } = await createProjectContributionPayment({
          projectId: project.id,
          amount: amount,
          currency: project.funding_currency
      });

      if (data.success && data.checkout_page_url) {
        window.location.href = data.checkout_page_url;
      } else {
        console.error("Failed to create payment link:", data);
        alert(`Failed to create payment link: ${data?.details?.errors?.[0]?.detail || data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating contribution payment:", error);
      alert("Failed to initiate contribution. Please try again.");
    } finally {
      setIsContributing(false);
    }
  };

  const handleProjectUpdate = async (updatedData) => {
    try {
      await CrowdProject.update(project.id, updatedData);
      setShowEditModal(false);
      await loadProjectData(); // Refresh project data
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Target className="w-16 h-16 md:w-24 md:h-24 text-gray-600 mx-auto" />
          <h1 className="text-xl md:text-2xl font-bold text-white">Project Not Found</h1>
          <p className="text-gray-400 text-sm md:text-base">This project may not exist or has been removed.</p>
          <Link to={createPageUrl("Crowdsourcing")}>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getProjectTypeInfo = (type) => {
    const types = {
      fundraising: { icon: Target, color: "text-blue-400", bg: "bg-blue-500/20", label: "Fundraising" },
      bounty: { icon: Gift, color: "text-green-400", bg: "bg-green-500/20", label: "Bounty" }
    };
    return types[type] || types.fundraising;
  };

  const getCurrencyInfo = (currency) => {
    const currencies = {
      eqoflo: { symbol: 'EQOFLO', icon: Coins, label: 'EQOFLO Tokens' },
      gbp: { symbol: '£', icon: DollarSign, label: 'British Pounds' }
    };
    return currencies[currency] || currencies.gbp;
  };

  const typeInfo = getProjectTypeInfo(project.project_type);
  const currencyInfo = getCurrencyInfo(project.funding_currency);
  const TypeIcon = typeInfo.icon;
  const CurrencyIcon = currencyInfo.icon;
  const fundingPercentage = (project.current_funding / project.funding_goal) * 100;
  const isDeadlinePassed = new Date(project.deadline) < new Date();
  const daysLeft = Math.max(0, Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)));

  const isProjectCreator = user && project && user.email === project.created_by;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-purple-500/20 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <Link to={createPageUrl("Crowdsourcing")} className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm md:text-base">Back to Crowdsourcing</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${typeInfo.bg}`}>
                  <TypeIcon className={`w-4 h-4 md:w-5 md:h-5 ${typeInfo.color}`} />
                </div>
                <Badge className={`${typeInfo.bg} ${typeInfo.color} border-0 text-xs md:text-sm`}>
                  {typeInfo.label}
                </Badge>
                <Badge className={project.status === 'active' ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                  {project.status}
                </Badge>
                {isProjectCreator && (
                  <Button
                    onClick={() => setShowEditModal(true)}
                    variant="outline"
                    size="sm"
                    className="border-purple-500/30 text-white hover:bg-purple-500/20 hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200 text-xs md:text-sm"
                  >
                    <Edit className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Edit Project
                  </Button>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-bold text-white mb-4">{project.title}</h1>
              <p className="text-gray-300 text-sm md:text-lg leading-relaxed">{project.description}</p>

              <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-4 md:mt-6">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                  <span className="text-gray-300 text-xs md:text-sm">By {project.created_by.split('@')[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                  <span className="text-gray-300 text-xs md:text-sm">
                    Created {format(new Date(project.created_date), "MMM d, yyyy")}
                  </span>
                </div>
                {community && (
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                    <Link to={`${createPageUrl("CommunityProfile")}?id=${community.id}`} className="text-purple-400 hover:text-purple-300 text-xs md:text-sm">
                      {community.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Funding Card - Mobile: Full width, Desktop: Fixed width */}
            <Card className="dark-card w-full lg:w-96 lg:flex-shrink-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
                    <CurrencyIcon className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                    Funding Progress
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl md:text-2xl font-bold text-white">
                      {currencyInfo.symbol}{project.current_funding.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-400">
                      {Math.round(fundingPercentage)}%
                    </span>
                  </div>
                  <Progress value={fundingPercentage} className="h-3 mb-2" />
                  <p className="text-sm text-gray-400">
                    of {currencyInfo.symbol}{project.funding_goal.toLocaleString()} goal
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-white">{project.contributors?.length || 0}</p>
                    <p className="text-sm text-gray-400">Backers</p>
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-white">{daysLeft}</p>
                    <p className="text-sm text-gray-400">Days left</p>
                  </div>
                </div>

                {/* Contribution Form */}
                {user && project.status === 'active' && !isDeadlinePassed && (
                  <div className="space-y-3 pt-4 border-t border-purple-500/20">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        className="flex-1 px-3 py-2 bg-black/20 border border-purple-500/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500/50 text-sm md:text-base"
                        min="1"
                      />
                      <Button
                        onClick={handleContribute}
                        disabled={!contributionAmount || isContributing}
                        className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 px-4 md:px-6 w-full sm:w-auto"
                      >
                        {isContributing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <>
                            <HeartHandshake className="w-4 h-4 mr-2" />
                            Back
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      You'll be contributing in {currencyInfo.label}
                    </p>
                  </div>
                )}

                {!user && (
                  <div className="pt-4 border-t border-purple-500/20 text-center">
                    <p className="text-sm text-gray-400 mb-3">Sign in to support this project</p>
                    <Button
                      onClick={() => User.login()}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                    >
                      Sign In to Contribute
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {paymentStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-green-300">Payment Successful!</p>
              <p className="text-sm text-green-400">Thank you for your contribution. The project details will update shortly.</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPaymentStatus(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Project Images */}
            {project.project_images && project.project_images.length > 0 && (
              <Card className="dark-card">
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-4">
                    <img
                      src={project.project_images[selectedImageIndex]}
                      alt={`Project image ${selectedImageIndex + 1}`}
                      className="w-full h-48 md:h-96 object-cover rounded-lg"
                    />
                    {project.project_images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {project.project_images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImageIndex === index
                                ? 'border-purple-500'
                                : 'border-gray-600 hover:border-gray-400'
                            }`}
                          >
                            <img
                              src={image}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Tabs */}
            <Tabs defaultValue="story" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 dark-card p-1 md:p-1.5 rounded-2xl">
                <TabsTrigger value="story" className="rounded-xl text-white text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500">
                  Story
                </TabsTrigger>
                <TabsTrigger value="milestones" className="rounded-xl text-white text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500">
                  Milestones
                </TabsTrigger>
                <TabsTrigger value="updates" className="rounded-xl text-white text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500">
                  Updates
                </TabsTrigger>
                <TabsTrigger value="backers" className="rounded-xl text-white text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500">
                  Backers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="story">
                <Card className="dark-card">
                  <CardContent className="p-4 md:p-6">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                        {project.description}
                      </p>

                      {project.tags && project.tags.length > 0 && (
                        <div className="mt-6 md:mt-8">
                          <h3 className="text-white font-semibold mb-4 text-base md:text-lg">Tags</h3>
                          <div className="flex flex-wrap gap-2">
                            {project.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="milestones">
                <Card className="dark-card">
                  <CardContent className="p-4 md:p-6">
                    {project.milestones && project.milestones.length > 0 ? (
                      <div className="space-y-4">
                        {project.milestones.map((milestone, index) => (
                          <div key={index} className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-black/20 rounded-lg">
                            <div className="flex-shrink-0 mt-1">
                              {milestone.completed ? (
                                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                              ) : (
                                <Circle className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium text-sm md:text-base">{milestone.title}</h4>
                              <p className="text-gray-400 text-xs md:text-sm mt-1">{milestone.description}</p>
                            </div>
                            <div className="text-purple-400 font-medium text-sm md:text-base flex-shrink-0">
                              {currencyInfo.symbol}{milestone.funding_required.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <TrendingUp className="w-8 h-8 md:w-12 md:h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm md:text-base">No milestones defined for this project</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="updates">
                <Card className="dark-card">
                  <CardContent className="p-4 md:p-6">
                    {project.updates && project.updates.length > 0 ? (
                      <div className="space-y-4 md:space-y-6">
                        {project.updates.map((update, index) => (
                          <div key={index} className="border-b border-purple-500/20 pb-4 md:pb-6 last:border-b-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <h4 className="text-white font-medium text-sm md:text-base">{update.title}</h4>
                              <span className="text-xs md:text-sm text-gray-400">
                                {format(new Date(update.posted_at), "MMM d, yyyy")}
                              </span>
                            </div>
                            <p className="text-gray-300 leading-relaxed text-xs md:text-sm">{update.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-8 h-8 md:w-12 md:h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm md:text-base">No updates posted yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="backers">
                <Card className="dark-card">
                  <CardContent className="p-4 md:p-6">
                    {project.contributors && project.contributors.length > 0 ? (
                      <div className="space-y-4">
                        {project.contributors.map((contributor, index) => (
                          <div key={index} className="flex items-center justify-between p-3 md:p-4 bg-black/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-xs md:text-sm">
                                  {contributor.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-medium text-sm md:text-base truncate">{contributor.email.split('@')[0]}</p>
                                <p className="text-xs text-gray-400">
                                  {formatDistanceToNow(new Date(contributor.contributed_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-white font-medium text-sm md:text-base">
                                {currencyInfo.symbol}{contributor.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-8 h-8 md:w-12 md:h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm md:text-base">No backers yet. Be the first to support this project!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Project Documents */}
            {project.project_documents && project.project_documents.length > 0 && (
              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-base md:text-lg">
                    <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                    Project Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.project_documents.map((doc, index) => (
                    <a
                      key={index}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors group"
                    >
                      <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium group-hover:text-purple-400 transition-colors truncate text-sm md:text-base">
                          {doc.title}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">
                          {doc.document_type.replace('_', ' ')}
                        </p>
                      </div>
                      <ExternalLink className="w-3 h-3 md:w-4 md:h-4 text-gray-400 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Project Stats */}
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white text-base md:text-lg">Project Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm md:text-base">Category</span>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400 capitalize text-xs">
                    {project.category}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm md:text-base">Created</span>
                  <span className="text-white text-sm md:text-base">{format(new Date(project.created_date), "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm md:text-base">Deadline</span>
                  <span className={`font-medium text-sm md:text-base ${isDeadlinePassed ? 'text-red-400' : 'text-white'}`}>
                    {format(new Date(project.deadline), "MMM d, yyyy")}
                  </span>
                </div>
                {project.reward_token && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm md:text-base">Reward Token</span>
                    <span className="text-green-400 text-sm md:text-base">{project.reward_token}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && project && (
        <EditProjectModal
          project={project}
          onSave={handleProjectUpdate}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
