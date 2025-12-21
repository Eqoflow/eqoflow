import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";

const CATEGORIES = [
  "gaming", "just_chatting", "music", "art", "coding", "fitness", "cooking", "education", "irl", "other"
];

const LANGUAGES = [
  "english", "spanish", "french", "german", "portuguese", "russian", "japanese", "korean", "chinese", "other"
];

export default function StreamFilters({ filters, onFiltersChange }) {
  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({ category: "all", language: "all", status: "live" });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== "status" && value !== "all"
  );

  return (
    <Card className="dark-card">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-400">Filters:</span>
          </div>
          
          <div className="flex flex-wrap gap-3 flex-1">
            <Select value={filters.category} onValueChange={(value) => updateFilter("category", value)}>
              <SelectTrigger className="w-36 bg-black/20 border-purple-500/20 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-black border-purple-500/20">
                <SelectItem value="all" className="text-white hover:bg-purple-500/10">All Categories</SelectItem>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category} className="text-white capitalize hover:bg-purple-500/10">
                    {category.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.language} onValueChange={(value) => updateFilter("language", value)}>
              <SelectTrigger className="w-32 bg-black/20 border-purple-500/20 text-white">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="bg-black border-purple-500/20">
                <SelectItem value="all" className="text-white hover:bg-purple-500/10">All Languages</SelectItem>
                {LANGUAGES.map(language => (
                  <SelectItem key={language} value={language} className="text-white capitalize hover:bg-purple-500/10">
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger className="w-32 bg-black/20 border-purple-500/20 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-black border-purple-500/20">
                <SelectItem value="live" className="text-white hover:bg-purple-500/10">Live Only</SelectItem>
                <SelectItem value="offline" className="text-white hover:bg-purple-500/10">Offline</SelectItem>
                <SelectItem value="ended" className="text-white hover:bg-purple-500/10">Past Streams</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="border-purple-500/30 text-purple-400 cursor-pointer hover:bg-purple-500/10 bg-black/20"
                onClick={clearFilters}
              >
                <X className="w-3 h-3 mr-1" />
                Clear Filters
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}