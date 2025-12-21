import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function WalletButton({ user, onUpdate }) {
  const isConnected = user?.solana_wallet_address;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={createPageUrl("Wallet")}>
            <Button
              variant="ghost"
              size="icon"
              className={`header-icon-btn relative ${
                isConnected ? 'wallet-connected' : 'wallet-disconnected'
              }`}
              aria-label={isConnected ? 'Wallet Connected' : 'Connect Wallet'}
            >
              <Wallet className={`w-5 h-5 ${isConnected ? 'md:text-gray-400 text-green-400' : ''}`} />
              {isConnected && (
                <CheckCircle className="hidden md:block absolute -top-1 -right-1 w-4 h-4 text-green-400 bg-slate-950 rounded-full" />
              )}
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent className="bg-black/80 border-purple-500/20 text-white">
          <p>{isConnected ? 'Wallet Connected' : 'Connect Wallet'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}