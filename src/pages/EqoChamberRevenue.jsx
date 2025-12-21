import React, { useState, useEffect } from 'react';
import { MarketplaceTransaction } from '@/entities/MarketplaceTransaction';
import { User } from '@/entities/User';
import { Loader2, User as UserIcon, ArrowLeft, CheckCircle, XCircle, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EqoChamberRevenuePage() {
    const [creators, setCreators] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRevenueData = async () => {
            setIsLoading(true);
            try {
                // Get all community membership transactions
                const transactions = await MarketplaceTransaction.filter(
                    { item_type: 'community_access' },
                    '-created_date'
                );

                // Get unique seller emails (community creators)
                const sellerEmails = [...new Set(transactions.map(t => t.seller_email))];
                
                // Fetch user data for all creators
                const userProfiles = await User.filter({ email: { $in: sellerEmails } });

                const userMap = userProfiles.reduce((acc, user) => {
                    acc[user.email] = user;
                    return acc;
                }, {});

                // Calculate revenue per creator
                const revenueData = transactions.reduce((acc, tx) => {
                    const sellerEmail = tx.seller_email;
                    
                    if (!acc[sellerEmail]) {
                        acc[sellerEmail] = {
                            user: userMap[sellerEmail] || { email: sellerEmail, full_name: 'Unknown User' },
                            totalRevenue: 0,
                            totalPlatformFees: 0,
                            totalPayoutDue: 0,
                            transactionCount: 0,
                            communities: new Set(),
                            transactions: []
                        };
                    }

                    acc[sellerEmail].totalRevenue += tx.amount_total;
                    acc[sellerEmail].totalPlatformFees += tx.amount_platform_fee;
                    
                    if (tx.payout_status === 'due') {
                        acc[sellerEmail].totalPayoutDue += tx.amount_seller_payout;
                    }
                    
                    acc[sellerEmail].transactionCount += 1;
                    acc[sellerEmail].communities.add(tx.item_id);
                    acc[sellerEmail].transactions.push(tx);

                    return acc;
                }, {});

                // Convert Set to count
                Object.values(revenueData).forEach(creator => {
                    creator.communityCount = creator.communities.size;
                    delete creator.communities;
                });
                
                setCreators(revenueData);

            } catch (err) {
                console.error("Error fetching community revenue data:", err);
                setError("Failed to load community revenue data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchRevenueData();
    }, []);

    const handleMarkAsPaid = async (transactionId) => {
        try {
            await MarketplaceTransaction.update(transactionId, { 
                payout_status: 'paid',
                payout_date: new Date().toISOString()
            });
            
            // Reload data
            window.location.reload();
        } catch (error) {
            console.error("Error marking transaction as paid:", error);
            alert("Failed to update transaction.");
        }
    };

    const hasPaymentMethod = (creator) => {
        return !!(
            creator.user.stripe_connect_account_id ||
            creator.user.bank_payout_details ||
            creator.user.stripe_payment_link ||
            creator.user.square_connect_link
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
                    <p className="text-gray-400">Loading EqoChamber Revenue Data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="text-center py-10 text-red-400">{error}</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-black text-white min-h-screen">
            {/* Back Button */}
            <Link to={createPageUrl("AdminHub")}>
                <Button
                    variant="outline"
                    className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Admin Hub
                </Button>
            </Link>

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <UsersIcon className="w-8 h-8 text-green-400"/>
                    EqoChamber Memberships
                </h1>
                <p className="text-gray-400 mt-2">
                    Review community creator earnings from paid memberships and manage payouts.
                </p>
            </header>

            <div className="space-y-6">
                {Object.values(creators).length > 0 ? (
                    Object.values(creators)
                        .sort((a, b) => b.totalPayoutDue - a.totalPayoutDue)
                        .map(creatorData => (
                            <Card key={creatorData.user.email} className="dark-card">
                                <CardHeader className="border-b border-purple-500/20">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-white flex items-center gap-2">
                                                <UserIcon className="w-5 h-5 text-purple-400" />
                                                {creatorData.user.full_name}
                                            </CardTitle>
                                            <p className="text-sm text-gray-400 mt-1">
                                                @{creatorData.user.username || 'N/A'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {creatorData.user.email}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {hasPaymentMethod(creatorData) ? (
                                                <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Payment Method Connected
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-600/20 text-red-400 border-red-500/30">
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    No Payment Method
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-slate-900/50 p-4 rounded-lg border border-purple-500/20">
                                            <p className="text-sm text-gray-400 mb-1">Total Sales</p>
                                            <p className="text-2xl font-bold text-white">
                                                ${creatorData.totalRevenue.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-lg border border-purple-500/20">
                                            <p className="text-sm text-gray-400 mb-1">Platform Fees (15%)</p>
                                            <p className="text-2xl font-bold text-red-400">
                                                -${creatorData.totalPlatformFees.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-lg border border-green-500/20">
                                            <p className="text-sm text-gray-400 mb-1">Amount Owed</p>
                                            <p className="text-2xl font-bold text-green-400">
                                                ${creatorData.totalPayoutDue.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-lg border border-blue-500/20">
                                            <p className="text-sm text-gray-400 mb-1">Total Members</p>
                                            <p className="text-2xl font-bold text-blue-400">
                                                {creatorData.transactionCount}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Communities Count */}
                                    <div className="mb-6">
                                        <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                                            {creatorData.communityCount} Paid {creatorData.communityCount === 1 ? 'Community' : 'Communities'}
                                        </Badge>
                                    </div>

                                    {/* Payment Method Details */}
                                    <div className="bg-slate-900/30 p-4 rounded-lg border border-purple-500/10">
                                        <h4 className="text-sm font-semibold text-white mb-3">Payment Method Status</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Stripe Connect:</span>
                                                <span className={creatorData.user.stripe_connect_account_id ? "text-green-400" : "text-gray-500"}>
                                                    {creatorData.user.stripe_connect_account_id ? "Connected" : "Not Connected"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Bank Details:</span>
                                                <span className={creatorData.user.bank_payout_details ? "text-green-400" : "text-gray-500"}>
                                                    {creatorData.user.bank_payout_details ? "Provided" : "Not Provided"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Stripe Payment Link:</span>
                                                <span className={creatorData.user.stripe_payment_link ? "text-green-400" : "text-gray-500"}>
                                                    {creatorData.user.stripe_payment_link ? "Provided" : "Not Provided"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Square Link:</span>
                                                <span className={creatorData.user.square_connect_link ? "text-green-400" : "text-gray-500"}>
                                                    {creatorData.user.square_connect_link ? "Provided" : "Not Provided"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Transactions List */}
                                    <div className="mt-6">
                                        <h4 className="text-sm font-semibold text-white mb-3">Recent Transactions</h4>
                                        <div className="space-y-2">
                                            {creatorData.transactions.slice(0, 5).map((tx) => (
                                                <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg border border-purple-500/10">
                                                    <div className="flex-1">
                                                        <p className="text-sm text-white">{tx.item_title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(tx.created_date).toLocaleDateString()} • {tx.buyer_email}
                                                        </p>
                                                    </div>
                                                    <div className="text-right mr-4">
                                                        <p className="text-sm font-medium text-white">${tx.amount_seller_payout.toFixed(2)}</p>
                                                        <Badge className={
                                                            tx.payout_status === 'paid' 
                                                                ? 'bg-green-600/20 text-green-400 border-green-500/30'
                                                                : 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
                                                        }>
                                                            {tx.payout_status}
                                                        </Badge>
                                                    </div>
                                                    {tx.payout_status === 'due' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleMarkAsPaid(tx.id)}
                                                            className="bg-green-600 hover:bg-green-700">
                                                            Mark Paid
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                ) : (
                    <div className="text-center py-12 bg-slate-900/50 rounded-lg">
                        <UsersIcon className="mx-auto h-12 w-12 text-gray-500" />
                        <h3 className="mt-2 text-lg font-medium text-white">No Paid Memberships Yet</h3>
                        <p className="mt-1 text-sm text-gray-400">
                            No community creators have earned money from paid memberships yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}