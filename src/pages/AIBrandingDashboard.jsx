
import React, { useState, useEffect } from 'react';
import { useUser } from '@/components/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, Users, Settings, BarChart, Bot, PlusCircle, RefreshCw } from 'lucide-react';
import QuantumFlowLoader from '@/components/layout/QuantumFlowLoader';

// New entity imports
import { SponsorProfile } from '@/entities/SponsorProfile';
import { AIBrandingCategory } from '@/entities/AIBrandingCategory';
import { TrendingContentAlert } from '@/entities/TrendingContentAlert'; // NEW: TrendingContentAlert entity

// New component imports
import SponsorCard from '@/components/admin/branding/SponsorCard';
import SponsorFormModal from '@/components/admin/branding/SponsorFormModal';
import CategoryManager from '@/components/admin/branding/CategoryManager';

// Mock Data - to be replaced with API calls
const mockSponsors = [
  { id: 'sp1', name: 'SynthWave Records', logo_url: 'https://via.placeholder.com/40/ec4899/FFFFFF?text=S', is_active: true, monthly_budget_usd: 1500, manager_user_email: 'admin@example.com', registration_status: 'approved' },
  { id: 'sp2', name: 'FutureHealth AI', logo_url: 'https://via.placeholder.com/40/3b82f6/FFFFFF?text=F', is_active: true, monthly_budget_usd: 2500, manager_user_email: 'sponsor1@example.com', registration_status: 'approved' },
  { id: 'sp3', name: 'Gourmet Kitchen Inc.', logo_url: 'https://via.placeholder.com/40/10b981/FFFFFF?text=G', is_active: false, monthly_budget_usd: 1000, manager_user_email: 'pending@example.com', registration_status: 'pending' }
];

const AIBrandingDashboard = () => {
  const { user, isLoading: userIsLoading } = useUser();
  const [activeTab, setActiveTab] = useState('dashboard');

  // State for sponsors
  const [sponsors, setSponsors] = useState([]);
  const [loadingSponsors, setLoadingSponsors] = useState(true);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);

  // State for categories
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // NEW: State for trending content
  const [trendingContent, setTrendingContent] = useState([]);
  const [loadingTrendingContent, setLoadingTrendingContent] = useState(true);

  const fetchData = async () => {
    setLoadingSponsors(true);
    setLoadingCategories(true);
    setLoadingTrendingContent(true); // NEW

    try {
      // Placeholder for API calls, using mockSponsors and categories for initial display
      // Replace with actual API calls from SponsorProfile and AIBrandingCategory
      const [sponsorsData, categoriesData, trendingData] = await Promise.all([
        SponsorProfile.filter({ registration_status: 'approved' }), // Only show approved sponsors
        AIBrandingCategory.list(),
        TrendingContentAlert.filter({ status: ['new', 'viewed'] }, '-created_date', 20) // Fetch recent trending alerts
      ]);
      setSponsors(sponsorsData);
      setCategories(categoriesData);
      setTrendingContent(trendingData); // NEW
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Fallback to mock data if API fails during development, or show error
      // Filter mock data here to simulate fetching approved sponsors if API fails
      setSponsors(mockSponsors.filter(s => s.registration_status === 'approved')); 
      setCategories([{ id: 'c1', name: 'Music', is_active: true }, { id: 'c2', name: 'Technology', is_active: true }, { id: 'c3', name: 'Food', is_active: false }]);
      setTrendingContent([]); // Fallback for trending content
    } finally {
      setLoadingSponsors(false);
      setLoadingCategories(false);
      setLoadingTrendingContent(false); // NEW
    }
  };

  useEffect(() => {
    if (user) { // Fetch data once user is loaded, regardless of role
      fetchData();
    }
  }, [user]);

  // --- Sponsor Handlers ---
  const handleSaveSponsor = async (sponsorData) => {
    try {
      if (editingSponsor) {
        await SponsorProfile.update(editingSponsor.id, sponsorData);
      } else {
        await SponsorProfile.create(sponsorData);
      }
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to save sponsor:", error);
    } finally {
      setEditingSponsor(null);
      setShowSponsorModal(false);
    }
  };

  const handleToggleSponsorActive = async (sponsor, isActive) => {
    try {
      await SponsorProfile.update(sponsor.id, { is_active: isActive });
      fetchData();
    } catch (error) {
      console.error("Failed to toggle sponsor status:", error);
    }
  };

  const handleDeleteSponsor = async (sponsor) => {
    if (window.confirm(`Are you sure you want to delete ${sponsor.name}?`)) {
      try {
        await SponsorProfile.delete(sponsor.id);
        fetchData();
      } catch (error) {
        console.error("Failed to delete sponsor:", error);
      }
    }
  };

  const openSponsorModal = (sponsor = null) => {
    setEditingSponsor(sponsor);
    setShowSponsorModal(true);
  };

  // --- Category Handlers ---
  const handleSaveCategory = async (category, categoryData) => {
    try {
      if (category && category.id) {// Check for existing category to update
        await AIBrandingCategory.update(category.id, categoryData);
      } else {// Create new category
        await AIBrandingCategory.create(categoryData);
      }
      fetchData();
    } catch (error) {
      console.error("Failed to save category:", error);
    }
  };

  const handleToggleCategoryActive = async (category, isActive) => {
    try {
      await AIBrandingCategory.update(category.id, { is_active: isActive });
      fetchData();
    } catch (error) {
      console.error("Failed to toggle category status:", error);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (window.confirm(`Are you sure you want to delete the "${category.name}" category?`)) {
      try {
        await AIBrandingCategory.delete(category.id);
        fetchData();
      } catch (error) {
        console.error("Failed to delete category:", error);
      }
    }
  };

  // NEW: Trending content handlers
  const handleOfferToSponsors = async (alert) => {
    try {
      // Update alert status to 'actioned'
      await TrendingContentAlert.update(alert.id, { status: 'actioned' });

      // Here we could implement logic to automatically match sponsors
      // based on their subscribed_category_ids vs the alert's suggested_category_ids

      // For now, just refresh the data
      fetchData();

      // TODO: In future, this could open a modal to select specific sponsors
      // or create AIBrandingPartnership records automatically

    } catch (error) {
      console.error("Failed to offer to sponsors:", error);
    }
  };

  const handleDismissAlert = async (alert) => {
    try {
      await TrendingContentAlert.update(alert.id, { status: 'dismissed' });
      fetchData();
    } catch (error) {
      console.error("Failed to dismiss alert:", error);
    }
  };

  if (userIsLoading) {
    return <QuantumFlowLoader message="Loading Dashboard..." />;
  }

  // Updated access control - allow approved sponsors
  const isApprovedSponsor = user && sponsors.some(sponsor =>
    sponsor.manager_user_email === user.email &&
    sponsor.registration_status === 'approved'
  );

  if (!user || (user.role !== 'admin' && !isApprovedSponsor)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Card className="dark-card max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view this page. This area is restricted to administrators and approved sponsors.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    if (loadingSponsors || loadingCategories || loadingTrendingContent) {// NEW: Add loadingTrendingContent
      return <div className="flex justify-center items-center p-20"><QuantumFlowLoader message="Loading data..." /></div>;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Updated stats with real data */}
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white text-lg">Active Partnerships</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-purple-400">{sponsors.filter((s) => s.is_active).length}</p>
                <p className="text-sm text-gray-400">Brand partners</p>
              </CardContent>
            </Card>
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white text-lg">Trending Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-yellow-400">{trendingContent.filter((t) => t.status === 'new').length}</p>
                <p className="text-sm text-gray-400">New alerts waiting for review</p>
              </CardContent>
            </Card>
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white text-lg">Active Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-400">{categories.filter((c) => c.is_active).length}</p>
                <p className="text-sm text-gray-400">Content categories</p>
              </CardContent>
            </Card>
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white text-lg">Total Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-400">${sponsors.reduce((sum, s) => sum + (s.monthly_budget_usd || 0), 0).toLocaleString()}</p>
                <p className="text-sm text-gray-400">Monthly allocation</p>
              </CardContent>
            </Card>
          </div>);

      case 'trending':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Trending Content Feed</h2>
                <p className="text-gray-400">AI-identified viral content opportunities for brand partnerships</p>
              </div>
              <Button
                onClick={() => fetchData()}
                variant="outline" className="bg-background text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-purple-500/30 hover:bg-purple-500/10">


                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Feed
              </Button>
            </div>

            {trendingContent.length === 0 ?
              <Card className="dark-card">
                <CardContent className="p-8 text-center">
                  <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No Trending Content Yet</h3>
                  <p className="text-gray-400">The AI is monitoring for viral content. Check back soon or create some engaging posts!</p>
                </CardContent>
              </Card> :

              trendingContent.map((alert) =>
                <Card key={alert.id} className="dark-card flex flex-col md:flex-row items-start gap-4 p-4">
                  {alert.post_snapshot?.media_url &&
                    <img src={alert.post_snapshot.media_url} alt="content media" className="w-full md:w-32 h-32 object-cover rounded-lg" />
                  }
                  <div className="flex-grow">
                    <p className="text-gray-300 mb-2">"{alert.post_snapshot?.content_preview}"</p>
                    <p className="text-sm text-gray-500 mb-2">by {alert.creator_email}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {alert.suggested_category_ids?.map((categoryId) =>
                        <Badge key={categoryId} variant="outline" className="text-purple-300 border-purple-500/30">
                          {categories.find((c) => c.id === categoryId)?.name || categoryId}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span><TrendingUp className="w-4 h-4 inline mr-1 text-green-400" />Velocity: {alert.performance_metrics?.velocity?.toFixed(1) || 'N/A'}</span>
                      <span>Likes: {alert.performance_metrics?.likes || 0}</span>
                      <span>Comments: {alert.performance_metrics?.comments || 0}</span>
                      <span>Shares: {alert.performance_metrics?.shares || 0}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex md:flex-col gap-2 w-full md:w-auto">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleOfferToSponsors(alert)}
                      disabled={alert.status === 'actioned'}>

                      {alert.status === 'actioned' ? 'Offered' : 'Offer to Sponsors'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      onClick={() => handleDismissAlert(alert)}>

                      Dismiss
                    </Button>
                  </div>
                </Card>
              )
            }
          </div>);

      case 'sponsors':
        // Only show sponsors tab to admins
        if (user.role !== 'admin') {
          return (
            <div className="text-center p-8">
              <p className="text-gray-400">This section is only available to administrators.</p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Sponsor Management</h2>
                <p className="text-gray-400">Onboard, configure, and manage brand partners.</p>
              </div>
              <Button onClick={() => openSponsorModal()} className="bg-purple-600 hover:bg-purple-700">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Sponsor
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sponsors.map((sponsor) =>
                <SponsorCard
                  key={sponsor.id}
                  sponsor={sponsor}
                  onEdit={openSponsorModal}
                  onToggleActive={handleToggleSponsorActive}
                  onDelete={handleDeleteSponsor} />

              )}
            </div>
          </div>);

      case 'settings':
        // Only show settings tab to admins
        if (user.role !== 'admin') {
          return (
            <div className="text-center p-8">
              <p className="text-gray-400">This section is only available to administrators.</p>
            </div>
          );
        }
        return (
          <CategoryManager
            categories={categories}
            onSave={handleSaveCategory}
            onDelete={handleDeleteCategory}
            onToggleActive={handleToggleCategoryActive} />);


      default:
        return null;
    }
  };

  // Filter tabs based on user role
  const availableTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart },
    { id: 'trending', label: 'Trending Feed', icon: Target },
  ];

  // Add admin-only tabs
  if (user && user.role === 'admin') { // Ensure user is defined before checking role
    availableTabs.push(
      { id: 'sponsors', label: 'Sponsors', icon: Users },
      { id: 'settings', label: 'Settings', icon: Settings }
    );
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6">
        <header>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Branding Dashboard</h1>
              <p className="text-gray-400">Identify, partner, and manage brand collaborations on trending content.</p>
            </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-slate-900/80 p-1 h-auto">
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-slate-50 px-3 py-1.5 text-sm font-medium justify-center whitespace-nowrap rounded-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                <tab.icon className="w-4 h-4" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="mt-6">
            {renderContent()}
          </div>
        </Tabs>
      </div>
      <SponsorFormModal
        isOpen={showSponsorModal}
        onClose={() => setShowSponsorModal(false)}
        onSave={handleSaveSponsor}
        sponsor={editingSponsor}
        categories={categories} // Pass categories to the modal for selection
      />
    </>
  );
};

export default AIBrandingDashboard;
