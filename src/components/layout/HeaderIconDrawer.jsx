import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MoreHorizontal } from 'lucide-react';
import WalletButton from './WalletButton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function HeaderIconDrawer({ user, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative header-icon-btn"
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent className="bg-black/80 border-purple-500/20 text-white">
          <p>More Options</p>
        </TooltipContent>
      </Tooltip>

      <SheetContent side="left" className="bg-slate-950 border-purple-500/20 text-white w-64">
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-400 font-medium mb-2">Quick Actions</p>
            <WalletButton user={user} onUpdate={onUpdate} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}