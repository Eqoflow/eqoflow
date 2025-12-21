
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Clock,
  Heart,
  Users,
  Compass,
  Zap,
  Plus,
  X,
  Info, // Added icon
  Shield // Added Shield icon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const algorithmOptions = [
{
  id: "chronological",
  name: "Chronological",
  description: "Newest posts first, like the old days",
  icon: Clock,
  color: "text-blue-400"
},
{
  id: "engagement",
  name: "Engagement-Based",
  description: "Posts with the most likes, comments, and shares",
  icon: Heart,
  color: "text-red-400"
},
{
  id: "personalized",
  name: "Personalized",
  description: "AI-curated based on your interests and behavior",
  icon: Zap,
  color: "text-purple-400"
},
{
  id: "community_focused",
  name: "Community-Focused",
  description: "Prioritizes content from your communities",
  icon: Users,
  color: "text-green-400"
},
{
  id: "discovery",
  name: "Discovery Mode",
  description: "Helps you find new creators and content",
  icon: Compass,
  color: "text-cyan-400"
}];


const defaultPreferences = {
  primary_algorithm: 'personalized',
  weight_recency: 0.3,
  weight_engagement: 0.4,
  weight_creator_reputation: 0.2,
  weight_personal_interest: 0.1,
  boost_followed_creators: true,
  boost_community_content: true,
  boost_confidential_matches: false, // Added default preference for confidential matches
  filter_controversial: false,
  minimum_quality_threshold: 0.3,
  diversity_factor: 0.5,
  custom_filters: []
};

export default function AlgorithmSelector({ preferences, onUpdate, onApply }) {
  const [localPrefs, setLocalPrefs] = useState(preferences || defaultPreferences);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newFilter, setNewFilter] = useState({ type: "keyword", value: "", action: "boost" });

  const handleWeightChange = (key, value) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [key]: value[0] / 100
    }));
  };

  const handleAddFilter = () => {
    if (newFilter.value.trim()) {
      setLocalPrefs((prev) => ({
        ...prev,
        custom_filters: [...(prev.custom_filters || []), { ...newFilter }]
      }));
      setNewFilter({ type: "keyword", value: "", action: "boost" });
    }
  };

  const handleRemoveFilter = (index) => {
    setLocalPrefs((prev) => ({
      ...prev,
      custom_filters: prev.custom_filters?.filter((_, i) => i !== index) || []
    }));
  };

  const handleApply = () => {
    onUpdate(localPrefs);
    onApply();
  };

  const selectedAlgorithm = algorithmOptions.find((a) => a.id === localPrefs.primary_algorithm);

  return (
    <Card className="dark-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          Algorithm Settings
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Take control of your feed. Choose how you want to see content ranked and filtered.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Nillion Confidential Matches Toggle - TOP SECTION */}
        <div className="bg-[#000000] p-4 rounded-lg flex items-center justify-between from-purple-600/10 to-pink-600/10 border border-purple-500/20">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-white">Prioritize Confidential Matches</p>
              <Badge className="bg-purple-600/20 text-purple-300 text-xs flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Nillion
              </Badge>
            </div>
            <p className="text-sm text-gray-400 mt-1">Show content from users matched via private interests</p>
          </div>
          <Switch
            checked={localPrefs.boost_confidential_matches || false}
            onCheckedChange={(checked) => setLocalPrefs((prev) => ({ ...prev, boost_confidential_matches: checked }))} />

        </div>

        {/* Primary Algorithm Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Primary Algorithm</h3>
          <div className="grid gap-3">
            {algorithmOptions.map((algo) => {
              const Icon = algo.icon;
              const isSelected = localPrefs.primary_algorithm === algo.id;

              return (
                <div
                  key={algo.id}
                  onClick={() => setLocalPrefs((prev) => ({ ...prev, primary_algorithm: algo.id }))}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                  isSelected ?
                  'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20' :
                  'border-gray-700 bg-black/20 hover:border-gray-600'}`
                  }>

                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-purple-400' : algo.color}`} />
                    <div className="flex-1">
                      <div className="font-medium text-white">{algo.name}</div>
                      <div className="text-sm text-gray-400">{algo.description}</div>
                    </div>
                    {isSelected &&
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
                    }
                  </div>
                </div>);

            })}
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
          <div>
            <p className="font-medium text-white">Advanced Customization</p>
            <p className="text-sm text-gray-400">Fine-tune weights and filters</p>
          </div>
          <Switch
            checked={showAdvanced}
            onCheckedChange={setShowAdvanced} />

        </div>

        {/* Advanced Settings */}
        <AnimatePresence>
          {showAdvanced &&
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6">

              {/* Weight Sliders */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Ranking Weights</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-gray-300">Recency</label>
                      <span className="text-sm text-purple-400">{Math.round(localPrefs.weight_recency * 100)}%</span>
                    </div>
                    <Slider
                    value={[localPrefs.weight_recency * 100]}
                    onValueChange={(value) => handleWeightChange('weight_recency', value)}
                    max={100}
                    step={5}
                    className="w-full" />

                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-gray-300">Engagement</label>
                      <span className="text-sm text-purple-400">{Math.round(localPrefs.weight_engagement * 100)}%</span>
                    </div>
                    <Slider
                    value={[localPrefs.weight_engagement * 100]}
                    onValueChange={(value) => handleWeightChange('weight_engagement', value)}
                    max={100}
                    step={5}
                    className="w-full" />

                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-gray-300">Creator Reputation</label>
                      <span className="text-sm text-purple-400">{Math.round(localPrefs.weight_creator_reputation * 100)}%</span>
                    </div>
                    <Slider
                    value={[localPrefs.weight_creator_reputation * 100]}
                    onValueChange={(value) => handleWeightChange('weight_creator_reputation', value)}
                    max={100}
                    step={5}
                    className="w-full" />

                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-gray-300">Personal Interest</label>
                      <span className="text-sm text-purple-400">{Math.round(localPrefs.weight_personal_interest * 100)}%</span>
                    </div>
                    <Slider
                    value={[localPrefs.weight_personal_interest * 100]}
                    onValueChange={(value) => handleWeightChange('weight_personal_interest', value)}
                    max={100}
                    step={5}
                    className="w-full" />

                  </div>
                </div>
              </div>

              {/* Boost Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Content Boosts</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Boost Followed Creators</p>
                      <p className="text-sm text-gray-400">Prioritize content from people you follow</p>
                    </div>
                    <Switch
                    checked={localPrefs.boost_followed_creators}
                    onCheckedChange={(checked) => setLocalPrefs((prev) => ({ ...prev, boost_followed_creators: checked }))} />

                  </div>

                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Boost Community Content</p>
                      <p className="text-sm text-gray-400">Prioritize content from your communities</p>
                    </div>
                    <Switch
                    checked={localPrefs.boost_community_content}
                    onCheckedChange={(checked) => setLocalPrefs((prev) => ({ ...prev, boost_community_content: checked }))} />

                  </div>

                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Filter Controversial</p>
                      <p className="text-sm text-gray-400">Hide potentially controversial content</p>
                    </div>
                    <Switch
                    checked={localPrefs.filter_controversial}
                    onCheckedChange={(checked) => setLocalPrefs((prev) => ({ ...prev, filter_controversial: checked }))} />

                  </div>
                </div>
              </div>

              {/* Quality & Diversity */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Quality & Diversity</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-gray-300">Minimum Quality Threshold</label>
                      <span className="text-sm text-purple-400">{Math.round(localPrefs.minimum_quality_threshold * 100)}%</span>
                    </div>
                    <Slider
                    value={[localPrefs.minimum_quality_threshold * 100]}
                    onValueChange={(value) => handleWeightChange('minimum_quality_threshold', value)}
                    max={100}
                    step={5}
                    className="w-full" />

                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-gray-300">Diversity Factor</label>
                      <span className="text-sm text-purple-400">{Math.round(localPrefs.diversity_factor * 100)}%</span>
                    </div>
                    <Slider
                    value={[localPrefs.diversity_factor * 100]}
                    onValueChange={(value) => handleWeightChange('diversity_factor', value)}
                    max={100}
                    step={5}
                    className="w-full" />

                  </div>
                </div>
              </div>

              {/* Custom Filters */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Custom Filters</h3>
                
                {/* Add New Filter */}
                <div className="flex gap-2">
                  <Select value={newFilter.type} onValueChange={(value) => setNewFilter((prev) => ({ ...prev, type: value }))}>
                    <SelectTrigger className="w-32 bg-black/20 border-purple-500/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-500/20">
                      <SelectItem value="keyword" className="text-white">Keyword</SelectItem>
                      <SelectItem value="tag" className="text-white">Tag</SelectItem>
                      <SelectItem value="creator" className="text-white">Creator</SelectItem>
                      <SelectItem value="community" className="text-white">Community</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                  placeholder="Enter value..."
                  value={newFilter.value}
                  onChange={(e) => setNewFilter((prev) => ({ ...prev, value: e.target.value }))}
                  className="flex-1 bg-black/20 border-purple-500/20 text-white" />

                  
                  <Select value={newFilter.action} onValueChange={(value) => setNewFilter((prev) => ({ ...prev, action: value }))}>
                    <SelectTrigger className="w-28 bg-black/20 border-purple-500/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-500/20">
                      <SelectItem value="boost" className="text-white">Boost</SelectItem>
                      <SelectItem value="hide" className="text-white">Hide</SelectItem>
                      <SelectItem value="focus" className="text-white">Focus</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button onClick={handleAddFilter} size="icon" className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Existing Filters */}
                <div className="space-y-2">
                  {localPrefs.custom_filters?.map((filter, index) =>
                <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                          {filter.type}
                        </Badge>
                        <span className="text-white">{filter.value}</span>
                        <Badge
                      className={`${
                      filter.action === 'boost' ? 'bg-green-500/20 text-green-400' :
                      filter.action === 'hide' ? 'bg-red-500/20 text-red-400' :
                      filter.action === 'focus' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'}`
                      }>

                          {filter.action}
                        </Badge>
                      </div>
                      <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFilter(index)}
                    className="text-red-400 hover:text-red-300">

                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                )}
                </div>
              </div>
            </motion.div>
          }
        </AnimatePresence>

        {/* Apply Button */}
        <Button
          onClick={handleApply}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 neon-glow">

          <Zap className="w-4 h-4 mr-2" />
          Apply Algorithm Settings
        </Button>

        {/* Info */}
        <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-400 text-sm">Algorithm Transparency</p>
              <p className="text-xs text-gray-400 mt-1">
                Your algorithm settings are stored locally and used to rank your feed. 
                Using a 'Focus' filter will show ONLY posts matching that criteria.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>);

}