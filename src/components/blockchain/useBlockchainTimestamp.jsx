import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { timestampOnBlockchain } from '@/functions/timestampOnBlockchain';

export function useBlockchainTimestamp() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected, connect } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const timestampContent = async (contentHash, postId) => {
    // Ensure wallet is connected – if not, prompt user now
    if (!connected || !publicKey) {
      try {
        await connect();
      } catch (err) {
        throw new Error('User cancelled wallet connection or connection failed.');
      }
    }

    // After connect, verify we have publicKey
    if (!publicKey) {
      throw new Error('Wallet connection did not provide a public key.');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create memo data
      const memoData = `EQOFLOW:${contentHash}:${postId || 'content'}:${Date.now()}`;
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      
      // Create transaction with memo instruction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: publicKey,
      });

      // Add memo instruction (convert string to Uint8Array for browser compatibility)
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: new TextEncoder().encode(memoData),
      });
      transaction.add(memoInstruction);

      // Send transaction and wait for signature
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });

      console.log('Transaction sent, signature:', signature);

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