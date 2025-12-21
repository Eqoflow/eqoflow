
import React, { useState, useEffect } from "react";
import { TradingAccount } from "@/entities/TradingAccount";
import { CryptoPosition } from "@/entities/CryptoPosition";
import { TradeOrder } from "@/entities/TradeOrder";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Wallet,
  Shield,
  AlertTriangle,
  Activity,
  PieChart,
  Zap,
  Plus
} from "lucide-react";

export default function Trading() {
  const [user, setUser] = useState(null);
  const [tradingAccount, setTradingAccount] = useState(null);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);

  // Mock crypto data
  const cryptoData = [
    { symbol: "BTC", name: "Bitcoin", price: 43250.50, change: 2.45, changePercent: 0.057 },
    { symbol: "ETH", name: "Ethereum", price: 2680.75, change: -45.20, changePercent: -1.66 },
    { symbol: "SOL", name: "Solana", price: 98.40, change: 5.80, changePercent: 6.27 },
    { symbol: "ADA", name: "Cardano", price: 0.45, change: 0.02, changePercent: 4.65 },
    { symbol: "MATIC", name: "Polygon", price: 0.82, change: -0.05, changePercent: -5.75 }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      const accounts = await TradingAccount.filter({ created_by: userData.email });
      const accountData = accounts.length > 0 ? accounts[0] : null;
      
      setUser(userData);
      setTradingAccount(accountData);
      
      if (accountData) {
        const [positionsData, ordersData] = await Promise.all([
          CryptoPosition.filter({ created_by: userData.email }),
          TradeOrder.filter({ created_by: userData.email }, "-created_date", 20)
        ]);
        setPositions(positionsData);
        setOrders(ordersData);
      }
    } catch (error) {
      console.error("Error loading trading data:", error);
    }
    setIsLoading(false);
  };

  const createTradingAccount = async () => {
    const newAccount = await TradingAccount.create({
      account_type: "basic",
      balance_usd: 1000,
      total_portfolio_value: 1000,
      verification_status: "unverified"
    });
    setTradingAccount(newAccount);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
          <span className="text-lg">Loading trading platform...</span>
        </div>
      </div>
    );
  }

  if (!tradingAccount) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="dark-card neon-glow max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-center gap-2 text-2xl">
                <BarChart3 className="w-8 h-8 text-green-400" />
                Welcome to QuantumFlow Trading
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-4">Start Your Crypto Trading Journey</h2>
                <p className="text-gray-400 mb-6">
                  Trade cryptocurrencies, manage your portfolio, and earn $NGA tokens.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-600/10 rounded-xl border border-green-500/20">
                  <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white">Secure</h3>
                  <p className="text-sm text-gray-400">Bank-level security</p>
                </div>
                <div className="text-center p-4 bg-blue-600/10 rounded-xl border border-blue-500/20">
                  <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white">Fast</h3>
                  <p className="text-sm text-gray-400">Instant transactions</p>
                </div>
                <div className="text-center p-4 bg-purple-600/10 rounded-xl border border-purple-500/20">
                  <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white">Profitable</h3>
                  <p className="text-sm text-gray-400">Earn while you trade</p>
                </div>
              </div>

              <div className="p-4 bg-yellow-600/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-400 text-sm">Demo Account</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Start with $1,000 in demo funds to practice trading risk-free.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={createTradingAccount}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 neon-glow"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Create Trading Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--neon-primary), var(--neon-secondary))' }}>
            Crypto Trading
          </h1>
          <p className="text-gray-400">
            Trade cryptocurrencies directly within the QuantumFlow platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="dark-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Portfolio Value</p>
                  <p className="text-2xl font-bold text-white">
                    ${(tradingAccount.total_portfolio_value || 0).toLocaleString()}
                  </p>
                </div>
                <PieChart className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Available Balance</p>
                  <p className="text-2xl font-bold text-white">
                    ${(tradingAccount.balance_usd || 0).toLocaleString()}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total P&L</p>
                  <p className={`text-2xl font-bold ${
                    (tradingAccount.total_profit_loss || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(tradingAccount.total_profit_loss || 0) >= 0 ? '+' : ''}
                    ${(tradingAccount.total_profit_loss || 0).toLocaleString()}
                  </p>
                </div>
                {(tradingAccount.total_profit_loss || 0) >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-400" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-400" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="dark-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Positions</p>
                  <p className="text-2xl font-bold text-white">{positions.length}</p>
                </div>
                <Activity className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 dark-card p-1.5 rounded-2xl">
            <TabsTrigger value="dashboard" className="rounded-xl p-2 text-gray-400 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:neon-glow transition-all">
              <BarChart3 className="w-4 h-4 mr-2" />
              Markets
            </TabsTrigger>
            <TabsTrigger value="trade" className="rounded-xl p-2 text-gray-400 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:neon-glow transition-all">
              <DollarSign className="w-4 h-4 mr-2" />
              Trade
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="rounded-xl p-2 text-gray-400 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:neon-glow transition-all">
              <PieChart className="w-4 h-4 mr-2" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl p-2 text-gray-400 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:neon-glow transition-all">
              <Activity className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="dark-card mb-6">
                  <CardHeader>
                    <CardTitle className="text-white">Market Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {cryptoData.map((crypto) => (
                        <div key={crypto.symbol} className="flex items-center justify-between p-4 rounded-xl bg-black/20 hover:bg-black/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{crypto.symbol.slice(0, 2)}</span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{crypto.name}</p>
                              <p className="text-sm text-gray-400">{crypto.symbol}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">${crypto.price.toLocaleString()}</p>
                            <div className={`flex items-center gap-1 ${
                              crypto.change >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {crypto.change >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              <span className="text-sm">
                                {crypto.change >= 0 ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="dark-card">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Trade</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 to-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Buy Crypto
                    </Button>
                    <Button variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10">
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Sell Crypto
                    </Button>
                  </CardContent>
                </Card>

                <Card className="dark-card">
                  <CardHeader>
                    <CardTitle className="text-white">Account Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Account Type</span>
                      <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">
                        {tradingAccount.account_type}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Verification</span>
                      <Badge className={tradingAccount.verification_status === 'verified' 
                        ? "bg-green-600/20 text-green-400 border-green-500/30"
                        : "bg-yellow-600/20 text-yellow-400 border-yellow-500/30"
                      }>
                        {tradingAccount.verification_status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Trading Level</span>
                      <span className="text-white font-medium">{tradingAccount.trading_level}/10</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trade">
            <div className="dark-card rounded-2xl p-12 text-center neon-glow">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h3 className="text-xl font-semibold text-white mb-2">Trading Interface Coming Soon</h3>
              <p className="text-gray-500">Advanced trading tools and charts are being developed.</p>
            </div>
          </TabsContent>

          <TabsContent value="portfolio">
            {positions.length === 0 ? (
              <div className="dark-card rounded-2xl p-12 text-center neon-glow">
                <PieChart className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <h3 className="text-xl font-semibold text-white mb-2">No Positions Yet</h3>
                <p className="text-gray-500">Start trading to build your crypto portfolio!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((position) => (
                  <Card key={position.id} className="dark-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-white">{position.symbol}</h3>
                          <p className="text-gray-400">{position.amount} coins</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">${position.current_value?.toLocaleString()}</p>
                          <p className={`${position.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {position.profit_loss >= 0 ? '+' : ''}${position.profit_loss?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            {orders.length === 0 ? (
              <div className="dark-card rounded-2xl p-12 text-center neon-glow">
                <Activity className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
                <h3 className="text-xl font-semibold text-white mb-2">No Orders Yet</h3>
                <p className="text-gray-500">Your trading orders will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="dark-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-white">{order.side.toUpperCase()} {order.symbol}</h3>
                          <p className="text-gray-400">{order.amount} @ ${order.price}</p>
                        </div>
                        <Badge className={
                          order.status === 'filled' ? "bg-green-600/20 text-green-400" :
                          order.status === 'cancelled' ? "bg-red-600/20 text-red-400" :
                          "bg-yellow-600/20 text-yellow-400"
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
