import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, ExternalLink, DollarSign, Coins } from 'lucide-react';
import { format } from 'date-fns';

export default function ITOTransactionLogs() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInvestments: 0,
    totalAmount: 0,
    uniqueInvestors: 0
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      // This would be replaced with actual transaction data from your backend
      // For now, showing placeholder structure
      const mockTransactions = [
        {
          id: '1',
          investor_email: 'investor@example.com',
          amount_usd: 25000,
          tokens_allocated: 2500000,
          phase: 'Exclusive Early Round',
          payment_method: 'bank_transfer',
          status: 'completed',
          transaction_hash: '0x1234...abcd',
          created_date: new Date().toISOString()
        }
      ];

      setTransactions(mockTransactions);
      
      // Calculate stats
      const totalAmount = mockTransactions.reduce((sum, tx) => sum + tx.amount_usd, 0);
      const uniqueInvestors = new Set(mockTransactions.map(tx => tx.investor_email)).size;
      
      setStats({
        totalInvestments: mockTransactions.length,
        totalAmount,
        uniqueInvestors
      });

    } catch (error) {
      console.error('Failed to load ITO transaction logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-600/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
      failed: 'bg-red-600/20 text-red-400 border-red-500/30'
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="p-0 md:p-6 bg-black min-h-full">
      <Card className="dark-card p-4 sm:p-6 bg-slate-950/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-white">EqoFlow ITO Transaction Logs</CardTitle>
              <p className="text-gray-400 mt-1">
                Complete transaction history for the Initial Token Offering.
              </p>
            </div>
            <Button 
              onClick={loadTransactions} 
              variant="outline" 
              className="border-purple-500/30 text-white hover:bg-purple-500/10" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <RefreshCw className="w-4 h-4 mr-2"/>}
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-purple-600/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Investments</p>
                  <p className="text-2xl font-bold text-white">{stats.totalInvestments}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            
            <div className="p-4 bg-green-600/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Amount</p>
                  <p className="text-2xl font-bold text-white">${stats.totalAmount.toLocaleString()}</p>
                </div>
                <Coins className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Unique Investors</p>
                  <p className="text-2xl font-bold text-white">{stats.uniqueInvestors}</p>
                </div>
                <ExternalLink className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-white">Investor</TableHead>
                    <TableHead className="text-white">Amount (USD)</TableHead>
                    <TableHead className="text-white">$EQOFLO Tokens</TableHead>
                    <TableHead className="text-white">Phase</TableHead>
                    <TableHead className="text-white">Payment Method</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Date</TableHead>
                    <TableHead className="text-white">Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(transaction => (
                    <TableRow key={transaction.id} className="border-slate-800">
                      <TableCell className="font-medium">{transaction.investor_email}</TableCell>
                      <TableCell>${transaction.amount_usd.toLocaleString()}</TableCell>
                      <TableCell>{transaction.tokens_allocated.toLocaleString()}</TableCell>
                      <TableCell>{transaction.phase}</TableCell>
                      <TableCell className="capitalize">{transaction.payment_method.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(transaction.created_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {transaction.transaction_hash && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://explorer.solana.com/tx/${transaction.transaction_hash}`, '_blank')}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Coins className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Transactions Yet</h3>
              <p className="text-gray-400">
                ITO transactions will appear here once investments are processed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}