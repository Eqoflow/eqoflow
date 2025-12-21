
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { UploadFile } from '@/integrations/Core';
import {
  Shield,
  Plus,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  FileText,
  Trash2,
  Edit,
  Info } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ProfessionalCredentialsManager({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingCredential, setIsAddingCredential] = useState(false);
  const [newCredential, setNewCredential] = useState({
    type: 'license',
    title: '',
    issuer: '',
    credential_number: '',
    verification_url: '',
    issue_date: '',
    expiry_date: '',
    notes: '',
    public_display: true
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [basicInfo, setBasicInfo] = useState({
    profession: user?.professional_credentials?.profession || '',
    regulatory_body: user?.professional_credentials?.regulatory_body || '',
    license_number: user?.professional_credentials?.license_number || ''
  });

  const credentials = user?.professional_credentials || {
    is_verified: false,
    verification_status: 'pending',
    credentials: []
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await UploadFile({ file });
      setNewCredential((prev) => ({ ...prev, document_url: file_url }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddCredential = () => {
    if (!newCredential.title || !newCredential.issuer) {
      alert('Please fill in the required fields (Title and Issuer)');
      return;
    }

    const updatedCredentials = [
    ...(credentials.credentials || []),
    {
      ...newCredential,
      is_verified: false
    }];


    onUpdate({
      professional_credentials: {
        ...credentials,
        credentials: updatedCredentials
      }
    });

    setNewCredential({
      type: 'license',
      title: '',
      issuer: '',
      credential_number: '',
      verification_url: '',
      issue_date: '',
      expiry_date: '',
      notes: '',
      public_display: true
    });
    setIsAddingCredential(false);
  };

  const handleUpdateBasicInfo = () => {
    onUpdate({
      professional_credentials: {
        ...credentials,
        ...basicInfo,
        verification_status: 'pending'
      }
    });
    setIsEditing(false);
  };

  const handleDeleteCredential = (index) => {
    if (window.confirm('Are you sure you want to delete this credential?')) {
      const updatedCredentials = credentials.credentials.filter((_, i) => i !== index);
      onUpdate({
        professional_credentials: {
          ...credentials,
          credentials: updatedCredentials
        }
      });
    }
  };

  const handleTogglePublicDisplay = (index) => {
    const updatedCredentials = [...credentials.credentials];
    updatedCredentials[index].public_display = !updatedCredentials[index].public_display;

    onUpdate({
      professional_credentials: {
        ...credentials,
        credentials: updatedCredentials
      }
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-600/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30';
      case 'rejected':
        return 'bg-red-600/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="bg-[#000000] space-y-6">
        {/* Basic Professional Information */}
        <Card className="dark-card">
          <CardHeader className="bg-[#000000] p-6 space-y-1.5 flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Professional Information
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-black/90 border border-blue-500/30 text-white p-3 rounded-lg max-w-sm">
                  <p className="text-sm">
                    Verify your professional status here. Add your title and regulatory body, then upload credentials like licenses or qualifications. After review, a verified badge will be added to your profile.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon(credentials.verification_status)}
              <Badge className={getStatusColor(credentials.verification_status)}>
                {credentials.verification_status || 'Not Submitted'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="bg-[#000000] pt-0 p-6 space-y-4">
            {credentials.verification_status === 'pending' &&
            <div className="p-4 bg-yellow-600/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  Your professional credentials are under review. This process typically takes 2-3 business days.
                </p>
              </div>
            }

            {credentials.verification_status === 'rejected' &&
            <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-lg">
                <p className="text-red-300 text-sm">
                  Your professional credentials were rejected. Please review the information and resubmit.
                </p>
              </div>
            }

            {isEditing ?
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4">

                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">
                    Professional Title *
                  </label>
                  <Input
                  value={basicInfo.profession}
                  onChange={(e) => setBasicInfo((prev) => ({ ...prev, profession: e.target.value }))}
                  placeholder="e.g., Medical Doctor, Lawyer, Engineer"
                  className="bg-black/20 border-blue-500/20 text-white" />

                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">
                    Regulatory Body *
                  </label>
                  <Input
                  value={basicInfo.regulatory_body}
                  onChange={(e) => setBasicInfo((prev) => ({ ...prev, regulatory_body: e.target.value }))}
                  placeholder="e.g., GMC UK, Bar Association, Engineering Council"
                  className="bg-black/20 border-blue-500/20 text-white" />

                </div>

                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">
                    License/Registration Number *
                  </label>
                  <Input
                  value={basicInfo.license_number}
                  onChange={(e) => setBasicInfo((prev) => ({ ...prev, license_number: e.target.value }))}
                  placeholder="Your professional license number"
                  className="bg-black/20 border-blue-500/20 text-white" />

                </div>

                <div className="flex gap-3">
                  <Button
                  onClick={handleUpdateBasicInfo}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500">

                    Save Information
                  </Button>
                  <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="border-gray-600 text-gray-400">

                    Cancel
                  </Button>
                </div>
              </motion.div> :

            <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-400">Professional Title</span>
                    <p className="text-white font-medium">
                      {credentials.profession || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Regulatory Body</span>
                    <p className="text-white font-medium">
                      {credentials.regulatory_body || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">

                  <Edit className="w-4 h-4 mr-2" />
                  Edit Professional Information
                </Button>
              </div>
            }
          </CardContent>
        </Card>

        {/* Credentials List */}
        <Card className="dark-card">
          <CardHeader className="bg-[#000000] p-6 space-y-1.5 flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Credentials & Documents
            </CardTitle>
            <Button
              onClick={() => setIsAddingCredential(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-500">

              <Plus className="w-4 h-4 mr-2" />
              Add Credential
            </Button>
          </CardHeader>
          <CardContent className="bg-[#000000] pt-0 p-6">
            {credentials.credentials && credentials.credentials.length > 0 ?
            <div className="space-y-4">
                {credentials.credentials.map((cred, index) =>
              <div key={index} className="p-4 bg-black/20 rounded-lg border border-purple-500/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-white">{cred.title}</h4>
                          {getStatusIcon(cred.is_verified ? 'verified' : 'pending')}
                          <Badge className={`text-xs ${
                      cred.is_verified ?
                      'bg-green-600/20 text-green-400' :
                      'bg-yellow-600/20 text-yellow-400'}`
                      }>
                            {cred.is_verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{cred.issuer}</p>
                        {cred.credential_number &&
                    <p className="text-gray-500 text-sm">#{cred.credential_number}</p>
                    }
                        {cred.expiry_date &&
                    <p className="text-gray-500 text-sm">
                            Expires: {new Date(cred.expiry_date).toLocaleDateString()}
                          </p>
                    }
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Public</span>
                          <Switch
                        checked={cred.public_display}
                        onCheckedChange={() => handleTogglePublicDisplay(index)} />

                        </div>
                        {cred.verification_url &&
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(cred.verification_url, '_blank')}>

                            <ExternalLink className="w-4 h-4" />
                          </Button>
                    }
                        <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCredential(index)}
                      className="text-red-400 hover:text-red-300">

                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
              )}
              </div> :

            <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p>No credentials added yet.</p>
                <p className="text-sm">Add your professional credentials to get verified.</p>
              </div>
            }
          </CardContent>
        </Card>

        {/* Add Credential Modal */}
        <AnimatePresence>
          {isAddingCredential &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

              <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Add Professional Credential</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">
                        Credential Type *
                      </label>
                      <select
                      value={newCredential.type}
                      onChange={(e) => setNewCredential((prev) => ({ ...prev, type: e.target.value }))}
                      className="w-full p-3 bg-black/20 border border-purple-500/20 rounded-lg text-white">

                        <option value="license">Professional License</option>
                        <option value="qualification">Educational Qualification</option>
                        <option value="membership">Professional Membership</option>
                        <option value="insurance">Professional Insurance</option>
                        <option value="certification">Certification</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">
                        Title *
                      </label>
                      <Input
                      value={newCredential.title}
                      onChange={(e) => setNewCredential((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Medical License, MBBS, Royal College Membership"
                      className="bg-black/20 border-purple-500/20 text-white" />

                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">
                        Issuing Organization *
                      </label>
                      <Input
                      value={newCredential.issuer}
                      onChange={(e) => setNewCredential((prev) => ({ ...prev, issuer: e.target.value }))}
                      placeholder="e.g., GMC UK, Oxford University, Royal College"
                      className="bg-black/20 border-purple-500/20 text-white" />

                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">
                        Credential Number
                      </label>
                      <Input
                      value={newCredential.credential_number}
                      onChange={(e) => setNewCredential((prev) => ({ ...prev, credential_number: e.target.value }))}
                      placeholder="License/certificate number"
                      className="bg-black/20 border-purple-500/20 text-white" />

                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">
                        Verification URL
                      </label>
                      <Input
                      value={newCredential.verification_url}
                      onChange={(e) => setNewCredential((prev) => ({ ...prev, verification_url: e.target.value }))}
                      placeholder="URL to verify this credential online"
                      className="bg-black/20 border-purple-500/20 text-white" />

                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-400 mb-2 block">
                          Issue Date
                        </label>
                        <Input
                        type="date"
                        value={newCredential.issue_date}
                        onChange={(e) => setNewCredential((prev) => ({ ...prev, issue_date: e.target.value }))}
                        className="bg-black/20 border-purple-500/20 text-white" />

                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-400 mb-2 block">
                          Expiry Date
                        </label>
                        <Input
                        type="date"
                        value={newCredential.expiry_date}
                        onChange={(e) => setNewCredential((prev) => ({ ...prev, expiry_date: e.target.value }))}
                        className="bg-black/20 border-purple-500/20 text-white" />

                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">
                        Upload Document
                      </label>
                      <div className="flex items-center gap-4">
                        <Button
                        onClick={() => document.getElementById('credential-upload').click()}
                        variant="outline"
                        disabled={uploadingFile}
                        className="border-purple-500/30 text-purple-400">

                          {uploadingFile ?
                        <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400 mr-2" />
                              Uploading...
                            </> :

                        <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Document
                            </>
                        }
                        </Button>
                        <input
                        id="credential-upload"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden" />

                        {newCredential.document_url &&
                      <span className="text-sm text-green-400">Document uploaded ✓</span>
                      }
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">
                        Additional Notes
                      </label>
                      <Textarea
                      value={newCredential.notes}
                      onChange={(e) => setNewCredential((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any additional information about this credential"
                      className="bg-black/20 border-purple-500/20 text-white"
                      rows={3} />

                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                      checked={newCredential.public_display}
                      onCheckedChange={(checked) => setNewCredential((prev) => ({ ...prev, public_display: checked }))} />

                      <span className="text-sm text-gray-400">
                        Show this credential in public badge tooltip
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                    onClick={handleAddCredential}
                    className="bg-gradient-to-r from-purple-600 to-pink-500">

                      Add Credential
                    </Button>
                    <Button
                    onClick={() => setIsAddingCredential(false)}
                    variant="outline"
                    className="border-gray-600 text-gray-400">

                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          }
        </AnimatePresence>
      </div>
    </TooltipProvider>);

}