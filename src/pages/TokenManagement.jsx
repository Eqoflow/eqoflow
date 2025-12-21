
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlatformConfig } from '@/entities/PlatformConfig';
import { User } from '@/entities/User';
import { TokenAllocation } from '@/entities/TokenAllocation';
import { linkSolanaWallet } from '@/functions/linkSolanaWallet';
import { getTokenBalance } from '@/functions/getTokenBalance';
import { airdropTokens } from '@/functions/airdropTokens';
import { updateTokenAllocation } from '@/functions/updateTokenAllocation';
import { AirdropLog } from '@/entities/AirdropLog';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, CheckCircle, Loader2, Send, Info, Server, RefreshCw, Package, AlertTriangle } from 'lucide-react';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';
import { checkQflowTokenStatus } from '@/functions/checkQflowTokenStatus';

const toHexString = (byteArray) => {
    return Array.from(byteArray, (byte) => {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
};

const POOL_NAMES = {
    'foundation_treasury': 'Foundation Treasury',
    'community_pool': 'Community Pool',
    'marketing_pool': 'Marketing Pool',
    'team_allocation': 'Team Allocation',
    'liquidity_provision': 'Liquidity Provision',
    'advisors': 'Advisors',
    'ecosystem_development': 'Ecosystem Development',
    'seed_round': 'Seed Round',
    'private_sale': 'Private Sale',
    'public_sale': 'Public Sale',
    // Add other pools as necessary
};

const TokenAllocationManager = ({ onUpdate }) => {
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingPool, setUpdatingPool] = useState('');
  const [operationData, setOperationData] = useState({
    pool: '',
    amount: '',
    operation: 'distribute',
    description: ''
  });

  useEffect(() => {
    loadAllocations();
  }, []);

  const loadAllocations = async () => {
    setIsLoading(true);
    try {
      const { data } = await TokenAllocation.list();
      setAllocations(data || []);
    } catch (error) {
      console.error('Error loading allocations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAllocation = async () => {
    if (!operationData.pool || !operationData.amount || parseFloat(operationData.amount) <= 0) {
      alert('Please select a pool and enter a valid amount');
      return;
    }

    setUpdatingPool(operationData.pool);
    
    try {
      const { data } = await updateTokenAllocation({
        allocation_pool: operationData.pool,
        amount_to_add: parseFloat(operationData.amount),
        operation_type: operationData.operation,
        description: operationData.description
      });

      alert(`Success! ${data.message}`);
      setOperationData({ pool: '', amount: '', operation: 'distribute', description: '' });
      await loadAllocations();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating allocation:', error);
      alert(`Failed to update allocation: ${error.response?.data?.error || error.message}`);
    } finally {
      setUpdatingPool('');
    }
  };

  return (
    <Card className="dark-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-400" />
          Token Allocation Management
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Manually update allocation records to keep Live Tokenomics accurate
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Allocations Display */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-3">Current Allocations</h3>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400" />
            </div>
          ) : (
            allocations.map((allocation) => {
              const remaining = allocation.total_allocated - (allocation.amount_distributed || 0);
              const percentDistributed = allocation.total_allocated === 0 ? 0 : ((allocation.amount_distributed || 0) / allocation.total_allocated) * 100;
              
              return (
                <div key={allocation.id} className="p-4 bg-black/20 border border-purple-500/20 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-white">
                      {POOL_NAMES[allocation.pool_name] || allocation.pool_name}
                    </span>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                      {percentDistributed.toFixed(2)}% distributed
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 my-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${percentDistributed}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Total:</span>
                      <br />
                      <span className="text-white font-medium">{allocation.total_allocated.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Distributed:</span>
                      <br />
                      <span className="text-green-400 font-medium">{(allocation.amount_distributed || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Remaining:</span>
                      <br />
                      <span className="text-cyan-400 font-medium">{remaining.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Manual Update Form */}
        <div className="border-t border-purple-500/20 pt-6">
          <h3 className="text-lg font-semibold text-white mb-3">Manual Allocation Update</h3>
          <p className="text-sm text-gray-400 mb-4">
            Use this when tokens are distributed outside of the normal EP swap or airdrop systems
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">Allocation Pool</Label>
              <Select
                value={operationData.pool}
                onValueChange={(value) => setOperationData({...operationData, pool: value})}
              >
                <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                  <SelectValue placeholder="Select allocation pool" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(POOL_NAMES).map(([key, name]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-400">Operation Type</Label>
              <Select
                value={operationData.operation}
                onValueChange={(value) => setOperationData({...operationData, operation: value})}
              >
                <SelectTrigger className="bg-black/20 border-purple-500/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distribute">Distribute (reduce remaining)</SelectItem>
                  <SelectItem value="return">Return (increase remaining)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-400">Amount</Label>
              <Input
                type="number"
                placeholder="Enter token amount"
                value={operationData.amount}
                onChange={(e) => setOperationData({...operationData, amount: e.target.value})}
                className="bg-black/20 border-purple-500/20 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-400">Description (Optional)</Label>
              <Input
                placeholder="Reason for this update"
                value={operationData.description}
                onChange={(e) => setOperationData({...operationData, description: e.target.value})}
                className="bg-black/20 border-purple-500/20 text-white"
              />
            </div>
          </div>

          <Button
            onClick={handleUpdateAllocation}
            disabled={!operationData.pool || !operationData.amount || updatingPool}
            className="mt-4 bg-gradient-to-r from-purple-600 to-pink-500"
          >
            {updatingPool ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Allocation
              </>
            )}
          </Button>
        </div>

        {/* Warning */}
        <div className="p-4 bg-yellow-600/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium">Important</p>
              <p className="text-yellow-300 text-sm mt-1">
                Manual updates should only be used when tokens are distributed through external means (exchanges, partnerships, etc.). 
                Normal EP swaps and admin airdrops automatically update these records.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function TokenManagement() {
    const [qflowMintAddress, setQflowMintAddress] = useState('');
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [balance, setBalance] = useState(null);
    const [isCheckingBalance, setIsCheckingBalance] = useState(false);
    const [connectionError, setConnectionError] = useState('');
    const [balanceError, setBalanceError] = useState('');
    const [airdropAddress, setAirdropAddress] = useState('');
    const [airdropAmount, setAirdropAmount] = useState('');
    const [isAirdropping, setIsAirdropping] = useState(false);
    const [airdropResult, setAirdropResult] = useState(null);
    const [tokenStatus, setTokenStatus] = useState(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    useEffect(() => {
        loadInitialData();
        handleCheckTokenStatus();
    }, []);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const [configData, userData] = await Promise.all([
                PlatformConfig.filter({ key: 'qflow_mint_address' }, '', 1),
                User.me()
            ]);

            if (configData.length > 0) {
                setQflowMintAddress(configData[0].value);
            }
            setUser(userData);
            if (userData?.solana_wallet_address) {
                if (configData.length > 0) {
                    handleCheckBalance(userData.solana_wallet_address, configData[0].value);
                } else {
                    setBalanceError("QFLOW mint address is not configured. Please set it in the Admin Hub.");
                }
            }
        } catch (error) {
            console.error("Error loading initial data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCheckTokenStatus = async () => {
        setIsCheckingStatus(true);
        setTokenStatus(null);
        try {
            const { data } = await checkQflowTokenStatus();
            setTokenStatus(data);
        } catch (error) {
            setTokenStatus({ success: false, error: 'Failed to fetch token status.' });
        } finally {
            setIsCheckingStatus(false);
        }
    };

    const handleConnectWallet = async () => {
        setIsConnecting(true);
        setConnectionError('');
        try {
            if (!window.solana || !window.solana.isPhantom) {
                throw new Error('Phantom wallet not found. Please install it.');
            }

            const { publicKey } = await window.solana.connect();
            if (!publicKey) {
                throw new Error('Could not get public key from wallet.');
            }
            
            const message = `Sign this message to securely link your Solana wallet to your QuantumFlow account for admin tasks. Nonce: ${user.id}`;
            const encodedMessage = new TextEncoder().encode(message);
            
            const signedMessage = await window.solana.signMessage(encodedMessage, 'utf8');
            const signatureHex = toHexString(signedMessage.signature);

            const { data, error: apiError } = await linkSolanaWallet({
                publicKey: publicKey.toString(),
                signature: signatureHex,
            });

            if (apiError || data.error) {
                throw new Error(apiError?.message || data.error || 'Failed to link wallet on the backend.');
            }
            
            await loadInitialData();

        } catch (error) {
            console.error("Error connecting wallet:", error);
            if (error.message.includes("User rejected the request")) {
              setConnectionError("You must approve the signature request in your wallet.");
            } else {
              setConnectionError(error.message || "Failed to connect wallet. Please try again.");
            }
        } finally {
            setIsConnecting(false);
        }
    };
    
    const handleCheckBalance = async (walletAddress, mintAddress) => {
        if (!mintAddress) {
            setBalanceError("QFLOW mint address is not configured.");
            return;
        }
        setIsCheckingBalance(true);
        setBalance(null);
        setBalanceError('');
        try {
            const { data } = await getTokenBalance({ walletAddress, tokenMintAddress: mintAddress });
            if (data.error) {
                throw new Error(data.error);
            }
            setBalance(data.balance);
        } catch (error) {
            console.error("Error checking balance:", error);
            setBalanceError(error.message || "Failed to check balance.");
        } finally {
            setIsCheckingBalance(false);
        }
    };
    
    const handleAirdrop = async (e) => {
        e.preventDefault();
        if (!airdropAddress || !airdropAmount) return;

        setIsAirdropping(true);
        setAirdropResult(null);

        try {
            const { data, error } = await airdropTokens({
                recipientAddress: airdropAddress,
                amount: Number(airdropAmount),
                mintAddress: qflowMintAddress
            });

            if (error || data.error) {
                throw new Error(error?.message || data.error);
            }
            
            setAirdropResult({ success: true, signature: data.signature });
            await AirdropLog.create({
                recipient_address: airdropAddress,
                amount: Number(airdropAmount),
                status: 'success',
                transaction_signature: data.signature,
            });
            setAirdropAddress('');
            setAirdropAmount('');
        } catch (err) {
            setAirdropResult({ success: false, error: err.message });
            await AirdropLog.create({
                recipient_address: airdropAddress,
                amount: Number(airdropAmount),
                status: 'failed',
                notes: err.message
            });
        } finally {
            setIsAirdropping(false);
        }
    };

    if (isLoading) {
        return <QuantumFlowLoader message="Loading Token Management..." />;
    }

    const StatusRow = ({ label, value, isMono = false, isSuccess = false, isError = false }) => (
        <div className="flex justify-between items-center py-2 border-b border-purple-500/10">
            <span className="text-white">{label}</span>
            <span className={`text-right ${isMono ? 'font-mono text-xs' : 'font-semibold'} 
                ${isSuccess ? 'text-green-400' : ''} ${isError ? 'text-red-400' : 'text-white'}`}>
                {value}
            </span>
        </div>
    );

    return (
        <div className="p-6 text-white max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-purple-400">Token Management</h1>
            <p className="text-gray-400 mb-8">Manage the $QFLOW token supply, distribution, and on-chain activities.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Column 1: Configuration & Diagnostics */}
                <div className="space-y-8">
                    <Card className="dark-card">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Info className="w-5 h-5 text-cyan-400" />
                                On-Chain Status
                            </CardTitle>
                             <CardDescription className="text-gray-400">
                                A real-time diagnostic view of your token on the Solana Mainnet.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleCheckTokenStatus} disabled={isCheckingStatus} className="mb-4 w-full">
                                <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                                {isCheckingStatus ? 'Checking Status...' : 'Refresh On-Chain Status'}
                            </Button>
                            {tokenStatus ? (
                                <div className="space-y-2">
                                    {tokenStatus.error && <StatusRow label="Error" value={tokenStatus.error} isError={true} />}
                                    <StatusRow label="Token Exists" value={tokenStatus.tokenExists ? 'Yes' : 'No'} isSuccess={tokenStatus.tokenExists} isError={!tokenStatus.tokenExists} />
                                    {tokenStatus.tokenExists && (
                                        <>
                                            <StatusRow label="Mint Address" value={tokenStatus.mintAddress} isMono={true} />
                                            <StatusRow label="Total Supply" value={tokenStatus.mintInfo?.supply ? (Number(tokenStatus.mintInfo.supply) / 10**tokenStatus.mintInfo.decimals).toLocaleString() : 'N/A'} />
                                            <StatusRow label="Treasury Wallet" value={tokenStatus.platformWallet || 'Not Found'} isMono={true} />
                                            <StatusRow label="Treasury Balance" value={tokenStatus.tokenAccount?.amount ? (Number(tokenStatus.tokenAccount.amount) / 10**tokenStatus.mintInfo.decimals).toLocaleString() : '0'} isSuccess={tokenStatus.tokenAccount?.amount > 0} />
                                            <StatusRow label="Metadata Exists" value={tokenStatus.metadataExists ? 'Yes' : 'No'} isSuccess={tokenStatus.metadataExists} />
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500">Click refresh to check status.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="dark-card">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Server className="w-5 h-5 text-gray-400" />
                                Platform Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="text-sm text-white">Mint Address Stored in DB</p>
                                {qflowMintAddress ? (
                                    <p className="font-mono text-sm break-all text-white">{qflowMintAddress}</p>
                                ) : (
                                    <p className="text-yellow-400">QFLOW mint address not set.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <TokenAllocationManager onUpdate={() => console.log("Token allocation updated. Consider refreshing related live tokenomics displays.")} />
                </div>
                
                {/* Column 2: Wallet & Actions */}
                <div className="space-y-8">
                     <Card className="dark-card">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-green-400" />
                                Admin Wallet
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                Connect your primary Solana wallet to manage tokens.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {user?.solana_wallet_address ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-green-400">
                                        <CheckCircle className="w-5 h-5" />
                                        <p className="font-medium">Wallet Connected</p>
                                    </div>
                                    <p className="font-mono text-xs break-all bg-black/20 p-2 rounded-md text-white">{user.solana_wallet_address}</p>
                                    <div className="border-t border-purple-500/10 pt-4">
                                        <h4 className="text-white font-semibold mb-2">Check Balance</h4>
                                        <Button onClick={() => handleCheckBalance(user.solana_wallet_address, qflowMintAddress)} disabled={isCheckingBalance || !qflowMintAddress} className="w-full">
                                            {isCheckingBalance && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            {isCheckingBalance ? 'Checking...' : 'Check $QFLOW Balance'}
                                        </Button>
                                        {balance !== null && <p className="mt-2 text-center text-lg text-white">Balance: <span className="font-bold text-purple-400">{balance.toLocaleString()} $QFLOW</span></p>}
                                        {balanceError && <p className="mt-2 text-red-400 text-sm">{balanceError}</p>}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Button onClick={handleConnectWallet} disabled={isConnecting} className="w-full">
                                        {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {isConnecting ? 'Connecting...' : 'Connect Phantom Wallet'}
                                    </Button>
                                    {connectionError && <p className="mt-2 text-red-400 text-sm">{connectionError}</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="dark-card">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Send className="w-5 h-5 text-blue-400" />
                                Airdrop Tokens
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                Send $QFLOW from the treasury to any Solana wallet.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAirdrop} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-white block mb-2">Recipient Wallet Address</label>
                                    <Input
                                        value={airdropAddress}
                                        onChange={(e) => setAirdropAddress(e.target.value)}
                                        placeholder="Enter Solana wallet address"
                                        className="bg-black/20 border-purple-500/20 text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-white block mb-2">Amount</label>
                                    <Input
                                        type="number"
                                        value={airdropAmount}
                                        onChange={(e) => setAirdropAmount(e.target.value)}
                                        placeholder="e.g., 1000"
                                        className="bg-black/20 border-purple-500/20 text-white"
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={isAirdropping || !qflowMintAddress} className="w-full">
                                    {isAirdropping && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {isAirdropping ? 'Airdropping...' : 'Send Tokens'}
                                </Button>
                                {!qflowMintAddress && <p className="text-xs text-center text-yellow-400">Airdrop disabled until token is minted.</p>}
                            </form>
                            <AnimatePresence>
                                {airdropResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 p-3 rounded-md"
                                    >
                                        {airdropResult.success ? (
                                            <div className="text-green-400">
                                                <p className="font-bold mb-1">Airdrop Successful!</p>
                                                <a href={`https://explorer.solana.com/tx/${airdropResult.signature}?cluster=mainnet-beta`} target="_blank" rel="noopener noreferrer" className="text-xs break-all underline hover:text-green-300">
                                                    View Transaction: {airdropResult.signature}
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="text-red-400">
                                                <p className="font-bold">Airdrop Failed:</p>
                                                <p className="text-xs">{airdropResult.error}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
