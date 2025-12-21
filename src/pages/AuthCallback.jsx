import React, { useEffect, useState } from 'react';
import { xAuth } from '@/functions/xAuth';
import QuantumFlowLoader from '@/components/layout/QuantumFlowLoader';
import { ShieldCheck, AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthCallback() {
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('Processing authentication...');
    const [provider, setProvider] = useState('');

    useEffect(() => {
        handleAuthCallback();
    }, []);

    const handleAuthCallback = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const providerParam = urlParams.get('provider');
            const error = urlParams.get('error');

            setProvider(providerParam || 'unknown');

            if (error) {
                setStatus('error');
                setMessage('Authentication was cancelled or denied.');
                return;
            }

            if (!code || !providerParam) {
                setStatus('error');
                setMessage('Invalid authentication parameters.');
                return;
            }

            // Get stored OAuth data
            const storedState = localStorage.getItem(`${providerParam}_oauth_state`);
            const codeVerifier = localStorage.getItem(`${providerParam}_oauth_code_verifier`);

            if (!storedState || !codeVerifier) {
                setStatus('error');
                setMessage('Authentication session expired. Please try again.');
                return;
            }

            // Clean up stored data
            localStorage.removeItem(`${providerParam}_oauth_state`);
            localStorage.removeItem(`${providerParam}_oauth_code_verifier`);

            setMessage('Completing authentication...');

            // Call the appropriate auth function
            const response = await xAuth({
                step: 'handleCallback',
                code,
                state,
                storedState,
                codeVerifier,
            });

            if (response.data?.success) {
                setStatus('success');
                setMessage('Authentication successful!');
                
                // Notify parent window if opened as popup
                if (window.opener) {
                    window.opener.postMessage(
                        { type: 'auth_success', provider: providerParam },
                        window.location.origin
                    );
                }

                // Auto-close after success
                setTimeout(() => {
                    if (window.opener) {
                        window.close();
                    } else {
                        window.history.back();
                    }
                }, 2500);
            } else {
                throw new Error(response.data?.error || 'Authentication failed');
            }

        } catch (error) {
            console.error('Auth callback error:', error);
            setStatus('error');
            setMessage(error.message || 'An unexpected error occurred');
        }
    };

    const goHome = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                {status === 'processing' && (
                    <div>
                        <QuantumFlowLoader message={message} />
                        <p className="text-gray-400 mt-4 text-sm">
                            Please wait while we complete the authentication...
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-green-400">
                        <ShieldCheck className="w-16 h-16 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
                        <p className="text-gray-300 mb-4">{message}</p>
                        <p className="text-sm text-gray-400">This window will close automatically.</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-red-400">
                        <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
                        <p className="text-gray-300 mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                            {message}
                        </p>
                        <div className="space-y-2">
                            <Button onClick={() => window.close()} className="w-full">
                                Close Window
                            </Button>
                            <Button onClick={goHome} variant="outline" className="w-full">
                                <Home className="w-4 h-4 mr-2" />
                                Go to Home
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}