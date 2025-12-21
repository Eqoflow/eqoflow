
import React, { useState, useEffect } from 'react';
import { Feedback } from '@/entities/Feedback';
import { ModerationLog } from '@/entities/ModerationLog';
import { User } from '@/entities/User';
import { Notification } from '@/entities/Notification';
import { Post } from '@/entities/Post';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Coins, Gavel, ArrowLeft } from 'lucide-react';
import AppealReviewModal from '../components/moderation/AppealReviewModal';

const getStatusColor = (status) => {
  switch (status) {
    case 'new': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'in_progress':
    case 'under_review':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'completed':
    case 'resolved':
    case 'approved':
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'rejected':
    case 'flagged':
    case 'removed':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
};

export default function ModerationHub() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [inProgressFeedbacks, setInProgressFeedbacks] = useState([]);
    const [moderationLogs, setModerationLogs] = useState([]);
    const [appealedLogs, setAppealedLogs] = useState([]); // New state for appeals
    const [isLoading, setIsLoading] = useState(true);
    const [rewardAmounts, setRewardAmounts] = useState({});
    const [showAppealReviewModal, setShowAppealReviewModal] = useState(false);
    const [selectedAppealLog, setSelectedAppealLog] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [userRes, feedbackRes, inProgressRes, modLogRes, appealLogRes] = await Promise.all([
                User.me(),
                Feedback.filter({ status: 'new' }, '-created_date', 50),
                Feedback.filter({ status: 'in_progress' }, '-created_date', 50),
                ModerationLog.filter({ moderation_result: 'flagged', status: 'final' }, '-created_date', 50),
                ModerationLog.filter({ status: 'appealed' }, '-created_date', 50)
            ]);
            setCurrentUser(userRes);
            setFeedbacks(feedbackRes);
            setInProgressFeedbacks(inProgressRes);
            setModerationLogs(modLogRes);
            setAppealedLogs(appealLogRes);
            
            // Initialize reward amounts with default values for both new and in-progress feedback
            const initialRewards = {};
            [...feedbackRes, ...inProgressRes].forEach(fb => {
                initialRewards[fb.id] = 100; // Default 100 QFLOW tokens
            });
            setRewardAmounts(initialRewards);
        } catch (error) {
            console.error("Error loading moderation data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUpdateFeedbackStatus = async (id, newStatus) => {
        try {
            await Feedback.update(id, { status: newStatus });
            
            // If feedback is being completed/approved, award tokens and send notification
            if (newStatus === 'completed') {
                // Find feedback in either list
                const feedback = [...feedbacks, ...inProgressFeedbacks].find(fb => fb.id === id);
                const rewardAmount = rewardAmounts[id] || 100;
                
                if (feedback && rewardAmount > 0) {
                    try {
                        // Award tokens to the user
                        const user = await User.filter({ email: feedback.created_by }, '', 1);
                        if (user.length > 0) {
                            const currentBalance = user[0].token_balance || 0;
                            await User.update(user[0].id, { 
                                token_balance: currentBalance + rewardAmount 
                            });
                            
                            // Create notification for the user
                            await Notification.create({
                                recipient_email: feedback.created_by,
                                type: 'reward',
                                title: 'Feedback Reward',
                                message: `Your feedback has been approved! You've been awarded ${rewardAmount} $QFLOW tokens for helping improve the platform.`,
                                actor_email: 'admin@quantumflow.app',
                                actor_name: 'QuantumFlow Team',
                                actor_avatar: '',
                                related_content_type: 'feedback',
                                related_content_id: id,
                                action_url: '/Profile?section=wallet',
                                metadata: {
                                    reward_amount: rewardAmount,
                                    feedback_content: feedback.content.substring(0, 100)
                                }
                            });
                        }
                    } catch (error) {
                        console.error('Error awarding tokens or sending notification:', error);
                        alert('Feedback status updated, but there was an issue awarding tokens. Please check manually.');
                    }
                }
            }
            
            loadData();
        } catch (error) {
            console.error("Error updating feedback:", error);
        }
    };

    const handleRewardAmountChange = (feedbackId, amount) => {
        setRewardAmounts(prev => ({
            ...prev,
            [feedbackId]: parseInt(amount) || 0
        }));
    };

    const handleOpenAppealReview = (log) => {
        setSelectedAppealLog(log);
        setShowAppealReviewModal(true);
    };

    const handleResolveAppeal = async (log, decision, adminResponse) => {
        if (!currentUser) {
            alert("No current user logged in. Cannot resolve appeal.");
            return;
        }
        try {
            // Ensure we have the post author email
            let postAuthorEmail = log.post_author_email;
            
            if (!postAuthorEmail && log.content_type === 'post' && log.content_id) {
                // Fetch the post to get the author email
                try {
                    const post = await Post.get(log.content_id);
                    postAuthorEmail = post.created_by;
                } catch (postError) {
                    console.error("Error fetching post to get author email:", postError);
                }
            }
            
            if (!postAuthorEmail) {
                console.error("Cannot send notification: no post author email available");
                alert("Could not determine the content author to send notification.");
                return;
            }

            // Update ModerationLog
            await ModerationLog.update(log.id, {
                status: 'resolved',
                human_reviewer_decision: decision,
                admin_response: adminResponse,
                reviewed_by: currentUser.email,
                resolved_date: new Date().toISOString(),
                post_author_email: postAuthorEmail // Ensure this field is set
            });

            // Update Post
            if (log.content_type === 'post' && log.content_id) {
                const newStatus = decision === 'overturned' ? 'approved' : 'removed';
                await Post.update(log.content_id, { moderation_status: newStatus });
            }

            // Send notification to user
            await Notification.create({
                recipient_email: postAuthorEmail,
                type: 'system', // or a new 'appeal_response' type
                title: `Appeal Resolved: Content Flag ${decision.charAt(0).toUpperCase() + decision.slice(1)}`,
                message: `Our team has reviewed your appeal. Final decision: ${decision}. Reason: "${adminResponse}"`,
                actor_email: 'admin@eqoflow.app',
                actor_name: 'EqoFlow Moderation',
                related_content_id: log.content_id,
                related_content_type: log.content_type,
                action_url: createPageUrl(`TransparencyHub`), // Assuming a Transparency Hub for users to see
            });
            
            // Refresh data
            loadData();
            setShowAppealReviewModal(false); // Close modal after resolution

        } catch (error) {
            console.error("Error resolving appeal:", error);
            alert("Failed to resolve appeal. Please check the console and try again.");
        }
    };

    const renderFeedbackSection = (feedbackList, title, emptyMessage) => (
        <Card className="dark-card mt-4">
            <CardHeader><CardTitle className="text-white">{title}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {feedbackList.length === 0 ? <p className="text-gray-500">{emptyMessage}</p> : feedbackList.map(fb => (
                    <div key={fb.id} className="p-4 bg-slate-900 rounded-lg border border-gray-700">
                        <p className="text-white">{fb.content}</p>
                        <div className="flex items-center justify-between mt-2 text-xs">
                            <p className="text-gray-400">From: {fb.created_by} on page: <span className="font-mono text-purple-400">{fb.page_name}</span></p>
                            <p className="text-gray-500">{format(new Date(fb.created_date), 'PPp')}</p>
                        </div>
                        
                        {/* Token Reward Section */}
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-green-400" />
                                    <Label className="text-green-300 text-sm font-medium">QFLOW Reward:</Label>
                                </div>
                                <Input
                                    type="number"
                                    min="0"
                                    max="10000"
                                    value={rewardAmounts[fb.id] || 100}
                                    onChange={(e) => handleRewardAmountChange(fb.id, e.target.value)}
                                    className="w-24 h-8 bg-black/30 border-green-500/30 text-green-300 text-sm"
                                />
                                <span className="text-green-300 text-sm">tokens</span>
                            </div>
                            <p className="text-xs text-green-400/70 mt-1">
                                Tokens will be awarded when feedback is marked as complete
                            </p>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Button size="sm" variant="outline" className="text-yellow-300 border-yellow-500 hover:bg-yellow-500/10" onClick={() => handleUpdateFeedbackStatus(fb.id, 'in_progress')}>In Progress</Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-green-300 border-green-500 hover:bg-green-500/10 flex items-center gap-2" 
                                onClick={() => handleUpdateFeedbackStatus(fb.id, 'completed')}
                            >
                                <Coins className="w-4 h-4" />
                                Complete & Award {rewardAmounts[fb.id] || 100} QFLOW
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleUpdateFeedbackStatus(fb.id, 'rejected')}>Reject</Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return <QuantumFlowLoader message="Loading Moderation Hub..." />;
    }

    return (
        <div className="bg-slate-950 p-6 space-y-6">
            {/* Back Button */}
            <Link to={createPageUrl("AdminHub")}>
                <Button
                    variant="outline"
                    className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Admin Hub
                </Button>
            </Link>

            {showAppealReviewModal && selectedAppealLog && (
                <AppealReviewModal
                    log={selectedAppealLog}
                    onResolve={handleResolveAppeal}
                    onClose={() => setShowAppealReviewModal(false)}
                />
            )}
            <Card className="dark-card">
                <CardHeader>
                    <CardTitle className="text-white">Moderation Hub</CardTitle>
                    <p className="text-gray-400">Review user feedback, award tokens, and monitor flagged content.</p>
                </CardHeader>
            </Card>

            <Tabs defaultValue="feedback" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-black/20">
                    <TabsTrigger value="feedback" className="text-white">User Feedback ({feedbacks.length + inProgressFeedbacks.length})</TabsTrigger>
                    <TabsTrigger value="content" className="text-white">Flagged Content ({moderationLogs.length})</TabsTrigger>
                    <TabsTrigger value="appeals" className="text-white relative">
                        Appeals ({appealedLogs.length})
                        {appealedLogs.length > 0 && <div className="absolute top-1 right-2 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse" />}
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="feedback">
                    {/* New Feedback Section */}
                    {renderFeedbackSection(feedbacks, "New Feedback Submissions", "No new feedback.")}
                    
                    {/* In Progress Feedback Section */}
                    {renderFeedbackSection(inProgressFeedbacks, "In Progress Feedback", "No feedback currently in progress.")}
                </TabsContent>

                <TabsContent value="content">
                    <Card className="dark-card mt-4">
                        <CardHeader><CardTitle className="text-white">AI-Flagged Content for Review</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                           {moderationLogs.length === 0 ? <p className="text-gray-500">No content flagged.</p> : moderationLogs.map(log => (
                               <div key={log.id} className="p-4 bg-slate-900 rounded-lg border border-red-500/30">
                                   <p className="text-white font-mono text-sm">{log.content_snapshot}</p>
                                   <div className="flex items-center justify-between mt-2 text-xs">
                                       <div>
                                            <span className="text-gray-400 mr-2">Flagged for:</span>
                                            <Badge className={getStatusColor('flagged')}>{log.moderation_reason?.replace(/_/g, ' ') || 'N/A'}</Badge>
                                       </div>
                                       <p className="text-gray-500">{format(new Date(log.created_date), 'PPp')}</p>
                                   </div>
                                    <div className="mt-4 flex gap-2">
                                        {/* Future functionality can link to the post itself */}
                                        <Link to={createPageUrl("Post", {id: log.content_id})} target="_blank">
                                            <Button size="sm" variant="outline">View Details</Button>
                                        </Link>
                                        {/* <Button size="sm" variant="destructive">Remove Content</Button> */}
                                        {/* <Button size="sm" className="bg-gray-600">Dismiss Flag</Button> */}
                                    </div>
                               </div>
                           ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="appeals">
                    <Card className="dark-card mt-4">
                        <CardHeader><CardTitle className="text-white">Appealed Content for Final Review</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                           {appealedLogs.length === 0 ? <p className="text-gray-500">No active appeals.</p> : appealedLogs.map(log => (
                               <div key={log.id} className="p-4 bg-slate-900 rounded-lg border border-yellow-500/30">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <div className="space-y-2">
                                           <Label className="text-yellow-200">Original Content</Label>
                                            <div className="text-white font-mono text-sm p-2 bg-black/30 rounded-md h-20 overflow-y-auto">{log.content_snapshot}</div>
                                       </div>
                                       <div className="space-y-2">
                                           <Label className="text-yellow-200">User's Appeal Reason</Label>
                                           <div className="text-blue-200 text-sm p-2 bg-black/30 rounded-md h-20 overflow-y-auto italic">"{log.appeal_reason}"</div>
                                       </div>
                                   </div>
                                   <div className="flex items-center justify-between mt-4 pt-2 border-t border-yellow-500/20 text-xs">
                                       <div>
                                            <span className="text-gray-400 mr-2">Originally flagged for:</span>
                                            <Badge className={getStatusColor('flagged')}>{log.moderation_reason?.replace(/_/g, ' ') || 'N/A'}</Badge>
                                       </div>
                                       <p className="text-gray-500">Appealed: {format(new Date(log.updated_date), 'PPp')}</p>
                                   </div>
                                    <div className="mt-4 flex gap-2">
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleOpenAppealReview(log)}
                                            className="bg-yellow-600 hover:bg-yellow-700"
                                        >
                                            <Gavel className="w-4 h-4 mr-2" />
                                            Resolve Appeal
                                        </Button>
                                        <Link to={createPageUrl("Post", {id: log.content_id})} target="_blank">
                                            <Button size="sm" variant="outline">View Original Post</Button>
                                        </Link>
                                    </div>
                               </div>
                           ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
