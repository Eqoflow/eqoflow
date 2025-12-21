import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, Star, ExternalLink, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CourseCard({ course, onClick }) {
  const getCategoryColor = (category) => {
    const colors = {
      technology: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      business: 'bg-green-500/20 text-green-300 border-green-500/30',
      design: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      marketing: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      art: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      music: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      health: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      languages: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      personal_development: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      other: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return colors[category] || colors.other;
  };

  const getDifficultyColor = (level) => {
    const colors = {
      beginner: 'bg-green-500/20 text-green-300',
      intermediate: 'bg-yellow-500/20 text-yellow-300',
      advanced: 'bg-red-500/20 text-red-300',
      all_levels: 'bg-blue-500/20 text-blue-300'
    };
    return colors[level] || colors.all_levels;
  };

  const formatPrice = () => {
    if (course.price_amount === 0) return 'Free';
    const symbol = course.currency === 'USD' ? '$' : 
                   course.currency === 'EUR' ? '€' : 
                   course.currency === 'GBP' ? '£' : '';
    return `${symbol}${course.price_amount}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="dark-card hover-lift cursor-pointer overflow-hidden"
        onClick={onClick}
      >
        {/* Thumbnail */}
        <div className="relative h-48 overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
              <TrendingUp className="w-16 h-16 text-purple-400 opacity-50" />
            </div>
          )}
          
          {/* Featured Badge */}
          {course.is_featured && (
            <Badge className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-orange-500 border-0">
              Featured
            </Badge>
          )}
          
          {/* Price Tag */}
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-black/80 text-white border-0 text-base font-bold">
              {formatPrice()}
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-white line-clamp-2 text-lg">
              {course.title}
            </h3>
          </div>
          
          {/* Category and Difficulty */}
          <div className="flex flex-wrap gap-2">
            <Badge className={getCategoryColor(course.category)}>
              {course.category.replace('_', ' ')}
            </Badge>
            <Badge className={getDifficultyColor(course.difficulty_level)}>
              {course.difficulty_level.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Description */}
          <p className="text-gray-400 text-sm line-clamp-2 mb-4">
            {course.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            {course.duration_hours && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{course.duration_hours}h</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{course.enrolled_count || 0}</span>
            </div>
            {course.average_rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{course.average_rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Creator */}
          <div className="flex items-center gap-2 mb-4">
            {course.creator_avatar ? (
              <img
                src={course.creator_avatar}
                alt={course.creator_name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                <span className="text-xs text-white">
                  {course.creator_name?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-400">
              by {course.creator_name || 'Anonymous'}
            </span>
          </div>

          {/* Action Button */}
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View Course
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}