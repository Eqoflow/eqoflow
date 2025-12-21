import React from 'react';
import { Clock } from 'lucide-react';

export default function PayoutNotice() {
  return (
    <div className="p-4 bg-blue-900/40 border border-blue-500/30 rounded-xl mb-6">
      <div className="flex items-start gap-4">
        <Clock className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-semibold text-white mb-1">Creator Payout Information</h4>
          <p className="text-sm text-gray-300">
            To ensure service quality and buyer protection, payments for skills and community access are securely held by EqoFlow for a 14-day period.
          </p>
          <p className="text-sm text-gray-300 mt-2">
            Cleared funds are paid out to creators twice a month, on the <strong className="text-white">1st</strong> and <strong className="text-white">15th</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}