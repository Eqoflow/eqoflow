
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { FraudFlag } from "@/entities/FraudFlag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  AlertTriangle,
  Eye,
  CheckCircle,
  X,
  Search,
  Filter,
  Calendar,
  User as UserIcon,
  TrendingUp,
  Users,
  MessageCircle,
  Zap,
  RefreshCw,
  ExternalLink,
  Ban,
  Flag,
  ArrowLeft // Added ArrowLeft import
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { detectFraud } from "@/functions/detectFraud";

export default function FraudMonitor() {
  const [user, setUser] = useState(null);
  const [flags, setFlags] = useState([]);
  const [filteredFlags, setFilteredFlags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningDetection, setIsRunningDetection] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterFlags();
  }, [flags, searchTerm, statusFilter, severityFilter, typeFilter]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is admin
      const currentUser = await User.me();
      if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      
      setUser(currentUser);
      await loadFlags();
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFlags = async () => {
    try {
      const fraudFlags = await FraudFlag.list("-created_date", 100);
      setFlags(fraudFlags);
    } catch (error) {
      console.error("Error loading fraud flags:", error);
    }
  };

  const filterFlags = () => {
    let filtered = flags;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(flag =>
        flag.flagged_user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flag.flagged_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flag.detection_reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(flag => flag.status === statusFilter);
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter(flag => flag.severity === severityFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(flag => flag.flag_type === typeFilter);
    }

    setFilteredFlags(filtered);
  };

  const runFraudDetection = async () => {
    try {
      setIsRunningDetection(true);
      const response = await detectFraud();
      
      if (response.data?.success) {
        alert(`Fraud detection completed! ${response.data.flags_created} new flags created.`);
        await loadFlags(); // Refresh the flags list
      } else {
        alert("Fraud detection failed. Check console for details.");
      }
    } catch (error) {
      console.error("Error running fraud detection:", error);
      alert("Error running fraud detection. Check console for details.");
    } finally {
      setIsRunningDetection(false);
    }
  };

  const updateFlagStatus = async (flagId, newStatus, reviewNotes = "", actionTaken = "none") => {
    try {
      await FraudFlag.update(flagId, {
        status: newStatus,
        reviewed_by: user.email,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString(),
        action_taken: actionTaken
      });
      
      await loadFlags();
      setShowDetailModal(false);
    } catch (error) {
      console.error("Error updating flag status:", error);
      alert("Error updating flag status");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'medium': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'critical': return 'bg-red-600/30 text-red-300 border-red-600/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'under_review': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'dismissed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'escalated': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getFlagTypeIcon = (type) => {
    switch (type) {
      case 'suspicious_ep_gain': return <Zap className="w-4 h-4" />;
      case 'bot_like_followers': return <Users className="w-4 h-4" />;
      case 'coordinated_engagement': return <MessageCircle className="w-4 h-4" />;
      case 'rapid_follower_growth': return <TrendingUp className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  const formatFlagType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading fraud monitoring system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl("AdminHub")}>
          <Button
            variant="outline"
            className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Hub
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-400" />
              Fraud Monitoring System
            </h1>
            <p className="text-gray-400">
              Monitor and review potential fraudulent activity across the platform
            </p>
          </div>
          
          <Button
            onClick={runFraudDetection}
            disabled={isRunningDetection}
            className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
          >
            {isRunningDetection ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Detection...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Run Fraud Detection
              </>
            )}
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="dark-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">New Flags</p>
                  <p className="text-xl font-bold text-white">
                    {flags.filter(f => f.status === 'new').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Under Review</p>
                  <p className="text-xl font-bold text-white">
                    {flags.filter(f => f.status === 'under_review').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Critical Flags</p>
                  <p className="text-xl font-bold text-white">
                    {flags.filter(f => f.severity === 'critical').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Resolved</p>
                  <p className="text-xl font-bold text-white">
                    {flags.filter(f => f.status === 'resolved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="dark-card mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-400" />
              Filter Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Input
                  placeholder="Search by email or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-black/20 border-purple-500/20 text-white"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/20">
                  <SelectItem value="all" className="text-white">All Statuses</SelectItem>
                  <SelectItem value="new" className="text-white">New</SelectItem>
                  <SelectItem value="under_review" className="text-white">Under Review</SelectItem>
                  <SelectItem value="resolved" className="text-white">Resolved</SelectItem>
                  <SelectItem value="dismissed" className="text-white">Dismissed</SelectItem>
                  <SelectItem value="escalated" className="text-white">Escalated</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/20">
                  <SelectItem value="all" className="text-white">All Severities</SelectItem>
                  <SelectItem value="low" className="text-white">Low</SelectItem>
                  <SelectItem value="medium" className="text-white">Medium</SelectItem>
                  <SelectItem value="high" className="text-white">High</SelectItem>
                  <SelectItem value="critical" className="text-white">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                  <SelectValue placeholder="Flag Type" />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/20">
                  <SelectItem value="all" className="text-white">All Types</SelectItem>
                  <SelectItem value="suspicious_ep_gain" className="text-white">Suspicious EP Gain</SelectItem>
                  <SelectItem value="bot_like_followers" className="text-white">Bot-like Followers</SelectItem>
                  <SelectItem value="coordinated_engagement" className="text-white">Coordinated Engagement</SelectItem>
                  <SelectItem value="rapid_follower_growth" className="text-white">Rapid Follower Growth</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSeverityFilter("all");
                  setTypeFilter("all");
                }}
                variant="outline"
                className="border-purple-500/30 text-white hover:bg-purple-500/10"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Flags List */}
        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-white">
              Fraud Flags ({filteredFlags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFlags.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No fraud flags found</p>
                <p className="text-gray-500">All users are behaving appropriately!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFlags.map((flag) => (
                  <motion.div
                    key={flag.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-black/20 rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedFlag(flag);
                      setShowDetailModal(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          {getFlagTypeIcon(flag.flag_type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">
                              {flag.flagged_user_name || 'Unknown User'}
                            </h3>
                            <Badge className={getSeverityColor(flag.severity)}>
                              {flag.severity.toUpperCase()}
                            </Badge>
                            <Badge className={getStatusColor(flag.status)}>
                              {flag.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-400 mb-2">
                            {flag.flagged_user_email}
                          </p>
                          
                          <p className="text-sm text-gray-300 mb-3">
                            <strong>{formatFlagType(flag.flag_type)}:</strong> {flag.detection_reason}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(flag.created_date), 'MMM d, yyyy h:mm a')}
                            </div>
                            {flag.reviewed_by && (
                              <div className="flex items-center gap-1">
                                <UserIcon className="w-3 h-3" />
                                Reviewed by {flag.reviewed_by}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`${createPageUrl("PublicProfile")}?email=${encodeURIComponent(flag.flagged_user_email)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-purple-500/30 text-white hover:bg-purple-500/10"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-purple-500/30 text-white hover:bg-purple-500/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl bg-gray-900 border-purple-500/20">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-400" />
                Fraud Flag Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedFlag && (
              <FlagDetailView 
                flag={selectedFlag} 
                onStatusUpdate={updateFlagStatus}
                onClose={() => setShowDetailModal(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Separate component for flag detail view
function FlagDetailView({ flag, onStatusUpdate, onClose }) {
  const [reviewNotes, setReviewNotes] = useState(flag.review_notes || "");
  const [actionTaken, setActionTaken] = useState(flag.action_taken || "none");

  const handleStatusUpdate = (newStatus) => {
    onStatusUpdate(flag.id, newStatus, reviewNotes, actionTaken);
  };

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="p-4 bg-black/20 rounded-xl">
        <h3 className="text-white font-semibold mb-2">Flagged User</h3>
        <div className="space-y-2 text-sm">
          <div><span className="text-gray-400">Name:</span> <span className="text-white">{flag.flagged_user_name}</span></div>
          <div><span className="text-gray-400">Email:</span> <span className="text-white">{flag.flagged_user_email}</span></div>
          <div><span className="text-gray-400">Flag Type:</span> <span className="text-white">{formatFlagType(flag.flag_type)}</span></div>
          <div><span className="text-gray-400">Severity:</span> <Badge className={getSeverityColor(flag.severity)}>{flag.severity}</Badge></div>
          <div><span className="text-gray-400">Status:</span> <Badge className={getStatusColor(flag.status)}>{flag.status}</Badge></div>
        </div>
      </div>

      {/* Detection Details */}
      <div className="p-4 bg-black/20 rounded-xl">
        <h3 className="text-white font-semibold mb-2">Detection Details</h3>
        <p className="text-gray-300 text-sm">{flag.detection_reason}</p>
        
        {flag.metrics_snapshot && (
          <div className="mt-3">
            <h4 className="text-gray-400 text-sm font-medium mb-2">Metrics Snapshot:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(flag.metrics_snapshot).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-400">{key.replace('_', ' ')}:</span>
                  <span className="text-white">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Section */}
      <div className="p-4 bg-black/20 rounded-xl">
        <h3 className="text-white font-semibold mb-3">Admin Review</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Action Taken</label>
            <Select value={actionTaken} onValueChange={setActionTaken}>
              <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-purple-500/20">
                <SelectItem value="none" className="text-white">No Action</SelectItem>
                <SelectItem value="warning_sent" className="text-white">Warning Sent</SelectItem>
                <SelectItem value="rewards_suspended" className="text-white">Rewards Suspended</SelectItem>
                <SelectItem value="account_banned" className="text-white">Account Banned</SelectItem>
                <SelectItem value="under_monitoring" className="text-white">Under Monitoring</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Review Notes</label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add your review notes..."
              className="bg-black/20 border-purple-500/20 text-white"
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={() => handleStatusUpdate('dismissed')}
          variant="outline"
          className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
        >
          <X className="w-4 h-4 mr-2" />
          Dismiss
        </Button>
        
        <Button
          onClick={() => handleStatusUpdate('under_review')}
          className="bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          <Eye className="w-4 h-4 mr-2" />
          Mark Under Review
        </Button>
        
        <Button
          onClick={() => handleStatusUpdate('resolved')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark Resolved
        </Button>
        
        <Button
          onClick={() => handleStatusUpdate('escalated')}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Ban className="w-4 h-4 mr-2" />
          Escalate
        </Button>
      </div>
    </div>
  );
}

// Helper functions (same as in parent component)
function getSeverityColor(severity) {
  switch (severity) {
    case 'low': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'medium': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'critical': return 'bg-red-600/30 text-red-300 border-red-600/50';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'under_review': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'dismissed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'escalated': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

function formatFlagType(type) {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
