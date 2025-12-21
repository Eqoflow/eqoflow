import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import {
  CreditCard,
  Plus,
  Trash2,
  DollarSign,
  Euro,
  PoundSterling,
  Loader2,
  Shield,
  Info,
  Check,
  Banknote,
  ShieldCheck,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VeriffKYCModal from '../kyc/VeriffKYCModal';

export default function FiatPaymentManager({ user, onUpdate }) {
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'card',
    last4: '',
    brand: '',
    country: 'US',
    currency: 'USD'
  });

  const [squareLink, setSquareLink] = useState(user?.square_connect_link || '');
  const [stripeLink, setStripeLink] = useState(user?.stripe_payment_link || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isAddingBank, setIsAddingBank] = useState(false);
  const [bankDetails, setBankDetails] = useState({
      account_holder_name: '',
      bank_name: '',
      country: 'GB',
      account_number: '',
      sort_code: '',
      iban: '',
      bic_swift: ''
  });

  const [showKYCModal, setShowKYCModal] = useState(false);

  useEffect(() => {
      setSquareLink(user?.square_connect_link || '');
      setStripeLink(user?.stripe_payment_link || '');
      if (user?.bank_payout_details) {
          setBankDetails(user.bank_payout_details);
      } else {
        setBankDetails({
          account_holder_name: '',
          bank_name: '',
          country: 'GB',
          account_number: '',
          sort_code: '',
          iban: '',
          bic_swift: ''
        });
      }
  }, [user]);

  const handleSavePayoutLinks = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
        await base44.User.updateMyUserData({
            square_connect_link: squareLink,
            stripe_payment_link: stripeLink
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (onUpdate) {
            await onUpdate();
        }
    } catch (error) {
        console.error("Error saving payout links:", error);
        setError(error.message || "Failed to save payout links. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleSaveBankDetails = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
        if (!bankDetails.account_holder_name.trim()) {
            throw new Error("Account holder name is required.");
        }

        const currentBankFields = getBankingFieldsForCountry(bankDetails.country);
        for (const [key, config] of Object.entries(currentBankFields)) {
            if (config.required && !(bankDetails[key] && bankDetails[key].trim())) {
                throw new Error(`${config.label} is required.`);
            }
        }

        await base44.User.updateMyUserData({ bank_payout_details: bankDetails });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        setIsAddingBank(false);
        if (onUpdate) {
            await onUpdate();
        }
    } catch (err) {
        console.error("Error saving bank details:", err);
        setError(err.message || "Failed to save bank details. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };

  const existingPaymentMethods = user?.fiat_payment_methods || [];

  const currencies = [
    { code: 'USD', symbol: '$', icon: DollarSign, label: 'US Dollar' },
    { code: 'EUR', symbol: '€', icon: Euro, label: 'Euro' },
    { code: 'GBP', symbol: '£', icon: PoundSterling, label: 'British Pound' }
  ];

  const cardBrands = ['Visa', 'Mastercard', 'American Express', 'Discover'];

  const getBankingFieldsForCountry = (country) => {
    switch (country) {
      case 'GB':
        return {
          account_number: { label: 'Account Number', placeholder: '12345678', required: true },
          sort_code: { label: 'Sort Code', placeholder: '12-34-56', required: true }
        };
      case 'US':
        return {
          account_number: { label: 'Account Number', placeholder: '123456789', required: true },
          routingNumber: { label: 'Routing Number (ACH)', placeholder: '021000021', required: true }
        };
      case 'DE':
      case 'FR':
      case 'ES':
      case 'IT':
      case 'NL':
        return {
          iban: { label: 'IBAN', placeholder: 'DE89 3704 0044 0532 0130 00', required: true },
          bic_swift: { label: 'BIC/SWIFT Code', placeholder: 'COBADEFFXXX', required: false }
        };
      default:
        return {
          iban: { label: 'IBAN', placeholder: 'International Bank Account Number', required: true },
          bic_swift: { label: 'BIC/SWIFT Code', placeholder: 'BANKGB2L', required: true }
        };
    }
  };

  const countries = [
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' }
  ];

  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.brand || !newPaymentMethod.last4) {
      setError('Card Brand and Last 4 digits are required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const paymentData = {
        type: 'card',
        country: newPaymentMethod.country,
        currency: newPaymentMethod.currency,
        brand: newPaymentMethod.brand,
        last4: newPaymentMethod.last4
      };

      const { addFiatPaymentMethod } = await import('@/functions/addFiatPaymentMethod');
      const response = await addFiatPaymentMethod({ paymentMethodData: paymentData });

      if (response.data?.error) throw new Error(response.data.error);

      setIsAddingPayment(false);
      setNewPaymentMethod({
        type: 'card',
        last4: '',
        brand: '',
        country: 'US',
        currency: 'USD'
      });
      if (onUpdate) await onUpdate();

    } catch (err) {
      console.error("Error adding payment method:", err);
      setError(err.message || 'Failed to add payment method. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePaymentMethod = async (methodId) => {
    if (!window.confirm('Are you sure you want to remove this payment method? This action cannot be undone.')) {
      return;
    }

    try {
      const { removeFiatPaymentMethod } = await import('@/functions/removeFiatPaymentMethod');
      const response = await removeFiatPaymentMethod({ paymentMethodId: methodId });
      if (response.data?.error) throw new Error(response.data.error);
      if (onUpdate) await onUpdate();
    } catch (err) {
      console.error("Error removing payment method:", err);
      alert(`Failed to remove payment method: ${err.message}`);
    }
  };

  const getCurrencyIcon = (currencyCode) => {
    const currency = currencies.find(c => c.code === currencyCode);
    return currency ? currency.icon : DollarSign;
  };

  const isKYCVerified = user?.kyc_status === 'verified';

  return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white">Payment Settings</h3>

        <VeriffKYCModal
          isOpen={showKYCModal}
          onClose={() => setShowKYCModal(false)}
          user={user}
          onStatusUpdate={(newStatus) => {
            if (onUpdate) {
              onUpdate({ ...user, kyc_status: newStatus });
            }
          }}
        />

        {!isKYCVerified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-yellow-600/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-yellow-400 font-medium mb-1">Identity Verification Required</p>
                <p className="text-gray-400 text-sm mb-3">
                  To receive payouts on EqoFlow, you must complete identity verification (KYC). This is required for compliance and to protect all users.
                </p>
                <Button
                  onClick={() => setShowKYCModal(true)}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                  <Shield className="w-4 h-4 mr-2" />
                  Start Verification
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Banknote className="w-6 h-6 text-green-400" />
                Payout Links (Optional)
              </span>
              {(user?.square_connect_link || user?.stripe_payment_link) && (
                <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                  Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Provide your payment links here to receive payouts for your content and services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isKYCVerified ? (
              <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Complete KYC verification to manage payout links
                </p>
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-sm font-medium text-gray-400 mb-2 block">Your Square Payout Link</Label>
                  <Input
                    value={squareLink}
                    onChange={(e) => setSquareLink(e.target.value)}
                    className="bg-black/20 border-purple-500/20 text-white"
                    placeholder="https://square.link/your-link"
                    type="url"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-400 mb-2 block">Your Stripe Payment Link</Label>
                  <Input
                    value={stripeLink}
                    onChange={(e) => setStripeLink(e.target.value)}
                    className="bg-black/20 border-purple-500/20 text-white"
                    placeholder="https://buy.stripe.com/your-link"
                    type="url"
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                <div className="border-t border-purple-500/20 pt-6 -mx-6 px-6">
                  <Button onClick={handleSavePayoutLinks} disabled={isSaving} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {saveSuccess ? <Check className="w-4 h-4 mr-2" /> : null}
                    {isSaving ? 'Saving...' : saveSuccess ? 'Links Saved!' : 'Save Payout Links'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Banknote className="w-6 h-6 text-green-400" />
                Bank Details (Direct Deposit)
              </span>
              {user?.bank_payout_details && Object.keys(user.bank_payout_details).length > 0 && (
                <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                  Saved
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Set up your bank account to receive direct payouts. This is often the fastest method.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isKYCVerified ? (
              <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Complete KYC verification to add bank details
                </p>
              </div>
            ) : (
              <>
                {!user?.bank_payout_details && !isAddingBank && (
                    <Button onClick={() => { setIsAddingBank(true); setError(null); }} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Plus className="w-4 h-4 mr-2"/> Add Bank Details
                  </Button>
                )}

                {user?.bank_payout_details && !isAddingBank && (
                    <div className="p-4 bg-black/20 rounded-lg space-y-2 border border-purple-500/20">
                        <p className="text-white font-medium">{user.bank_payout_details.account_holder_name}</p>
                        <p className="text-gray-400 text-sm">{user.bank_payout_details.bank_name || 'N/A'}</p>
                        <p className="text-gray-400 text-sm">
                            {user.bank_payout_details.iban ? `IBAN: •••• ${user.bank_payout_details.iban.slice(-4)}` :
                            (user.bank_payout_details.account_number ? `Acc No: •••• ${user.bank_payout_details.account_number.slice(-4)}` :
                            (user.bank_payout_details.routingNumber ? `Routing No: •••• ${user.bank_payout_details.routingNumber.slice(-4)}` : 'Bank details saved'))}
                        </p>
                        <Button variant="outline" size="sm" onClick={() => { setIsAddingBank(true); setError(null); }} className="mt-2 border-purple-500/30 text-white hover:bg-purple-500/10">Edit Details</Button>
                    </div>
                )}

                <AnimatePresence>
                {isAddingBank && (
                    <motion.div
                        className="space-y-4 p-4 bg-black/20 border border-purple-500/20 rounded-lg"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-300">
                          Please ensure all details are correct to avoid payout delays.
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-400 mb-2 block">Country</Label>
                          <Select
                            value={bankDetails.country}
                            onValueChange={(value) => {setBankDetails({...bankDetails, country: value, iban: '', bic_swift: '', account_number: '', sort_code: '', routingNumber: ''}); setError(null);}}
                          >
                            <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-purple-500/20">
                              {countries.map(country => (
                                <SelectItem key={country.code} value={country.code} className="text-white">
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-400 mb-2 block">Account Holder Name *</Label>
                          <Input value={bankDetails.account_holder_name} onChange={(e) => setBankDetails({...bankDetails, account_holder_name: e.target.value})} className="bg-black/20 border-purple-500/20 text-white" />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-400 mb-2 block">Bank Name (Optional)</Label>
                          <Input value={bankDetails.bank_name} onChange={(e) => setBankDetails({...bankDetails, bank_name: e.target.value})} className="bg-black/20 border-purple-500/20 text-white" />
                        </div>

                        {Object.entries(getBankingFieldsForCountry(bankDetails.country)).map(([key, config]) => (
                            <div key={key}>
                                <Label className="text-sm font-medium text-gray-400 mb-2 block">{config.label} {config.required ? '*' : ''}</Label>
                                <Input value={bankDetails[key] || ''} onChange={(e) => setBankDetails({...bankDetails, [key]: e.target.value})} placeholder={config.placeholder} className="bg-black/20 border-purple-500/20 text-white" />
                            </div>
                        ))}

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                         <div className="flex flex-col sm:flex-row gap-3">
                            <Button variant="outline" onClick={() => { setIsAddingBank(false); setError(null); }} className="flex-1 border-purple-500/30 text-white hover:bg-purple-500/10">Cancel</Button>
                            <Button onClick={handleSaveBankDetails} disabled={isSaving} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Bank Details'}
                            </Button>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-400" />
              Payment Methods for Spending
            </CardTitle>
            <CardDescription className="text-gray-400">
              Add your payment cards to purchase $EQOFLO tokens and pay for services on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-300 mb-1">Secure Card Payments</h4>
                  <p className="text-sm text-blue-200">
                    Your card details are securely processed and never stored on our servers.
                  </p>
                </div>
              </div>
            </div>

            {existingPaymentMethods.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">Your Payment Cards</h4>
                {existingPaymentMethods.map((method) => {
                  const CurrencyIcon = getCurrencyIcon(method.currency);
                  return (
                    <motion.div
                      key={method.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-black/20 border border-purple-500/20 rounded-lg gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <p className="font-medium text-white text-sm sm:text-base">
                              {method.brand} •••• {method.last4}
                            </p>
                            {method.isDefault && (
                              <Badge className="bg-green-600/20 text-green-400 border-green-500/30 text-xs w-fit">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <CurrencyIcon className="w-3 h-3" />
                            <span>{method.currency}</span>
                            <span>•</span>
                            <span>{method.country}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        className="text-gray-400 hover:text-red-400 self-end sm:self-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {!isAddingPayment ? (
              <Button
                onClick={() => { setIsAddingPayment(true); setError(null); }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Card
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 p-4 bg-black/20 border border-purple-500/20 rounded-lg"
              >
                <h4 className="font-medium text-white">Add New Payment Card</h4>

                <div>
                  <Label className="text-sm font-medium text-gray-400 mb-2 block">Country</Label>
                  <Select
                    value={newPaymentMethod.country}
                    onValueChange={(value) => setNewPaymentMethod({...newPaymentMethod, country: value})}
                  >
                    <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-500/20">
                      {countries.map(country => (
                        <SelectItem key={country.code} value={country.code} className="text-white">
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-400 mb-2 block">Card Brand</Label>
                  <Select
                    value={newPaymentMethod.brand}
                    onValueChange={(value) => setNewPaymentMethod({...newPaymentMethod, brand: value})}
                  >
                    <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                      <SelectValue placeholder="Select card brand" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-500/20">
                      {cardBrands.map(brand => (
                        <SelectItem key={brand} value={brand} className="text-white">
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-400 mb-2 block">Last 4 Digits</Label>
                  <Input
                    value={newPaymentMethod.last4}
                    onChange={(e) => setNewPaymentMethod({...newPaymentMethod, last4: e.target.value})}
                    placeholder="1234"
                    maxLength={4}
                    className="bg-black/20 border-purple-500/20 text-white"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-400 mb-2 block">Preferred Currency</Label>
                  <Select
                    value={newPaymentMethod.currency}
                    onValueChange={(value) => setNewPaymentMethod({...newPaymentMethod, currency: value})}
                  >
                    <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-500/20">
                      {currencies.map(currency => {
                        const Icon = currency.icon;
                        return (
                          <SelectItem key={currency.code} value={currency.code} className="text-white">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {currency.label} ({currency.symbol})
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => {
                      setIsAddingPayment(false);
                      setError(null);
                      setNewPaymentMethod({
                        type: 'card',
                        last4: '',
                        brand: '',
                        country: 'US',
                        currency: 'USD'
                      });
                    }}
                    variant="outline"
                    className="flex-1 border-purple-500/30 text-white hover:bg-purple-500/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddPaymentMethod}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Add Card
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Bank-level security:</span>
                <span className="text-green-300">All payment data is encrypted and PCI DSS compliant.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}