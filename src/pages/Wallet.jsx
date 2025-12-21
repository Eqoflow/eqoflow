import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { EngagementPoint } from '@/entities/EngagementPoint';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet as WalletIcon, Coins, Zap, Activity, Clock, PieChart } from 'lucide-react';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';
import EPSwapInterface from '../components/wallet/EPSwapInterface';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

export default function WalletPage() {
    const [user, setUser] = useState(null);
    const [epHistory, setEpHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [currentUser, history] = await Promise.all([
                User.me(),
                EngagementPoint.list("-created_date", 100)
            ]);
            setUser(currentUser);
            setEpHistory(history);
        } catch (error) {
            console.error("Error loading wallet data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const epChartData = epHistory.reduce((acc, item) => {
        const date = format(new Date(item.created_date), 'MMM d');
        if (!acc[date]) {
            acc[date] = { date, EP_Earned: 0 };
        }
        acc[date].EP_Earned += item.final_points;
        return acc;
    }, {});

    const sortedChartData = Object.values(epChartData).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14); // Last 14 days with activity

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <QuantumFlowLoader message="Loading your financial dashboard..." />
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Card className="dark-card text-center p-8">
                    <CardTitle>Please Log In</CardTitle>
                    <CardDescription>You need to be logged in to view your wallet.</CardDescription>
                    <Button onClick={() => User.login()} className="mt-4">Login</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                            Financial Dashboard
                        </h1>
                        <p className="text-gray-400">Manage your tokens, swap EP, and track your earnings.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <EPSwapInterface user={user} onSwapSuccess={loadData} />
                        <Card className="dark-card">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-purple-400" />
                                    Recent EP Activity
                                </CardTitle>
                                <CardDescription>Your last 10 engagement point transactions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {epHistory.slice(0, 10).map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                                            <div>
                                                <p className="font-medium text-white">{item.description}</p>
                                                <p className="text-xs text-gray-400">{format(new Date(item.created_date), "MMM d, yyyy 'at' h:mm a")}</p>
                                            </div>
                                            <div className="text-lg font-bold text-cyan-400">
                                                +{item.final_points} EP
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-8">
                        <Card className="dark-card">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <WalletIcon className="w-5 h-5 text-purple-400" />
                                    Your Balances
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 rounded-lg bg-black/20">
                                    <Label className="text-gray-400 flex items-center gap-1.5">
                                        <Coins className="w-4 h-4" /> Available $QFLOW Balance
                                    </Label>
                                    <div className="text-3xl font-bold text-yellow-400">
                                        {(user.token_balance || 0).toLocaleString()}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-black/20">
                                    <Label className="text-gray-400 flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" /> $QFLOW on Hold
                                    </Label>
                                    <div className="text-2xl font-semibold text-gray-300">
                                        {(user.tokens_on_hold || 0).toLocaleString()}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Tokens from recent swaps, released after 7 days.</p>
                                </div>
                                <div className="p-4 rounded-lg bg-black/20">
                                    <Label className="text-gray-400 flex items-center gap-1.5">
                                        <Zap className="w-4 h-4" /> Engagement Points
                                    </Label>
                                    <div className="text-2xl font-semibold text-cyan-400">
                                        {(user.total_ep_earned || 0).toLocaleString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="dark-card">
                           <CardHeader>
                               <CardTitle className="text-white flex items-center gap-2">
                                   <PieChart className="w-5 h-5 text-purple-400"/>
                                   EP Earning Trends
                               </CardTitle>
                               <CardDescription>Your EP earnings over the last 14 active days.</CardDescription>
                           </CardHeader>
                           <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={sortedChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                background: "rgba(10, 10, 10, 0.8)",
                                                borderColor: "rgba(139, 92, 246, 0.3)",
                                                color: "white"
                                            }}
                                        />
                                        <Legend wrapperStyle={{fontSize: "14px"}}/>
                                        <Bar dataKey="EP_Earned" fill="url(#colorUv)" radius={[4, 4, 0, 0]} />
                                        <defs>
                                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.8}/>
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                           </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}