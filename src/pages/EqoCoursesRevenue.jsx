import React, { useState, useEffect } from 'react';
import { CourseEnrollment } from '@/entities/CourseEnrollment';
import { User } from '@/entities/User';
import { UserProfileData } from '@/entities/UserProfileData';
import { Loader2, User as UserIcon, ArrowLeft, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EqoCoursesRevenuePage() {
    const [instructors, setInstructors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRevenueData = async () => {
            setIsLoading(true);
            try {
                // Get all paid enrollments
                const enrollments = await CourseEnrollment.filter(
                    { enrollment_type: 'paid', payment_status: 'completed' },
                    '-created_date'
                );

                // Get unique instructor emails
                const instructorEmails = [...new Set(enrollments.map(e => e.instructor_email))];
                
                // Fetch user data for all instructors
                const userProfiles = await User.filter({ email: { in: instructorEmails } });
                const profileData = await UserProfileData.filter({ user_email: { in: instructorEmails } });

                const userMap = userProfiles.reduce((acc, user) => {
                    acc[user.email] = user;
                    return acc;
                }, {});

                const profileMap = profileData.reduce((acc, profile) => {
                    acc[profile.user_email] = profile;
                    return acc;
                }, {});

                // Calculate revenue per instructor
                const revenueData = enrollments.reduce((acc, enrollment) => {
                    const instructorEmail = enrollment.instructor_email;
                    
                    if (!acc[instructorEmail]) {
                        const user = userMap[instructorEmail];
                        const profile = profileMap[instructorEmail] || {};
                        
                        acc[instructorEmail] = {
                            user: {
                                email: instructorEmail,
                                full_name: user?.full_name || profile.full_name || 'Unknown User',
                                username: user?.username || profile.username || 'N/A',
                                stripe_connect_account_id: user?.stripe_connect_account_id,
                                bank_payout_details: user?.bank_payout_details,
                                stripe_payment_link: user?.stripe_payment_link,
                                square_connect_link: user?.square_connect_link
                            },
                            totalRevenue: 0,
                            totalPlatformFees: 0,
                            totalPayoutDue: 0,
                            enrollmentCount: 0,
                            enrollments: []
                        };
                    }

                    const platformFeePercentage = 10; // Default 10% platform fee
                    const platformFee = enrollment.amount_paid * (platformFeePercentage / 100);
                    const instructorPayout = enrollment.amount_paid - platformFee;

                    acc[instructorEmail].totalRevenue += enrollment.amount_paid;
                    acc[instructorEmail].totalPlatformFees += platformFee;
                    acc[instructorEmail].totalPayoutDue += instructorPayout;
                    acc[instructorEmail].enrollmentCount += 1;
                    acc[instructorEmail].enrollments.push(enrollment);

                    return acc;
                }, {});
                
                setInstructors(revenueData);

            } catch (err) {
                console.error("Error fetching course revenue data:", err);
                setError("Failed to load course revenue data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchRevenueData();
    }, []);

    const hasPaymentMethod = (instructor) => {
        return !!(
            instructor.user.stripe_connect_account_id ||
            instructor.user.bank_payout_details ||
            instructor.user.stripe_payment_link ||
            instructor.user.square_connect_link
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
                    <p className="text-gray-400">Loading Course Revenue Data...</p>
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
                    <BookOpen className="w-8 h-8 text-purple-400"/>
                    EqoCourses Revenue
                </h1>
                <p className="text-gray-400 mt-2">
                    Review instructor earnings from course sales and manage payouts.
                </p>
            </header>

            <div className="space-y-6">
                {Object.values(instructors).length > 0 ? (
                    Object.values(instructors)
                        .sort((a, b) => b.totalPayoutDue - a.totalPayoutDue)
                        .map(instructorData => (
                            <Card key={instructorData.user.email} className="dark-card">
                                <CardHeader className="border-b border-purple-500/20">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-white flex items-center gap-2">
                                                <UserIcon className="w-5 h-5 text-purple-400" />
                                                {instructorData.user.full_name}
                                            </CardTitle>
                                            <p className="text-sm text-gray-400 mt-1">
                                                @{instructorData.user.username}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {instructorData.user.email}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {hasPaymentMethod(instructorData) ? (
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
                                                ${instructorData.totalRevenue.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-lg border border-purple-500/20">
                                            <p className="text-sm text-gray-400 mb-1">Platform Fees (10%)</p>
                                            <p className="text-2xl font-bold text-red-400">
                                                -${instructorData.totalPlatformFees.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-lg border border-green-500/20">
                                            <p className="text-sm text-gray-400 mb-1">Amount Owed</p>
                                            <p className="text-2xl font-bold text-green-400">
                                                ${instructorData.totalPayoutDue.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-lg border border-blue-500/20">
                                            <p className="text-sm text-gray-400 mb-1">Total Enrollments</p>
                                            <p className="text-2xl font-bold text-blue-400">
                                                {instructorData.enrollmentCount}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payment Method Details */}
                                    <div className="bg-slate-900/30 p-4 rounded-lg border border-purple-500/10">
                                        <h4 className="text-sm font-semibold text-white mb-3">Payment Method Status</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Stripe Connect:</span>
                                                <span className={instructorData.user.stripe_connect_account_id ? "text-green-400" : "text-gray-500"}>
                                                    {instructorData.user.stripe_connect_account_id ? "Connected" : "Not Connected"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Bank Details:</span>
                                                <span className={instructorData.user.bank_payout_details ? "text-green-400" : "text-gray-500"}>
                                                    {instructorData.user.bank_payout_details ? "Provided" : "Not Provided"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Stripe Payment Link:</span>
                                                <span className={instructorData.user.stripe_payment_link ? "text-green-400" : "text-gray-500"}>
                                                    {instructorData.user.stripe_payment_link ? "Provided" : "Not Provided"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Square Link:</span>
                                                <span className={instructorData.user.square_connect_link ? "text-green-400" : "text-gray-500"}>
                                                    {instructorData.user.square_connect_link ? "Provided" : "Not Provided"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                ) : (
                    <div className="text-center py-12 bg-slate-900/50 rounded-lg">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-500" />
                        <h3 className="mt-2 text-lg font-medium text-white">No Course Sales Yet</h3>
                        <p className="mt-1 text-sm text-gray-400">
                            No instructors have earned money from course sales yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}