
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Wallet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  X
} from "lucide-react";
import { motion } from "framer-motion";

export default function NFTAccessChecker({ nftGateSettings, contentType, onAccessGranted, onClose }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [nftCheckResult, setNftCheckResult] = useState(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    setConnectionError("");

    // Check if MetaMask is installed *before* trying to connect.
    if (typeof window.ethereum === 'undefined') {
      setConnectionError("MetaMask is not installed. Please install the MetaMask extension to continue.");
      setIsConnecting(false);
      return;
    }

    try {
      // Request account access from MetaMask
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        setConnectionError("No accounts found. Please make sure your MetaMask wallet is unlocked.");
        setIsConnecting(false);
        return;
      }

      const address = accounts[0];
      setWalletAddress(address);
      await checkNFTOwnership(address);

    } catch (error) {
      console.error("MetaMask connection error:", error);
      // Handle specific errors like the user rejecting the connection
      if (error.code === 4001) {
        setConnectionError("Connection rejected. Please approve the request in MetaMask to proceed.");
      } else {
        setConnectionError(error.message || "An unknown error occurred while connecting your wallet.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const checkNFTOwnership = async (address) => {
    try {
      // This is a simplified check - in a real implementation, you would:
      // 1. Connect to the blockchain (Ethereum, Polygon, etc.)
      // 2. Query the NFT contract for the user's token balance
      // 3. Verify they own the required number of NFTs
      
      // For now, we'll simulate a successful check
      // In production, replace this with actual blockchain queries
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      const hasRequiredNFTs = Math.random() > 0.3; // 70% success rate for demo
      
      setNftCheckResult({
        hasAccess: hasRequiredNFTs,
        ownedCount: hasRequiredNFTs ? Math.max(nftGateSettings.amount, Math.floor(Math.random() * 5) + 1) : 0,
        requiredCount: nftGateSettings.amount
      });

      if (hasRequiredNFTs) {
        setTimeout(() => {
          onAccessGranted();
        }, 1500);
      }

    } catch (error) {
      console.error("NFT verification error:", error);
      setConnectionError("Failed to verify NFT ownership. Please try again.");
    }
  };

  const getCollectionName = (address) => {
    const collections = {
      "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D": "Bored Ape Yacht Club",
      "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB": "CryptoPunks",
      "0x60E4d786628Fea6478F785A6d7e704777c86a7c6": "Mutant Ape Yacht Club",
      "0xED5AF388653567Af2F388E6224dC7C4b3241C544": "Azuki"
    };
    return collections[address] || "NFT Collection";
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
    >
      <Card className="dark-card max-w-md mx-auto">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-2 top-2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-white">NFT Access Required</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30 mb-3">
              {getCollectionName(nftGateSettings.collection)}
            </Badge>
            <p className="text-gray-300 text-sm">
              This {contentType} requires ownership of{" "}
              <span className="font-semibold text-purple-400">
                {nftGateSettings.amount} {nftGateSettings.amount === 1 ? "NFT" : "NFTs"}
              </span>{" "}
              from the {getCollectionName(nftGateSettings.collection)} collection.
            </p>
          </div>

          {connectionError && (
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {connectionError}
                {connectionError.includes("MetaMask is not installed") && (
                  <div className="mt-2">
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline"
                    >
                      Download MetaMask <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {nftCheckResult && (
            <Alert className={`border-${nftCheckResult.hasAccess ? 'green' : 'red'}-500/30 bg-${nftCheckResult.hasAccess ? 'green' : 'red'}-500/10`}>
              {nftCheckResult.hasAccess ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <AlertDescription className={`text-${nftCheckResult.hasAccess ? 'green' : 'red'}-300`}>
                {nftCheckResult.hasAccess ? (
                  <>
                    ✅ Access Granted! You own {nftCheckResult.ownedCount} NFT{nftCheckResult.ownedCount !== 1 ? 's' : ''} from this collection.
                    <br />
                    <span className="text-white font-medium">Unlocking content...</span>
                  </>
                ) : (
                  `❌ Access Denied. You need ${nftGateSettings.amount} NFT${nftGateSettings.amount !== 1 ? 's' : ''} but own ${nftCheckResult.ownedCount}.`
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {!walletAddress ? (
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            ) : (
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Connected Wallet:</p>
                <p className="text-white font-mono text-sm">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
            )}

            {walletAddress && !nftCheckResult && (
              <Button
                onClick={() => checkNFTOwnership(walletAddress)}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Verifying NFTs...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Verify NFT Ownership
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Your wallet will be used only to verify NFT ownership.
              <br />
              No transactions will be made.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
