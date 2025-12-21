
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MarketplaceTransaction } from "@/entities/MarketplaceTransaction";
import { User } from "@/entities/User";
import { EngagementPoint } from "@/entities/EngagementPoint";
import { Post } from "@/entities/Post";
import { Skill } from "@/entities/Skill";
import { CreatorProfile } from "@/entities/CreatorProfile";
import { UserProfileData } from "@/entities/UserProfileData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, ShoppingCart, Briefcase, RefreshCw } from "lucide-react";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

const TransactionCard = ({ transaction, userRole, sellerNames }) => {
  const isBuyer = userRole === 'buyer';
  const otherPartyEmail = isBuyer ? transaction.seller_email : transaction.buyer_email;
  const otherPartyName = sellerNames[otherPartyEmail] || otherPartyEmail.split('@')[0];

  const getStatusColor = (status) => {
    const colors = {
      pending_payment: "bg-yellow-500/20 text-yellow-400",
      held_in_escrow: "bg-blue-500/20 text-blue-400",
      release_to_seller: "bg-purple-500/20 text-purple-400",
      completed: "bg-green-500/20 text-green-400",
      disputed: "bg-red-500/20 text-red-400",
      refunded: "bg-gray-500/20 text-gray-400",
      cancelled: "bg-gray-500/20 text-gray-400",
    };
    return colors[transaction.status] || "bg-gray-500/20 text-gray-400";
  };

  return (
    <Card className="dark-card hover-lift">
      <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-white font-semibold line-clamp-1">{transaction.item_title}</p>
          <p className="text-sm text-gray-400">
            {isBuyer ? `Seller: ${otherPartyName}` : `Buyer: ${otherPartyName}`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Engaged on: {format(new Date(transaction.created_date), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
           <div className="text-center">
            <p className="text-white font-bold text-lg">${transaction.amount_total.toFixed(2)}</p>
            <Badge variant="outline" className={getStatusColor(transaction.status) + " border-0 capitalize"}>
              {transaction.status.replace('_', ' ')}
            </Badge>
          </div>
          <Link to={`${createPageUrl('SkillWorkroom')}?transactionId=${transaction.id}`}>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 w-full md:w-auto">
              Go to Workroom <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default function MyEngagements() {
  const [user, setUser] = useState(null);
  const [buyingJobs, setBuyingJobs] = useState([]);
  const [sellingJobs, setSellingJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // New state for refresh
  const [engagements, setEngagements] = useState([]);
  const [sellerNames, setSellerNames] = useState({});

  const getSellerDisplayName = async (email) => {
    if (!email) return '';
    try {
      const creatorProfiles = await CreatorProfile.filter({ user_email: email });
      if (creatorProfiles.length > 0 && creatorProfiles[0].business_name) {
        return creatorProfiles[0].business_name;
      }

      const users = await User.filter({ email: email });
      if (users.length > 0 && users[0].full_name) {
        return users[0].full_name;
      }

      return email.split('@')[0];
    } catch (error) {
      console.error('Error fetching seller name:', error);
      return email.split('@')[0];
    }
  };

  const getBuyerDisplayName = async (email) => {
    if (!email) return '';
    try {
      const profileData = await UserProfileData.filter({ user_email: email });
      if (profileData.length > 0) {
        if (profileData[0].full_name && profileData[0].full_name.trim() !== '') {
          return profileData[0].full_name;
        }
        if (profileData[0].username && profileData[0].username.trim() !== '') {
          return profileData[0].username;
        }
      }

      const users = await User.filter({ email: email });
      if (users.length > 0) {
        if (users[0].full_name && users[0].full_name.trim() !== '') {
          return users[0].full_name;
        }
        if (users[0].username && users[0].username.trim() !== '') {
          return users[0].username;
        }
      }

      return email.split('@')[0];
    } catch (error) {
      console.error('Error fetching buyer name:', error);
      return email.split('@')[0];
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (!currentUser?.email) {
        setIsLoading(false);
        return;
      }

      const [
        boughtTransactions,
        soldTransactions,
        userEngagementPointsRaw
      ] = await Promise.all([
        MarketplaceTransaction.filter({ buyer_email: currentUser.email }, '-created_date', 50),
        MarketplaceTransaction.filter({ seller_email: currentUser.email }, '-created_date', 50),
        EngagementPoint.filter({ created_by: currentUser.email }, "-created_date", 100)
      ]);

      // CRITICAL: Filter out pending_payment and cancelled transactions
      const activeBoughtTransactions = boughtTransactions.filter(t => 
        t.status !== 'pending_payment' && t.status !== 'cancelled'
      );
      
      const activeSoldTransactions = soldTransactions.filter(t => 
        t.status !== 'pending_payment' && t.status !== 'cancelled'
      );

      // Fetch display names
      const namesMap = {};
      
      for (const transaction of activeBoughtTransactions) {
        if (transaction.seller_email && !namesMap[transaction.seller_email]) {
          namesMap[transaction.seller_email] = await getSellerDisplayName(transaction.seller_email);
        }
      }
      
      for (const transaction of activeSoldTransactions) {
        if (transaction.buyer_email && !namesMap[transaction.buyer_email]) {
          namesMap[transaction.buyer_email] = await getBuyerDisplayName(transaction.buyer_email);
        }
      }
      
      setSellerNames(namesMap);
      setBuyingJobs(activeBoughtTransactions);
      setSellingJobs(activeSoldTransactions);

      if (userEngagementPointsRaw.length > 0) {
        const postIds = [...new Set(
          userEngagementPointsRaw.filter(ep => ep.related_content_type === 'post' && ep.related_content_id)
            .map(ep => ep.related_content_id)
        )];

        const skillIds = [...new Set(
          userEngagementPointsRaw.filter(ep => ep.related_content_type === 'skill' && ep.related_content_id)
            .map(ep => ep.related_content_id)
        )];

        const userEmails = [...new Set(
          userEngagementPointsRaw.filter(ep => ep.related_content_type === 'user' && ep.related_content_id)
            .map(ep => ep.related_content_id)
        )];

        const [relatedPosts, relatedSkills, relatedUsers] = await Promise.all([
          postIds.length > 0 ? Post.filter({ id: { $in: postIds } }).catch(() => []) : [],
          skillIds.length > 0 ? Skill.filter({ id: { $in: skillIds } }).catch(() => []) : [],
          userEmails.length > 0 ? User.filter({ email: { $in: userEmails } }).catch(() => []) : []
        ]);

        const postsMap = relatedPosts.reduce((acc, post) => {
          acc[post.id] = post;
          return acc;
        }, {});

        const skillsMap = relatedSkills.reduce((acc, skill) => {
          acc[skill.id] = skill;
          return acc;
        }, {});

        const usersMap = relatedUsers.reduce((acc, userItem) => {
          acc[userItem.email] = userItem;
          return acc;
        }, {});

        const enrichedEP = userEngagementPointsRaw.map(ep => {
          let relatedContent = null;
          
          if (ep.related_content_type === 'post' && ep.related_content_id) {
            relatedContent = postsMap[ep.related_content_id] || null;
          } else if (ep.related_content_type === 'skill' && ep.related_content_id) {
            relatedContent = skillsMap[ep.related_content_id] || null;
          } else if (ep.related_content_type === 'user' && ep.related_content_id) {
            relatedContent = usersMap[ep.related_content_id] || null;
          }

          return {
            ...ep,
            related_content: relatedContent
          };
        });

        setEngagements(enrichedEP);
      } else {
        setEngagements([]);
      }
    } catch (error) {
      console.error("Error loading engagements and marketplace jobs:", error);
      setBuyingJobs([]);
      setSellingJobs([]);
      setEngagements([]);
      setSellerNames({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to={createPageUrl("SkillsMarket")} className="inline-flex items-center text-purple-400 hover:text-purple-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Skills Marketplace
          </Link>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="border-purple-500/30 text-white hover:bg-purple-500/10"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Jobs
              </>
            )}
          </Button>
        </div>
        
        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--neon-primary), var(--neon-secondary))' }}>
          Manage My Jobs
        </h1>

        {isLoading ? (
          <div className="text-center text-gray-400">Loading your jobs...</div>
        ) : (
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-cyan-400" />
                Jobs I'm Buying
              </h2>
              {buyingJobs.length > 0 ? (
                <div className="space-y-4">
                  {buyingJobs.map(job => <TransactionCard key={job.id} transaction={job} userRole="buyer" sellerNames={sellerNames} />)}
                </div>
              ) : (
                <p className="text-gray-500">You haven't purchased any skills yet.</p>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-green-400" />
                Jobs I'm Selling
              </h2>
              {sellingJobs.length > 0 ? (
                <div className="space-y-4">
                  {sellingJobs.map(job => <TransactionCard key={job.id} transaction={job} userRole="seller" sellerNames={sellerNames} />)}
                </div>
              ) : (
                <p className="text-gray-500">You haven't sold any skills yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
