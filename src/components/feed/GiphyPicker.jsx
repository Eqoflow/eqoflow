import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2 } from "lucide-react";

export default function GiphyPicker({ isOpen, onClose, onSelect }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadGifs("trending");
    }
  }, [isOpen]);

  const loadGifs = async (query) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('searchGiphy', { q: query });
      if (response.data?.gifs) {
        setGifs(response.data.gifs);
      }
    } catch (error) {
      console.error("Failed to load GIFs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      loadGifs(searchQuery);
    } else {
      loadGifs("trending");
    }
  };

  const handleGifSelect = (gif) => {
    onSelect(gif.url);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-3xl">
        <DialogHeader>
          <DialogTitle>Search GIFs</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for GIFs..."
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </form>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {gifs.map((gif) => (
                <div
                  key={gif.id}
                  onClick={() => handleGifSelect(gif)}
                  className="cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                >
                  <img
                    src={gif.preview}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-center text-xs text-gray-500 pt-2">
          Powered by <span className="font-bold ml-1">GIPHY</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}