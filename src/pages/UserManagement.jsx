
import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';
import { Search, Shield, User as UserIcon, RefreshCw, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { refreshPublicDirectory } from "@/functions/refreshPublicDirectory";

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshMessage, setRefreshMessage] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        let results = users;
        if (roleFilter !== 'all') {
            results = results.filter(u => u.role === roleFilter);
        }
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            results = results.filter(u => 
                u.full_name?.toLowerCase().includes(lowercasedTerm) ||
                u.email?.toLowerCase().includes(lowercasedTerm) ||
                u.username?.toLowerCase().includes(lowercasedTerm)
            );
        }
        setFilteredUsers(results);
    }, [searchTerm, roleFilter, users]);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const allUsers = await User.list('-created_date', 500); // Load up to 500 users
            setUsers(allUsers);
            setFilteredUsers(allUsers);
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await User.update(userId, { role: newRole });
            // Optimistic update
            setUsers(prevUsers => prevUsers.map(u => u.id === userId ? {...u, role: newRole} : u));
        } catch (error) {
            console.error("Error updating user role:", error);
        }
    };

    // Function to refresh the public directory
    const handleRefreshDirectory = async () => {
        setIsRefreshing(true);
        setRefreshMessage(null);
        
        try {
            const response = await refreshPublicDirectory();
            if (response.data && response.data.success) {
                setRefreshMessage({
                    type: 'success',
                    message: `Directory refreshed successfully! ${response.data.stats.updated} users updated, ${response.data.stats.created} users created.`
                });
                // Also reload the users list to show updated data
                setTimeout(() => {
                    loadUsers();
                }, 1000);
            } else {
                setRefreshMessage({
                    type: 'error',
                    message: 'Failed to refresh directory. Please try again.'
                });
            }
        } catch (error) {
            console.error("Error refreshing directory:", error);
            setRefreshMessage({
                type: 'error',
                message: `Error: ${error.message || 'Unknown error occurred'}`
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    // UserRow component definition, encapsulating the table row rendering
    const UserRow = ({ user, onUpdateRole }) => {
        const profileUrl = user.username
            ? createPageUrl(`PublicProfile?username=${encodeURIComponent(user.username)}`)
            : createPageUrl(`PublicProfile?email=${encodeURIComponent(user.email)}`);

        return (
            <TableRow key={user.id} className="border-gray-800 hover:bg-slate-800/50">
                <TableCell>
                    <div className="flex items-center gap-3">
                        <img src={user.avatar_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/15a1336a5_user-default-avatar.png'} alt={user.full_name} className="w-10 h-10 rounded-full object-cover bg-gray-700" />
                        <div>
                            <p className="font-medium text-white">{user.full_name}</p>
                            <p className="text-xs text-gray-400">@{user.username || 'N/A'}</p>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-gray-300 font-mono text-sm">{user.email}</TableCell>
                <TableCell>
                    <Select value={user.role} onValueChange={(newRole) => onUpdateRole(user.id, newRole)}>
                        <SelectTrigger className="w-[110px] bg-slate-800 border-gray-700 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700 text-white">
                            <SelectItem value="user"><UserIcon className="w-4 h-4 inline-block mr-2" />User</SelectItem>
                            <SelectItem value="admin"><Shield className="w-4 h-4 inline-block mr-2" />Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </TableCell>
                <TableCell className="text-gray-400">{format(new Date(user.created_date), 'PP')}</TableCell>
                <TableCell className="text-right">
                    <Link to={profileUrl}>
                        <Button variant="outline" size="sm" className="border-purple-500/30 text-white hover:bg-purple-500/10">
                            View Profile
                        </Button>
                    </Link>
                </TableCell>
            </TableRow>
        );
    };

    if (isLoading) {
        return <QuantumFlowLoader message="Loading User Data..." />;
    }

    return (
        <div className="bg-slate-950 p-6 space-y-6">
            {/* Back Button */}
            <Link to={createPageUrl("AdminHub")}>
                <Button
                    variant="outline"
                    className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Admin Hub
                </Button>
            </Link>

            <Card className="dark-card">
                <CardHeader>
                    <CardTitle className="text-white">User Management</CardTitle>
                    <p className="text-gray-400">View, search, and manage platform users.</p>
                </CardHeader>
                <CardContent>
                    {/* Directory Refresh Section */}
                    <div className="mb-6 p-4 bg-black/20 rounded-lg border border-purple-500/20">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h4 className="text-white font-medium mb-1">Directory Sync</h4>
                                <p className="text-sm text-gray-400">
                                    Refresh the public user directory to sync the latest profile data across Discovery and Public Profile pages.
                                </p>
                            </div>
                            <Button
                                onClick={handleRefreshDirectory}
                                disabled={isRefreshing}
                                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 disabled:opacity-50"
                            >
                                {isRefreshing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Refreshing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Refresh Directory
                                    </>
                                )}
                            </Button>
                        </div>
                        
                        {/* Refresh status message */}
                        {refreshMessage && (
                            <div className={`mt-3 p-3 rounded-lg ${
                                refreshMessage.type === 'success' 
                                    ? 'bg-green-900/20 border border-green-500/20 text-green-300' 
                                    : 'bg-red-900/20 border border-red-500/20 text-red-300'
                            }`}>
                                {refreshMessage.message}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input 
                                placeholder="Search by name, username, or email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="bg-black/30 border-gray-700 pl-10 text-white"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full md:w-[180px] bg-black/30 border-gray-700 text-white">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700 text-white">
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="dark-card">
                <CardHeader>
                    <CardTitle className="text-white">Users ({filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-700 hover:bg-transparent">
                                    <TableHead className="text-white">User</TableHead>
                                    <TableHead className="text-white">Email</TableHead>
                                    <TableHead className="text-white">Role</TableHead>
                                    <TableHead className="text-white">Joined</TableHead>
                                    <TableHead className="text-white text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map(user => (
                                    <UserRow 
                                        key={user.id} 
                                        user={user} 
                                        onUpdateRole={handleRoleChange} 
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
