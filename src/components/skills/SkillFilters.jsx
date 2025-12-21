
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Search } from "lucide-react";

const CATEGORIES = [
  "design", "development", "writing", "marketing", "consulting", 
  "education", "art", "music", "fitness", "cooking", "other"
];

export default function SkillFilters({ filters, onFiltersChange }) {
  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({ 
      category: "all", 
      skill_type: "all", 
      price_type: "all",
      search: ""
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'search' ? value !== "all" : value !== ""
  );

  return (
    <Card className="dark-card">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Search Bar - Ensuring icon is correctly placed */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              placeholder="Search skills, services, or keywords..."
              value={filters.search || ""}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-10 bg-black/20 border-purple-500/20 text-white placeholder:text-gray-500 h-10"
            />
            {filters.search && (
              <button
                onClick={() => updateFilter("search", "")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-400">Filters:</span>
            </div>
            
            <div className="flex flex-wrap gap-3 flex-1">
              <Select value={filters.category} onValueChange={(value) => updateFilter("category", value)}>
                <SelectTrigger className="w-40 bg-black/20 border-purple-500/20 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/20 z-50">
                  <SelectItem value="all" className="text-white hover:bg-purple-500/10">All Categories</SelectItem>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category} className="text-white capitalize hover:bg-purple-500/10">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.skill_type} onValueChange={(value) => updateFilter("skill_type", value)}>
                <SelectTrigger className="w-32 bg-black/20 border-purple-500/20 text-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/20 z-50">
                  <SelectItem value="all" className="text-white hover:bg-purple-500/10">All Types</SelectItem>
                  <SelectItem value="offering" className="text-white hover:bg-purple-500/10">Offering</SelectItem>
                  <SelectItem value="seeking" className="text-white hover:bg-purple-500/10">Seeking</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.price_type} onValueChange={(value) => updateFilter("price_type", value)}>
                <SelectTrigger className="w-32 bg-black/20 border-purple-500/20 text-white">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent className="bg-black border-purple-500/20 z-50">
                  <SelectItem value="all" className="text-white hover:bg-purple-500/10">All Prices</SelectItem>
                  <SelectItem value="free" className="text-white hover:bg-purple-500/10">Free</SelectItem>
                  <SelectItem value="tokens" className="text-white hover:bg-purple-500/10">$EQOFLO Tokens</SelectItem>
                  <SelectItem value="fiat" className="text-white hover:bg-purple-500/10">Traditional Currency</SelectItem>
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
                  Clear All
                </Badge>
              </div>
            )}
          </div>

          {/* Active Search Indicator */}
          {filters.search && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Search className="w-4 h-4" />
              <span>Searching for: "<span className="text-white font-medium">{filters.search}</span>"</span>
              <button
                onClick={() => updateFilter("search", "")}
                className="text-purple-400 hover:text-purple-300 ml-2"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
