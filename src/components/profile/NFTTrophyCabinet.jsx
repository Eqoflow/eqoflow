import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Trophy,
  Eye,
  EyeOff,
  View,
  Wallet,
  Plus,
  ExternalLink,
  Sparkles } from
"lucide-react";
import { User } from "@/entities/User";

export default function NFTTrophyCabinet({ user, onUpdate, onTogglePublic, isEditing, onViewVRRoom }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const current = await User.me();
        setCurrentUser(current);
      } catch (error) {
        console.log("Not logged in or error getting current user");
        setCurrentUser(null);
      }
    };
    getCurrentUser();
  }, []);

  const cabinetSettings = {
    is_public: user?.nft_trophy_cabinet?.is_public ?? false,
    vr_showcase_enabled: user?.nft_trophy_cabinet?.vr_showcase_enabled ?? true,
    featured_nfts: user?.nft_trophy_cabinet?.featured_nfts || []
  };

  const isOwnProfile = currentUser?.email === user?.email;

  const handleSettingChange = (key, value) => {
    const newSettings = { ...cabinetSettings, [key]: value };
    onUpdate({ nft_trophy_cabinet: newSettings });
  };

  const getRarityColor = (rank) => {
    if (rank <= 100) return "text-yellow-400 bg-yellow-600/20 border-yellow-500/30";
    if (rank <= 500) return "text-purple-400 bg-purple-600/20 border-purple-500/30";
    if (rank <= 1000) return "text-blue-400 bg-blue-600/20 border-blue-500/30";
    return "text-gray-400 bg-gray-600/20 border-gray-500/30";
  };

  const getRarityLabel = (rank) => {
    if (rank <= 100) return "Legendary";
    if (rank <= 500) return "Epic";
    if (rank <= 1000) return "Rare";
    return "Common";
  };

  return (
    <Card className="dark-card">
      <CardHeader className="bg-[#000000] p-6 flex flex-col space-y-1.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            NFT Trophy Cabinet
            {cabinetSettings.is_public ?
            <Badge className="bg-green-600/20 text-green-400 border-green-500/30 text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Public
              </Badge> :

            <Badge className="bg-red-600/20 text-red-400 border-red-500/30 text-xs">
                <EyeOff className="w-3 h-3 mr-1" />
                Private
              </Badge>
            }
          </CardTitle>
          <div className="flex items-center gap-2">
            {cabinetSettings.featured_nfts.length > 0 && onViewVRRoom &&
            <Button
              size="sm"
              onClick={onViewVRRoom}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">

                <View className="w-4 h-4 mr-2" />
                View 3D Gallery
              </Button>
            }
            {isEditing && isOwnProfile && cabinetSettings.is_public &&
            <Button
              size="sm"
              variant="outline"
              onClick={() => onTogglePublic(false)}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10">

                <EyeOff className="w-4 h-4 mr-2" />
                Make Private
              </Button>
            }
            {isEditing && isOwnProfile && !cabinetSettings.is_public &&
            <Button
              size="sm"
              onClick={() => onTogglePublic(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">

                <Eye className="w-4 h-4 mr-2" />
                Make Public
              </Button>
            }
          </div>
        </div>
      </CardHeader>

      <CardContent className="bg-[#000000] p-3 space-y-4 md:space-y-6 sm:p-4 md:p-6">
        {isEditing && isOwnProfile &&
        <div className="space-y-4 p-4 bg-black/20 rounded-xl border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Public Trophy Cabinet</p>
                <p className="text-sm text-gray-400">Allow others to see your NFT collection</p>
              </div>
              <Switch
              checked={cabinetSettings.is_public}
              onCheckedChange={(checked) => handleSettingChange("is_public", checked)} />

            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">VR Showcase</p>
                <p className="text-sm text-gray-400">Enable 3D virtual reality trophy room</p>
              </div>
              <Switch
              checked={cabinetSettings.vr_showcase_enabled}
              onCheckedChange={(checked) => handleSettingChange("vr_showcase_enabled", checked)} />

            </div>
          </div>
        }

        {cabinetSettings.featured_nfts.length > 0 ?
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cabinetSettings.featured_nfts.map((nft, index) =>
          <div
            key={index}
            className="group relative bg-black/30 rounded-xl border border-purple-500/20 overflow-hidden hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">

                <div className="aspect-square relative overflow-hidden">
                  <img
                src={nft.image_url}
                alt={nft.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.target.src = "/api/placeholder/300/300";
                }} />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                  size="sm"
                  variant="outline"
                  className="bg-black/80 border-purple-500/30 text-white hover:bg-purple-500/20">

                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-white truncate text-sm">
                        {nft.name}
                      </h4>
                      <p className="text-xs text-gray-400 truncate">
                        {nft.collection_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {nft.rarity_rank &&
                <Badge className={`${getRarityColor(nft.rarity_rank)} text-xs`}>
                        #{nft.rarity_rank} {getRarityLabel(nft.rarity_rank)}
                      </Badge>
                }
                    {nft.floor_price &&
                <div className="text-xs text-gray-300">
                        Floor: {nft.floor_price}Ξ
                      </div>
                }
                  </div>
                </div>
              </div>
          )}

            {isEditing && isOwnProfile &&
          <div className="group relative bg-black/20 rounded-xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 transition-colors duration-300 flex items-center justify-center min-h-[200px] cursor-pointer">
                <div className="text-center">
                  <Plus className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-400">Add NFT</p>
                  <p className="text-xs text-gray-500">Showcase your collection</p>
                </div>
              </div>
          }
          </div> :

        <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            {isOwnProfile ?
          <>
                <h3 className="text-lg font-semibold text-white mb-2">No NFTs Connected</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Connect your wallet to showcase your NFT collection
                </p>
                {user?.nft_wallet_connected ?
            <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add NFTs to Cabinet
                  </Button> :

            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
            }
              </> :

          <>
                <h3 className="text-lg font-semibold text-white mb-2">No NFTs Showcased</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  {user?.full_name || "This user"} hasn't added any NFTs to their trophy cabinet yet.
                </p>
              </>
          }
          </div>
        }

        {cabinetSettings.featured_nfts.length > 0 &&
        <div className="mt-6 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Showing {cabinetSettings.featured_nfts.length} featured NFTs</span>
              {cabinetSettings.vr_showcase_enabled &&
            <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  VR Ready
                </span>
            }
            </div>
          </div>
        }
      </CardContent>
    </Card>);

}