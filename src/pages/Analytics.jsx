import React from 'react';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

export default function AnalyticsPage() {
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

      <Card className="dark-card p-6 bg-slate-950/50">
         <AnalyticsDashboard />
      </Card>
    </div>
  );
}