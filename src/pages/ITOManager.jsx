
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ScanLine, AlertCircle, CheckCircle, ExternalLink, PlusCircle, PieChart, Check, X, Download, Pencil, ArrowLeft, Search } from 'lucide-react'; // Added Search
import { monitorITOWallet } from '@/functions/monitorITOWallet';
import { exportITODeposits } from '@/functions/exportITODeposits';
import { ITOTransaction } from '@/entities/ITOTransaction';
import { ITOClaim } from '@/entities/ITOClaim';
import { format } from 'date-fns';
import ManualDepositForm from '../components/ito/ManualDepositForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';


const itoPhases = [
{ name: "Private Sale", price: 0.002 },
{ name: "Phase 1", price: 0.008 },
{ name: "Phase 2", price: 0.012 },
{ name: "Phase 3", price: 0.016 },
{ name: "Phase 4", price: 0.018 }];



export default function ITOManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [claims, setClaims] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [newFromAddress, setNewFromAddress] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchAddress, setSearchAddress] = useState(''); // NEW: Search state

  const loadTransactions = useCallback(async () => {
    try {
      const fetchedTransactions = await ITOTransaction.list('-created_date');
      setTransactions(fetchedTransactions);
    } catch (err) {
      setError('Failed to load recent transactions.');
      console.error(err);
    }
  }, []);

  const loadClaims = useCallback(async () => {
    try {
      const fetchedClaims = await ITOClaim.list('-claimed_at');
      setClaims(fetchedClaims);
    } catch (err) {
      console.error('Failed to load claim records:', err);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    loadClaims();
  }, [loadTransactions, loadClaims]);

  const handleScanWallet = async () => {
    setIsLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const { data } = await monitorITOWallet();
      setScanResult(data.message || 'Scan completed successfully.');
      await loadTransactions();
    } catch (err) {
      if (err.response?.status === 429) {
        setError(err.response?.data?.error || 'The Solana network is busy. Please wait a few minutes before scanning again.');
      } else {
        setError(err.response?.data?.error || 'An unknown error occurred during the scan.');
      }
      console.error('Scan wallet error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualDeposit = async (depositData) => {
    try {
      await ITOTransaction.create(depositData);
      setShowManualForm(false);
      await loadTransactions();
    } catch (error) {
      console.error('Manual deposit error:', error);
      throw new Error(error.response?.data?.error || 'Failed to submit manual deposit.');
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const { data } = await exportITODeposits();

      // Create blob and download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ito-deposits-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setNewFromAddress(transaction.from_address);
    setError(null); // Clear any previous error
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setNewFromAddress('');
    setError(null); // Clear error on cancel
  };

  const handleSaveEdit = async () => {
    if (!newFromAddress.trim()) {
      setError('Please enter a valid wallet address.');
      return;
    }

    setIsUpdating(true);
    setError(null);
    
    try {
      await ITOTransaction.update(editingTransaction.id, {
        from_address: newFromAddress.trim()
      });
      
      await loadTransactions();
      setEditingTransaction(null);
      setNewFromAddress('');
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError(error.response?.data?.error || 'Failed to update transaction. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const phaseStats = useMemo(() => {
    return itoPhases.map((phase) => {
      const phaseTransactions = transactions.filter((tx) => tx.phase_name === phase.name);
      if (phaseTransactions.length === 0) return null;

      const totalTokensAllocated = phaseTransactions.reduce((sum, tx) => sum + tx.tokens_allocated, 0);

      const claimedTransactions = phaseTransactions.filter((tx) => tx.claimed);
      const unclaimedTransactions = phaseTransactions.filter((tx) => !tx.claimed);

      const tokensClaimed = claimedTransactions.reduce((sum, tx) => sum + tx.tokens_allocated, 0);
      const tokensUnclaimed = totalTokensAllocated - tokensClaimed;

      const claimProgress = totalTokensAllocated > 0 ? tokensClaimed / totalTokensAllocated * 100 : 0;

      return {
        ...phase,
        stats: {
          totalTokensAllocated,
          tokensClaimed,
          tokensUnclaimed,
          claimedCount: claimedTransactions.length,
          unclaimedCount: unclaimedTransactions.length,
          totalTransactions: phaseTransactions.length,
          claimProgress
        }
      };
    }).filter(Boolean); // Remove phases with no transactions
  }, [transactions]);

  // NEW: Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    if (!searchAddress.trim()) {
      return transactions;
    }
    return transactions.filter(tx => 
      tx.from_address.toLowerCase().includes(searchAddress.toLowerCase())
    );
  }, [transactions, searchAddress]);

  const totalRaised = transactions.reduce((sum, tx) => sum + tx.amount_usdc, 0);
  const totalTokensAllocated = transactions.reduce((sum, tx) => sum + tx.tokens_allocated, 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <Link to={createPageUrl("AdminHub")}>
        <Button
          variant="outline"
          className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Hub
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
          ITO Deposit Manager
        </h1>
        <p className="text-gray-400">Monitor live wallet deposits, view transaction logs, and manage the ITO.</p>
      </div>

      <Tabs defaultValue="deposit-manager" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
          <TabsTrigger value="deposit-manager">Deposit Manager</TabsTrigger>
          <TabsTrigger value="claimed-tokens">Claimed Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit-manager" className="mt-6 space-y-6">
          <Card className="dark-card">
            <CardHeader className="bg-slate-950 p-6 flex flex-col space-y-1.5">
              <CardTitle className="text-slate-50 font-semibold leading-none tracking-tight">Live Wallet Monitor</CardTitle>
              <CardDescription>
                Manually scan the project's Solana wallet for new USDC deposits. This process runs automatically in the background, but can be triggered here for an immediate update.
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-slate-950 pt-0 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button onClick={handleScanWallet} disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScanLine className="w-4 h-4 mr-2" />}
                  {isLoading ? 'Scanning Wallet...' : 'Scan for New Deposits'}
                </Button>
                <Button
                  onClick={handleExportCSV}
                  disabled={isExporting || transactions.length === 0}
                  variant="outline" className="bg-green-500 text-slate-950 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-full sm:w-auto border-green-500/30 hover:bg-green-500/10">


                  {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </Button>
                {scanResult && !error &&
                <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>{scanResult}</span>
                  </div>
                }
              </div>
              {error && !editingTransaction && // Only show general errors if not editing
                <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                }
            </CardContent>
          </Card>

          <AnimatePresence>
            {showManualForm ?
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <ManualDepositForm onSubmit={handleManualDeposit} onCancel={() => setShowManualForm(false)} />
              </motion.div> :
            <div className="flex justify-end">
                <Button onClick={() => setShowManualForm(true)} variant="outline" className="bg-background text-gray-950 mx-20 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Manually Add Deposit
                </Button>
              </div>
            }
          </AnimatePresence>

          <Card className="dark-card">
            <CardHeader className="bg-slate-950 p-6 flex flex-col space-y-1.5">
              <CardTitle className="text-slate-50 font-semibold leading-none tracking-tight">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent className="bg-slate-950 text-center pt-0 p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Total Deposits</p>
                <p className="text-2xl font-bold text-white">{transactions.length}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Total USDC Raised</p>
                <p className="text-2xl font-bold text-green-400">${totalRaised.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Total Tokens Allocated</p>
                <p className="text-2xl font-bold text-purple-400">{totalTokensAllocated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardHeader className="bg-slate-950 p-6 flex flex-col space-y-1.5">
              <CardTitle className="text-slate-50 font-semibold leading-none tracking-tight">Deposit Transaction Log</CardTitle>
              <CardDescription>A complete log of all confirmed USDC deposits.</CardDescription>
            </CardHeader>
            <CardContent className="bg-slate-950 pt-0 p-6">
              {/* NEW: Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by sender address..."
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    className="pl-10 bg-slate-900 border-purple-500/20 text-white placeholder:text-gray-500"
                  />
                  {searchAddress && (
                    <button
                      onClick={() => setSearchAddress('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {searchAddress && (
                  <p className="text-sm text-gray-400 mt-2">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                  </p>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>From Address</TableHead>
                    <TableHead className="text-right">USDC Amount</TableHead>
                    <TableHead className="text-right">Tokens Allocated</TableHead>
                    <TableHead className="text-center">Claimed</TableHead>
                    <TableHead className="text-center">TXN Hash</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) =>
                  <TableRow key={tx.id}>
                      <TableCell className="text-slate-50 p-4 align-middle [&:has([role=checkbox])]:pr-0">{format(new Date(tx.created_date), 'dd MMM yyyy, HH:mm')}</TableCell>
                      <TableCell className="text-slate-50 p-4 text-xs font-mono align-middle [&:has([role=checkbox])]:pr-0">{tx.from_address}</TableCell>
                      <TableCell className="text-right text-green-400 font-semibold">${tx.amount_usdc.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-purple-400">{tx.tokens_allocated.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        {tx.claimed ?
                      <Check className="w-5 h-5 text-green-400 mx-auto" /> :
                      <X className="w-5 h-5 text-red-400 mx-auto" />
                      }
                      </TableCell>
                      <TableCell className="text-center">
                        <a href={`https://solscan.io/tx/${tx.transaction_hash}`} target="_blank" rel="noopener noreferrer" className="inline-block hover:opacity-75">
                          <ExternalLink className="w-4 h-4 text-cyan-400" />
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTransaction(tx)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {filteredTransactions.length === 0 && transactions.length > 0 &&
              <div className="text-center py-8 text-gray-500">
                  No transactions found matching "{searchAddress}"
                </div>
              }
              {transactions.length === 0 &&
              <div className="text-center py-8 text-gray-500">
                  No transactions logged yet. Make a deposit and run the wallet scan.
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claimed-tokens" className="mt-6 space-y-6">
          <Card className="dark-card">
            <CardHeader className="bg-slate-950 p-6 flex flex-col space-y-1.5">
              <CardTitle className="text-slate-50 font-semibold leading-none tracking-tight flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                Claim Status by Phase
              </CardTitle>
              <CardDescription>Overview of claimed vs. unclaimed tokens for each active ITO phase.</CardDescription>
            </CardHeader>
            <CardContent className="bg-slate-950 pt-0 p-6 space-y-6">
              {phaseStats.length > 0 ?
              phaseStats.map((phase) =>
              <div key={phase.name} className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-300 mb-4">{phase.name}</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="text-gray-300">Claim Progress</span>
                          <span className="font-semibold text-white">{phase.stats.claimProgress.toFixed(2)}%</span>
                        </div>
                        <Progress value={phase.stats.claimProgress} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-cyan-400" />
                      </div>
                      <div className="text-xs text-center text-gray-400">
                        {phase.stats.tokensClaimed.toLocaleString(undefined, { maximumFractionDigits: 0 })} / {phase.stats.totalTokensAllocated.toLocaleString(undefined, { maximumFractionDigits: 0 })} $EQOFLO claimed
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-green-500/10 rounded-md">
                          <p className="text-sm text-gray-300">Claimed</p>
                          <p className="text-lg font-bold text-green-400">{phase.stats.tokensClaimed.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                          <p className="text-xs text-gray-400">{phase.stats.claimedCount} deposits</p>
                        </div>
                        <div className="p-3 bg-red-500/10 rounded-md">
                          <p className="text-sm text-gray-300">Unclaimed</p>
                          <p className="text-lg font-bold text-red-400">{phase.stats.tokensUnclaimed.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                          <p className="text-xs text-gray-400">{phase.stats.unclaimedCount} deposits</p>
                        </div>
                      </div>
                    </div>
                  </div>
              ) :

              <div className="text-center py-12 text-gray-500">
                  <p>No deposit data available to calculate claim statistics.</p>
                </div>
              }
            </CardContent>
          </Card>

          {/* Claim Audit Log */}
          <Card className="dark-card">
            <CardHeader className="bg-slate-950 p-6 flex flex-col space-y-1.5">
              <CardTitle className="text-slate-50 font-semibold leading-none tracking-tight">Claim Audit Log</CardTitle>
              <CardDescription>Complete record of all token claims for security and verification purposes.</CardDescription>
            </CardHeader>
            <CardContent className="bg-slate-950 pt-0 p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claimed At</TableHead>
                    <TableHead>User Email</TableHead>
                    <TableHead>Sender Address</TableHead>
                    <TableHead className="text-right">Tokens Claimed</TableHead>
                    <TableHead className="text-center">Transaction Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim) =>
                  <TableRow key={claim.id}>
                      <TableCell className="text-slate-50">
                        {format(new Date(claim.claimed_at), 'dd MMM yyyy, HH:mm:ss')}
                      </TableCell>
                      <TableCell className="text-slate-50 font-mono text-sm">
                        {claim.claimed_by_user_email}
                      </TableCell>
                      <TableCell className="text-slate-50 font-mono text-xs">
                        {claim.sending_wallet_address}
                      </TableCell>
                      <TableCell className="text-right text-green-400 font-semibold">
                        {claim.claimed_amount_qflow.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center text-gray-300">
                        {claim.associated_transaction_hashes.length}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {claims.length === 0 &&
              <div className="text-center py-8 text-gray-500">
                  No token claims recorded yet.
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Transaction Modal */}
      <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="dark-card border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Transaction Address</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the sender's wallet address for this deposit transaction.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="from-address" className="text-slate-50">Sender's Wallet Address</Label>
              <Input
                id="from-address"
                value={newFromAddress}
                onChange={(e) => setNewFromAddress(e.target.value)}
                placeholder="Enter new Solana wallet address"
                className="bg-slate-950 text-slate-50"
              />
            </div>

            {editingTransaction && (
              <div className="p-3 bg-slate-800/50 rounded-lg text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction Hash:</span>
                  <span className="text-white font-mono text-xs">{editingTransaction.transaction_hash?.substring(0, 16)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-green-400 font-semibold">${editingTransaction.amount_usdc.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tokens Allocated:</span>
                  <span className="text-purple-400 font-semibold">{editingTransaction.tokens_allocated.toLocaleString()}</span>
                </div>
              </div>
            )}

            {error && ( // Display error specific to this dialog
              <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isUpdating || !newFromAddress.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-500"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
