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
      console.log('🔐 [useBlockchainTimestamp] Starting timestamp process...');
      console.log('🔐 [useBlockchainTimestamp] Content hash:', contentHash, 'Post ID:', postId);
      console.log('🔐 [useBlockchainTimestamp] Initial wallet state:', { 
        connected: wallet.connected, 
        hasPublicKey: !!wallet.publicKey,
        walletName: wallet?.adapter?.name,
        walletExists: !!wallet
      });

      // 1) Require a selected wallet first
      if (!wallet || !wallet.adapter) {
        console.error('🔐 [useBlockchainTimestamp] No wallet selected');
        setIsProcessing(false);
        throw new Error('No wallet selected. Please connect Phantom using the wallet button before timestamping.');
      }

      console.log('🔐 [useBlockchainTimestamp] Wallet selected:', wallet.adapter.name);

      // 2) If not yet connected, now it's safe to call connect()
      if (!wallet.connected || !wallet.publicKey) {
        console.log('🔐 [useBlockchainTimestamp] Wallet not connected, triggering connect()...');
        try {
          await wallet.connect();
          console.log('🔐 [useBlockchainTimestamp] Connect() completed, waiting for state update...');
          // After connect(), wait for wallet state to propagate
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('🔐 [useBlockchainTimestamp] After wait, wallet state:', { connected: wallet.connected, hasPublicKey: !!wallet.publicKey });
        } catch (err) {
          console.error('🔐 [useBlockchainTimestamp] Connect failed:', err);
          setIsProcessing(false);
          throw new Error('User cancelled wallet connection or connection failed.');
        }
      }

      // 3) Re-check publicKey after connection attempt
      if (!wallet.publicKey) {
        console.error('🔐 [useBlockchainTimestamp] No publicKey available after connection attempt');
        setIsProcessing(false);
        throw new Error('Wallet connection did not provide a public key.');
      }

      console.log('✅ [useBlockchainTimestamp] Wallet ready, creating transaction for:', wallet.publicKey.toBase58());

      // Create memo data with content hash
      const memoData = `EQOFLOW:${contentHash}:${postId}:${Date.now()}`;
      
      // Get recent blockhash
      console.log('🔐 [useBlockchainTimestamp] Getting recent blockhash...');
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

      console.log('📤 [useBlockchainTimestamp] Sending transaction to Phantom for approval...');
      console.log('📤 [useBlockchainTimestamp] Transaction details:', {
        feePayer: transaction.feePayer.toBase58(),
        recentBlockhash: transaction.recentBlockhash,
        instructions: transaction.instructions.length,
        memoData: memoData.substring(0, 50) + '...'
      });

      // THIS IS THE CRITICAL CALL - sends transaction to Phantom for user approval
      const signature = await wallet.sendTransaction(transaction, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });

      console.log('✅ [useBlockchainTimestamp] Transaction approved by user! Signature:', signature);

      // Wait for confirmation on blockchain
      console.log('⏳ [useBlockchainTimestamp] Waiting for blockchain confirmation...');
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        console.error('❌ [useBlockchainTimestamp] Transaction failed on blockchain:', confirmation.value.err);
        throw new Error('Transaction failed on blockchain');
      }

      console.log('✅ [useBlockchainTimestamp] Transaction confirmed on blockchain');

      // Call backend to deduct $eqoflo fee and update post with signature
      console.log('💰 [useBlockchainTimestamp] Calling backend to process fee and update post...');
      const response = await timestampOnBlockchain({
        blockchain_tx_id: signature,
        post_id: postId,
      });

      console.log('✅ [useBlockchainTimestamp] Backend response:', response);

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
      console.error('❌ [useBlockchainTimestamp] Error:', err);
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