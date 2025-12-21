import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, Info, Zap, Shield, Database, AlertTriangle } from 'lucide-react';
import { useUser } from '../components/contexts/UserContext';
import EqoFlowLoader from '../components/layout/QuantumFlowLoader';

export default function NillionTestPage() {
    const { user, isLoading } = useUser();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-6 bg-black min-h-screen">
                <EqoFlowLoader message="Verifying permissions..." />
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="flex items-center justify-center p-6 bg-black min-h-screen">
                <Card className="bg-red-900/30 border-red-500/30 max-w-lg w-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-300">
                            <AlertTriangle className="w-6 h-6" />
                            Access Denied
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-300">
                            You must be an administrator to access this page. This area is restricted for platform management and testing purposes.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 bg-black min-h-screen text-white">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Nillion Integration Status</h1>
                <p className="text-gray-400 mb-8">Privacy-preserving infrastructure for EqoFlow.</p>

                {/* Current Status */}
                <Card className="mb-6 bg-yellow-900/30 border-yellow-500/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-300">
                            <Clock className="w-5 h-5" />
                            Waiting for SDK Installation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-300 mb-4">
                            We've requested the platform administrators to install the required Nillion SDK packages. 
                            Once approved, we'll be able to implement privacy-preserving features.
                        </p>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                            <p className="text-yellow-300 text-sm">
                                <strong>Status:</strong> Request submitted for '@nillion/nuc-ts@0.1.2' and '@nillion/secretvaults-ts@0.1.2' packages.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* What Nillion Will Enable */}
                <Card className="mb-6 bg-gray-900/50 border-gray-600/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Info className="w-5 h-5 text-blue-400" />
                            What Nillion Will Enable
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <Shield className="w-8 h-8 text-blue-400 mb-2" />
                                <h3 className="font-semibold text-white mb-1">Private Data Storage</h3>
                                <p className="text-sm text-gray-300">Store sensitive user data in an encrypted, decentralized manner.</p>
                            </div>
                            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                <Zap className="w-8 h-8 text-purple-400 mb-2" />
                                <h3 className="font-semibold text-white mb-1">Private Computation</h3>
                                <p className="text-sm text-gray-300">Perform calculations on encrypted data without revealing the inputs.</p>
                            </div>
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <Database className="w-8 h-8 text-green-400 mb-2" />
                                <h3 className="font-semibold text-white mb-1">Secure Sharing</h3>
                                <p className="text-sm text-gray-300">Share data securely with granular permission controls.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Use Cases for EqoFlow */}
                <Card className="bg-gray-900/50 border-gray-600/30">
                    <CardHeader>
                        <CardTitle className="text-white">Potential Use Cases for EqoFlow</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-white">Private User Analytics</h4>
                                    <p className="text-sm text-gray-300">Analyze user engagement patterns without exposing individual user data.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-white">Confidential DAO Voting</h4>
                                    <p className="text-sm text-gray-300">Allow for private voting on governance proposals where vote weights are public but individual choices are not.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-white">Secure Skill Escrow</h4>
                                    <p className="text-sm text-gray-300">Hold project details or sensitive information in escrow, only revealing it upon successful transaction completion.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}