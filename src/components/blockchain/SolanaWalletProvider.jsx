import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

// Build Helius RPC URL using the existing HELIUS_API_KEY secret
const HELIUS_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const SOLANA_RPC_URL = HELIUS_KEY 
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`
  : 'https://api.mainnet-beta.solana.com';

export default function SolanaWalletProvider({ children }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}