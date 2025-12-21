import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { testMuxKeys } from '@/functions/testMuxKeys';

export default function MuxKeyTester() {
    const [tokenId, setTokenId] = useState('');
    const [tokenSecret, setTokenSecret] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleTest = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const response = await testMuxKeys({ tokenId, tokenSecret });
            setResult(response.data);
        } catch (error) {
            // New, more robust error handling
            const errorData = error?.response?.data || error?.data;
            let errorMessage;

            if (typeof errorData === 'string') {
                errorMessage = errorData;
            } else if (errorData && errorData.error) {
                errorMessage = errorData.error;
            } else if (errorData) {
                errorMessage = `Received an unexpected error format. Raw response: ${JSON.stringify(errorData)}`;
            } else {
                errorMessage = error.message || 'An unknown client-side error occurred.';
            }
            
            setResult({ success: false, error: errorMessage });
        }
        setIsLoading(false);
    };

    return (
        <div className="p-6 flex justify-center items-center min-h-screen bg-gray-900 text-white">
            <Card className="w-full max-w-lg dark-card">
                <CardHeader>
                    <CardTitle className="text-white">Mux Credentials Tester</CardTitle>
                    <CardDescription className="text-gray-400">
                        Use this page to verify your Mux API keys. This will tell you the exact reason if they are invalid.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="tokenId" className="text-gray-300">Mux Token ID</Label>
                        <Input 
                            id="tokenId"
                            type="text"
                            value={tokenId}
                            onChange={(e) => setTokenId(e.target.value)}
                            placeholder="Paste your Mux Token ID"
                            className="bg-black/20 border-purple-500/20 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tokenSecret" className="text-gray-300">Mux Token Secret</Label>
                        <Input 
                            id="tokenSecret"
                            type="password"
                            value={tokenSecret}
                            onChange={(e) => setTokenSecret(e.target.value)}
                            placeholder="Paste your Mux Token Secret"
                            className="bg-black/20 border-purple-500/20 text-white"
                        />
                    </div>
                    <Button onClick={handleTest} disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</>
                        ) : (
                            'Test Keys'
                        )}
                    </Button>
                    
                    {result && (
                        <div className={`p-4 rounded-lg text-sm ${result.success ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                            {result.success ? (
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 mt-0.5 text-green-400" />
                                    <div>
                                        <h4 className="font-bold">Validation Successful</h4>
                                        <p>{result.message}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 mt-0.5 text-red-400" />
                                    <div>
                                        <h4 className="font-bold">Validation Failed</h4>
                                        <p className="font-mono break-words">{result.error}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}