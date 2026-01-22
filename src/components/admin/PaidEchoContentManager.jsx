import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, ArrowUpCircle, Download, Wallet, Users, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';

export default function PaidEchoContentManager() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalTransactions: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGatedContentTransactions();

    // Real-time subscription for instant updates
    const unsubscribe = base44.entities.PlatformWallet.subscribe((event) => {
      if (event.type === 'create' && 
          event.data.transaction_type === 'ep_purchase_qflow' && 
          event.data.source_description === 'Gated Content Purchase Fee') {
        
        setTransactions(prev => [event.data, ...prev]);
        
        setStats(prev => ({
          ...prev,
          totalBalance: prev.totalBalance + (event.data.amount_qflow || 0),
          totalRevenue: prev.totalRevenue + (event.data.amount_qflow || 0),
          totalTransactions: prev.totalTransactions + 1
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const loadGatedContentTransactions = async () => {
    try {
      setIsLoading(true);
      const allTransactions = await base44.entities.PlatformWallet.list('-created_date', 1000);
      
      // Filter for gated content transactions only
      const gatedTransactions = allTransactions.filter(t => 
        t.transaction_type === 'ep_purchase_qflow' && 
        t.source_description === 'Gated Content Purchase Fee'
      );
      
      setTransactions(gatedTransactions);

      // Calculate statistics from gated content only
      let totalBalance = 0;
      gatedTransactions.forEach((transaction) => {
        totalBalance += transaction.amount_qflow || 0;
      });

      setStats({
        totalBalance,
        totalRevenue: totalBalance,
        totalTransactions: gatedTransactions.length
      });

    } catch (error) {
      console.error('Error loading gated content transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Coins className="w-12 h-12 text-purple-400 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-300">Loading Paid Echo transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>

          <Card className="dark-card border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-purple-400 flex items-center gap-2 text-base">
                <Wallet className="w-5 h-5" />
                Platform Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stats.totalBalance.toLocaleString()}</p>
              <p className="text-purple-400 text-sm">$EQOFLO Tokens</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>

          <Card className="dark-card border-emerald-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-emerald-400 flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-emerald-400 text-sm">From Gated Content</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}>

          <Card className="dark-card border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-400 flex items-center gap-2 text-base">
                <ArrowUpCircle className="w-5 h-5" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stats.totalTransactions}</p>
              <p className="text-blue-400 text-sm">Fee Transactions</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Transactions List */}
      <Card className="dark-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="w-6 h-6 text-purple-400" />
              Paid Echo Content Transactions
            </CardTitle>
            <Button
              onClick={loadGatedContentTransactions}
              variant="outline"
              size="sm"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">

              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length > 0 ?
            transactions.map((transaction, index) =>
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">

                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Coins className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{transaction.source_description}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {transaction.user_email &&
                    <span className="text-sm text-gray-400">
                        <Users className="w-3 h-3 inline mr-1" />
                        {transaction.user_email}
                      </span>
                    }
                      <span className="text-sm text-gray-500">
                        {format(new Date(transaction.created_date), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    {transaction.notes &&
                  <p className="text-xs text-gray-500 mt-1">{transaction.notes}</p>
                  }
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-lg font-bold text-emerald-400">
                    +{transaction.amount_qflow.toLocaleString()} $EQOFLO
                  </p>
                  <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 mt-1">
                    Fee
                  </Badge>
                </div>
              </motion.div>
            ) :

            <div className="text-center py-8">
                <Wallet className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Transactions Yet</h3>
                <p className="text-gray-400">
                  Gated content unlock fees will appear here as users purchase exclusive content.
                </p>
              </div>
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}