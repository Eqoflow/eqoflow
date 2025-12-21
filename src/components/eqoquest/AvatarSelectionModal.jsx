import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

const AVATARS = [
{
  name: "Mystic Mage",
  url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/0fa2d5f6c_4c7360a8-59a0-4964-8e98-ef0966a6ba54.png"
},
{
  name: "Cyber Core",
  url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/d07be7360_7ad277fa-534d-4adf-99d1-d8a3de18b246-removebg.png"
},
{
  name: "Cosmic Pilot",
  url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/2cc2491a7_212c2aee-b1f1-4ffb-91dd-400f5cd91300-removebg.png"
},
{
  name: "Elven Ranger",
  url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/4b3d97cc9_cf8269e8-6db0-4149-90eb-7ef0959998ad-removebg.png"
},
{
  name: "Wasteland Scavenger",
  url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/26093392d_ddb3732a-abe9-4037-a72d-10ed76c09b4a-removebg.png"
},
{
  name: "Tech Droid",
  url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/b42eec700_eea4c4e5-a330-4f4c-8bce-52f63192f735-removebg.png"
},
{
  name: "Cyberpunk Rebel",
  url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/18d32d48b_Screenshot_2025-12-17_132752-removebg-preview.png"
},
{
  name: "Space Trooper",
  url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/687e8a7d9ad971203c39d072/b1eb82af4_Screenshot_2025-12-17_132818-removebg-preview.png"
}];


export default function AvatarSelectionModal({ isOpen, onClose, onSelect, isLoading }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#000000] p-6 fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-w-3xl dark:bg-gray-900 border-2 border-[var(--color-primary)]">
        {isLoading &&
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm rounded-lg">
            <Loader2 className="w-12 h-12 animate-spin text-white" />
          </div>
        }
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center" style={{ color: 'var(--color-primary)' }}>
            Choose Your Avatar
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-4">
            {AVATARS.map((avatar, index) =>
            <div
              key={index}
              className="group relative cursor-pointer rounded-xl overflow-hidden border-2 border-transparent hover:border-[var(--color-primary)] transition-all duration-300 bg-gray-100 dark:bg-gray-800"
              onClick={() => onSelect(avatar.url)}>

                <div className="aspect-[3/4] relative">
                  <img
                  src={avatar.url}
                  alt={avatar.name} className="bg-gray-950 p-2 w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" />


                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-center text-sm font-semibold">{avatar.name}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>);

}