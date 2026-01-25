import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function WalletButton({ user, onUpdate }) {
  const { select, connect, disconnect, connected, connecting, publicKey, wallets } = useWallet();

  const handleWalletClick = async () => {
    try {
      if (connected) {
        await disconnect();
        console.log('🔐 [WalletButton] Disconnected from wallet');
      } else {
        // Find and select Phantom wallet
        const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
        if (phantomWallet) {
          console.log('🔐 [WalletButton] Selecting Phantom wallet...');
          select(phantomWallet.adapter.name);
          
          // Wait a moment for selection to complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          console.log('🔐 [WalletButton] Connecting to Phantom...');
          await connect();
          console.log('🔐 [WalletButton] Connected! PublicKey:', publicKey?.toBase58());
        } else {
          console.error('🔐 [WalletButton] Phantom wallet not found');
        }
      }
    } catch (error) {
      console.error('🔐 [WalletButton] Wallet action failed:', error);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleWalletClick}
            disabled={connecting}
            className={`header-icon-btn relative ${
              connected ? 'wallet-connected' : 'wallet-disconnected'
            }`}
            aria-label={connected ? 'Wallet Connected' : 'Connect Wallet'}
          >
            <Wallet className={`w-5 h-5 ${connected ? 'md:text-gray-400 text-green-400' : ''}`} />
            {connected && (
              <CheckCircle className="hidden md:block absolute -top-1 -right-1 w-4 h-4 text-green-400 bg-slate-950 rounded-full" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-black/80 border-purple-500/20 text-white">
          <p>{connected ? `Connected: ${publicKey?.toBase58().slice(0, 4)}...${publicKey?.toBase58().slice(-4)}` : 'Connect Phantom'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}