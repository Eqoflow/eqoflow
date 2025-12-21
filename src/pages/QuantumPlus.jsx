import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/entities/User';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Crown, Sparkles, User as UserIcon, Search, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';

const SubscriberCard = ({ user }) => {
    const tierConfig = {
        Creator: {
            Icon: Sparkles,
            color: "text-purple-400",
            badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        },
        Pro: {
            Icon: Crown,
            color: "text-yellow-400",
            badgeClass: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
        },
    };

    const config = tierConfig[user.subscription_tier] || {};

    return (
        <motion.div
            className="dark-card p-4 rounded-lg flex items-center justify-between gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center gap-4">
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-slate-400" />
                    </div>
                )}
                <div>
                    <h3 className="font-semibold text-white">{user.full_name}</h3>
                    <p className="text-sm text-gray-400">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Joined {formatDistanceToNow(new Date(user.created_date), { addSuffix: true })}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Badge className={config.badgeClass}>
                    {config.Icon && <config.Icon className={`w-3.5 h-3.5 mr-1.5 ${config.color}`} />}
                    {user.subscription_tier}
                </Badge>
                <Link to={createPageUrl(`PublicProfile?email=${user.email}`)} target="_blank">
                    <Button variant="outline" size="sm" className="border-purple-500/30 text-white hover:bg-purple-500/10">
                        View Profile <ExternalLink className="w-3.5 h-3.5 ml-2" />
                    </Button>
                </Link>
            </div>
        </motion.div>
    );
};

export default function EqoPlusSubsPage() {
    const [subscribers, setSubscribers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tierFilter, setTierFilter] = useState('all');

    useEffect(() => {
        const fetchSubscribers = async () => {
            setIsLoading(true);
            try {
                const subscribedUsers = await User.filter({
                    subscription_tier: { $in: ['Creator', 'Pro'] }
                }, '-created_date');
                setSubscribers(subscribedUsers);
            } catch (error) {
                console.error("Failed to fetch subscribers:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSubscribers();
    }, []);

    const filteredSubscribers = useMemo(() => {
        return subscribers.filter(user => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = user.full_name?.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower);
            const matchesTier = tierFilter === 'all' || user.subscription_tier === tierFilter;
            return matchesSearch && matchesTier;
        });
    }, [subscribers, searchTerm, tierFilter]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <QuantumFlowLoader message="Loading subscribers..." />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white tracking-tight">Eqo+ Subscribers</h1>
                    <p className="mt-2 text-lg text-gray-400">Manage all users with an active Eqo+ subscription.</p>
                </div>

                <Card className="dark-card p-4 mb-6">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="relative w-full md:flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-800 border-gray-700 text-white pl-10"
                            />
                        </div>
                        <div className="w-full md:w-auto">
                            <Select value={tierFilter} onValueChange={setTierFilter}>
                                <SelectTrigger className="bg-slate-800 border-gray-700 text-white w-full md:w-[180px]">
                                    <SelectValue placeholder="Filter by tier" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-gray-700 text-white">
                                    <SelectItem value="all">All Tiers</SelectItem>
                                    <SelectItem value="Creator">Creator</SelectItem>
                                    <SelectItem value="Pro">Pro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                <div className="space-y-4">
                    {filteredSubscribers.length > 0 ? (
                        filteredSubscribers.map(user => <SubscriberCard key={user.id} user={user} />)
                    ) : (
                        <div className="text-center py-16 text-gray-500 dark-card rounded-lg">
                            <p className="font-semibold">No subscribers found</p>
                            <p className="text-sm mt-1">Try adjusting your filters or check back later.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}