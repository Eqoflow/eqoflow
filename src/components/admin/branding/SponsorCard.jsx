import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Globe, DollarSign, Edit, Trash2, Power } from 'lucide-react';

export default function SponsorCard({ sponsor, onEdit, onToggleActive, onDelete }) {
  const handleToggle = (isActive) => {
    onToggleActive(sponsor, isActive);
  };

  return (
    <Card className="dark-card border-slate-700/50 hover-lift flex flex-col">
      <CardHeader className="flex-row items-start gap-4">
        <img src={sponsor.logo_url || 'https://via.placeholder.com/80/1e293b/FFFFFF?text=Logo'} alt={`${sponsor.name} logo`} className="w-16 h-16 rounded-lg bg-slate-700 object-contain p-1" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <CardTitle className="text-white text-xl">{sponsor.name}</CardTitle>
            <Switch
              checked={sponsor.is_active}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
          <CardDescription className="text-gray-400 flex items-center gap-2 mt-1">
            <Globe className="w-4 h-4" />
            <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
              {sponsor.website}
            </a>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Subscribed Categories</h4>
          <div className="flex flex-wrap gap-2">
            {sponsor.subscribed_category_ids && sponsor.subscribed_category_ids.length > 0 ? (
              sponsor.subscribed_category_ids.map(catId => <Badge key={catId} variant="outline" className="text-purple-300 border-purple-500/30">{catId}</Badge>)
            ) : (
              <Badge variant="secondary" className="bg-slate-700 text-gray-400">None</Badge>
            )}
          </div>
        </div>
        <div className="pt-4 border-t border-slate-700/50">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Budget & Status</h4>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-green-400">
              <DollarSign className="w-5 h-5" />
              <span className="text-lg font-bold">${(sponsor.monthly_budget_usd || 0).toLocaleString()}</span>
              <span className="text-sm text-gray-400">/ month</span>
            </div>
            {sponsor.is_active ?
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 flex items-center gap-1">
                <Power className="w-3 h-3" /> Active
              </Badge> :
              <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/30">Inactive</Badge>
            }
          </div>
        </div>
      </CardContent>
      <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-700/50 bg-slate-900/20">
        <Button variant="ghost" size="sm" onClick={() => onEdit(sponsor)} className="text-gray-300 hover:bg-slate-700 hover:text-white">
          <Edit className="w-4 h-4 mr-2" /> Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(sponsor)} className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </Button>
      </div>
    </Card>
  );
}