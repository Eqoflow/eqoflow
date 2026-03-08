import React from 'react';
import { ChevronDown, Globe, Gamepad2, Cpu, Briefcase, DollarSign, Trophy, BarChart2, Music, Film, Heart, BookOpen, TrendingUp } from 'lucide-react';

const CATEGORIES = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'technology', label: 'Technology', icon: Cpu },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'trading', label: 'Trading', icon: BarChart2 },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'entertainment', label: 'Entertainment', icon: Film },
  { id: 'health', label: 'Health & Fitness', icon: Heart },
  { id: 'education', label: 'Education', icon: BookOpen },
];

export default function GlobalCategorySidebar({ selectedCategory, onCategorySelect, searchQuery, onSearchChange }) {
  return (
    <div className="w-[200px] flex-shrink-0 bg-black/30 border-r border-white/5 flex flex-col">
      {/* Search bar */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/5">
          <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none flex-1 min-w-0"
          />
        </div>
      </div>

      {/* Category list */}
      <div className="flex flex-col mt-1 flex-1">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className={`flex items-center justify-between px-4 py-3 text-sm transition-all text-left ${
                isActive
                  ? 'border-l-2 border-cyan-400 bg-white/5 text-cyan-400'
                  : 'border-l-2 border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
                <span className="font-medium">{cat.label}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
            </button>
          );
        })}
      </div>
    </div>
  );
}