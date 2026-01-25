import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { timestampOnBlockchain } from '@/functions/timestampOnBlockchain';

export function useBlockchainTimestamp() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const timestampContent = async (contentHash, postId) => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('🔐 Starting timestamp process...');
      console.log('Initial wallet state:', { connected: wallet.connected, hasPublicKey: !!wallet.publicKey });

      // Ensure wallet is connected – if not, prompt user now
      if (!wallet.connected || !wallet.publicKey) {
        console.log('Wallet not connected, triggering connect()...');
        try {
          await wallet.connect();
          console.log('Connect() completed, waiting for state update...');
          // After connect(), wait for wallet state to propagate
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('After wait, wallet state:', { connected: wallet.connected, hasPublicKey: !!wallet.publicKey });
        } catch (err) {
          console.error('Connect failed:', err);
          setIsProcessing(false);
          throw new Error('User cancelled wallet connection or connection failed.');
        }
      }

      // Re-check publicKey after connection attempt
      if (!wallet.publicKey) {
        console.error('No publicKey available after connection attempt');
        setIsProcessing(false);
        throw new Error('Wallet connection did not provide a public key.');
      }

      console.log('✅ Wallet ready, creating transaction for:', wallet.publicKey.toBase58());

      // Create memo data
      const memoData = `EQOFLOW:${contentHash}:${postId || 'content'}:${Date.now()}`;
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      
      // Create transaction with memo instruction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: wallet.publicKey,
      });

      // Add memo instruction (convert string to Uint8Array for browser compatibility)
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: new TextEncoder().encode(memoData),
      });
      transaction.add(memoInstruction);

      console.log('📤 Sending transaction to wallet for approval...');
      console.log('Transaction details:', {
        feePayer: transaction.feePayer.toBase58(),
        recentBlockhash: transaction.recentBlockhash,
        instructions: transaction.instructions.length
      });

      // Send transaction and wait for signature - this should trigger Phantom popup
      const signature = await wallet.sendTransaction(transaction, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });

      console.log('✅ Transaction approved! Signature:', signature);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed on blockchain');
      }

      console.log('Transaction confirmed on blockchain');

      // Call backend to deduct fee and update post
      const response = await timestampOnBlockchain({
        blockchain_tx_id: signature,
        post_id: postId,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to process timestamp fee');
      }

      setIsProcessing(false);
      return {
        success: true,
        blockchain_tx_id: signature,
        explorer_url: `https://explorer.solana.com/tx/${signature}`,
        new_balance: response.data.new_balance,
      };
    } catch (err) {
      console.error('Blockchain timestamp error:', err);
      setError(err.message || 'Failed to timestamp on blockchain');
      setIsProcessing(false);
      throw err;
    }
  };

  return {
    timestampContent,
    isProcessing,
    error,
  };
}