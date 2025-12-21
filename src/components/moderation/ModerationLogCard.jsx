import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertTriangle, BrainCircuit, MessageSquare } from 'lucide-react';

export default function ModerationLogCard({ log, onAppeal }) {
    const getStatusInfo = (result) => {
        switch (result) {
            case 'flagged':
                return {
                    text: 'Content Flagged',
                    icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
                    color: 'text-yellow-400',
                };
            case 'approved':
                return {
                    text: 'Content Approved',
                    icon: <AlertTriangle className="w-5 h-5 text-green-400" />,
                    color: 'text-green-400',
                };
            case 'removed':
                 return {
                    text: 'Content Removed',
                    icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
                    color: 'text-red-400',
                };
            default:
                return {
                    text: 'Action Taken',
                    icon: <AlertTriangle className="w-5 h-5 text-gray-400" />,
                    color: 'text-gray-400',
                };
        }
    };
    
    const statusInfo = getStatusInfo(log.moderation_result);

    return (
        <Card className="bg-slate-900/50 border border-slate-700 text-white">
            <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left side */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-3">
                        {statusInfo.icon}
                        <h3 className={`text-lg font-semibold ${statusInfo.color}`}>
                           {statusInfo.text}
                        </h3>
                    </div>
                    
                    <blockquote className="border-l-4 border-slate-600 pl-4 py-2 bg-black/20 rounded-r-md">
                        <p className="text-gray-300 italic">"{log.content_snapshot}"</p>
                    </blockquote>

                    {log.appeal_reason && (
                         <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                            <p className="text-xs font-semibold text-blue-300 mb-1">Your Appeal:</p>
                            <p className="text-sm text-blue-200 italic">"{log.appeal_reason}"</p>
                        </div>
                    )}
                     {log.admin_response && (
                        <div className={`p-3 rounded-lg border ${log.human_reviewer_decision === 'overturned' ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                            <p className={`text-xs font-semibold mb-1 ${log.human_reviewer_decision === 'overturned' ? 'text-green-300' : 'text-red-300'}`}>
                                Admin's Final Response:
                            </p>
                            <p className={`text-sm italic ${log.human_reviewer_decision === 'overturned' ? 'text-green-200' : 'text-red-200'}`}>"{log.admin_response}"</p>
                        </div>
                    )}
                    
                    <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                         <h4 className="font-semibold text-gray-300 flex items-center gap-2 mb-3"><BrainCircuit className="w-4 h-4 text-purple-400" /> AI Analysis</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                             <div><span className="text-gray-400">Reason:</span> <span className="font-medium text-white">{log.moderation_reason?.replace(/_/g, ' ') || 'N/A'}</span></div>
                             <div><span className="text-gray-400">Confidence:</span> <span className="font-medium text-white">{((log.ai_confidence_score || 0) * 100).toFixed(1)}%</span></div>
                             <div><span className="text-gray-400">Note:</span> <span className="font-medium text-white">{log.moderator_notes || 'None'}</span></div>
                         </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 capitalize">{log.content_type}</Badge>
                        <Badge variant="outline" className="border-purple-500/50 text-purple-400 capitalize">{log.status}</Badge>
                         {log.status === 'resolved' && (
                            <Badge variant="outline" className={`capitalize ${log.human_reviewer_decision === 'overturned' ? 'border-green-500/50 text-green-400' : 'border-red-500/50 text-red-400'}`}>
                                {log.human_reviewer_decision}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Right side */}
                <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700 flex flex-col justify-between">
                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-gray-400 text-xs">Log ID</p>
                            <p className="font-mono text-white text-xs truncate">{log.id}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs">Content ID</p>
                            <p className="font-mono text-white text-xs truncate">{log.content_id}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs">Timestamp</p>
                            <p className="font-mono text-white text-xs">{format(new Date(log.created_date), 'PPp')}</p>
                        </div>
                    </div>
                     <div className="mt-4">
                        {onAppeal && (
                            <Button onClick={onAppeal} className="w-full bg-blue-600 hover:bg-blue-700">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Appeal Decision
                            </Button>
                        )}
                        {log.status === 'appealed' && (
                            <Button disabled className="w-full mt-2 bg-gray-700 text-gray-400 cursor-not-allowed opacity-70">
                                Appeal Pending
                            </Button>
                        )}
                        {log.status === 'resolved' && (
                             <Button disabled className="w-full mt-2 bg-gray-700 text-gray-400 cursor-not-allowed opacity-70">
                                Decision Final
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}