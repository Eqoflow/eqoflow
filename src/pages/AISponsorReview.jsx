
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Bot, CheckCircle, XCircle, Clock, ExternalLink, Mail, Globe, User as UserIcon, Building2, Calendar } from 'lucide-react';
import { SponsorProfile } from '@/entities/SponsorProfile';
import { AIBrandingCategory } from '@/entities/AIBrandingCategory';
import { User } from '@/entities/User'; // This 'User' is the entity, not the icon
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';

export default function AISponsorReview() {
  const [user, setUser] = useState(null);
  const [sponsors, setSponsors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [reviewModal, setReviewModal] = useState({ open: false, sponsor: null, action: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await User.me(); // Using the User entity here
      setUser(currentUser);

      if (currentUser?.role !== 'admin') {
        setLoading(false);
        return;
      }

      const [sponsorsData, categoriesData] = await Promise.all([
        SponsorProfile.list('-created_date'),
        AIBrandingCategory.list()
      ]);

      setSponsors(sponsorsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (sponsor, action) => {
    setReviewModal({ open: true, sponsor, action });
    setRejectionReason('');
  };

  const processReview = async () => {
    if (!reviewModal.sponsor || !reviewModal.action) return;

    setIsProcessing(true);
    try {
      const updateData = {
        registration_status: reviewModal.action,
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
        ...(reviewModal.action === 'rejected' && rejectionReason && { rejection_reason: rejectionReason })
      };

      await SponsorProfile.update(reviewModal.sponsor.id, updateData);
      
      // Refresh data
      await loadData();
      
      // Close modal
      setReviewModal({ open: false, sponsor: null, action: null });
    } catch (error) {
      console.error('Error processing review:', error);
      alert('Error processing review. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: Clock, text: 'Pending' },
      approved: { color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: XCircle, text: 'Rejected' }
    };
    
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const filteredSponsors = sponsors.filter(sponsor => {
    if (activeTab === 'all') return true;
    return sponsor.registration_status === activeTab;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <QuantumFlowLoader message="Loading sponsor applications..." />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-slate-950">
        <Card className="dark-card p-8 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You need admin privileges to access this page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              AI Sponsor Review
            </h1>
          </div>
          <p className="text-gray-400">Review and approve sponsor applications for the AI Branding program</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-900/80 p-1 h-auto mb-6">
            <TabsTrigger value="pending" className="text-slate-50 data-[state=active]:bg-yellow-600">
              Pending ({sponsors.filter(s => s.registration_status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-slate-50 data-[state=active]:bg-green-600">
              Approved ({sponsors.filter(s => s.registration_status === 'approved').length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-slate-50 data-[state=active]:bg-red-600">
              Rejected ({sponsors.filter(s => s.registration_status === 'rejected').length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-slate-50 data-[state=active]:bg-purple-600">
              All ({sponsors.length})
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSponsors.map((sponsor) => (
              <Card key={sponsor.id} className="dark-card hover-lift">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        {sponsor.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                        <Globe className="w-4 h-4" />
                        <a 
                          href={sponsor.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:text-purple-400 transition-colors flex items-center gap-1"
                        >
                          {sponsor.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    {getStatusBadge(sponsor.registration_status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {sponsor.company_description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-gray-400 mb-1">
                        <UserIcon className="w-3 h-3" /> {/* Using UserIcon */}
                        <span>Contact</span>
                      </div>
                      <p className="text-white">{sponsor.contact_person}</p>
                      <div className="flex items-center gap-1 text-gray-400 mt-1">
                        <Mail className="w-3 h-3" />
                        <span className="text-xs">{sponsor.contact_email}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-gray-400 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>Applied</span>
                      </div>
                      <p className="text-white">
                        {new Date(sponsor.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {sponsor.monthly_budget_usd > 0 && (
                    <div>
                      <p className="text-gray-400 text-sm">Monthly Budget</p>
                      <p className="text-green-400 font-semibold">
                        ${sponsor.monthly_budget_usd.toLocaleString()} USD
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-gray-400 text-sm mb-2">Interested Categories</p>
                    <div className="flex flex-wrap gap-1">
                      {sponsor.subscribed_category_ids?.slice(0, 3).map(categoryId => (
                        <Badge key={categoryId} variant="outline" className="text-purple-300 border-purple-500/30 text-xs">
                          {getCategoryName(categoryId)}
                        </Badge>
                      ))}
                      {sponsor.subscribed_category_ids?.length > 3 && (
                        <Badge variant="outline" className="text-gray-400 border-gray-500/30 text-xs">
                          +{sponsor.subscribed_category_ids.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {sponsor.registration_status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                      <Button
                        onClick={() => handleReviewAction(sponsor, 'approved')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReviewAction(sponsor, 'rejected')}
                        variant="outline"
                        className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {sponsor.registration_status === 'rejected' && sponsor.rejection_reason && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                      <p className="text-red-300 text-sm">
                        <strong>Rejection Reason:</strong> {sponsor.rejection_reason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSponsors.length === 0 && (
            <Card className="dark-card p-8 text-center">
              <p className="text-gray-400">
                No sponsors found for the {activeTab} category.
              </p>
            </Card>
          )}
        </Tabs>
      </div>

      {/* Review Modal */}
      <Dialog open={reviewModal.open} onOpenChange={() => setReviewModal({ open: false, sponsor: null, action: null })}>
        <DialogContent className="dark-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {reviewModal.action === 'approved' ? 'Approve Sponsor' : 'Reject Sponsor'}
            </DialogTitle>
            <DialogDescription>
              {reviewModal.action === 'approved' 
                ? `Are you sure you want to approve ${reviewModal.sponsor?.name}? They will gain access to the AI Branding Dashboard.`
                : `Are you sure you want to reject ${reviewModal.sponsor?.name}? Please provide a reason below.`
              }
            </DialogDescription>
          </DialogHeader>

          {reviewModal.action === 'rejected' && (
            <div className="py-4">
              <Label htmlFor="rejection_reason" className="text-gray-300">
                Rejection Reason (Optional)
              </Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this application was rejected..."
                className="dark-input mt-2"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewModal({ open: false, sponsor: null, action: null })}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={processReview}
              disabled={isProcessing}
              className={reviewModal.action === 'approved' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
              }
            >
              {isProcessing ? 'Processing...' : (reviewModal.action === 'approved' ? 'Approve' : 'Reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
