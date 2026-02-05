import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Shield,
  Lock,
  Eye,
  Key,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  MessageCircle,
  DollarSign,
  Check,
  X,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NillionInterestsManager from "../privacy/NillionInterestsManager";
import { nillionPrivacy } from "@/functions/nillionPrivacy";
import { requestAccountDeletion } from "@/functions/requestAccountDeletion";

export default function PrivacyHubTab({ user, onUpdate }) {
  const [activeSection, setActiveSection] = useState('interests');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: user?.privacy_settings?.profile_visibility || 'public',
    show_activity: user?.privacy_settings?.show_activity ?? true,
    show_followers: user?.privacy_settings?.show_followers ?? true,
    allow_stranger_messages: user?.privacy_settings?.allow_stranger_messages ?? true,
    profanity_filter_enabled: user?.privacy_settings?.profanity_filter_enabled ?? false,
    data_monetization_enabled: user?.privacy_settings?.data_monetization_enabled ?? true
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [privateData, setPrivateData] = useState('');
  const [retrievalPassword, setRetrievalPassword] = useState('');
  const [storeResult, setStoreResult] = useState(null);
  const [myStores, setMyStores] = useState([]);
  
  const [retrieveStoreId, setRetrieveStoreId] = useState('');
  const [retrieveSecretId, setRetrieveSecretId] = useState('');
  const [retrievePassword, setRetrievePassword] = useState('');
  const [retrievedData, setRetrievedData] = useState('');

  const [grantStoreId, setGrantStoreId] = useState('');
  const [grantSecretId, setGrantSecretId] = useState('');
  const [grantToUserId, setGrantToUserId] = useState('');

  const [birthdate, setBirthdate] = useState('');
  const [birthdatePassword, setBirthdatePassword] = useState('');
  const [birthdateResult, setBirthdateResult] = useState(null);
  const [verifyAgeSecretId, setVerifyAgeSecretId] = useState('');
  const [verifyAgeStoreId, setVerifyAgeStoreId] = useState('');
  const [verifyAgePassword, setVerifyAgePassword] = useState('');
  const [ageVerificationResult, setAgeVerificationResult] = useState(null);

  const [currentProposal] = useState({
    id: 'prop_demo_001',
    title: 'Should we implement feature X?',
    description: 'Vote anonymously on this important decision'
  });
  const [selectedVote, setSelectedVote] = useState('');
  const [votingResults, setVotingResults] = useState(null);

  const [uniquenessResult, setUniquenessResult] = useState(null);

  useEffect(() => {
    if (user) {
      setPrivacySettings({
        profile_visibility: user.privacy_settings?.profile_visibility || 'public',
        show_activity: user.privacy_settings?.show_activity ?? true,
        show_followers: user.privacy_settings?.show_followers ?? true,
        allow_stranger_messages: user.privacy_settings?.allow_stranger_messages ?? true,
        profanity_filter_enabled: user.privacy_settings?.profanity_filter_enabled ?? false,
        data_monetization_enabled: user.privacy_settings?.data_monetization_enabled ?? true
      });
      loadMyStores();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-cyan-400" />
              Privacy Hub
            </h2>
            <p className="text-gray-400 mt-1">Loading privacy settings...</p>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <Check className="w-3 h-3 mr-1" />
            Nillion Powered
          </Badge>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading privacy settings...</p>
        </div>
      </div>
    );
  }

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const loadMyStores = async () => {
    try {
      const result = await nillionPrivacy({ action: 'list_stores' });
      
      if (result.data?.success) {
        setMyStores(result.data.stores || []);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const handleSavePrivacySettings = async () => {
    setIsSavingSettings(true);
    try {
      await onUpdate({
        privacy_settings: privacySettings
      });
      showMessage('success', 'Privacy settings updated successfully!');
    } catch (error) {
      showMessage('error', 'Failed to update privacy settings: ' + error.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePrivacyToggle = (key, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStorePrivateData = async () => {
    if (!privateData || !retrievalPassword) {
      showMessage('error', 'Please provide both data and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await nillionPrivacy({
        action: 'store_private_data',
        data: { privateData, retrievalPassword }
      });

      if (result.data?.success) {
        setStoreResult(result.data);
        showMessage('success', 'Data stored securely! Save your Store ID and Secret ID.');
        setPrivateData('');
        setRetrievalPassword('');
        await loadMyStores();
      } else {
        showMessage('error', result.data?.error || 'Failed to store data');
      }
    } catch (error) {
      showMessage('error', 'Error storing data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetrievePrivateData = async () => {
    if (!retrieveStoreId || !retrieveSecretId || !retrievePassword) {
      showMessage('error', 'Please provide Store ID, Secret ID, and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await nillionPrivacy({
        action: 'retrieve_private_data',
        data: {
          storeId: retrieveStoreId,
          secretId: retrieveSecretId,
          retrievalPassword: retrievePassword
        }
      });

      if (result.data?.success) {
        setRetrievedData(result.data.data);
        showMessage('success', 'Data retrieved successfully!');
      } else {
        showMessage('error', result.data?.error || 'Failed to retrieve data');
      }
    } catch (error) {
      showMessage('error', 'Error retrieving data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantPermission = async () => {
    if (!grantStoreId || !grantSecretId || !grantToUserId) {
      showMessage('error', 'Please provide all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await nillionPrivacy({
        action: 'grant_permission',
        data: {
          storeId: grantStoreId,
          secretId: grantSecretId,
          grantToUserId
        }
      });

      if (result.data?.success) {
        showMessage('success', 'Permission granted successfully!');
        setGrantStoreId('');
        setGrantSecretId('');
        setGrantToUserId('');
      } else {
        showMessage('error', result.data?.error || 'Failed to grant permission');
      }
    } catch (error) {
      showMessage('error', 'Error granting permission: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoreBirthdate = async () => {
    if (!birthdate || !birthdatePassword) {
      showMessage('error', 'Please provide birthdate and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await nillionPrivacy({
        action: 'store_birthdate_for_mpc',
        data: { birthdate, retrievalPassword: birthdatePassword }
      });

      if (result.data?.success) {
        setBirthdateResult(result.data);
        showMessage('success', 'Birthdate stored securely!');
        setBirthdate('');
        setBirthdatePassword('');
      } else {
        showMessage('error', result.data?.error || 'Failed to store birthdate');
      }
    } catch (error) {
      showMessage('error', 'Error storing birthdate: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAge = async () => {
    if (!verifyAgeSecretId || !verifyAgeStoreId || !verifyAgePassword) {
      showMessage('error', 'Please provide Secret ID, Store ID, and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await nillionPrivacy({
        action: 'verify_age_mpc',
        data: {
          secretId: verifyAgeSecretId,
          storeId: verifyAgeStoreId,
          retrievalPassword: verifyAgePassword,
          ageThreshold: 18
        }
      });

      if (result.data?.success) {
        setAgeVerificationResult(result.data.result);
        showMessage('success', 'Age verification completed!');
      } else {
        showMessage('error', result.data?.error || 'Failed to verify age');
      }
    } catch (error) {
      showMessage('error', 'Error verifying age: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCastVote = async () => {
    if (!selectedVote) {
      showMessage('error', 'Please select a vote option');
      return;
    }

    setIsLoading(true);
    try {
      const result = await nillionPrivacy({
        action: 'cast_anonymous_vote',
        data: { proposalId: currentProposal.id, vote: selectedVote }
      });

      if (result.data?.success) {
        showMessage('success', 'Vote cast anonymously!');
        setSelectedVote('');
      } else {
        showMessage('error', result.data?.error || 'Failed to cast vote');
      }
    } catch (error) {
      showMessage('error', 'Error casting vote: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewResults = async () => {
    setIsLoading(true);
    try {
      const result = await nillionPrivacy({
        action: 'get_voting_results',
        data: { proposalId: currentProposal.id }
      });

      if (result.data?.success) {
        setVotingResults(result.data.results);
        showMessage('success', 'Results retrieved!');
      } else {
        showMessage('error', result.data?.error || 'Failed to get results');
      }
    } catch (error) {
      showMessage('error', 'Error getting results: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateUniquenessProof = async () => {
    setIsLoading(true);
    try {
      const result = await nillionPrivacy({
        action: 'verify_uniqueness',
        data: { userEmail: user.email, verificationType: 'email_based' }
      });

      if (result.data?.success) {
        setUniquenessResult(result.data.result);
        showMessage('success', 'Uniqueness proof generated!');
      } else {
        showMessage('error', result.data?.error || 'Failed to generate proof');
      }
    } catch (error) {
      showMessage('error', 'Error generating proof: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      showMessage('error', 'Please type the confirmation text exactly as shown');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await requestAccountDeletion();
      showMessage('success', 'Account deletion request submitted. You will be logged out shortly.');
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (error) {
      showMessage('error', 'Failed to delete account: ' + error.message);
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-400" />
            Privacy Hub
          </h2>
          <p className="text-gray-400 mt-1">
            Control your privacy, data, and security settings
          </p>
        </div>
        <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
          ✓ Nillion Powered
        </Badge>
      </div>

      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-600/10 border-green-500/30 text-green-400'
                : 'bg-red-600/10 border-red-500/30 text-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2 bg-black/20 p-2 rounded-xl">
        {[
          { id: 'interests', label: 'Private Interests', icon: Users },
          { id: 'settings', label: 'Privacy Settings', icon: Shield },
          { id: 'storage', label: 'Private Storage', icon: Lock },
          { id: 'age', label: 'Age Verification', icon: Calendar },
          { id: 'governance', label: 'Anonymous Voting', icon: CheckCircle },
          { id: 'uniqueness', label: 'Uniqueness Proof', icon: Key },
          { id: 'delete', label: 'Delete Account', icon: Trash2 }
        ].map(tab => (
          <Button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            variant={activeSection === tab.id ? "default" : "ghost"}
            className={`flex items-center gap-2 text-xs md:text-sm ${
              activeSection === tab.id
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                : "text-gray-400 hover:text-white hover:bg-black/30"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeSection === 'settings' && (
            <div className="space-y-6">
              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    Profile Visibility & Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-black/20 border border-purple-500/20 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Public Profile</h3>
                      <p className="text-sm text-gray-400">Allow anyone on the internet to see your profile.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {privacySettings.profile_visibility === 'public' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <Switch
                        checked={privacySettings.profile_visibility === 'public'}
                        onCheckedChange={(checked) => handlePrivacyToggle('profile_visibility', checked ? 'public' : 'private')}
                        className={privacySettings.profile_visibility === 'public' ? 'data-[state=checked]:bg-green-600' : 'data-[state=unchecked]:bg-red-600'}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/20 border border-purple-500/20 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Show Activity Status</h3>
                      <p className="text-sm text-gray-400">Let others see when you are online.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {privacySettings.show_activity ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <Switch
                        checked={privacySettings.show_activity}
                        onCheckedChange={(checked) => handlePrivacyToggle('show_activity', checked)}
                        className={privacySettings.show_activity ? 'data-[state=checked]:bg-green-600' : 'data-[state=unchecked]:bg-red-600'}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/20 border border-purple-500/20 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Show Followers & Following Lists</h3>
                      <p className="text-sm text-gray-400">Allow others to see who you follow and who follows you.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {privacySettings.show_followers ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <Switch
                        checked={privacySettings.show_followers}
                        onCheckedChange={(checked) => handlePrivacyToggle('show_followers', checked)}
                        className={privacySettings.show_followers ? 'data-[state=checked]:bg-green-600' : 'data-[state=unchecked]:bg-red-600'}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/20 border border-purple-500/20 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Profanity Filter</h3>
                      <p className="text-sm text-gray-400">Automatically hide profanity with asterisks on your feed and messages.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {privacySettings.profanity_filter_enabled ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <Switch
                        checked={privacySettings.profanity_filter_enabled}
                        onCheckedChange={(checked) => handlePrivacyToggle('profanity_filter_enabled', checked)}
                        className={privacySettings.profanity_filter_enabled ? 'data-[state=checked]:bg-green-600' : 'data-[state=unchecked]:bg-red-600'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                    Messaging Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-black/20 border border-blue-500/20 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Allow Messages from Strangers</h3>
                      <p className="text-sm text-gray-400">Receive direct messages from users you don't follow.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {privacySettings.allow_stranger_messages ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <Switch
                        checked={privacySettings.allow_stranger_messages}
                        onCheckedChange={(checked) => handlePrivacyToggle('allow_stranger_messages', checked)}
                        className={privacySettings.allow_stranger_messages ? 'data-[state=checked]:bg-green-600' : 'data-[state=unchecked]:bg-red-600'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    Data & Monetization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/20 border border-green-500/20 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Enable Data Monetization</h3>
                      <p className="text-sm text-gray-400">Earn rewards by sharing anonymized interaction data with the platform.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {privacySettings.data_monetization_enabled ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <Switch
                        checked={privacySettings.data_monetization_enabled}
                        onCheckedChange={(checked) => handlePrivacyToggle('data_monetization_enabled', checked)}
                        className={privacySettings.data_monetization_enabled ? 'data-[state=checked]:bg-green-600' : 'data-[state=unchecked]:bg-red-600'}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                    <h3 className="font-bold text-blue-300 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      How Data Monetization Works
                    </h3>
                    <p className="text-sm text-blue-200">
                      When enabled, engagement patterns help us improve the platform. In return, you earn Engagement Points that contribute to your ranking on the weekly, monthly, and quarterly leaderboards. Your personal information remains private and secure—only anonymized behavioral data is used for platform analytics.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleSavePrivacySettings}
                  disabled={isSavingSettings}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                >
                  {isSavingSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Save Privacy Settings
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'storage' && (
            <div className="space-y-6">
              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-400" />
                    Store & Encrypt Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-400">Your Private Data</Label>
                    <Textarea
                      value={privateData}
                      onChange={(e) => setPrivateData(e.target.value)}
                      placeholder="Enter sensitive data to store securely..."
                      className="bg-black/20 border-purple-500/20 text-white mt-2"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Retrieval Password</Label>
                    <Input
                      type="password"
                      value={retrievalPassword}
                      onChange={(e) => setRetrievalPassword(e.target.value)}
                      placeholder="Set a password to retrieve this data later"
                      className="bg-black/20 border-purple-500/20 text-white mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleStorePrivateData}
                    disabled={isLoading || !privateData || !retrievalPassword}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                    Encrypt & Store
                  </Button>

                  {storeResult && (
                    <div className="p-4 bg-green-600/10 border border-green-500/30 rounded-lg space-y-2">
                      <p className="text-green-400 font-bold">✓ Successfully Stored!</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-300">Store ID: <code className="bg-black/30 px-2 py-1 rounded">{storeResult.store_id}</code></p>
                        <p className="text-gray-300">Secret ID: <code className="bg-black/30 px-2 py-1 rounded">{storeResult.secret_id}</code></p>
                      </div>
                      <p className="text-yellow-400 text-xs">⚠ Save these IDs! You'll need them to retrieve your data.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-blue-400" />
                    Retrieve & Decrypt Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-400">Store ID</Label>
                    <Input
                      value={retrieveStoreId}
                      onChange={(e) => setRetrieveStoreId(e.target.value)}
                      placeholder="Enter Store ID"
                      className="bg-black/20 border-blue-500/20 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Secret ID</Label>
                    <Input
                      value={retrieveSecretId}
                      onChange={(e) => setRetrieveSecretId(e.target.value)}
                      placeholder="Enter Secret ID"
                      className="bg-black/20 border-blue-500/20 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Retrieval Password</Label>
                    <Input
                      type="password"
                      value={retrievePassword}
                      onChange={(e) => setRetrievePassword(e.target.value)}
                      placeholder="Enter your password"
                      className="bg-black/20 border-blue-500/20 text-white mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleRetrievePrivateData}
                    disabled={isLoading || !retrieveStoreId || !retrieveSecretId || !retrievePassword}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                    Decrypt & Retrieve
                  </Button>

                  {retrievedData && (
                    <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-400 font-bold mb-2">✓ Data Retrieved:</p>
                      <div className="bg-black/30 p-3 rounded text-white whitespace-pre-wrap break-words">
                        {retrievedData}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-400" />
                    Grant Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-400 text-sm">Share access to your encrypted data with specific users</p>
                  <div>
                    <Label className="text-gray-400">Store ID</Label>
                    <Input
                      value={grantStoreId}
                      onChange={(e) => setGrantStoreId(e.target.value)}
                      placeholder="Enter Store ID"
                      className="bg-black/20 border-green-500/20 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Secret ID</Label>
                    <Input
                      value={grantSecretId}
                      onChange={(e) => setGrantSecretId(e.target.value)}
                      placeholder="Enter Secret ID"
                      className="bg-black/20 border-green-500/20 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Grant To (User ID/Email)</Label>
                    <Input
                      value={grantToUserId}
                      onChange={(e) => setGrantToUserId(e.target.value)}
                      placeholder="Enter user ID or email"
                      className="bg-black/20 border-green-500/20 text-white mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleGrantPermission}
                    disabled={isLoading || !grantStoreId || !grantSecretId || !grantToUserId}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                    Grant Permission
                  </Button>
                </CardContent>
              </Card>

              {myStores.length > 0 && (
                <Card className="dark-card">
                  <CardHeader>
                    <CardTitle className="text-white">Your Private Data Stores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {myStores.map((store) => (
                        <div key={store.id} className="p-3 bg-black/20 border border-purple-500/20 rounded-lg">
                          <p className="text-sm text-gray-400">Store ID: <code className="text-purple-400">{store.id}</code></p>
                          <p className="text-sm text-gray-400">Secret ID: <code className="text-purple-400">{store.secret_id}</code></p>
                          <p className="text-xs text-gray-500 mt-1">Created: {new Date(store.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeSection === 'age' && (
            <div className="space-y-6">
              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    Store Your Birthdate Securely
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    Store your birthdate encrypted on Nillion. This enables zero-knowledge age verification.
                  </p>
                  <div>
                    <Label className="text-gray-400">Birthdate</Label>
                    <Input
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="bg-black/20 border-blue-500/20 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Password</Label>
                    <Input
                      type="password"
                      value={birthdatePassword}
                      onChange={(e) => setBirthdatePassword(e.target.value)}
                      placeholder="Set a password for verification"
                      className="bg-black/20 border-blue-500/20 text-white mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleStoreBirthdate}
                    disabled={isLoading || !birthdate || !birthdatePassword}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                    Encrypt & Store Birthdate
                  </Button>

                  {birthdateResult && (
                    <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg space-y-2">
                      <p className="text-blue-400 font-bold">✓ Birthdate Stored!</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-300">Store ID: <code className="bg-black/30 px-2 py-1 rounded">{birthdateResult.store_id}</code></p>
                        <p className="text-gray-300">Secret ID: <code className="bg-black/30 px-2 py-1 rounded">{birthdateResult.secret_id}</code></p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Verify Age (18+) Privately
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    Prove you're over 18 without revealing your exact birthdate using MPC.
                  </p>
                  <div>
                    <Label className="text-gray-400">Store ID</Label>
                    <Input
                      value={verifyAgeStoreId}
                      onChange={(e) => setVerifyAgeStoreId(e.target.value)}
                      placeholder="Enter Store ID from above"
                      className="bg-black/20 border-green-500/20 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Secret ID</Label>
                    <Input
                      value={verifyAgeSecretId}
                      onChange={(e) => setVerifyAgeSecretId(e.target.value)}
                      placeholder="Enter Secret ID from above"
                      className="bg-black/20 border-green-500/20 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400">Password</Label>
                    <Input
                      type="password"
                      value={verifyAgePassword}
                      onChange={(e) => setVerifyAgePassword(e.target.value)}
                      placeholder="Enter your password"
                      className="bg-black/20 border-green-500/20 text-white mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleVerifyAge}
                    disabled={isLoading || !verifyAgeSecretId || !verifyAgeStoreId || !verifyAgePassword}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-500"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Verify Age with MPC
                  </Button>

                  {ageVerificationResult && (
                    <div className={`p-4 border rounded-lg ${
                      ageVerificationResult.meetsRequirement
                        ? 'bg-green-600/10 border-green-500/30'
                        : 'bg-red-600/10 border-red-500/30'
                    }`}>
                      <p className={`font-bold mb-2 ${
                        ageVerificationResult.meetsRequirement ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {ageVerificationResult.meetsRequirement ? '✓ Age Verified: 18+' : '✗ Under 18'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Method: {ageVerificationResult.computationMethod}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'interests' && (
            <NillionInterestsManager user={user} showMessage={showMessage} />
          )}

          {activeSection === 'governance' && (
            <div className="space-y-6">
              <Card className="dark-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                    Anonymous Governance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                    <h3 className="font-bold text-white mb-2">{currentProposal.title}</h3>
                    <p className="text-gray-400 text-sm">{currentProposal.description}</p>
                  </div>

                  <div>
                    <Label className="text-gray-400 mb-3 block">Your Vote</Label>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setSelectedVote('yes')}
                        variant={selectedVote === 'yes' ? 'default' : 'outline'}
                        className={`flex-1 ${selectedVote === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'border-green-500/30 text-green-400'}`}
                      >
                        Yes
                      </Button>
                      <Button
                        onClick={() => setSelectedVote('no')}
                        variant={selectedVote === 'no' ? 'default' : 'outline'}
                        className={`flex-1 ${selectedVote === 'no' ? 'bg-red-600 hover:bg-red-700' : 'border-red-500/30 text-red-400'}`}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleCastVote}
                    disabled={isLoading || !selectedVote}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Cast Vote Anonymously
                  </Button>

                  <div className="pt-4 border-t border-gray-700">
                    <Button
                      onClick={handleViewResults}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full border-purple-500/30 text-purple-400"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                      View Aggregated Results
                    </Button>
                  </div>

                  {votingResults && (
                    <div className="p-4 bg-purple-600/10 border border-purple-500/30 rounded-lg space-y-3">
                      <p className="font-bold text-white">Voting Results</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-green-400">Yes Votes:</span>
                          <span className="text-white font-bold">{votingResults.yesVotes} ({votingResults.yesPercentage}%)</span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${votingResults.yesPercentage}%` }} />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-red-400">No Votes:</span>
                          <span className="text-white font-bold">{votingResults.noVotes} ({votingResults.noPercentage}%)</span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: `${votingResults.noPercentage}%` }} />
                        </div>
                        <div className="text-center text-gray-400 text-sm pt-2">
                          Total Votes: {votingResults.totalVotes}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'uniqueness' && (
            <Card className="dark-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  Private Proof of Uniqueness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Generate a zero-knowledge proof that you're a unique human without revealing your identity.
                </p>
                <Button
                  onClick={handleGenerateUniquenessProof}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                  Generate Uniqueness Proof
                </Button>

                {uniquenessResult && (
                  <div className="p-4 bg-purple-600/10 border border-purple-500/30 rounded-lg space-y-2">
                    <p className="text-purple-400 font-bold">✓ Uniqueness Verified!</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-300">Proof ID: <code className="bg-black/30 px-2 py-1 rounded">{uniquenessResult.proofId}</code></p>
                      <p className="text-gray-300">Method: {uniquenessResult.method}</p>
                      <p className="text-gray-300">Timestamp: {new Date(uniquenessResult.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'delete' && (
            <Card className="dark-card border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Delete Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-lg space-y-3">
                  <p className="text-red-300 font-bold">⚠ Warning: This action is permanent and cannot be undone</p>
                  <p className="text-gray-300 text-sm">
                    Deleting your account will:
                  </p>
                  <ul className="text-gray-300 text-sm list-disc list-inside space-y-1">
                    <li>Permanently remove all your posts, comments, and content</li>
                    <li>Delete your profile and personal information</li>
                    <li>Forfeit all your tokens and rewards</li>
                    <li>Remove you from all communities and subscriptions</li>
                    <li>Cancel all pending transactions</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Permanently Delete My Account
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => !isDeletingAccount && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="dark-card border-red-500/50">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Confirm Account Deletion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-300 text-sm mb-2">
                      This will permanently delete your account and all associated data. This action cannot be reversed.
                    </p>
                    <p className="text-gray-300 text-sm">
                      To confirm, type <strong className="text-white">DELETE MY ACCOUNT</strong> below:
                    </p>
                  </div>

                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type: DELETE MY ACCOUNT"
                    className="bg-black/20 border-red-500/20 text-white"
                    disabled={isDeletingAccount}
                  />

                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeleteConfirmText('');
                      }}
                      variant="outline"
                      className="flex-1 border-gray-500/30 text-white hover:bg-gray-500/10"
                      disabled={isDeletingAccount}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {isDeletingAccount ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Forever
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}