import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

// Use configured Helius RPC endpoint
const SOLANA_RPC_URL = import.meta.env.VITE_HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=52439c67-aead-4d94-9680-3ee0550f33bb';

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