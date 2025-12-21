
import React, { useState } from 'react';
import { ITOTransfer } from '@/entities/ITOTransfer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2, DollarSign, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddTransferModal({ onClose, onSuccess }) {
  const [transferMode, setTransferMode] = useState('crypto'); // 'crypto' or 'bank'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Crypto transfer fields
  const [txid, setTxid] = useState('');
  const [recipientWallet, setRecipientWallet] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [cryptoFees, setCryptoFees] = useState('');

  // Bank transfer fields
  const [bankAmount, setBankAmount] = useState('');
  const [bankFees, setBankFees] = useState('');
  const [bankReason, setBankReason] = useState('');

  // Common fields
  const [transferType, setTransferType] = useState('operational_expense');
  const [customTransferType, setCustomTransferType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate custom transfer type if "other" is selected
    if (transferType === 'other' && !customTransferType.trim()) {
      setError('Please specify what "Other" means');
      return;
    }

    if (transferMode === 'crypto') {
      if (!txid || !recipientWallet || !cryptoAmount) {
        setError('Please fill in all crypto transfer fields');
        return;
      }

      const amount = parseFloat(cryptoAmount);
      const fees = parseFloat(cryptoFees) || 0;
      
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (isNaN(fees) || fees < 0) {
        setError('Please enter a valid fee amount');
        return;
      }

      setIsSubmitting(true);
      try {
        const description = transferType === 'other' 
          ? `Crypto transfer: ${customTransferType}`
          : `Crypto transfer: ${transferType.replace('_', ' ')}`;

        await ITOTransfer.create({
          transaction_hash: txid,
          to_address: recipientWallet,
          amount_usdc: amount,
          fees_usdc: fees,
          transfer_type: transferType,
          description: description,
          status: 'confirmed'
        });

        onSuccess();
      } catch (err) {
        console.error('Error creating crypto transfer:', err);
        setError('Failed to add crypto transfer. Please try again.');
        setIsSubmitting(false);
      }
    } else {
      // Bank transfer
      if (!bankAmount || !bankReason) {
        setError('Please fill in all bank transfer fields');
        return;
      }

      const amount = parseFloat(bankAmount);
      const fees = parseFloat(bankFees) || 0;
      
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (isNaN(fees) || fees < 0) {
        setError('Please enter a valid fee amount');
        return;
      }

      setIsSubmitting(true);
      try {
        await ITOTransfer.create({
          transaction_hash: `BANK_${Date.now()}`,
          to_address: 'Bank Transfer',
          amount_usdc: amount,
          fees_usdc: fees,
          transfer_type: transferType,
          description: bankReason,
          status: 'confirmed'
        });

        onSuccess();
      } catch (err) {
        console.error('Error creating bank transfer:', err);
        setError('Failed to add bank transfer. Please try again.');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl"
      >
        <Card className="dark-card border-orange-500/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-xl">Add New Transfer</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Transfer Mode Toggle */}
              <div className="flex gap-4 mb-6">
                <Button
                  type="button"
                  onClick={() => setTransferMode('crypto')}
                  variant={transferMode === 'crypto' ? 'default' : 'outline'}
                  className={`flex-1 ${transferMode === 'crypto' ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'border-orange-500/30'}`}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Crypto Transfer
                </Button>
                <Button
                  type="button"
                  onClick={() => setTransferMode('bank')}
                  variant={transferMode === 'bank' ? 'default' : 'outline'}
                  className={`flex-1 ${transferMode === 'bank' ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'border-orange-500/30'}`}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Bank Transfer
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {transferMode === 'crypto' ? (
                  <motion.div
                    key="crypto"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="txid" className="text-white">Transaction Hash (TXID)</Label>
                      <Input
                        id="txid"
                        placeholder="e.g., 2z...v9"
                        value={txid}
                        onChange={(e) => setTxid(e.target.value)}
                        className="bg-slate-950 text-white border-orange-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recipient" className="text-white">Recipient Wallet Address</Label>
                      <Input
                        id="recipient"
                        placeholder="e.g., So...aN"
                        value={recipientWallet}
                        onChange={(e) => setRecipientWallet(e.target.value)}
                        className="bg-slate-950 text-white border-orange-500/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="crypto-amount" className="text-white">Amount (USDC)</Label>
                        <Input
                          id="crypto-amount"
                          type="number"
                          step="0.01"
                          placeholder="e.g., 1000.00"
                          value={cryptoAmount}
                          onChange={(e) => setCryptoAmount(e.target.value)}
                          className="bg-slate-950 text-white border-orange-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="crypto-fees" className="text-white">Fees (USDC)</Label>
                        <Input
                          id="crypto-fees"
                          type="number"
                          step="0.01"
                          placeholder="e.g., 0.50"
                          value={cryptoFees}
                          onChange={(e) => setCryptoFees(e.target.value)}
                          className="bg-slate-950 text-white border-orange-500/20"
                        />
                      </div>
                    </div>

                    {cryptoAmount && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 space-y-1">
                        <p className="text-sm text-gray-300">
                          <span className="font-semibold text-orange-400">Total Deducted from Wallet:</span>{' '}
                          {parseFloat(cryptoAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                        {cryptoFees && parseFloat(cryptoFees) > 0 && (
                          <p className="text-sm text-gray-400">
                            <span className="font-semibold">Recipient Receives:</span>{' '}
                            {(parseFloat(cryptoAmount) - parseFloat(cryptoFees)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="bank"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bank-amount" className="text-white">Transfer Amount (USD)</Label>
                        <Input
                          id="bank-amount"
                          type="number"
                          step="0.01"
                          placeholder="e.g., 5000.00"
                          value={bankAmount}
                          onChange={(e) => setBankAmount(e.target.value)}
                          className="bg-slate-950 text-white border-orange-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bank-fees" className="text-white">Fees (USD)</Label>
                        <Input
                          id="bank-fees"
                          type="number"
                          step="0.01"
                          placeholder="e.g., 25.00"
                          value={bankFees}
                          onChange={(e) => setBankFees(e.target.value)}
                          className="bg-slate-950 text-white border-orange-500/20"
                        />
                      </div>
                    </div>

                    {bankAmount && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 space-y-1">
                        <p className="text-sm text-gray-300">
                          <span className="font-semibold text-orange-400">Total Deducted from Account:</span>{' '}
                          {parseFloat(bankAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                        {bankFees && parseFloat(bankFees) > 0 && (
                          <p className="text-sm text-gray-400">
                            <span className="font-semibold">Recipient Receives:</span>{' '}
                            {(parseFloat(bankAmount) - parseFloat(bankFees)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="bank-reason" className="text-white">Reason for Transfer</Label>
                      <Textarea
                        id="bank-reason"
                        placeholder="e.g., Payment to marketing agency for Q1 campaigns"
                        value={bankReason}
                        onChange={(e) => setBankReason(e.target.value)}
                        className="bg-slate-950 text-white border-orange-500/20 min-h-[100px]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Common Fields */}
              <div className="space-y-2">
                <Label htmlFor="transfer-type" className="text-white">Transfer Type</Label>
                <Select value={transferType} onValueChange={setTransferType}>
                  <SelectTrigger className="bg-slate-950 text-white border-orange-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational_expense">Operational Expense</SelectItem>
                    <SelectItem value="liquidity_provision">Liquidity Provision</SelectItem>
                    <SelectItem value="team_payout">Team Payout</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Transfer Type Input - Shows when "Other" is selected */}
              <AnimatePresence>
                {transferType === 'other' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="custom-type" className="text-white">Specify Transfer Purpose</Label>
                    <Input
                      id="custom-type"
                      placeholder="e.g., Legal fees, Software licenses, etc."
                      value={customTransferType}
                      onChange={(e) => setCustomTransferType(e.target.value)}
                      className="bg-slate-950 text-white border-orange-500/20"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="border-orange-500/30"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Transfer'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
