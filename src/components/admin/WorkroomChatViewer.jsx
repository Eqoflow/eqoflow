import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { User as UserIcon } from 'lucide-react';
import QuantumFlowLoader from '../layout/QuantumFlowLoader';

export default function WorkroomChatViewer({ transactionId, conversationId, isMarketplaceMonitor = false }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [transactionId, conversationId]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      let loadedMessages = [];
      
      if (isMarketplaceMonitor && conversationId) {
        // Load Skills Marketplace messages by conversation_id
        loadedMessages = await base44.entities.SkillsMarketplaceMessage.filter(
          { conversation_id: conversationId },
          'created_date',
          200
        );
      } else if (transactionId) {
        // Load Workroom messages by transaction_id
        loadedMessages = await base44.entities.WorkroomMessage.filter(
          { transaction_id: transactionId },
          'created_date',
          200
        );
      }
      
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <QuantumFlowLoader message="Loading chat history..." size="sm" />;
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No messages yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
      {messages.map((msg) => {
        // Get the correct message content field
        const messageContent = isMarketplaceMonitor && conversationId 
          ? msg.message_content 
          : msg.content;

        return (
          <div key={msg.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500">
              {msg.sender_avatar ? (
                <img 
                  src={msg.sender_avatar} 
                  alt={msg.sender_name} 
                  className="w-full h-full object-cover rounded-full" 
                />
              ) : (
                <UserIcon className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-sm">{msg.sender_name}</span>
                <span className="text-xs text-gray-500">
                  {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                </span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-white text-sm whitespace-pre-wrap break-words">
                  {messageContent}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}