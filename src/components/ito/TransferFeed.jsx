import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ExternalLink, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function TransferFeed({ transfers }) {
  return (
    <Card className="dark-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ArrowDownLeft className="w-5 h-5 text-orange-400" />
          Live Transfer Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!transfers || transfers.length === 0 ? (
          <div className="text-center py-10">
            <ArrowDownLeft className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold text-white mb-2">No Transfers Yet</h3>
            <p className="text-gray-400">Outgoing transfers will appear here once added.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.map((transfer) => {
              const totalDeducted = transfer.amount_usdc || 0;
              const isBankTransfer = transfer.transaction_hash?.startsWith('BANK_');
              
              return (
                <div
                  key={transfer.id}
                  className="bg-slate-800/50 rounded-lg p-3 border border-purple-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-red-500/10 p-2 rounded-full">
                      <CheckCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {totalDeducted.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} Transfer
                      </p>
                      <p className="text-sm text-gray-400">
                        {transfer.description || 'Outgoing Transfer'} &bull; {formatDistanceToNow(new Date(transfer.created_date))} ago
                      </p>
                    </div>
                  </div>
                  <div className="text-right w-full sm:w-auto">
                    <p className="text-red-400 font-bold">
                      - {totalDeducted.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </p>
                    {isBankTransfer ? (
                      <p className="text-xs text-white">
                        Bank Transfer
                      </p>
                    ) : (
                      <a 
                        href={`https://solscan.io/tx/${transfer.transaction_hash}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-orange-400 hover:text-orange-300 flex items-center justify-end gap-1"
                      >
                        View on Solscan <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}