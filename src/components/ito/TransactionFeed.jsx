import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, CheckCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Helper to format wallet addresses for anonymity
const formatAddress = (address) => {
  if (!address) return 'Anonymous';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
};

export default function TransactionFeed({ transactions }) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  const paginatedTransactions = transactions ? transactions.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  ) : [];

  const totalPages = transactions ? Math.ceil(transactions.length / itemsPerPage) : 0;

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  return (
    <Card className="dark-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-green-400" />
          Live Deposit Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions && transactions.length > 0 ? (
          <>
            <div className="space-y-3">
              {paginatedTransactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800/50 rounded-lg p-3 border border-purple-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/10 p-2 rounded-full">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {tx.amount_usdc.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} Deposit
                      </p>
                      <p className="text-sm text-gray-400">
                        by {formatAddress(tx.from_address)} &bull; {formatDistanceToNow(new Date(tx.created_date))} ago
                      </p>
                    </div>
                  </div>
                  <div className="text-right w-full sm:w-auto">
                      <p className="text-green-400 font-bold">
                          + {tx.tokens_allocated.toLocaleString()} $EQOFLO
                      </p>
                      <a 
                        href={`https://solscan.io/tx/${tx.transaction_hash}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center justify-end gap-1"
                      >
                        View on Solscan <ExternalLink className="w-3 h-3" />
                      </a>
                  </div>
                </motion.div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-purple-500/10">
                <Button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0}
                  variant="outline"
                  className="border-purple-500/30 text-white hover:bg-purple-500/10"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <span className="text-sm text-gray-400">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  onClick={goToNextPage}
                  disabled={currentPage >= totalPages - 1}
                  variant="outline"
                  className="border-purple-500/30 text-white hover:bg-purple-500/10"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">No deposits have been made yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}