import React from 'react';
import MarketplaceMonitor from '../components/admin/MarketplaceMonitor';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

export default function MarketplaceMonitorPage() {
  return (
    <div className="p-0 md:p-6 bg-black min-h-full">
      {/* Back Button */}
      <Link to={createPageUrl("AdminHub")}>
        <Button
          variant="outline"
          className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Hub
        </Button>
      </Link>

      <MarketplaceMonitor />
    </div>
  );
}