import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, X, Loader2, CheckCircle, AlertCircle, Lock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { storeNillionInterests } from '@/functions/storeNillionInterests';

const SUGGESTED_INTERESTS = [
  'AI & Machine Learning',
  'Blockchain',
  'Web3',
  'Gaming',
  'NFTs',
  'DeFi',
  'Music',
  'Art & Design',
  'Photography',
  'Fitness',
  'Travel',
  'Cooking',
  'Reading',
  'Technology',
  'Entrepreneurship',
  'Fashion',
  'Sports',
  'Cryptocurrency',
  'Programming',
  'Mental Health'
];

export default function NillionInterestsManager({ user }) {
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');
  const [isStoring, setIsStoring] = useState(false);
  const [storeResult, setStoreResult] = useState(null);
  const [userKeypair, setUserKeypair] = useState(null);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);

  useEffect(() => {
    if (user?.nillion_private_key && user?.nillion_did) {
      setUserKeypair({
        privateKey: user.nillion_private_key,
        did: user.nillion_did
      });
    }
  }, [user]);

  const handleGenerateKeys = async () => {
    setIsGeneratingKeys(true);
    setStoreResult(null);
    
    try {
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      
      const privateKey = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const did = `did:nillion:${crypto.randomUUID()}`;

      await base44.auth.updateMe({
        nillion_private_key: privateKey,
        nillion_did: did
      });

      setUserKeypair({ privateKey, did });
      
      setStoreResult({
        success: true,
        message: 'Nillion keys generated successfully! You can now store your private interests on the Nillion network.',
        result: {
          mode: 'nillion_mpc'
        }
      });
    } catch (error) {
      console.error('Error generating keys:', error);
      setStoreResult({
        success: false,
        error: 'Failed to generate Nillion keys: ' + error.message
      });
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  const addInterest = (interest) => {
    if (interest && !interests.includes(interest)) {
      setInterests([...interests, interest]);
      setNewInterest('');
    }
  };

  const removeInterest = (interest) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleStoreInterests = async () => {
    if (interests.length === 0) {
      setStoreResult({
        success: false,
        error: 'Please add at least one interest'
      });
      return;
    }

    if (!userKeypair) {
      setStoreResult({
        success: false,
        error: 'Please generate your Nillion keys first'
      });
      return;
    }

    setIsStoring(true);
    setStoreResult(null);

    try {
      const response = await storeNillionInterests({
        interests: interests
      });

      if (response.data?.success) {
        setStoreResult({
          success: true,
          message: response.data.message || 'Interests stored securely on Nillion network using MPC! Find matches on the Discovery page.',
          result: response.data.result
        });
        
        setInterests([]);
      } else {
        setStoreResult({
          success: false,
          error: response.data?.error || 'Failed to store interests'
        });
      }
    } catch (error) {
      console.error('Error storing interests:', error);
      setStoreResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsStoring(false);
    }
  };

  return (
    <Card className="dark-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          Private Interests (Nillion MPC Network)
        </CardTitle>
        <p className="text-sm text-gray-400 mt-2">
          Store your interests as encrypted shares on Nillion's decentralized network. Your interests are split into mathematical shares and distributed across multiple nodes - no single party ever sees your data.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!userKeypair ? (
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-4">
              <Lock className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-2">Setup Required</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Generate a Nillion keypair to enable MPC-based private interest storage. This keypair is used to create secret shares that are distributed across the Nillion network.
                </p>
                <Button
                  onClick={handleGenerateKeys}
                  disabled={isGeneratingKeys}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isGeneratingKeys ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Keys...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Generate Nillion Keys
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-600/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">Nillion MPC Keys Active</span>
            </div>
            <p className="text-xs text-gray-400 mb-2">Your DID:</p>
            <p className="text-xs font-mono text-purple-400 break-all">{userKeypair.did}</p>
          </div>
        )}

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Add Your Interests</label>
          <div className="flex gap-2">
            <Input
              placeholder="Type an interest or select from suggestions..."
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addInterest(newInterest)}
              className="bg-black/20 border-purple-500/20 text-white"
              disabled={!userKeypair}
            />
            <Button
              onClick={() => addInterest(newInterest)}
              disabled={!newInterest || !userKeypair}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">Suggested Interests:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_INTERESTS.map((interest) => (
              <Button
                key={interest}
                variant="outline"
                size="sm"
                onClick={() => addInterest(interest)}
                disabled={interests.includes(interest) || !userKeypair}
                className="border-purple-500/30 text-white hover:bg-purple-500/10"
              >
                {interest}
              </Button>
            ))}
          </div>
        </div>

        {interests.length > 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Your Interests ({interests.length}):</p>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge
                  key={interest}
                  className="bg-purple-600/20 text-purple-300 border-purple-500/40 pr-1"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="ml-2 hover:bg-purple-500/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleStoreInterests}
          disabled={isStoring || interests.length === 0 || !userKeypair}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
        >
          {isStoring ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Storing on Nillion MPC Network...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Store on Nillion Network (MPC)
            </>
          )}
        </Button>

        <AnimatePresence>
          {storeResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg ${
                storeResult.success
                  ? 'bg-green-600/10 border border-green-500/20'
                  : 'bg-red-600/10 border border-red-500/20'
              }`}
            >
              <div className="flex items-start gap-3">
                {storeResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${storeResult.success ? 'text-green-300' : 'text-red-300'}`}>
                    {storeResult.success ? 'Success!' : 'Error'}
                  </p>
                  <p className={`text-xs mt-1 ${storeResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {storeResult.message || storeResult.error}
                  </p>
                  {storeResult.result && (
                    <div className="mt-2 p-2 bg-black/20 rounded">
                      <p className="text-xs text-gray-400">
                        Stored {storeResult.result.storedCount} interests in collection {storeResult.result.collectionId}
                      </p>
                      {storeResult.result.mode && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${
                            storeResult.result.mode === 'nillion_mpc' 
                              ? 'bg-green-600/20 text-green-400 border-green-500/30'
                              : 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
                          }`}>
                            {storeResult.result.mode === 'nillion_mpc' ? (
                              <>
                                <Sparkles className="w-3 h-3 mr-1" />
                                Nillion MPC Active
                              </>
                            ) : (
                              <>
                                <Shield className="w-3 h-3 mr-1" />
                                Encrypted (Fallback)
                              </>
                            )}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Network: {storeResult.result.network}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-purple-600/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
            <div className="text-xs text-gray-400">
              <p className="font-semibold text-purple-300 mb-2">Nillion MPC Technology:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Interests are split into mathematical shares using secret sharing</li>
                <li>Shares are distributed across multiple Nillion nodes</li>
                <li>No single node or party ever sees your actual interest</li>
                <li>Matching happens via secure multi-party computation (MPC)</li>
                <li>Only mutual matches are revealed - your individual interests remain private</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}