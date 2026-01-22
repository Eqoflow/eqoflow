import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart2,
  Users,
  Shield,
  FileText,
  DollarSign,
  UserCheck,
  Link2,
  Award,
  Megaphone,
  ShieldCheck,
  CircleDollarSign,
  Key,
  Database,
  Gift,
  HandCoins,
  ScanLine,
  Bot,
  Briefcase,
  ArrowRight,
  BarChart3,
  ShoppingBag,
  Settings,
  BookOpen,
  Coins
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import EqoFlowLoader from '../components/layout/QuantumFlowLoader';
import { User } from "@/entities/User";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from 'framer-motion'; // Added motion
import NillionMPCDeployment from './NillionMPCDeployment'; // Added NillionMPCDeployment
import { base44 } from '@/api/base44Client'; // Changed import path for base44
import PaidEchoContentManager from '../components/admin/PaidEchoContentManager';

export default function AdminHub() {
  const [loading, setLoading] = useState(false);
  // activeTab state and its useEffect are removed as the new Tabs component uses defaultValue and a different tab structure.
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // Added for the new Unique ID Tool

  // Load current user to check admin access level
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
        // If not logged in or not admin, they shouldn't be here
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };
    loadUser();
  }, []);

  // Check if user has access to critical features
  const hasSuperlAdminAccess = user?.role === 'admin' && user?.admin_access_level === 'tier1';
  // isRegularAdmin is kept, although its direct use in tab switching is removed.
  // It's still useful for displaying user's access level.
  const isRegularAdmin = user?.role === 'admin' && user?.admin_access_level === 'tier2';

  const handleGeneratePublicIds = async () => {
    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('generateUserPublicIds');

      if (response.data.success) {
        alert(`✅ Success!\n\nGenerated public IDs for ${response.data.updatedCount} users.\nSkipped ${response.data.skippedCount} users who already had IDs.\n\nTotal users processed: ${response.data.totalUsers}`);
      } else {
        alert(`❌ Operation failed: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error generating public IDs:', error);
      alert(`❌ Error: ${error.message}`);
    }
    setIsLoading(false);
  };

  // Conditional early returns must come AFTER all hooks and derived states based on hooks.
  // This ensures React Hooks rules are followed.
  if (loading || userLoading) {
    return <EqoFlowLoader message="Loading Admin Hub..." />;
  }

  // If user is not an admin at all, redirect or show error
  if (!userLoading && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-slate-950">
        <Card className="dark-card p-8 text-center max-w-md">
          <div className="text-red-400 mb-4">
            <Shield className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You need admin privileges to access this page.</p>
        </Card>
      </div>);

  }

  // UPDATED: Categorized admin features into new tabs
  // Features are now organized to match the new tab structure and include a 'requiresSuperAdmin' flag.

  const overviewFeatures = [
  {
    title: "Platform Analytics",
    description: "View key metrics and analytics for the entire platform.",
    icon: BarChart2,
    href: createPageUrl("Analytics"),
    iconColorClass: "text-purple-400"
  }];


  const usersFeatures = [
  {
    title: "DAO Council Manager",
    description: "Add, remove, and manage members of the DAO Governing Council.",
    icon: Users,
    href: createPageUrl("DaoCouncilManager"),
    iconColorClass: "text-pink-400"
  },
  {
    title: "User Management",
    description: "Manage users, roles, and permissions",
    icon: Users,
    href: createPageUrl("UserManagement"),
    iconColorClass: "text-blue-400"
  },
  {
    title: "Profile Sync Tool",
    description: "Fix Discovery page name/avatar sync issues",
    icon: Link2,
    href: createPageUrl("ProfileSyncTool"),
    iconColorClass: "text-orange-400"
  },
  {
    title: "Username Management",
    description: "Assign usernames to users who have not set one.",
    icon: UserCheck,
    href: createPageUrl("AdminUsernames"),
    iconColorClass: "text-sky-400"
  },
  {
    title: "Badge Manager",
    description: "Assign or remove custom badges for users",
    icon: Award,
    href: createPageUrl("BadgeManager"),
    iconColorClass: "text-cyan-400"
  },
  {
    title: "Social Connections",
    description: "Review and manage social connection requests",
    icon: Link2,
    href: createPageUrl("SocialReviewDashboard"),
    iconColorClass: "text-indigo-400"
  },
  {
    title: "EqoChamber Memberships",
    description: "Track paid community memberships and creator payouts",
    icon: Users,
    href: createPageUrl("EqoChamberRevenue"),
    iconColorClass: "text-green-400"
  }];


  const contentFeatures = [
  {
    title: "Blog & Updates Manager",
    description: "Create, edit, and publish articles for the EqoFlow Updates page.",
    icon: Megaphone,
    href: createPageUrl("BlogManager"),
    iconColorClass: "text-teal-400"
  },
  {
    title: "Moderation Hub",
    description: "Review flagged content and user reports",
    icon: Shield,
    href: createPageUrl("ModerationHub"),
    iconColorClass: "text-red-400"
  }];


  const marketplaceFeatures = [
  {
    title: "AI Sponsors",
    description: "Review and approve sponsor applications for the AI Branding program.",
    icon: Bot,
    href: createPageUrl("AISponsorReview"),
    iconColorClass: "text-purple-400",
    requiresSuperAdmin: true
  },
  {
    title: "EqoCourses Revenue",
    description: "Review instructor earnings from course sales and manage payouts.",
    icon: BookOpen,
    href: createPageUrl("EqoCoursesRevenue"),
    iconColorClass: "text-blue-400",
    requiresSuperAdmin: true
  },
  {
    title: "User Payroll",
    description: "Manage and process payouts to creators and skill providers.",
    icon: CircleDollarSign,
    href: createPageUrl("UserPayroll"),
    iconColorClass: "text-green-400",
    requiresSuperAdmin: true
  },
  {
    title: "ITO Deposit Manager",
    description: "Monitor live wallet deposits, view transaction logs, and manage the ITO.",
    icon: ScanLine,
    href: createPageUrl("ITOManager"),
    iconColorClass: "text-blue-400",
    requiresSuperAdmin: true
  },
  {
    title: "ITO Live Transfers",
    description: "Add and manage crypto and bank transfers from the ITO wallet.",
    icon: DollarSign,
    href: createPageUrl("ITOLiveTransfers"),
    iconColorClass: "text-orange-400",
    requiresSuperAdmin: true
  },
  {
    title: "Gamify Tokens",
    description: "View platform wallet and $EQOFLO tokens collected from EP purchases",
    icon: HandCoins,
    href: createPageUrl("GamifyTokens"),
    iconColorClass: "text-emerald-400",
    requiresSuperAdmin: true
  },
  {
    title: "Marketplace Monitor",
    description: "Monitor all Skills Marketplace transactions, escrow holdings, and buyer-seller communications",
    icon: Briefcase,
    href: createPageUrl("MarketplaceMonitor"),
    iconColorClass: "text-purple-400",
    requiresSuperAdmin: true
  }];


  const systemFeatures = [
  {
    title: "Platform Operations Spending",
    description: "Add and manage operational expenses displayed on the DAO Treasury transparency page",
    icon: Briefcase,
    href: createPageUrl("PlatformOpsManager"),
    iconColorClass: "text-blue-400",
    requiresSuperAdmin: true
  },
  {
    title: "Fraud Monitor",
    description: "Review suspicious activity and platform abuse",
    icon: ShieldCheck,
    href: createPageUrl("FraudMonitor"),
    iconColorClass: "text-rose-400"
  },
  {
    title: "Welcome Bonus",
    description: "Configure token rewards for new users",
    icon: Gift,
    href: createPageUrl("WelcomeBonusManager"),
    iconColorClass: "text-yellow-400"
  },
  {
    title: "Subscription Manager",
    description: "Manage user subscription tiers and benefits",
    icon: Key,
    href: createPageUrl("SubscriptionManager"),
    iconColorClass: "text-purple-400"
  },
  {
    title: "Discovery Profiles",
    description: "Manage which users appear in Discovery tab",
    icon: Database,
    href: createPageUrl("DiscoveryProfileManager"),
    iconColorClass: "text-teal-400"
  },
  {
    title: "Eqo+ Subs",
    description: "Manage Eqo+ subscriptions",
    icon: Key,
    href: createPageUrl("QuantumPlus"),
    iconColorClass: "text-gray-400"
  }];


  // Helper function to render feature cards
  const renderFeatureCards = (features, hasSuperlAdminAccess) =>
  <div className="bg-slate-950 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature) => {
      const IconComponent = feature.icon;
      const canAccess = !feature.requiresSuperAdmin || hasSuperlAdminAccess;

      return (
        <div key={feature.title} className={!canAccess ? 'opacity-50' : ''}>
            <Link to={canAccess ? feature.href : '#'} onClick={(e) => !canAccess && e.preventDefault()} className="block h-full">
              <Card className={`dark-card hover-lift group h-full ${!canAccess ? 'border-red-500/30' : 'cursor-pointer'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <IconComponent className={`w-8 h-8 ${feature.iconColorClass} group-hover:scale-110 transition-transform`} />
                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <CardTitle className="text-white mt-4">{feature.title}</CardTitle>
                  <CardDescription className="flex-grow">{feature.description}</CardDescription>
                  {!canAccess &&
                <p className="text-red-400 text-xs mt-2">Super Admin (Tier 1) required</p>
                }
                </CardHeader>
              </Card>
            </Link>
          </div>);

    })}
    </div>;



  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8">

          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
            Admin Hub
          </h1>
          <p className="text-gray-400">
            Manage and monitor the EqoFlow platform
            {user && user.role === 'admin' &&
            <span className="ml-2 text-purple-400">
                • Access Level: {hasSuperlAdminAccess ? 'Super Admin (Tier 1)' : 'Admin (Tier 2)'}
              </span>
            }
          </p>
        </motion.div>

        {/* Action Alerts - (placeholder removed as no existing alerts section in original file) */}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-900/50 p-1 grid grid-cols-3 lg:grid-cols-6 gap-2 flex-wrap">
            <TabsTrigger value="overview" className="text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="content" className="text-white">
              <FileText className="w-4 h-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="text-white">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="paid-echo" className="text-white">
              <Coins className="w-4 h-4 mr-2" />
              Paid Echo
            </TabsTrigger>
            <TabsTrigger value="system" className="text-white">
              <Settings className="w-4 h-4 mr-2" />
              System
            </TabsTrigger>
            <TabsTrigger value="nillion-mpc" className="text-white">
              <Shield className="w-4 h-4 mr-2" />
              Nillion MPC
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {renderFeatureCards(overviewFeatures, hasSuperlAdminAccess)}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            {renderFeatureCards(usersFeatures, hasSuperlAdminAccess)}
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            {renderFeatureCards(contentFeatures, hasSuperlAdminAccess)}
          </TabsContent>

          {/* Marketplace Tab */}
           <TabsContent value="marketplace">
             <div className="space-y-6">
               <PaidEchoContentManager />
               {renderFeatureCards(marketplaceFeatures, hasSuperlAdminAccess)}
             </div>
           </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <div className="bg-slate-950 space-y-6">
              {renderFeatureCards(systemFeatures, hasSuperlAdminAccess)}

              {/* New Unique ID Tool */}
              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    Generate User Public IDs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-300 text-sm">
                      Generate unique, non-reversible public identifiers (UUIDs) for all existing users who don't have one yet.
                      This will update both User and PublicUserDirectory entities.
                    </p>
                    <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-lg p-3">
                      <p className="text-yellow-300 text-xs">
                        ⚠️ This operation will process all users in the database. Users who already have a public ID will be skipped.
                      </p>
                    </div>
                    <Button
                      onClick={handleGeneratePublicIds}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 w-full">

                      <Shield className="w-4 h-4 mr-2" />
                      {isLoading ? 'Generating...' : 'Generate Unique IDs for All Users'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* NEW: Nillion MPC Tab */}
          <TabsContent value="nillion-mpc">
            <NillionMPCDeployment />
          </TabsContent>
        </Tabs>
      </div>
    </div>);

}