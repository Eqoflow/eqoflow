import React, { useState, useEffect } from 'react';
import { ReferralCodeRequest } from '@/entities/ReferralCodeRequest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Check, X, Loader2, RefreshCw, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { processReferralRequest } from '@/functions/processReferralRequest';

export default function CustomReferrals() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rejectionReasons, setRejectionReasons] = useState({});

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const pendingRequests = await ReferralCodeRequest.filter({ status: 'pending' }, '-created_date');
      setRequests(pendingRequests);
    } catch (error) {
      console.error("Error fetching referral requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequest = async (requestId, decision) => {
    if (decision === 'rejected' && !rejectionReasons[requestId]) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setProcessingId(requestId);
    try {
      await processReferralRequest({
        requestId,
        decision,
        rejectionReason: rejectionReasons[requestId] || ''
      });
      
      // Remove from requests list
      setRequests(prev => prev.filter(r => r.id !== requestId));
      
      // Clear rejection reason
      setRejectionReasons(prev => {
        const newReasons = { ...prev };
        delete newReasons[requestId];
        return newReasons;
      });
      
    } catch (error) {
      console.error(`Error processing request:`, error);
      alert(`Failed to ${decision} request.`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectionReasonChange = (requestId, value) => {
    setRejectionReasons(prev => ({ ...prev, [requestId]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="ml-3 text-lg">Loading referral requests...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("AdminHub")}>
              <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin Hub
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-cyan-400">Custom Referral Requests</h1>
              <p className="text-gray-400">
                Review and approve custom referral code requests from users.
              </p>
            </div>
          </div>
          <Button onClick={fetchRequests} variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </header>

        {requests.length === 0 ? (
          <div className="text-center py-20 bg-slate-950 rounded-xl">
            <Check className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="mt-4 text-2xl font-semibold text-white">All Clear!</h2>
            <p className="mt-2 text-gray-400">There are no pending custom referral requests to review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <Card key={request.id} className="dark-card border-cyan-500/20 hover:border-cyan-500/40 transition-colors duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Custom Referral Request
                      </CardTitle>
                      <p className="text-sm text-gray-400">From: {request.created_by}</p>
                    </div>
                    <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
                      {format(new Date(request.created_date), 'MMM d, yyyy')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm p-3 bg-black/20 rounded-lg">
                    <p><strong className="text-white">Requested Code:</strong></p>
                    <div className="bg-cyan-900/20 border border-cyan-500/30 rounded px-3 py-2">
                      <span className="text-cyan-300 font-mono text-lg">{request.requested_code}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rejection Reason (required if rejecting)
                    </label>
                    <Textarea
                      placeholder="Provide reason for rejection..."
                      value={rejectionReasons[request.id] || ''}
                      onChange={(e) => handleRejectionReasonChange(request.id, e.target.value)}
                      className="bg-black/20 border-gray-600 text-white placeholder-gray-400"
                      disabled={processingId === request.id}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      onClick={() => handleRequest(request.id, 'rejected')}
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4 mr-2" />
                      )}
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleRequest(request.id, 'approved')}
                      className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}