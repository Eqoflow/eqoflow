import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, FileKey, ExternalLink, Copy, Check, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ProvenanceDisplay({ post, compact = false }) {
  const [license, setLicense] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (post?.license_id) {
      loadLicense();
    }
  }, [post?.license_id]);

  const loadLicense = async () => {
    try {
      const licenses = await base44.entities.ContentLicense.filter({ id: post.license_id });
      if (licenses.length > 0) {
        setLicense(licenses[0]);
      }
    } catch (error) {
      console.error("Failed to load license:", error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!post?.content_hash && !post?.blockchain_tx_id && !post?.license_id) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {post.blockchain_tx_id && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <Clock className="w-4 h-4 text-green-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-green-500/30 max-w-xs">
                <p className="text-xs text-green-400 font-mono break-all">{post.blockchain_tx_id}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {license && (
          <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-xs flex items-center gap-1">
            <FileKey className="w-3 h-3" />
            {license.short_code}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-black/20 border-purple-500/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-purple-400" />
        <h3 className="text-sm font-semibold text-white">Content Provenance</h3>
      </div>

      {/* Content Hash */}
      {post.content_hash && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400">Content Hash (SHA-256)</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-purple-300 bg-black/30 px-2 py-1 rounded font-mono flex-1 truncate">
              {post.content_hash}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(post.content_hash)}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Blockchain Transaction */}
      {post.blockchain_tx_id && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Check className="w-3 h-3 text-green-400" />
            Blockchain Timestamp (Solana)
          </p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-green-300 bg-black/30 px-2 py-1 rounded font-mono flex-1 truncate">
              {post.blockchain_tx_id}
            </code>
            <a
              href={`https://explorer.solana.com/tx/${post.blockchain_tx_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>
          <p className="text-xs text-green-400/70 mt-1">
            Timestamped: {new Date(post.updated_date || post.created_date).toLocaleString()}
          </p>
        </div>
      )}

      {/* License */}
      {license && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400">Content License</p>
          <div className="flex items-center gap-2">
            <FileKey className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white font-medium">{license.name}</span>
            <Badge className="bg-purple-600/20 text-purple-300 text-xs">{license.short_code}</Badge>
          </div>
          <p className="text-xs text-gray-400 mt-2">{license.description}</p>
          
          {/* License Terms */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {license.terms?.commercial_use && (
              <div className="flex items-center gap-1 text-xs text-green-400">
                <Check className="w-3 h-3" />
                Commercial Use
              </div>
            )}
            {license.terms?.modification && (
              <div className="flex items-center gap-1 text-xs text-green-400">
                <Check className="w-3 h-3" />
                Modifications
              </div>
            )}
            {license.terms?.distribution && (
              <div className="flex items-center gap-1 text-xs text-green-400">
                <Check className="w-3 h-3" />
                Distribution
              </div>
            )}
            {license.terms?.attribution_required && (
              <div className="flex items-center gap-1 text-xs text-purple-400">
                <Shield className="w-3 h-3" />
                Attribution Required
              </div>
            )}
            {!license.terms?.ai_training && (
              <div className="flex items-center gap-1 text-xs text-red-400">
                <X className="w-3 h-3" />
                No AI Training
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
        Created: {new Date(post.created_date).toLocaleString()}
      </div>
    </Card>
  );
}