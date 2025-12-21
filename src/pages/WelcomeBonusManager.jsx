
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getWelcomeBonusConfig } from '@/functions/getWelcomeBonusConfig';
import { updateWelcomeBonusConfig } from '@/functions/updateWelcomeBonusConfig';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';
import { Info, Save, Loader2, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WelcomeBonusManager() {
    const [config, setConfig] = useState({
        initialAmount: 1000,
        userLimit: 100,
        subsequentAmount: 500,
        awardedCount: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState({ message: '', type: '' });

    const loadConfig = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await getWelcomeBonusConfig();
            if (data) {
                setConfig({
                    initialAmount: data.initialAmount || 1000,
                    userLimit: data.userLimit || 100,
                    subsequentAmount: data.subsequentAmount || 500,
                    awardedCount: data.awardedCount || 0
                });
            }
        } catch (err) {
            console.error("Failed to load welcome bonus config:", err);
            setError("Could not load settings. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus({ message: '', type: '' });
        try {
            const settingsToSave = {
                initialAmount: parseInt(config.initialAmount, 10),
                userLimit: parseInt(config.userLimit, 10),
                subsequentAmount: parseInt(config.subsequentAmount, 10)
            };
            await updateWelcomeBonusConfig(settingsToSave);
            setSaveStatus({ message: 'Settings saved successfully!', type: 'success' });
        } catch (err) {
            console.error("Failed to save welcome bonus config:", err);
            setSaveStatus({ message: 'Failed to save settings. Please try again.', type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveStatus({ message: '', type: '' }), 4000);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    if (isLoading) {
        return <QuantumFlowLoader message="Loading Welcome Bonus Settings..." />;
    }

    if (error) {
        return <div className="text-center text-red-400">{error}</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
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
                    <CardTitle className="text-2xl text-white">Welcome Bonus Configuration</CardTitle>
                    <CardDescription className="text-gray-400">
                        Manage the token rewards new users receive upon joining EqoFlow.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-start gap-4">
                        <Info className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-blue-300">How It Works</h4>
                            <p className="text-sm text-blue-200/80">
                                This system rewards the first group of users with a special bonus. After the user limit is reached, all subsequent new users will receive the secondary bonus amount.
                            </p>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-slate-800 rounded-lg">
                        <h3 className="font-semibold text-white mb-2">Current Status</h3>
                        <p className="text-gray-300">
                            <span className="font-bold text-xl text-purple-400">{config.awardedCount}</span> out of <span className="font-bold text-xl text-purple-400">{config.userLimit}</span> initial bonuses have been awarded.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="initialAmount" className="text-gray-300">Initial Bonus Amount ($EQOFLO)</Label>
                            <Input
                                id="initialAmount"
                                name="initialAmount"
                                type="number"
                                value={config.initialAmount}
                                onChange={handleChange}
                                className="bg-slate-800 border-gray-700 text-white"
                                placeholder="e.g., 1000"
                            />
                            <p className="text-xs text-gray-500">The amount of tokens the first batch of users receive.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="userLimit" className="text-gray-300">User Limit for Initial Bonus</Label>
                            <Input
                                id="userLimit"
                                name="userLimit"
                                type="number"
                                value={config.userLimit}
                                onChange={handleChange}
                                className="bg-slate-800 border-gray-700 text-white"
                                placeholder="e.g., 100"
                            />
                            <p className="text-xs text-gray-500">How many users receive the initial bonus.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subsequentAmount" className="text-gray-300">Subsequent Bonus Amount ($EQOFLO)</Label>
                        <Input
                            id="subsequentAmount"
                            name="subsequentAmount"
                            type="number"
                            value={config.subsequentAmount}
                            onChange={handleChange}
                            className="bg-slate-800 border-gray-700 text-white"
                            placeholder="e.g., 500"
                        />
                        <p className="text-xs text-gray-500">The amount all users receive after the initial limit is met. Set to 0 to stop bonuses.</p>
                    </div>

                </CardContent>
                <CardFooter className="flex justify-between items-center bg-black/20 p-4">
                     <div className="h-6">
                        {saveStatus.message && (
                            <div className={`flex items-center gap-2 text-sm ${saveStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {saveStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                {saveStatus.message}
                            </div>
                        )}
                    </div>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Settings
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
