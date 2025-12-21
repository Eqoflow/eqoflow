import React from "react";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

export default function NFTBadge({ user, size = "sm" }) {
  if (!user?.nft_wallet_connected) {
    return null;
  }

  const badgeSize = size === "lg" ? "text-sm" : "text-xs";
  const iconSize = size === "lg" ? "w-4 h-4" : "w-3 h-3";

  return (
    <Badge 
      className={`bg-gradient-to-r from-yellow-600/20 to-orange-600/20 text-yellow-400 border-yellow-500/30 ${badgeSize} ml-1`}
      title="Verified NFT Holder"
    >
      <Crown className={`${iconSize} mr-1`} />
      {size === "lg" ? "NFT Verified" : "NFT"}
    </Badge>
  );
}