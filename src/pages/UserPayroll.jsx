
import React, { useState, useEffect } from 'react';
import { MarketplaceTransaction } from '@/entities/MarketplaceTransaction';
import { User } from '@/entities/User';
import { User as UserIcon, DollarSign, ArrowLeft } from 'lucide-react';
import PayrollUserCard from '../components/admin/PayrollUserCard';
import { QuantumFlowLoader } from '../components/layout/QuantumFlowLoader';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UserPayrollPage() {
    const [creators, setCreators] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPayrollData = async () => {
            setIsLoading(true);
            try {
                const transactions = await MarketplaceTransaction.list('-created_date', 500);
                const userEmails = [...new Set(transactions.map(t => t.seller_email))];
                const userProfiles = await User.filter({ email: { in: userEmails } });

                const userMap = userProfiles.reduce((acc, user) => {
                    acc[user.email] = user;
                    return acc;
                }, {});

                const payrollData = transactions.reduce((acc, tx) => {
                    const sellerEmail = tx.seller_email;
                    if (!acc[sellerEmail]) {
                        acc[sellerEmail] = {
                            user: userMap[sellerEmail] || { email: sellerEmail, full_name: 'Unknown User' },
                            totalRevenue: 0,
                            totalPlatformFees: 0,
                            totalPayoutDue: 0,
                            transactions: []
                        };
                    }
                    acc[sellerEmail].totalRevenue += tx.amount_total;
                    acc[sellerEmail].totalPlatformFees += tx.amount_platform_fee;
                    
                    if (tx.payout_status === 'due') {
                        acc[sellerEmail].totalPayoutDue += tx.amount_seller_payout;
                    }
                    
                    acc[sellerEmail].transactions.push(tx);

                    return acc;
                }, {});
                
                setCreators(payrollData);

            } catch (err) {
                console.error("Error fetching payroll data:", err);
                setError("Failed to load creator payroll data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPayrollData();
    }, []);
    
    const handleMarkAsPaid = async (transactionId) => {
        try {
            await MarketplaceTransaction.update(transactionId, { 
                payout_status: 'paid',
                payout_date: new Date().toISOString()
            });
            // Re-fetch or update state locally
            // For simplicity, we can just refetch all data
            const transactions = await MarketplaceTransaction.list('-created_date', 500);
            const userEmails = [...new Set(transactions.map(t => t.seller_email))];
            const userProfiles = await User.filter({ email: { in: userEmails } });

            const userMap = userProfiles.reduce((acc, user) => {
                acc[user.email] = user;
                return acc;
            }, {});

            const payrollData = transactions.reduce((acc, tx) => {
                const sellerEmail = tx.seller_email;
                if (!acc[sellerEmail]) {
                    acc[sellerEmail] = {
                        user: userMap[sellerEmail] || { email: sellerEmail, full_name: 'Unknown User' },
                        totalRevenue: 0,
                        totalPlatformFees: 0,
                        totalPayoutDue: 0,
                        transactions: []
                    };
                }
                acc[sellerEmail].totalRevenue += tx.amount_total;
                acc[sellerEmail].totalPlatformFees += tx.amount_platform_fee;
                
                if (tx.payout_status === 'due') {
                    acc[sellerEmail].totalPayoutDue += tx.amount_seller_payout;
                }
                
                acc[sellerEmail].transactions.push(tx);

                return acc;
            }, {});
            
            setCreators(payrollData);
        } catch (error) {
            console.error("Error marking transaction as paid:", error);
            alert("Failed to update transaction.");
        }
    };


    if (isLoading) {
        return <QuantumFlowLoader text="Loading Creator Payrolls..." />;
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
                    <DollarSign className="w-8 h-8 text-green-400"/>
                    User Payroll
                </h1>
                <p className="text-gray-400 mt-2">
                    Review creator earnings, track payouts, and manage marketplace transactions.
                </p>
            </header>

            <div className="space-y-6">
                {Object.values(creators).length > 0 ? (
                    Object.values(creators)
                        .sort((a, b) => b.totalPayoutDue - a.totalPayoutDue)
                        .map(creatorData => (
                            <PayrollUserCard 
                                key={creatorData.user.email} 
                                creatorData={creatorData}
                                onMarkAsPaid={handleMarkAsPaid}
                            />
                        ))
                ) : (
                    <div className="text-center py-12 bg-slate-900/50 rounded-lg">
                        <UserIcon className="mx-auto h-12 w-12 text-gray-500" />
                        <h3 className="mt-2 text-lg font-medium text-white">No Earnings Yet</h3>
                        <p className="mt-1 text-sm text-gray-400">
                            No users have earned money from marketplace sales yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
