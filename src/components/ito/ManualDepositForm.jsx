
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';

const CURRENT_PHASE_CONFIG = {
  name: 'Phase 1',
  price: 0.008
};

export default function ManualDepositForm({ onSubmit, onCancel }) {
  const [transactionHash, setTransactionHash] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [amountUsdc, setAmountUsdc] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokensAllocated = useMemo(() => {
    const usdc = parseFloat(amountUsdc);
    if (!isNaN(usdc) && usdc > 0) {
      return usdc / CURRENT_PHASE_CONFIG.price;
    }
    return 0;
  }, [amountUsdc]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!transactionHash || !fromAddress || !amountUsdc) {
      setError('All fields are required.');
      return;
    }

    const usdcAmount = parseFloat(amountUsdc);
    if (isNaN(usdcAmount) || usdcAmount <= 0) {
      setError('Please enter a valid USDC amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const depositData = {
        transaction_hash: transactionHash,
        from_address: fromAddress,
        amount_usdc: usdcAmount,
        token_price_at_deposit: CURRENT_PHASE_CONFIG.price,
        tokens_allocated: tokensAllocated,
        phase_name: CURRENT_PHASE_CONFIG.name,
        status: 'confirmed'
      };
      await onSubmit(depositData);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="dark-card border-purple-500/30">
            <CardHeader>
                <CardTitle className="text-slate-50 font-semibold leading-none tracking-tight">Add Manual Deposit</CardTitle>
                <CardDescription>Enter details for a confirmed deposit. Token allocation will be calculated automatically for the current phase.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="tx-hash" className="text-slate-50 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Transaction Hash (TXN ID)</Label>
                        <Input id="tx-hash" placeholder="e.g., 2z...v9" value={transactionHash} onChange={(e) => setTransactionHash(e.target.value)} className="bg-slate-950 text-slate-50 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="from-address" className="text-slate-50 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Sender's Wallet Address</Label>
                        <Input id="from-address" placeholder="e.g., So...aN" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} className="bg-slate-950 text-slate-50 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount-usdc" className="text-gray-50 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">USDC Amount</Label>
                        <Input id="amount-usdc" type="number" placeholder="e.g., 1000.00" value={amountUsdc} onChange={(e) => setAmountUsdc(e.target.value)} className="bg-slate-950 text-slate-50 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
                    </div>

                    {tokensAllocated > 0 &&
          <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                            <p className="text-sm text-gray-400">Tokens to be Allocated</p>
                            <p className="text-xl font-bold text-purple-400">{tokensAllocated.toLocaleString('en-US')}</p>
                            <p className="text-xs text-gray-500">Based on ${CURRENT_PHASE_CONFIG.price}/token {CURRENT_PHASE_CONFIG.name} price</p>
                        </div>
          }
                    
                    {error &&
          <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
          }

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting || !tokensAllocated}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {isSubmitting ? 'Submitting...' : 'Confirm and Add Deposit'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>);

}
