import React, { useState, useEffect } from 'react';
import ProfileSyncTool from '@/components/admin/ProfileSyncTool';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Lock, ShieldAlert } from 'lucide-react';
import { PlatformConfig } from '@/entities/PlatformConfig';

export default function ProfileSyncToolPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [hasPassword, setHasPassword] = useState(false);

    useEffect(() => {
        // Check if password is set in PlatformConfig
        const checkPasswordExists = async () => {
            try {
                const configs = await PlatformConfig.filter({ key: 'profile_sync_tool_password' });
                setHasPassword(configs.length > 0 && configs[0].value);
            } catch (error) {
                console.error('Error checking password:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        checkPasswordExists();
        
        // Check if already authenticated in this session
        const authStatus = sessionStorage.getItem('profileSyncToolAuth');
        if (authStatus === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsChecking(true);

        try {
            const configs = await PlatformConfig.filter({ key: 'profile_sync_tool_password' });
            
            if (configs.length === 0 || !configs[0].value) {
                setError('No password has been set. Please contact a super admin to set up password protection.');
                setIsChecking(false);
                return;
            }

            const storedPassword = configs[0].value;

            if (passwordInput === storedPassword) {
                setIsAuthenticated(true);
                sessionStorage.setItem('profileSyncToolAuth', 'true');
                setError('');
            } else {
                setError('Incorrect password. Please try again.');
                setPasswordInput('');
            }
        } catch (error) {
            console.error('Error verifying password:', error);
            setError('Error verifying password. Please try again.');
        } finally {
            setIsChecking(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-slate-950 p-6 min-h-screen flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!hasPassword) {
        return (
            <div className="bg-slate-950 p-6 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <Link to={createPageUrl("AdminHub")}>
                        <Button
                            variant="outline"
                            className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Admin Hub
                        </Button>
                    </Link>

                    <Card className="dark-card border-yellow-500/30">
                        <CardHeader>
                            <CardTitle className="text-yellow-400 flex items-center gap-2">
                                <ShieldAlert className="w-6 h-6" />
                                Password Not Set
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-300 mb-4">
                                No password has been configured for the Profile Sync Tool. A super admin needs to set a password first.
                            </p>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                                <p className="text-sm text-gray-400 mb-2">
                                    <strong>To set the password:</strong>
                                </p>
                                <ol className="text-sm text-gray-400 list-decimal list-inside space-y-1">
                                    <li>Go to Dashboard → Data → PlatformConfig</li>
                                    <li>Create a new record with key: <code className="bg-slate-800 px-2 py-0.5 rounded">profile_sync_tool_password</code></li>
                                    <li>Set the value to your desired password</li>
                                    <li>Save and refresh this page</li>
                                </ol>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="bg-slate-950 p-6 min-h-screen flex items-center justify-center">
                <div className="w-full max-w-md">
                    <Link to={createPageUrl("AdminHub")}>
                        <Button
                            variant="outline"
                            className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Admin Hub
                        </Button>
                    </Link>

                    <Card className="dark-card">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
                                <Lock className="w-8 h-8 text-purple-400" />
                            </div>
                            <CardTitle className="text-2xl text-white">Protected Area</CardTitle>
                            <CardDescription className="text-gray-400">
                                Enter password to access Profile Sync Tool
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div>
                                    <Input
                                        type="password"
                                        placeholder="Enter password"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-white"
                                        disabled={isChecking}
                                        autoFocus
                                    />
                                </div>
                                
                                {error && (
                                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                    disabled={isChecking || !passwordInput}
                                >
                                    {isChecking ? 'Verifying...' : 'Access Tool'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-950 p-6 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <Link to={createPageUrl("AdminHub")}>
                    <Button
                        variant="outline"
                        className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Admin Hub
                    </Button>
                </Link>

                <h1 className="text-3xl font-bold text-white mb-2">Admin Tools</h1>
                <p className="text-gray-400 mb-6">Use these tools for site maintenance and data correction.</p>
                
                <ProfileSyncTool />
            </div>
        </div>
    );
}