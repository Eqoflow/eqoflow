import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Image, 
  FileText, 
  Users, 
  Bell, 
  UserCheck, 
  Grid3x3,
  Save,
  X
} from 'lucide-react';

const AVAILABLE_WIDGETS = [
  { id: 'media', name: 'Media', icon: FileText, description: 'Recent posts from the community' },
  { id: 'imageGallery', name: 'Image Gallery', icon: Image, description: 'All images shared in the community' },
  { id: 'following', name: 'Following', icon: UserCheck, description: 'Members you follow' },
  { id: 'updates', name: 'Latest Updates', icon: Bell, description: 'Recent activity feed' },
  { id: 'activeMembers', name: 'Active Members', icon: Users, description: 'Recently active members' },
  { id: 'groups', name: 'Related Groups', icon: Grid3x3, description: 'Similar communities' }
];

export default function WidgetManager({ isOpen, onClose, currentConfig, onSave }) {
  const [leftWidgets, setLeftWidgets] = useState(currentConfig?.left || ['media', 'following']);
  const [rightWidgets, setRightWidgets] = useState(currentConfig?.right || ['updates', 'activeMembers', 'groups']);

  // Get all active widget IDs
  const activeWidgets = [...leftWidgets, ...rightWidgets];

  const toggleWidget = (widgetId) => {
    const isActive = activeWidgets.includes(widgetId);
    
    if (isActive) {
      // Remove from whichever sidebar it's in
      if (leftWidgets.includes(widgetId)) {
        setLeftWidgets(leftWidgets.filter(w => w !== widgetId));
      } else {
        setRightWidgets(rightWidgets.filter(w => w !== widgetId));
      }
    } else {
      // Add to left sidebar by default
      setLeftWidgets([...leftWidgets, widgetId]);
    }
  };

  const handleSave = () => {
    onSave({ left: leftWidgets, right: rightWidgets });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dark-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Manage Widgets</DialogTitle>
          <p className="text-gray-400 text-sm">Toggle widgets on or off. Use "Move Widgets" to arrange them on your sidebars.</p>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {AVAILABLE_WIDGETS.map((widget) => {
            const isActive = activeWidgets.includes(widget.id);
            const Icon = widget.icon;
            
            return (
              <Card key={widget.id} className={`p-4 transition-all ${isActive ? 'border-purple-500/50 bg-purple-500/10' : 'border-gray-700/50 bg-black/20'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-400'}`}>{widget.name}</p>
                      <p className="text-gray-500 text-xs mt-1">{widget.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => toggleWidget(widget.id)}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-pink-500">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}