
import React, { useState, useEffect } from 'react';
import { PlatformWallet } from '@/entities/PlatformWallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Coins,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Download,
  Wallet,
  DollarSign,
  Users,
  ArrowLeft } from
'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function GamifyTokensPage() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalFromQflow: 0,
    totalFromFiat: 0,
    totalTransactions: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlatformWalletData();
  }, []);

  const loadPlatformWalletData = async () => {
    try {
      setIsLoading(true);
      const walletTransactions = await PlatformWallet.list('-created_date', 100);
      setTransactions(walletTransactions);

      // Calculate statistics
      let totalBalance = 0;
      let totalFromQflow = 0;
      let totalFromFiat = 0;

      walletTransactions.forEach((transaction) => {
        totalBalance += transaction.amount_qflow;

        if (transaction.transaction_type === 'ep_purchase_qflow') {
          totalFromQflow += transaction.amount_qflow;
        } else if (transaction.transaction_type === 'ep_purchase_fiat') {
          totalFromFiat += transaction.amount_qflow;
        }
      });

      setStats({
        totalBalance,
        totalFromQflow,
        totalFromFiat,
        totalTransactions: walletTransactions.length
      });

    } catch (error) {
      console.error('Error loading platform wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'ep_purchase_qflow':
        return <Coins className="w-5 h-5 text-blue-400" />;
      case 'ep_purchase_fiat':
        return <DollarSign className="w-5 h-5 text-green-400" />;
      case 'withdrawal':
        return <ArrowDownCircle className="w-5 h-5 text-red-400" />;
      case 'distribution_to_dao':
        return <ArrowUpCircle className="w-5 h-5 text-purple-400" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'ep_purchase_qflow':
        return 'text-blue-400';
      case 'ep_purchase_fiat':
        return 'text-green-400';
      case 'withdrawal':
        return 'text-red-400';
      case 'distribution_to_dao':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Coins className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white">Loading Gamify Tokens...</p>
        </div>
      </div>);

  }

  return (
    <div className="bg-slate-950 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl("AdminHub")}>
          <Button
            variant="outline" className="bg-slate-900 text-white mb-6 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-emerald-500/30 hover:bg-emerald-500/10">

            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Hub
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Platform Gamify Tokens</h1>
          <p className="text-lg text-gray-400">Monitor $EQOFLO tokens collected from EP package purchases</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}>

            <Card className="dark-card border-emerald-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-emerald-400 flex items-center gap-2 text-base">
                  <Wallet className="w-5 h-5" />
                  Total Platform Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stats.totalBalance.toLocaleString()}</p>
                <p className="text-emerald-400 text-sm">$EQOFLO Tokens</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}>

            <Card className="dark-card border-blue-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-400 flex items-center gap-2 text-base">
                  <Coins className="w-5 h-5" />
                  From $EQOFLO Purchases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stats.totalFromQflow.toLocaleString()}</p>
                <p className="text-blue-400 text-sm">Direct Token Purchases</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}>

            <Card className="dark-card border-green-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-400 flex items-center gap-2 text-base">
                  <DollarSign className="w-5 h-5" />
                  From Fiat Purchases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stats.totalFromFiat.toLocaleString()}</p>
                <p className="text-green-400 text-sm">Equivalent $EQOFLO Value</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}>

            <Card className="dark-card border-purple-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-purple-400 flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5" />
                  Total Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{stats.totalTransactions}</p>
                <p className="text-purple-400 text-sm">All Time</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Transactions List */}
        <Card className="dark-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white flex items-center gap-2">
                <Coins className="w-6 h-6 text-emerald-400" />
                Recent Platform Transactions
              </CardTitle>
              <Button
                onClick={() => loadPlatformWalletData()} // Changed to call the loading function
                variant="outline"
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">

                <Download className="w-4 h-4 mr-2" />
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

                    <div className="flex items-center gap-4">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <h3 className="font-semibold text-white">{transaction.source_description}</h3>
                        <div className="flex items-center gap-2 mt-1">
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
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getTransactionColor(transaction.transaction_type)}`}>
                        {transaction.amount_qflow > 0 ? '+' : ''}{transaction.amount_qflow.toLocaleString()} $EQOFLO
                      </p>
                      <Badge
                    className={
                    transaction.transaction_type === 'ep_purchase_qflow' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' :
                    transaction.transaction_type === 'ep_purchase_fiat' ? 'bg-green-600/20 text-green-400 border-green-500/30' :
                    transaction.transaction_type === 'withdrawal' ? 'bg-red-600/20 text-red-400 border-red-500/30' :
                    'bg-purple-600/20 text-purple-400 border-purple-500/30'
                    }>

                        {transaction.transaction_type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    </div>
                  </motion.div>
              ) :

              <div className="text-center py-8">
                  <Wallet className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Transactions Yet</h3>
                  <p className="text-gray-400">
                    Platform wallet transactions will appear here as users purchase EP packages.
                  </p>
                </div>
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

}