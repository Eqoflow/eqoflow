
import React, { useState, useEffect, useRef, useCallback } from "react";
import { DistributionRound } from "@/entities/DistributionRound";
import { DAOTreasury } from "@/entities/DAOTreasury";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Calendar,
  DollarSign,
  Users,
  AlertTriangle,
  Timer,
  TrendingUp,
  HelpCircle,
  Vote,
  Info
} from "lucide-react";
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

export default function DistributionCountdown({ onCreateProposal }) {
  const [currentRound, setCurrentRound] = useState(null);
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const hideTooltipTimeout = useRef(null);

  const loadCurrentRound = useCallback(async () => {
    try {
      setLoadError(null); // Clear any previous error
      setIsLoading(true); // Set loading true before fetch
      // Add delays between API calls
      const rounds = await DistributionRound.list("-created_date", 1);
      const round = rounds[0];

      await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between calls

      // Get current treasury balance with smaller batch size
      const treasuryTx = await DAOTreasury.list("-created_date", 50); // Reduced batch size
      const balance = treasuryTx.reduce((acc, tx) => acc + (tx?.amount_qflow || 0), 0);

      setCurrentRound(round);
      setTreasuryBalance(balance);
    } catch (error) {
      console.error("Error loading distribution round:", error);
      
      if (error.response?.status === 429) {
        setLoadError("Rate limit reached. Distribution data will refresh automatically.");
      } else {
        setLoadError("Failed to load distribution data.");
      }
    }
    setIsLoading(false);
  }, []); // Empty dependency array as it doesn't depend on component scope values

  const updateCountdown = useCallback(() => {
    if (!currentRound) return;

    const now = new Date();
    let targetDate;
    let phase = "";

    if (currentRound.status === "upcoming") {
      targetDate = new Date(currentRound.proposal_period_start);
      phase = "Proposal Period Opens";
    } else if (currentRound.status === "open_for_proposals") {
      targetDate = new Date(currentRound.proposal_period_end);
      phase = "Proposal Deadline";
    } else if (currentRound.status === "voting_active") {
      targetDate = new Date(currentRound.voting_period_end);
      phase = "Voting Ends";
    }

    if (targetDate) {
      const days = differenceInDays(targetDate, now);
      const hours = differenceInHours(targetDate, now) % 24;
      const minutes = differenceInMinutes(targetDate, now) % 60;

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m until ${phase}`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m until ${phase}`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m until ${phase}`);
      } else {
        setTimeRemaining(`${phase} - Refreshing...`);
        // Reload data when countdown expires
        setTimeout(loadCurrentRound, 5000);
      }
    }
  }, [currentRound, loadCurrentRound]); // Depends on currentRound state and loadCurrentRound function

  useEffect(() => {
    loadCurrentRound(); // Initial load
  }, [loadCurrentRound]); // Dependency on the memoized loadCurrentRound

  useEffect(() => {
    if (currentRound) {
      updateCountdown(); // Initial update when currentRound changes
      const interval = setInterval(updateCountdown, 60000); // Update every minute
      return () => clearInterval(interval); // Cleanup interval on unmount or dependency change
    }
  }, [currentRound, updateCountdown]); // Dependencies on currentRound and the memoized updateCountdown

  const handleMouseEnter = () => {
    if (hideTooltipTimeout.current) {
        clearTimeout(hideTooltipTimeout.current);
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    hideTooltipTimeout.current = setTimeout(() => {
        setShowTooltip(false);
    }, 150); // A small delay to allow moving the cursor from the trigger to the tooltip
  };
  
  const getStatusInfo = () => {
    if (!currentRound) {
      return {
        title: "No Active Distribution Round",
        description: "The next quarterly distribution round will be announced soon.",
        color: "text-gray-400",
        bgColor: "bg-gray-500/10",
        borderColor: "border-gray-500/20"
      };
    }

    switch (currentRound.status) {
      case "upcoming":
        return {
          title: `Q${currentRound.quarter} ${currentRound.year} Distribution Round`,
          description: "Get ready! The proposal period will open soon.",
          color: "text-blue-400",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/20"
        };
      case "open_for_proposals":
        return {
          title: "Proposal Period Active",
          description: "Submit your treasury distribution proposal now!",
          color: "text-green-400",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20"
        };
      case "voting_active":
        return {
          title: "Voting Period Active",
          description: "Vote on treasury distribution proposals now!",
          color: "text-purple-400",
          bgColor: "bg-purple-500/10",
          borderColor: "border-purple-500/20"
        };
      case "completed":
        return {
          title: "Round Completed",
          description: "This distribution round has finished. Next round starts next quarter.",
          color: "text-gray-400",
          bgColor: "bg-gray-500/10",
          borderColor: "border-gray-500/20"
        };
      default:
        return {
          title: "Distribution Round",
          description: "Loading status...",
          color: "text-gray-400",
          bgColor: "bg-gray-500/10",
          borderColor: "border-gray-500/20"
        };
    }
  };

  const maxDistributable = treasuryBalance * 0.75; // 75% max
  const statusInfo = getStatusInfo();

  if (isLoading) {
    return (
      <Card className="dark-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="dark-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-yellow-400 mb-2 text-2xl">⚠️</div>
            <p className="text-sm text-gray-400">{loadError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <Card className={`dark-card ${statusInfo.bgColor} border ${statusInfo.borderColor}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${statusInfo.color}`}>
            <Timer className="w-5 h-5" />
            Quarterly Distribution System
            <div className="relative">
              <Badge 
                className="bg-green-500/20 text-green-300 border-green-500/40 text-xs px-2 py-1 shadow-[0_0_8px_rgba(52,211,153,0.4)] hover:bg-green-500/30 transition-colors cursor-pointer"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <HelpCircle className="w-3 h-3 mr-1" />
                See How It Works
              </Badge>
              
              {/* Tooltip - Fixed positioning */}
              {showTooltip && (
                <div className="fixed inset-0 z-50 pointer-events-none">
                  <div 
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,800px)] max-h-[85vh] overflow-y-auto pointer-events-auto"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      maxHeight: '85vh'
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="bg-black/95 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 shadow-2xl mx-4">
                      <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-white">Treasury Revenue Sharing</h3>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-white font-medium mb-3">How Revenue Sharing Works</h4>
                          <p className="text-gray-300 text-sm mb-4">
                            The DAO Treasury collects revenue from platform activities (e.g., marketplace fees). Each quarter, a portion of the treasury can be distributed to all $EQOFLO holders as dividends. The community votes to decide the exact percentage.
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-gray-300 text-sm">Any token holder can create a "Treasury Distribution" proposal</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-gray-300 text-sm">Community votes on whether to approve the distribution</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-gray-300 text-sm">If approved, funds are distributed proportionally to all token holders</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-white font-medium mb-3">Distribution Process</h4>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Vote className="w-3 h-3 text-purple-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">1. Community Proposal</p>
                                <p className="text-gray-400 text-xs">Any token holder can propose what percentage of the treasury should be distributed.</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Users className="w-3 h-3 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">2. Community Vote</p>
                                <p className="text-gray-400 text-xs">A 7-day voting period where the community decides on a fair percentage to distribute.</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-3 h-3 text-green-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">3. Pro-Rata Distribution</p>
                                <p className="text-gray-400 text-xs">Funds distributed based on token holdings</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-green-600/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-green-400 text-sm">Example Distribution</p>
                            <p className="text-gray-300 text-xs">
                              If you hold 1,000 $EQOFLO tokens (1% of total supply) and the community votes to distribute 10,000 $EQOFLO from the treasury, you would receive 100 $EQOFLO (1% of the distribution). The more tokens you hold, the larger your share.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-yellow-600/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-yellow-400 text-sm">Important Legal Note</p>
                            <p className="text-gray-300 text-xs">
                              The platform does not promise or guarantee any distributions. All revenue sharing is decided by the decentralized community through governance votes. Token holders control when and how much to distribute from the treasury they collectively own.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">{statusInfo.title}</h3>
            <p className="text-gray-400 mb-4">{statusInfo.description}</p>

            {timeRemaining && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm">{timeRemaining}</span>
              </div>
            )}
          </div>

          {/* Treasury Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-black/20 rounded-xl">
              <div className="text-2xl font-bold text-green-400">
                {treasuryBalance.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Treasury Balance</div>
              <div className="text-xs text-gray-600">$EQOFLO</div>
            </div>

            <div className="text-center p-4 bg-black/20 rounded-xl">
              <div className="text-2xl font-bold text-yellow-400">
                {maxDistributable.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Max Distributable</div>
              <div className="text-xs text-gray-600">75% of Treasury</div>
            </div>

            <div className="text-center p-4 bg-black/20 rounded-xl">
              <div className="text-2xl font-bold text-purple-400">
                {currentRound?.round_number || "TBD"}
              </div>
              <div className="text-sm text-gray-500">Distribution Round</div>
              <div className="text-xs text-gray-600">All Time</div>
            </div>
          </div>

          {/* Action Button */}
          {currentRound?.status === "open_for_proposals" && (
            <div className="text-center">
              <Button
                onClick={() => onCreateProposal("treasury_distribution")}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Create Distribution Proposal
              </Button>
            </div>
          )}

          {/* Important Notes */}
          <div className="space-y-3">
            <div className="p-3 bg-yellow-600/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-400 text-sm">Distribution Rules</p>
                  <ul className="text-xs text-gray-400 mt-1 space-y-1">
                    <li>• Maximum 75% of treasury can be distributed per quarter</li>
                    <li>• Only one distribution per quarter is allowed</li>
                    <li>• Token snapshot taken at voting completion</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-400 text-sm">Quarterly Schedule</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Distributions happen every 3 months: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
