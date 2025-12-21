import React, { useState, useEffect } from 'react';
import { ModerationLog } from '@/entities/ModerationLog';
import { Post } from '@/entities/Post';
import { User } from '@/entities/User';
import { Card, CardContent } from '@/components/ui/card';
import { Gavel, Shield, Users, BrainCircuit } from 'lucide-react';
import QuantumFlowLoader from '../components/layout/QuantumFlowLoader';
import AppealModal from '../components/moderation/AppealModal';
import ModerationLogCard from '../components/moderation/ModerationLogCard';

export default function TransparencyHub() {
  const [moderationLogs, setModerationLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedLogForAppeal, setSelectedLogForAppeal] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userRes = await User.me().catch(() => null);
      setCurrentUser(userRes);

      let logsRes = [];
      if (userRes) {
          if (userRes.role === 'admin') {
              // Admins see all flagged logs
              logsRes = await ModerationLog.filter({ moderation_result: 'flagged' }, "-created_date", 100);
          } else {
              // Users see logs for content they authored
              logsRes = await ModerationLog.filter({ 
                  moderation_result: 'flagged',
                  post_author_email: userRes.email 
              }, "-created_date", 100);
          }
      }
      setModerationLogs(logsRes || []);

    } catch (error) {
      console.error("Error loading transparency data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAppealModal = (log) => {
    setSelectedLogForAppeal(log);
    setShowAppealModal(true);
  };

  const handleAppealSubmit = async (log, reason) => {
    try {
      await ModerationLog.update(log.id, {
        status: 'appealed',
        appeal_reason: reason,
        human_reviewer_decision: 'pending'
      });
      
      if (log.content_type === 'post' && log.content_id) {
        await Post.update(log.content_id, { moderation_status: 'appealed' });
      }

      loadData();
      setShowAppealModal(false);
    } catch (error) {
      console.error("Error submitting appeal:", error);
      alert("Failed to submit appeal. Please try again.");
    }
  };

  return (
    <div className="bg-slate-950 p-6 min-h-screen text-white">
      {showAppealModal && selectedLogForAppeal && (
        <AppealModal
          log={selectedLogForAppeal}
          onConfirm={handleAppealSubmit}
          onClose={() => setShowAppealModal(false)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><Gavel className="w-8 h-8 text-purple-400"/>Moderation Hub</h1>
            <p className="text-gray-400">Our commitment to transparent, community-aligned content moderation.</p>
        </div>
        
        <Card className="bg-slate-900/50 border border-slate-700 mb-6 text-white">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-purple-400" />
              Our Moderation Philosophy
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-1">
                  <BrainCircuit className="w-4 h-4 text-cyan-400" />
                  AI-Assisted, Human-Governed
                </h3>
                <p className="text-sm text-gray-400">
                  Our AI acts as the first line of defense, flagging content based on a publicly available ruleset. It never makes a final decision to remove content alone. Every action is logged here for you to see.
                </p>
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Community-Driven Appeals
                </h3>
                <p className="text-sm text-gray-400">
                  If you disagree with a decision, you can appeal. Appeals are reviewed by community moderators or through a decentralized governance process. Your voice matters.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-400" />
          Moderation Action Log
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
              <QuantumFlowLoader />
          </div>
        ) : (
          <div className="space-y-4">
            {moderationLogs.length > 0 ? (
              moderationLogs.map(log => {
                const isOwner = currentUser && log.post_author_email === currentUser.email;
                const canAppeal = isOwner && log.status === 'final' && log.moderation_result === 'flagged';

                return (
                  <ModerationLogCard
                    key={log.id}
                    log={log}
                    currentUser={currentUser}
                    canAppeal={canAppeal}
                    onAppeal={() => handleOpenAppealModal(log)}
                  />
                );
              })
            ) : (
              <Card className="bg-slate-900/50 border border-slate-700 text-center p-12">
                <Shield className="w-16 h-16 mx-auto mb-4 text-green-400" />
                <h3 className="text-xl font-semibold text-white">No Moderation Actions</h3>
                <p className="text-gray-500 mt-2">No flagged content has been recorded for your account.</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}