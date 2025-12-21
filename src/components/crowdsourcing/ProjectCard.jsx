
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Gift, Clock, Users, Coins, TrendingUp, DollarSign, FileText, Image, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ProjectCard({ project, index }) {
  const getProjectTypeInfo = (type) => {
    const types = {
      fundraising: { icon: Target, color: "text-blue-400", bg: "bg-blue-500/20", label: "Fundraising" },
      bounty: { icon: Gift, color: "text-green-400", bg: "bg-green-500/20", label: "Bounty" }
      // Removed 'grant' type as per instructions
    };
    return types[type] || types.fundraising;
  };

  const getCurrencyInfo = (currency) => {
    const currencies = {
      eqoflo: { symbol: 'EQOFLO', icon: Coins },
      usd: { symbol: '$', icon: DollarSign },
      eur: { symbol: '€', icon: DollarSign },
      gbp: { symbol: '£', icon: DollarSign }
    };
    return currencies[currency] || currencies.gbp; // Changed default to GBP
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending_approval':
        return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', text: 'Pending DAO Approval', icon: Clock };
      case 'active':
        return { color: 'bg-green-500/20 text-green-400 border-green-500/30', text: 'Active Funding', icon: Target };
      case 'funded':
        return { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', text: 'Successfully Funded', icon: CheckCircle };
      case 'completed':
        return { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', text: 'Completed', icon: CheckCircle };
      case 'failed':
        return { color: 'bg-red-500/20 text-red-400 border-red-500/30', text: 'Funding Failed', icon: XCircle };
      case 'rejected':
        return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', text: 'DAO Rejected', icon: XCircle };
      case 'cancelled':
        return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', text: 'Cancelled', icon: XCircle };
      default:
        return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', text: 'Unknown', icon: AlertCircle };
    }
  };

  const typeInfo = getProjectTypeInfo(project.project_type);
  const currencyInfo = getCurrencyInfo(project.funding_currency);
  const statusInfo = getStatusInfo(project.status);
  const TypeIcon = typeInfo.icon;
  const CurrencyIcon = currencyInfo.icon;
  const fundingPercentage = (project.current_funding / project.funding_goal) * 100;
  const isDeadlinePassed = new Date(project.deadline) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="h-full"
    >
      <Link to={`${createPageUrl("ProjectDetails")}?id=${project.id}`} className="block h-full">
        <Card className="dark-card hover-lift transition-all duration-300 h-full flex flex-col">
          {/* Project Images Gallery */}
          {project.project_images && project.project_images.length > 0 ? (
            <div className="h-48 w-full bg-gray-800 rounded-t-2xl overflow-hidden relative"> {/* Added relative for absolute badge positioning */}
              <img 
                src={project.project_images[0]} 
                alt={project.title}
                className="w-full h-full object-cover"
              />
              {project.project_images.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  +{project.project_images.length - 1} more
                </div>
              )}
            </div>
          ) : project.featured_image ? (
            <div className="h-48 w-full bg-gray-800 rounded-t-2xl overflow-hidden">
              <img 
                src={project.featured_image} 
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}
          
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeInfo.bg}`}>
                  <TypeIcon className={`w-4 h-4 ${typeInfo.color}`} />
                </div>
                <Badge className={typeInfo.bg + " " + typeInfo.color + " border-0"}>
                  {typeInfo.label}
                </Badge>
              </div>
              <Badge className={statusInfo.color + " flex items-center gap-1"}>
                <statusInfo.icon className="w-3 h-3" />
                {statusInfo.text}
              </Badge>
            </div>
            <CardTitle className="text-white text-lg line-clamp-2">
              {project.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col gap-4">
            <p className="text-gray-400 text-sm line-clamp-3 flex-1">
              {project.description}
            </p>
            
            {/* Funding Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Funding Progress</span>
                <span className="text-white font-medium">
                  {Math.round(fundingPercentage)}%
                </span>
              </div>
              <Progress value={fundingPercentage} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <CurrencyIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-medium">
                    {currencyInfo.symbol}{project.current_funding.toLocaleString()}
                  </span>
                  <span className="text-gray-400">of {currencyInfo.symbol}{project.funding_goal.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* Document and Image Indicators */}
            {(project.project_documents?.length > 0 || project.project_images?.length > 0) && (
              <div className="flex items-center gap-4 text-xs text-gray-400">
                {project.project_documents?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{project.project_documents.length} docs</span>
                  </div>
                )}
                {project.project_images?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Image className="w-3 h-3" />
                    <span>{project.project_images.length} images</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-purple-500/20">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{project.contributors?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className={isDeadlinePassed ? "text-red-400" : ""}>
                    {formatDistanceToNow(new Date(project.deadline), { addSuffix: true })}
                  </span>
                </div>
              </div>
              {project.reward_token && (
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Rewards</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
