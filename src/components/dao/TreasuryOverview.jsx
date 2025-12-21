
import React, { useState, useEffect } from "react";
import { DAOTreasury } from "@/entities/DAOTreasury";
import { PlatformExpense } from "@/entities/PlatformExpense";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Landmark, Coins, ArrowUpRight, ArrowDownLeft, Info, Zap, TrendingUp, Briefcase, Clock } from "lucide-react";
import { format } from 'date-fns';

export default function TreasuryOverview() {
  const [treasuryData, setTreasuryData] = useState({
    balance: 0,
    transactions: [],
    expenses: [],
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    totalExpenses: 0 // Added to store total expenses for platform ops tab
  });
  const [isLoading, setIsLoading] = useState(false);

  // Track if data has been loaded
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Lazy loading effect - only load data when component mounts for the first time
  useEffect(() => {
    if (!hasLoadedData) {
      loadTreasuryData();
      setHasLoadedData(true);
    }
  }, [hasLoadedData]);

  const loadTreasuryData = async () => {
    setIsLoading(true);

    try {
      // Fetch treasury transactions and expenses in parallel
      const [transactions, expenses] = await Promise.all([
        DAOTreasury.list("-created_date", 50).catch(() => []),
        PlatformExpense.list("-transaction_date", 50).catch(() => [])
      ]);

      // Calculate current balance
      const balance = transactions.reduce((sum, tx) => {
        return tx.transaction_type === "deposit"
          ? sum + (tx.amount_qflow || 0)
          : sum - Math.abs(tx.amount_qflow || 0); // Ensure absolute value for subtraction
      }, 0);

      // Calculate monthly stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyRevenue = transactions
        .filter(tx => {
          const txDate = new Date(tx.created_date);
          return tx.transaction_type === "deposit" &&
                 txDate.getMonth() === currentMonth &&
                 txDate.getFullYear() === currentYear;
        })
        .reduce((sum, tx) => sum + (tx.amount_qflow || 0), 0);

      const monthlyExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.transaction_date);
          return expenseDate.getMonth() === currentMonth &&
                 expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + (expense.amount_usd || 0), 0);
      
      // Calculate total expenses for platform ops tab
      const totalExpensesCalc = expenses.reduce((sum, expense) => sum + (expense.amount_usd || 0), 0);

      setTreasuryData({
        balance,
        transactions,
        expenses,
        monthlyRevenue,
        monthlyExpenses,
        totalExpenses: totalExpensesCalc
      });
    } catch (error) {
      console.error("Error loading treasury data:", error);
      // Optionally reset state to initial values on error
      setTreasuryData({
        balance: 0,
        transactions: [],
        expenses: [],
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        totalExpenses: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while data is being fetched
  if (!hasLoadedData || isLoading) {
    return (
      <div className="bg-slate-950 space-y-4 md:space-y-6">
        <div className="flex items-center justify-center py-12 min-h-[500px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          <span className="ml-3 text-gray-400">Loading treasury data...</span>
        </div>
      </div>
    );
  }

  const eqofloToUsdRate = 0.05;

  const getTypeStyle = (type) => {
    switch (type) {
      case 'deposit':
        return {
          icon: <ArrowDownLeft className="w-4 h-4 text-green-400" />,
          badge: "bg-green-500/20 text-green-300 border-green-500/30"
        };
      case 'withdrawal':
      case 'allocation':
        return {
          icon: <ArrowUpRight className="w-4 h-4 text-red-400" />,
          badge: "bg-red-500/20 text-red-300 border-red-500/30"
        };
      default:
        return {
          icon: <Coins className="w-4 h-4 text-gray-400" />,
          badge: "bg-gray-500/20 text-gray-300 border-gray-500/30"
        };
    }
  };

  const epOverflowTransactions = treasuryData.transactions.filter((tx) =>
    tx.source?.includes('Daily EP Cap Overflow') || tx.source?.includes('EP Cap Overflow')
  );

  const today = new Date().toISOString().split('T')[0];
  const todayEpOverflow = epOverflowTransactions.filter((tx) => {
    return tx.created_date?.split('T')[0] === today;
  }).reduce((sum, tx) => sum + (tx.amount_qflow || 0), 0);

  const totalEpOverflow = epOverflowTransactions.reduce((sum, tx) => sum + (tx.amount_qflow || 0), 0);

  const todayEpOverflowEP = todayEpOverflow * 100; // Changed from 10 to 100
  const totalEpOverflowEP = totalEpOverflow * 100; // Changed from 10 to 100

  const getExpenseTypeStyle = (type) => {
    const styles = {
      infrastructure: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      marketing: "bg-pink-500/20 text-pink-300 border-pink-500/30",
      salaries: "bg-green-500/20 text-green-300 border-green-500/30",
      development: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      legal: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      other: "bg-gray-500/20 text-gray-300 border-gray-500/30"
    };
    return styles[type] || styles.other;
  };

  return (
    <div className="bg-slate-950 space-y-4 md:space-y-6">
      {/* Treasury Overview Card */}
      <Card className="dark-card neon-glow">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
            <Landmark className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            EqoFlow Treasury
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center mb-4 md:mb-6 min-h-[120px] md:min-h-[140px] flex flex-col justify-center">
            <div className="text-sm text-white/80 mb-1">Total Treasury Value</div>
            <div className="text-2xl md:text-5xl font-bold text-white mb-2">
              {(treasuryData.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              <span className="text-lg md:text-2xl text-purple-400 ml-2">$EQOFLO</span>
            </div>
            <p className="text-sm md:text-base text-white/70">
              ≈ ${((treasuryData.balance || 0) * eqofloToUsdRate).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className="text-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg min-h-[80px] flex flex-col justify-center">
              <div className="text-sm text-white/80">Monthly Revenue</div>
              <div className="text-lg md:text-xl font-bold text-blue-400">
                {(treasuryData.monthlyRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} $EQOFLO
              </div>
            </div>
            <div className="text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg min-h-[80px] flex flex-col justify-center">
              <div className="text-sm text-white/80">Monthly Expenses</div>
              <div className="text-lg md:text-xl font-bold text-red-400">
                ${(treasuryData.monthlyExpenses || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 md:p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-400 text-sm">Disclaimer</p>
                  <p className="text-xs text-white/80 mt-1">
                    This treasury is owned and controlled by the DAO. Funds will be used for ecosystem grants, platform development, and other initiatives as approved by token holders. Future governance proposals may allow for the distribution of treasury assets to token holders.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 md:p-4 bg-green-600/10 border border-green-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-400 text-sm">Daily Treasury Deposits</p>
                  <p className="text-xs text-white/80 mt-1">
                    To ensure full transparency, all platform fees collected throughout the day are converted to $EQOFLO and sent to the DAO Treasury in a single daily transaction at <strong>21:00 UTC+2</strong>. You can verify these deposits in the transaction log.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treasury Tabs */}
      <div className="space-y-4">
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 gap-1 dark-card p-1 rounded-xl">
            <TabsTrigger
              value="transactions"
              className="w-full py-2 px-3 text-xs md:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white text-gray-400 hover:text-white transition-all">

              <Coins className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Treasury Transactions
            </TabsTrigger>
            <TabsTrigger
              value="ep-overflow"
              className="w-full py-2 px-3 text-xs md:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white text-gray-400 hover:text-white transition-all">

              <Zap className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              EP Overflow
            </TabsTrigger>
            <TabsTrigger
              value="platform-ops"
              className="w-full py-2 px-3 text-xs md:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white text-gray-400 hover:text-white transition-all">

              <Briefcase className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              Platform Ops
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4">
            <Card className="dark-card">
              <CardHeader className="bg-slate-950 pb-3 p-6 flex flex-col space-y-1.5">
                <CardTitle className="text-white text-base md:text-xl">All Treasury Transactions</CardTitle>
              </CardHeader>
              <CardContent className="bg-slate-950 p-2 md:p-6 min-h-[500px] flex flex-col">
                {treasuryData.transactions.length > 0 ? (
                  <div className="space-y-3 flex-1">
                    {treasuryData.transactions.map((tx) => {
                      const typeStyle = getTypeStyle(tx?.transaction_type);
                      const amount = tx?.amount_qflow || 0;
                      const usdValue = tx?.value_usd || 0;
                      const displaySource = (tx?.source || 'Unknown Source').replace(
                        /by [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
                        'by User'
                      );
                      return (
                        <div key={tx?.id || Math.random()} className="p-3 md:p-4 bg-black/20 rounded-lg border border-purple-500/10">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0 pr-3">
                              <p className="text-white font-medium text-sm md:text-base truncate">
                                {displaySource}
                              </p>
                              <p className="text-xs md:text-sm text-gray-400">
                                {tx?.created_date ? format(new Date(tx.created_date), 'MMM d, yyyy') : 'Unknown'}
                              </p>
                            </div>
                            <Badge className={`${typeStyle.badge} text-xs flex-shrink-0`}>
                              {typeStyle.icon}
                              <span className="ml-1 capitalize hidden md:inline">
                                {tx?.transaction_type || 'unknown'}
                              </span>
                            </Badge>
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="text-xs text-gray-500">
                              USD: ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-right">
                              <p className={`font-bold text-base md:text-lg ${amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {amount >= 0 ? '+' : ''}{amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} $EQOFLO
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col justify-center items-center flex-1 min-h-[400px]">
                    <Coins className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-white/40" />
                    <h3 className="text-base md:text-xl font-semibold text-white mb-2">No Transactions Yet</h3>
                    <p className="text-white/70 text-sm">Treasury transactions will appear here as the platform generates revenue.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ep-overflow" className="mt-4">
            <Card className="dark-card">
              <CardHeader className="bg-slate-950 pb-3 p-6 flex flex-col space-y-1.5">
                <CardTitle className="text-white flex items-center gap-2 text-base md:text-xl">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
                  EP Overflow Contributions
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-slate-950 p-2 md:p-6 min-h-[400px]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 min-h-[120px]">
                  <div className="text-center p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg min-h-[100px] flex flex-col justify-center">
                    <div className="text-lg md:text-2xl font-bold text-cyan-400">{todayEpOverflow.toFixed(2)}</div>
                    <div className="text-xs text-white/80">$EQOFLO Added Today</div>
                    <div className="text-xs text-cyan-300">({todayEpOverflowEP.toFixed(0)} EP)</div>
                  </div>
                  <div className="text-center p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg min-h-[100px] flex flex-col justify-center">
                    <div className="text-lg md:text-2xl font-bold text-purple-400">{totalEpOverflow.toFixed(2)}</div>
                    <div className="text-xs text-white/80">Total $EQOFLO from EP</div>
                    <div className="text-xs text-purple-300">({totalEpOverflowEP.toFixed(0)} EP)</div>
                  </div>
                  <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg min-h-[100px] flex flex-col justify-center">
                    <div className="text-lg md:text-2xl font-bold text-green-400">
                      {treasuryData.balance > 0 ? (totalEpOverflow / treasuryData.balance * 100).toFixed(1) : '0.0'}%
                    </div>
                    <div className="text-xs text-white/80">Treasury from EP</div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-blue-400 text-sm">Daily Conversion Schedule</p>
                        <p className="text-gray-300 text-xs mt-1">
                          Every day at <strong>21:00 UTC+2</strong>, all excess EP accumulated throughout the day is automatically converted to $EQOFLO tokens (at a rate of 100 EP = 1 $EQOFLO) and added to the DAO Treasury.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-600/10 border border-orange-500/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-orange-400 text-sm">Why Daily Batching?</p>
                        <p className="text-gray-300 text-xs mt-1">
                          We process EP overflow once per day to optimize efficiency and minimize transaction costs by batching.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-cyan-600/10 border border-cyan-500/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-cyan-400 text-sm">How EP Overflow Works</p>
                        <p className="text-xs text-white/80 mt-1">
                          When users exceed their daily EP cap, the excess points are automatically converted to $EQOFLO (100 EP = 1 $EQOFLO) and added to the treasury.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {epOverflowTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {epOverflowTransactions.map((tx) => {
                      const amount = tx?.amount_qflow || 0;
                      const epEquivalent = amount * 100; // Changed from 10 to 100
                      const batchInfo = tx?.source?.includes('21:00') ? 'Daily 21:00 UTC+2 Batch' : 'EP Overflow Conversion';
                      return (
                        <div key={tx?.id || Math.random()} className="p-3 md:p-4 bg-black/20 rounded-lg border border-purple-500/10">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <p className="text-white font-medium text-sm">{batchInfo}</p>
                              <p className="text-xs text-gray-400">
                                {tx?.created_date ? format(new Date(tx.created_date), 'MMM d, yyyy') : 'Unknown'}
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="text-xs text-purple-400">
                              {epEquivalent.toLocaleString(undefined, { maximumFractionDigits: 0 })} EP
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-cyan-400 text-base md:text-lg">
                                +{amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} $EQOFLO
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                   <div className="text-center w-full h-full flex flex-col justify-center items-center py-12">
                    <Zap className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-white/40" />
                    <h3 className="text-base md:text-xl font-semibold text-white mb-2">No EP Overflow Yet</h3>
                    <p className="text-white/70 text-sm">EP overflow will appear when users exceed daily caps.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="platform-ops" className="mt-4">
            <Card className="dark-card">
              <CardHeader className="bg-slate-950 pb-3 p-6 flex flex-col space-y-1.5">
                <CardTitle className="text-white flex items-center gap-2 text-base md:text-xl">
                  <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                  Platform Operational Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-slate-950 p-2 md:p-6 min-h-[400px]">
                <div className="text-center p-3 mb-4 bg-green-500/10 border border-green-500/20 rounded-lg min-h-[80px] flex flex-col justify-center">
                  <div className="text-sm text-white/80">Total Operational Spending</div>
                  <div className="text-xl md:text-3xl font-bold text-green-400">
                    ${(treasuryData.totalExpenses || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-400 text-sm">Transparency Report</p>
                      <p className="text-xs text-white/80 mt-1">
                        This log shows how platform fees are spent on infrastructure, development, and marketing. These funds are separate from the DAO Treasury.
                      </p>
                    </div>
                  </div>
                </div>

                {treasuryData.expenses.length > 0 ? (
                  <div className="space-y-3">
                    {treasuryData.expenses.map((expense) =>
                      <div key={expense.id} className="p-3 md:p-4 bg-black/20 rounded-lg border border-purple-500/10">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-white font-medium text-sm truncate">{expense.description}</p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(expense.transaction_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge className={`${getExpenseTypeStyle(expense.expense_type)} text-xs capitalize flex-shrink-0`}>
                            {expense.expense_type}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="text-xs text-gray-500 truncate flex-1 pr-2">
                            {expense.vendor}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-400 text-base md:text-lg">
                              -${(expense.amount_usd || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center w-full h-full flex flex-col justify-center items-center py-12">
                    <Briefcase className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-white/40" />
                    <h3 className="text-base md:text-xl font-semibold text-white mb-2">No Expenses Logged Yet</h3>
                    <p className="text-white/70 text-sm">Platform expenses will appear here for full transparency.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
