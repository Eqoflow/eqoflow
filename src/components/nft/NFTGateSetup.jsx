import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function NFTGateSetup({ onSetup, onCancel }) {
  const [collection, setCollection] = useState("");
  const [amount, setAmount] = useState(1);
  const [previewContent, setPreviewContent] = useState("");

  const handleSetup = () => {
    if (!collection) {
      alert("Please enter an NFT collection contract address.");
      return;
    }
    onSetup({
      collection,
      amount,
      preview_content: previewContent,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-20"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="dark-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              NFT Gate Setup
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">NFT Collection Address</label>
              <Input
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                placeholder="e.g., 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"
                className="bg-black/20 border-purple-500/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Minimum Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-black/20 border-purple-500/20 text-white"
              />
            </div>
             <div className="space-y-2">
              <label className="text-sm font-medium text-white">Public Preview Content</label>
              <Textarea
                value={previewContent}
                onChange={(e) => setPreviewContent(e.target.value)}
                placeholder="Write a teaser for what's behind the gate... This will be visible to everyone."
                className="mt-2 bg-black/20 border-purple-500/20 text-white"
                rows={4}
              />
              <p className="text-xs text-gray-400 mt-1">
                This short preview will entice users to unlock your exclusive content.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onCancel} className="border-purple-500/30 text-white hover:bg-purple-500/10">
                Cancel
              </Button>
              <Button
                onClick={handleSetup}
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
              >
                Set Gate
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}