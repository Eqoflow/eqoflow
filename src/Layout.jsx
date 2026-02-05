import React, { useState, useEffect, useMemo, useCallback, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { UserProfileData } from "@/entities/UserProfileData";
import { awardWelcomeBonus } from "@/functions/awardWelcomeBonus";
import { UserContext, UserCacheHelpers } from './components/contexts/UserContext';
import { NotificationProvider } from "./components/contexts/NotificationContext";
import { getAdminActionCounts } from "@/functions/getAdminActionCounts";
import { processReferral } from "@/functions/processReferral";
import { AnimatePresence, motion } from "framer-motion";
import SolanaWalletProvider from './components/blockchain/SolanaWalletProvider';

// Simple className utility function to replace clsx/twMerge
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Define useUser hook
const useUser = () => useContext(UserContext);

import {
  User as UserIcon,
  Menu,
  LogOut,
  RefreshCw,
  Rss,
  Search,
  Shield,
  Gavel,
  Users,
  Sparkles,
  BrainCircuit,
  Coins,
  Hammer,
  FlaskConical,
  GraduationCap,
  Scale,
  Gamepad2,
  Eye,
  EyeOff,
  Megaphone,
  Plus,
  Bot } from

"lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  SidebarProvider } from

"@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FeedbackWidget from "./components/feedback/FeedbackWidget";
import NotificationBell from "./components/layout/NotificationBell";
import MessageButton from "./components/layout/MessageButton";
import WalletButton from "./components/layout/WalletButton";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent } from

"@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator } from

"@/components/ui/dropdown-menu";
import HeaderIconDrawer from "./components/layout/HeaderIconDrawer";

// Helper function to convert hex color to rgba string
const hexToRgba = (hex, alpha) => {
  if (!hex || hex.length < 4) return `rgba(0,0,0,${alpha})`;
  let r = 0,g = 0,b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Global color schemes
const colorSchemes = {
  purple: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#2d1b69' },
  blue: { primary: '#3b82f6', secondary: '#06b6d4', accent: '#1e3a8a' },
  green: { primary: '#10b981', secondary: '#059669', accent: '#064e3b' },
  orange: { primary: '#f97316', secondary: '#eab308', accent: '#92400e' },
  red: { primary: '#ef4444', secondary: '#ec4899', accent: '#991b1b' },
  pink: { primary: '#ec4899', secondary: '#f472b6', accent: '#be185d' },
  cyan: { primary: '#06b6d4', secondary: '#3b82f6', accent: '#0e7490' },
  yellow: { primary: '#eab308', secondary: '#f97316', accent: '#a16207' },
  indigo: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#4338ca' },
  emerald: { primary: '#10b981', secondary: '#059646', accent: '#065f46' }
};

const getColorScheme = (schemeName) => {
  return colorSchemes[schemeName] || colorSchemes.purple;
};

const isPngImage = (url) => {
  if (!url) return false;
  return url.toLowerCase().includes('.png') || url.toLowerCase().includes('image/png');
};

const getAvatarBackgroundStyle = (avatarUrl) => {
  if (isPngImage(avatarUrl)) {
    return { background: 'linear-gradient(to right, #000000, #1a1a1a)' };
  }
  return { background: 'linear-gradient(to right, #8b5cf6, #ec4899)' };
};

// Custom Sidebar Navigation Item Component
const CustomSidebarNavItem = ({ item, isActive, userColorScheme, adminActionCount }) => {
  const { user } = useUser();
  const Icon = item.icon;
  const to = item.href;
  const label = item.name;

  if (item.adminOnly && user?.role !== 'admin') {
    return null;
  }

  const isExpanded = true;
  const showAdminDot = item.name === "Admin Hub" && adminActionCount > 0;

  const isComingSoonForUser = item.comingSoon && user?.role !== 'admin';

  if (isComingSoonForUser) {
    return (
      <div className="my-0.5 relative">
        <div
          className={cn(
            "group/item flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 justify-start relative overflow-hidden cursor-not-allowed opacity-50"
          )}
          style={{ color: `${userColorScheme.primary}80` }}>

          <div className="flex items-center w-full">
            <div className={cn("flex-shrink-0", isExpanded && "mr-3")}>
              <Icon className={`w-4 h-4 flex-shrink-0 transition-colors duration-200`} />
            </div>
            <AnimatePresence>
              {isExpanded &&
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0">

                  <div>
                    <p className="font-medium text-sm">
                      {label}
                    </p>
                    <p className="text-[10px] text-yellow-500/60 lowercase leading-none flex items-center gap-1">
                      <Hammer className="w-2.5 h-2.5 animate-hammer" style={{ color: '#eab308' }} />
                      <span>coming soon</span>
                    </p>
                  </div>
                </motion.span>
              }
            </AnimatePresence>
          </div>
        </div>
      </div>);

  }

  return (
    <div className="my-0.5 relative">
      <Link
        to={to}
        className={cn(
          "group/item flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 justify-start relative overflow-hidden",
          isActive && "shadow-md"
        )}
        style={{
          backgroundColor: isActive ? `${userColorScheme.primary}20` : 'transparent',
          color: isActive ? userColorScheme.primary : '#ffffff'
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}>

        <div className="flex items-center w-full">
          <div className={cn("flex-shrink-0", isExpanded && "mr-3")}>
            <Icon
              className={`w-4 h-4 flex-shrink-0 transition-colors duration-200`}
              style={{
                color: 'inherit'
              }} />

          </div>
          <AnimatePresence>
            {isExpanded &&
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-w-0">

                {(() => {
                if (item.comingSoon) {
                  return (
                    <div>
                        <p
                        className="font-medium text-sm transition-colors duration-200 group-hover/item:opacity-80">

                          {label}
                        </p>
                        <p className="text-[10px] text-yellow-400/70 lowercase leading-none flex items-center gap-1">
                          <Hammer className="w-2.5 h-2.5 animate-hammer" style={{ color: '#facc15' }} />
                          <span>coming soon</span>
                        </p>
                      </div>);

                }
                return (
                  <span
                    className="font-medium text-sm transition-colors duration-200 group-hover/item:opacity-80">

                      {label}
                    </span>);

              })()}
              </motion.span>
            }
          </AnimatePresence>
          {showAdminDot &&
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          }
        </div>

        {/* Subtle accent on active */}
        {isActive &&
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r"
          style={{ backgroundColor: userColorScheme.primary }} />

        }
      </Link>
    </div>);

};

const SidebarNavigationContent = ({ user, location, userColorScheme, adminActionCount, handleLogout, isEmailVisible, handleToggleEmailVisibility }) => {
  const mainNavLinks = [
  { name: "Feed", href: createPageUrl("Feed"), icon: Rss, adminOnly: false, comingSoon: false },
  { name: "Discovery", href: createPageUrl("Discovery"), icon: Search, adminOnly: false, comingSoon: false },
  { name: "EqoChambers", href: createPageUrl("Communities"), icon: Users, adminOnly: false, comingSoon: false },
  { name: "EqoAssist", href: createPageUrl("KnowledgeHub"), icon: GraduationCap, adminOnly: false, comingSoon: false },
  { name: "Initial Token Offering", href: createPageUrl("ITOLandingPage"), icon: Coins, adminOnly: false, comingSoon: false }];


  const moreNavLinks = [
  { name: "EqoUpdates", href: createPageUrl("Updates"), icon: Megaphone, adminOnly: false, comingSoon: false },
  { name: "EqoQuest", href: createPageUrl("EqoQuest"), icon: Gamepad2, adminOnly: false, comingSoon: false },
  { name: "Flow AI", href: createPageUrl("QuantumChat"), icon: BrainCircuit, adminOnly: false, comingSoon: false },
  { name: "AI Branding", href: createPageUrl("AIBranding"), icon: Sparkles, adminOnly: false, comingSoon: false },
  { name: "DAO", href: createPageUrl("DAO"), icon: Gavel, adminOnly: false, comingSoon: false },
  { name: "Transparency", href: createPageUrl("TransparencyHub"), icon: Scale, adminOnly: false, comingSoon: false }];


  const adminLinks = [
  { name: "Admin Hub", href: createPageUrl("AdminHub"), icon: Shield, adminOnly: true, comingSoon: false, isRed: true },
  { name: "AI Branding Dashboard", href: createPageUrl("AIBrandingDashboard"), icon: Bot, adminOnly: true, isTesting: true, comingSoon: false },
  { name: "Nillion Test", href: createPageUrl("NillionTest"), icon: FlaskConical, adminOnly: true, comingSoon: false, isRed: true }];


  return (
    <>
      <SidebarHeader className="bg-[#000000] p-4 flex flex-col gap-2 border-b border-white/5 md:p-6">
        <div className="flex items-center justify-center">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/d31ff4d3d_1000044465.png"
            alt="EqoFlow Logo"
            className="h-16 object-contain" />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#000000] p-3 flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden md:p-4"
      style={{
        background: '#000000'
      }}>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainNavLinks.map((item) =>
              <CustomSidebarNavItem
                key={item.name}
                item={item}
                isActive={location.pathname.startsWith(item.href)}
                userColorScheme={userColorScheme}
                adminActionCount={adminActionCount} />

              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="my-0.5 group/menu-item relative cursor-pointer">
                    <div
                      className={cn(
                        "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 justify-start relative overflow-hidden",
                        "hover:bg-white/[0.02]"
                      )}
                      style={{
                        color: `${userColorScheme.primary}B3`
                      }}>

                      <div className="flex items-center w-full">
                        <div className={cn("flex-shrink-0 mr-3")}>
                          <Plus className="w-4 h-4 flex-shrink-0 transition-colors duration-200" />
                        </div>
                        <span className="font-medium text-sm transition-colors duration-200 group-hover/menu-item:opacity-80">
                          More...
                        </span>
                      </div>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-[#000000] border-white/10"
                  side="bottom"
                  align="start">

                  {moreNavLinks.map((item) =>
                  <Link to={item.href} key={item.name}>
                      <DropdownMenuItem
                      className="cursor-pointer focus:bg-white/5 transition-colors"
                      style={{ color: `${userColorScheme.primary}B3` }}
                      onMouseEnter={(e) => e.currentTarget.style.color = userColorScheme.primary}
                      onMouseLeave={(e) => e.currentTarget.style.color = `${userColorScheme.primary}B3`}>

                        <item.icon className="w-4 h-4 mr-2" />
                        <div className="flex items-center gap-1">
                          <span>{item.name}</span>
                          {item.comingSoon &&
                        <Badge variant="outline" className="ml-1 px-1 py-0 text-yellow-400 border-yellow-400/50">SOON</Badge>
                        }
                        </div>
                      </DropdownMenuItem>
                     </Link>
                  )}
                  {user?.role === 'admin' &&
                  <>
                      <DropdownMenuSeparator className="bg-white/10" />
                      {adminLinks.map((item) =>
                    <Link to={item.href} key={item.name}>
                          <DropdownMenuItem
                        className={cn(
                          "cursor-pointer focus:bg-white/5",
                          item.isRed ? 'text-red-400' : ''
                        )}
                        style={!item.isRed ? { color: `${userColorScheme.primary}B3` } : {}}
                        onMouseEnter={(e) => {
                          if (!item.isRed) e.currentTarget.style.color = userColorScheme.primary;
                        }}
                        onMouseLeave={(e) => {
                          if (!item.isRed) e.currentTarget.style.color = `${userColorScheme.primary}B3`;
                        }}>

                            <item.icon className="w-4 h-4 mr-2" />
                            <div className="flex items-center gap-1">
                              <span className={item.isTesting || item.isRed ? 'text-red-400' : ''}>{item.name}</span>
                              {item.isTesting &&
                          <Badge variant="outline" className="ml-1 px-1 py-0 text-red-400 border-red-400/50">TESTING</Badge>
                          }
                              {item.comingSoon &&
                          <Badge variant="outline" className={cn("ml-1 px-1 py-0", item.isRed ? 'text-red-400 border-red-400/50' : 'text-yellow-400 border-yellow-400/50')}>SOON</Badge>
                          }
                            </div>
                             {item.name === "Admin Hub" && adminActionCount > 0 &&
                        <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        }
                          </DropdownMenuItem>
                        </Link>
                    )}
                    </>
                  }
                </DropdownMenuContent>
              </DropdownMenu>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="p-4 border-t border-white/5 bg-[#000000]">
        <div className="flex items-center gap-3 mb-2">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/71caaf98a_Screenshot-2025-08-28-111328.png"
            alt="Nillion"
            className="h-6 w-auto" />

        </div>
        <p className="text-xs leading-relaxed" style={{ color: `${userColorScheme.primary}80` }}>
          Privacy at the core. Powered by Nillion.
        </p>
      </div>

      <SidebarFooter className="border-t border-white/5 p-2 md:p-4 bg-[#000000]">
        {user && (user.subscription_tier === 'free' || !user.subscription_tier) &&
        <Link to={createPageUrl("EqoPlus")} className="w-full mb-4">
            <div
            className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 group"
            style={{
              backgroundColor: `${userColorScheme.primary}10`,
              borderColor: `${userColorScheme.primary}33`
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = `${userColorScheme.primary}4D`}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = `${userColorScheme.primary}33`}>

              <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(to right, ${userColorScheme.primary}, ${userColorScheme.secondary})`
              }}>

                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">Upgrade to Eqo+</p>
                <p className="text-xs" style={{ color: userColorScheme.primary }}>Unlock creator tools & more</p>
              </div>
            </div>
          </Link>
        }

        {user &&
        <>
            <Link to={createPageUrl("Profile")} className="w-full block mb-3">
              <div className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors duration-200">
                <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={getAvatarBackgroundStyle(user?.avatar_url)}>

                  {user?.avatar_url ?
                <img src={user.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" /> :
                <UserIcon className="w-5 h-5 text-white" />
                }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-white truncate text-sm">{user?.full_name || 'Anonymous'}</p>
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-500 hover:text-white flex-shrink-0"
                    onClick={handleToggleEmailVisibility}
                    aria-label={isEmailVisible ? 'Hide email address' : 'Show email address'}>

                      {isEmailVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 truncate" title={isEmailVisible ? user?.email : 'Email address hidden'}>
                    {isEmailVisible ? user?.email || 'Not logged in' : '******************'}
                  </p>
                </div>
              </div>
            </Link>

            <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full bg-transparent border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors text-sm h-9">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </>
        }

        {!user &&
        <div className="text-center p-3">
            <p className="text-gray-500 text-sm mb-3">Please log in to access EqoFlow</p>
            <Button
            onClick={() => window.location.href = '/'}
            className="w-full"
            style={{
              background: `linear-gradient(to right, ${userColorScheme.primary}, ${userColorScheme.secondary})`
            }}>

              Login
            </Button>
          </div>
        }
      </SidebarFooter>
    </>);

};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminActionCount, setAdminActionCount] = useState(0);
  const [isEmailVisible, setIsEmailVisible] = useState(true);

  // Define public pages that never require login
  const publicPages = useMemo(() => [
  'Landing',
  'Updates',
  'ArticleDetail',
  'SkillsMarket',
  'KnowledgeHub',
  'SharedEcho'],
  []);

  const isPublicPage = useMemo(() => {
    return publicPages.includes(currentPageName);
  }, [currentPageName, publicPages]);

  // Capture referral code from URL on initial load
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      if (refCode) {
        localStorage.setItem('quantumFlowReferralCode', refCode);
      }
    } catch (e) {
      console.error("Error accessing localStorage or URL params:", e);
    }
  }, []);

  // Fetch admin counts
  const fetchAdminCounts = useCallback(async () => {
    try {
      const { data } = await getAdminActionCounts();
      if (data) {
        const total = Object.values(data).reduce((sum, count) => sum + count, 0);
        setAdminActionCount(total);
      }
    } catch (error) {
      console.warn("Could not fetch admin action counts:", error);
      setAdminActionCount(0);
    }
  }, []);

  // Load user data logic
  const loadUserData = useCallback(async () => {
    try {
      const baseUser = await User.me();

      if (baseUser) {
        const profileDataRecords = await UserProfileData.filter({ user_email: baseUser.email });
        let mergedUser = baseUser;
        if (profileDataRecords.length > 0) {
          mergedUser = { ...baseUser, ...profileDataRecords[0] };
        }

        setUser(mergedUser);
        UserCacheHelpers.cacheUser(baseUser);
        if (profileDataRecords.length > 0) {
          UserCacheHelpers.cacheUserProfile(profileDataRecords[0]);
        }

        if (baseUser.role === 'admin') {
          fetchAdminCounts();
        }

        // Handle referral code processing
        const referralCode = localStorage.getItem('quantumFlowReferralCode');
        if (referralCode && !mergedUser.referral_processed) {
          try {
            await processReferral(referralCode);
            localStorage.removeItem('quantumFlowReferralCode');
            const updatedUser = await User.me();
            const updatedProfile = await UserProfileData.filter({ user_email: updatedUser.email });
            if (updatedProfile.length > 0) {
              setUser({ ...updatedUser, ...updatedProfile[0] });
              UserCacheHelpers.cacheUserProfile(updatedProfile[0]);
            } else {
              setUser(updatedUser);
            }
            UserCacheHelpers.cacheUser(updatedUser);
          } catch (err) {
            console.error("Failed to process referral:", err);
          }
        }

        // Handle welcome bonus
        if (!mergedUser.welcome_bonus_received) {
          try {
            await awardWelcomeBonus();
            const updatedUser = await User.me();
            const updatedProfile = await UserProfileData.filter({ user_email: updatedUser.email });
            if (updatedProfile.length > 0) {
              setUser({ ...updatedUser, ...updatedProfile[0] });
              UserCacheHelpers.cacheUserProfile(updatedProfile[0]);
            } else {
              setUser(updatedUser);
            }
            UserCacheHelpers.cacheUser(updatedUser);
          } catch (error) {
            console.error("Error awarding welcome bonus", error);
          }
        }
        return mergedUser;
      } else {
        setUser(null);
        UserCacheHelpers.invalidateUserCache();
        return null;
      }
    } catch (error) {
      console.error("loadUserData error:", error);
      setUser(null);
      UserCacheHelpers.invalidateUserCache();
      return null;
    }
  }, [fetchAdminCounts]);

  // Main effect to load user data and manage loading/redirects
  useEffect(() => {
    const initializeUserAndPage = async () => {
      setIsLoading(true);

      const userLoaded = await loadUserData();

      // Redirect to landing if user is not logged in AND page is not public
      if (!userLoaded && !isPublicPage) {
        window.location.href = '/';
        return;
      }

      setIsLoading(false);
    };

    initializeUserAndPage();
  }, [loadUserData, isPublicPage]);

  const handleLogout = async () => {
    try {
      UserCacheHelpers.invalidateUserCache();
      await User.logout();
      window.location.replace('https://eqoflow.app');
    } catch (error) {
      console.error('Logging out error:', error);
      window.location.replace('https://eqoflow.app');
    }
  };

  const handleUserUpdate = useCallback(async () => {
    try {
      const updatedUser = await User.me();
      const updatedProfileData = await UserProfileData.filter({ user_email: updatedUser.email });
      let finalUpdatedUser = updatedUser;
      if (updatedProfileData.length > 0) {
        finalUpdatedUser = { ...updatedUser, ...updatedProfileData[0] };
        UserCacheHelpers.cacheUserProfile(updatedProfileData[0]);
      } else {
        UserCacheHelpers.invalidateUserProfileCache();
      }

      UserCacheHelpers.cacheUser(updatedUser);
      setUser(finalUpdatedUser);
    } catch (error) {
      console.error('Updating user data error:', error);
      UserCacheHelpers.invalidateUserCache();
    }
  }, [setUser]);

  const handleToggleEmailVisibility = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    const newVisibility = !isEmailVisible;
    setIsEmailVisible(newVisibility);

    try {
      const updatedPrivacySettings = {
        ...(user.privacy_settings || {}),
        show_email_in_sidebar: newVisibility
      };

      await User.updateMyUserData({
        privacy_settings: updatedPrivacySettings
      });

      setUser((prevUser) => ({
        ...prevUser,
        privacy_settings: updatedPrivacySettings
      }));
    } catch (error) {
      console.error("Failed to update email visibility:", error);
      setIsEmailVisible(!newVisibility);
    }
  };

  useEffect(() => {
    if (user?.privacy_settings) {
      setIsEmailVisible(user.privacy_settings.show_email_in_sidebar !== false);
    } else {
      setIsEmailVisible(true);
    }
  }, [user]);

  const userColorScheme = getColorScheme(user?.color_scheme);

  const userContextValue = useMemo(() => ({
    user,
    refreshUser: loadUserData,
    isLoading,
    invalidateUserCache: UserCacheHelpers.invalidateUserCache,
    getCachedUser: UserCacheHelpers.getMergedCachedUser
  }), [user, loadUserData, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/942c1cf5d_EqoFlowLogoDesign-14.png"
            alt="EqoFlow"
            className="w-24 h-24 object-contain" />

        </div>
      </div>);

  }

  if (!user && !isPublicPage) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/942c1cf5d_EqoFlowLogoDesign-14.png"
            alt="EqoFlow"
            className="w-24 h-24 object-contain" />

        </div>
      </div>);

  }

  if (isPublicPage && !user) {
    return (
      <UserContext.Provider value={userContextValue}>
        <NotificationProvider>
          <TooltipProvider>
            <style>
              {`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

                :root {
                  --gradient-cosmic: linear-gradient(135deg, #1a0b2e 0%, ${userColorScheme.accent} 50%, #000000 100%);
                  --gradient-dark: linear-gradient(135deg, #000000 0%, #1a0b2e 50%, ${userColorScheme.accent} 100%);
                  --gradient-primary: linear-gradient(135deg, ${userColorScheme.accent} 0%, ${userColorScheme.primary} 100%);
                  --glass-bg: rgba(${parseInt(userColorScheme.primary.slice(1, 3), 16)}, ${parseInt(userColorScheme.primary.slice(3, 5), 16)}, ${parseInt(userColorScheme.primary.slice(5, 7), 16)}, 0.1);
                  --glass-border: rgba(${parseInt(userColorScheme.primary.slice(1, 3), 16)}, ${parseInt(userColorScheme.primary.slice(3, 5), 16)}, ${parseInt(userColorScheme.primary.slice(5, 7), 16)}, 0.2);
                  --neon-primary: ${userColorScheme.primary};
                  --neon-secondary: ${userColorScheme.secondary};
                  --cosmic-black: #000000;
                  --deep-primary: ${userColorScheme.accent};
                  --medium-primary: ${userColorScheme.primary};
                  --active-nav-item-border: rgba(${parseInt(userColorScheme.primary.slice(1, 3), 16)}, ${parseInt(userColorScheme.primary.slice(3, 5), 16)}, ${parseInt(userColorScheme.primary.slice(5, 7), 16)}, 0.25);
                }

                html, body {
                  background: #000000 !important;
                  background-color: #000000 !important;
                }

                body {
                  background-image:
                    radial-gradient(circle at 20% 80%, rgba(${parseInt(userColorScheme.primary.slice(1, 3), 16)}, ${parseInt(userColorScheme.primary.slice(3, 5), 16)}, ${parseInt(userColorScheme.primary.slice(5, 7), 16)}, 0.15) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(${parseInt(userColorScheme.accent.slice(1, 3), 16)}, ${parseInt(userColorScheme.accent.slice(3, 5), 16)}, ${parseInt(userColorScheme.accent.slice(5, 7), 16)}, 0.2) 0%, transparent 50%),
                    radial-gradient(circle at 40% 40%, rgba(26, 11, 46, 0.3) 0%, transparent 50%) !important;
                  min-height: 100vh;
                }

                #root {
                  background: #000000 !important;
                  min-height: 100vh;
                }

                *, *::before, *::after {
                  transition: background-color 0s !important;
                }

                .sidebar-dark {
                  background: #000000 !important;
                  border-color: rgba(255, 255, 255, 0.05) !important;
                }

                .sidebar-dark button {
                  color: white !important;
                }

                .sidebar-dark .text-gray-200,
                .sidebar-dark .text-gray-300,
                .sidebar-dark .text-gray-400 {
                  color: rgba(156, 163, 175, 0.8) !important;
                }

                [data-sidebar] {
                  background: #000000 !important;
                  border-color: rgba(255, 255, 255, 0.05) !important;
                }

                .dark-card [role="tablist"] button {
                  color: white !important;
                }

                .dark-card [role="tablist"] button[data-state="active"] {
                  color: white !important;
                }

                .dark-card [role="tablist"] button[data-state="inactive"] {
                  color: white !important;
                }

                .dark-card [role="tablist"] button[data-state="inactive"]:hover {
                  color: white !important;
                }

                .header-icon-btn {
                  position: relative;
                  color: rgb(156, 163, 175) !important;
                  background-color: transparent !important;
                  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                  border-radius: 0.5rem !important;
                }

                .header-icon-btn:hover {
                  color: white !important;
                  background-color: rgba(55, 65, 81, 0.5) !important;
                  transform: translateY(-1px) !important;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                }

                .header-icon-btn:active {
                  transform: translateY(0) !important;
                }

                .header-icon-btn.wallet-connected:hover {
                  background-color: rgba(16, 185, 129, 0.1) !important;
                  color: rgb(52, 211, 153) !important;
                }

                .header-icon-btn.wallet-disconnected:hover {
                  background-color: rgba(147, 51, 234, 0.1) !important;
                  color: rgb(168, 85, 247) !important;
                }

                ::-webkit-scrollbar {
                  width: 8px;
                  height: 8px;
                }

                ::-webkit-scrollbar-track {
                  background: rgba(0,0,0,0.3);
                  border-radius: 10px;
                }

                ::-webkit-scrollbar-thumb {
                  background: var(--neon-primary);
                  border-radius: 10px;
                  border: 1px solid var(--glass-border);
                }

                ::-webkit-scrollbar-thumb:hover {
                  background: var(--neon-secondary);
                }

                .super-charged-card {
                  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.15) 50%, rgba(217, 119, 6, 0.1) 100%);
                  border: 2px solid rgba(251, 191, 36, 0.3);
                  box-shadow: 0 0 20px rgba(251, 191, 36, 0.2), 0 0 40px rgba(251, 191, 36, 0.1);
                  position: relative;
                }

                .super-charged-card:hover {
                  box-shadow: 0 0 30px rgba(251, 191, 36, 0.4), 0 0 60px rgba(251, 191, 36, 0.2);
                  border-color: rgba(251, 191, 36, 0.5);
                }

                .super-charged-card::before {
                  content: '';
                  position: absolute;
                  inset: -2px;
                  border-radius: inherit;
                  padding: 2px;
                  background: linear-gradient(45deg, #fbbf24, #f59e0b, #d97706, #fbbf24);
                  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                  -webkit-mask-composite: xor;
                  mask-composite: exclude;
                  opacity: 0.3;
                  animation: superGlow 3s linear infinite;
                }

                @keyframes superGlow {
                  0%, 100% { opacity: 0.3; }
                  50% { opacity: 0.6; }
                }
              `}
            </style>
            <div className="min-h-screen bg-black text-white">
              {children}
            </div>
          </TooltipProvider>
        </NotificationProvider>
      </UserContext.Provider>);

  }

  return (
    <UserContext.Provider value={userContextValue}>
      <NotificationProvider>
        <SolanaWalletProvider>
          <TooltipProvider>
            <style>
              {`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

                :root {
                  --gradient-cosmic: linear-gradient(135deg, #1a0b2e 0%, ${userColorScheme.accent} 50%, #000000 100%);
                  --gradient-dark: linear-gradient(135deg, #000000 0%, #1a0b2e 50%, ${userColorScheme.accent} 100%);
                  --gradient-primary: linear-gradient(135deg, ${userColorScheme.accent} 0%, ${userColorScheme.primary} 100%);
                  --glass-bg: rgba(${parseInt(userColorScheme.primary.slice(1, 3), 16)}, ${parseInt(userColorScheme.primary.slice(3, 5), 16)}, ${parseInt(userColorScheme.primary.slice(5, 7), 16)}, 0.1);
                  --glass-border: rgba(${parseInt(userColorScheme.primary.slice(1, 3), 16)}, ${parseInt(userColorScheme.primary.slice(3, 5), 16)}, ${parseInt(userColorScheme.primary.slice(5, 7), 16)}, 0.2);
                  --neon-primary: ${userColorScheme.primary};
                  --neon-secondary: ${userColorScheme.secondary};
                  --cosmic-black: #000000;
                  --deep-primary: ${userColorScheme.accent};
                  --medium-primary: ${userColorScheme.primary};
                  --active-nav-item-border: rgba(${parseInt(userColorScheme.primary.slice(1, 3), 16)}, ${parseInt(userColorScheme.primary.slice(3, 5), 16)}, ${parseInt(userColorScheme.primary.slice(5, 7), 16)}, 0.25);
                }

                @keyframes tap-animation {
                  0% { transform: rotate(0deg); }
                  20% { transform: rotate(15deg); }
                  40% { transform: rotate(-10deg); }
                  60% { transform: rotate(5deg); }
                  80% { transform: rotate(-2deg); }
                  100% { transform: rotate(0deg); }
                }

                .animate-hammer {
                    animation: tap-animation 2s ease-in-out infinite;
                    transform-origin: bottom right;
                }

                html, body {
                  background: #000000 !important;
                  background-color: #000000 !important;
                }

                body {
                  background-image:
                    radial-gradient(circle at 20% 80%, rgba(${parseInt(userColorScheme.primary.slice(1, 3), 16)}, ${parseInt(userColorScheme.primary.slice(3, 5), 16)}, ${parseInt(userColorScheme.primary.slice(5, 7), 16)}, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(${parseInt(userColorScheme.accent.slice(1, 3), 16)}, ${parseInt(userColorScheme.accent.slice(3, 5), 16)}, ${parseInt(userColorScheme.accent.slice(5, 7), 16)}, 0.2) 0%, transparent 50%),
                      radial-gradient(circle at 40% 40%, rgba(26, 11, 46, 0.3) 0%, transparent 50%) !important;
                  min-height: 100vh;
                }

                #root {
                  background: #000000 !important;
                  min-height: 100vh;
                }

                *, *::before, *::after {
                  transition: background-color 0s !important;
                }

                .glass-morphism {
                  background: rgba(0, 0, 0, 0.4);
                  backdrop-filter: blur(20px);
                  border: 1px solid var(--glass-border);
                }

                .neon-glow {
                  box-shadow: 0 0 30px rgba(${parseInt(userColorScheme.primary.slice(1, 3), 16)}, ${parseInt(userColorScheme.primary.slice(3, 5), 16)}, ${parseInt(userColorScheme.primary.slice(5, 7), 16)}, 0.3), 0 0 60px rgba(${parseInt(userColorScheme.primary.slice(1, 3), 16)}, ${parseInt(userColorScheme.primary.slice(3, 5), 16)}, ${parseInt(userColorScheme.primary.slice(5, 7), 16)}, 0.1);
                }

                .shadow-inner-purple {
                  box-shadow: inset 0 0 10px rgba(${parseInt(userColorScheme.primary.slice(1, 3), 16)}, ${parseInt(userColorScheme.primary.slice(3, 5), 16)}, ${parseInt(userColorScheme.primary.slice(5, 7), 16)}, 0.4);
                }

                .hover-lift {
                  transition: all 0.3s ease;
                }

                .hover-lift:hover {
                  transform: translateY(-4px);
                  box-shadow: 0 10px 40px rgba(${parseInt(userColorScheme.primary.slice(1, 3), 16)}, ${parseInt(userColorScheme.primary.slice(3, 5), 16)}, ${parseInt(userColorScheme.primary.slice(5, 7), 16)}, 0.2);
                }

                .dark-card {
                  background: rgba(15, 23, 42, 0.3) !important;
                  backdrop-filter: blur(10px) saturate(150%);
                  border: 1px solid var(--glass-border) !important;
                }

                .btn-primary, .bg-gradient-to-r.from-purple-600, .bg-gradient-to-r.from-purple-500,
                button[class*="bg-gradient-to-r"][class*="from-purple"],
                button[class*="bg-purple"], .bg-purple-600, .bg-purple-500 {
                  background: linear-gradient(to right, var(--neon-primary), var(--neon-secondary)) !important;
                }

                button[class*="hover:bg-purple"], .hover\\:bg-purple-700:hover, .hover\\:bg-purple-600:hover {
                  background: linear-gradient(to right, var(--deep-primary), var(--medium-primary)) !important;
                }

                [data-state="active"] {
                  background: linear-gradient(to right, ${userColorScheme.primary}, ${userColorScheme.secondary}) !important;
                }

                .border-purple-500, .border-purple-600, [class*="border-purple"] {
                  border-color: ${userColorScheme.primary} !important;
                }

                .text-purple-400, .text-purple-300, .text-purple-500, [class*="text-purple"] {
                  color: ${userColorScheme.primary} !important;
                }

                .bg-purple-600\\/20, .bg-purple-500\\/20, [class*="bg-purple"][class*="/"] {
                  background-color: ${userColorScheme.primary}33 !important;
                }

                .sidebar-dark {
                  background: #000000 !important;
                  border-color: rgba(255, 255, 255, 0.05) !important;
                }

                .sidebar-dark button {
                  color: white !important;
                }

                .sidebar-dark .text-gray-200,
                .sidebar-dark .text-gray-300,
                .sidebar-dark .text-gray-400 {
                  color: rgba(156, 163, 175, 0.8) !important;
                }

                [data-sidebar] {
                  background: #000000 !important;
                  border-color: rgba(255, 255, 255, 0.05) !important;
                }

                .dark-card [role="tablist"] button {
                  color: white !important;
                }

                .dark-card [role="tablist"] button[data-state="active"] {
                  color: white !important;
                }

                .dark-card [role="tablist"] button[data-state="inactive"] {
                  color: white !important;
                }

                .dark-card [role="tablist"] button[data-state="inactive"]:hover {
                  color: white !important;
                }

                .header-icon-btn {
                  position: relative;
                  color: rgb(156, 163, 175) !important;
                  background-color: transparent !important;
                  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                  border-radius: 0.5rem !important;
                }

                .header-icon-btn:hover {
                  color: white !important;
                  background-color: rgba(55, 65, 81, 0.5) !important;
                  transform: translateY(-1px) !important;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                }

                .header-icon-btn:active {
                  transform: translateY(0) !important;
                }

                .header-icon-btn.wallet-connected:hover {
                  background-color: rgba(16, 185, 129, 0.1) !important;
                  color: rgb(52, 211, 153) !important;
                }

                .header-icon-btn.wallet-disconnected:hover {
                  background-color: rgba(147, 51, 234, 0.1) !important;
                  color: rgb(168, 85, 247) !important;
                }

                ::-webkit-scrollbar {
                  width: 8px;
                  height: 8px;
                }

                ::-webkit-scrollbar-track {
                  background: rgba(0,0,0,0.3);
                  border-radius: 10px;
                }

                ::-webkit-scrollbar-thumb {
                  background: var(--neon-primary);
                  border-radius: 10px;
                  border: 1px solid var(--glass-border);
                }

                ::-webkit-scrollbar-thumb:hover {
                  background: var(--neon-secondary);
                }

                .super-charged-card {
                  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.15) 50%, rgba(217, 119, 6, 0.1) 100%);
                  border: 2px solid rgba(251, 191, 36, 0.3);
                  box-shadow: 0 0 20px rgba(251, 191, 36, 0.2), 0 0 40px rgba(251, 191, 36, 0.1);
                  position: relative;
                }

                .super-charged-card:hover {
                  box-shadow: 0 0 30px rgba(251, 191, 36, 0.4), 0 0 60px rgba(251, 191, 36, 0.2);
                  border-color: rgba(251, 191, 36, 0.5);
                }

                .super-charged-card::before {
                  content: '';
                  position: absolute;
                  inset: -2px;
                  border-radius: inherit;
                  padding: 2px;
                  background: linear-gradient(45deg, #fbbf24, #f59e0b, #d97706, #fbbf24);
                  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                  -webkit-mask-composite: xor;
                  mask-composite: exclude;
                  opacity: 0.3;
                  animation: superGlow 3s linear infinite;
                }

                @keyframes superGlow {
                  0%, 100% { opacity: 0.3; }
                  50% { opacity: 0.6; }
                }
              `}
            </style>

            <SidebarProvider>
              <div className="min-h-screen w-full text-white bg-black md:flex">
                <Sidebar className="sidebar-dark border-r border-[var(--glass-border)]">
                  <SidebarNavigationContent
                    user={user}
                    location={location}
                    userColorScheme={userColorScheme}
                    adminActionCount={adminActionCount}
                    handleLogout={handleLogout}
                    isEmailVisible={isEmailVisible}
                    handleToggleEmailVisibility={handleToggleEmailVisibility} />

                </Sidebar>

                <div className="flex-1 flex flex-col bg-black">
                  <main className="flex-1 flex flex-col relative overflow-y-auto">
                    <header className="bg-[#000000] px-4 py-3 sticky top-0 z-40 border-b border-[var(--glass-border)] md:hidden">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <SidebarTrigger className="p-2 rounded-lg transition-colors duration-200 text-white" style={{
                            backgroundColor: hexToRgba(userColorScheme.primary, 0.10)
                          }}>
                            <Menu className="w-5 h-5 text-white" />
                          </SidebarTrigger>
                          <div className="flex-1 flex items-center justify-center">
                            <img
                              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/d31ff4d3d_1000044465.png"
                              alt="EqoFlow Logo"
                              className="h-16 object-contain" />
                          </div>
                          <div className="w-9 h-9" />
                        </div>

                        <div className="flex items-center justify-center gap-2">
                          <NotificationBell user={user} isMobile={true} />
                          <MessageButton />
                          <WalletButton user={user} onUpdate={handleUserUpdate} />
                          <Link to={createPageUrl("Profile")}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="relative text-gray-400 hover:text-white hover:bg-gray-700/50">

                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={getAvatarBackgroundStyle(user?.avatar_url)}>

                                {user?.avatar_url ?
                                <img
                                  src={user.avatar_url}
                                  alt="Profile"
                                  className="w-full h-full rounded-full object-cover" /> :
                                <UserIcon className="w-4 h-4 text-white" />
                                }
                              </div>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </header>

                    <div className="hidden md:flex items-center gap-2 absolute top-4 right-6 z-30">
                      <HeaderIconDrawer user={user} onUpdate={handleUserUpdate} />

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link to={createPageUrl("Profile")}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="relative header-icon-btn rounded-full w-9 h-9"
                              aria-label="View Profile">

                              <div
                                className="w-full h-full rounded-full flex items-center justify-center"
                                style={getAvatarBackgroundStyle(user?.avatar_url)}>
                                {user?.avatar_url ?
                                <img
                                  src={user.avatar_url}
                                  alt="Profile"
                                  className="w-full h-full rounded-full object-cover" /> :
                                <UserIcon className="w-5 h-5 text-white" />
                                }
                              </div>
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent className="bg-black/80 border-white/10 text-white">
                          <p>View Profile</p>
                        </TooltipContent>
                      </Tooltip>

                      <MessageButton />

                      <NotificationBell user={user} isMobile={false} />

                      <AnimatePresence>
                        {currentPageName === 'Discovery' &&
                        <motion.div
                          key="refresh-button"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}>

                            <Button
                            onClick={() => window.location.reload()}
                            variant="outline"
                            className="border-purple-500/30 text-white hover:bg-purple-500/10">

                              <RefreshCw className="w-4 h-4 mr-2" />
                              Refresh
                            </Button>
                          </motion.div>
                        }
                      </AnimatePresence>
                    </div>

                    <div className="p-3 md:p-6 flex-1">
                      {children}
                    </div>
                  </main>
                </div>
              </div>
            </SidebarProvider>

            <div className="fixed bottom-4 right-4 z-50">
              {user && <FeedbackWidget user={user} pageName={currentPageName} />}
            </div>
          </TooltipProvider>
        </SolanaWalletProvider>
      </NotificationProvider>
    </UserContext.Provider>);

}