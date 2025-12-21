import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { SmilePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reaction } from '@/entities/Reaction';

const availableReactions = [
  { type: 'laugh', emoji: '😂' },
  { type: 'love', emoji: '😍' },
  { type: 'sad', emoji: '😢' },
  { type: 'angry', emoji: '😠' },
  { type: 'dislike', emoji: '👎' },
];

export default function ReactionBar({ post, currentUser, onReactionChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTimeoutId, setPickerTimeoutId] = useState(null);
  const [optimisticReactions, setOptimisticReactions] = useState(post.reactions || []);

  const optimisticCounts = useMemo(() => {
    return (optimisticReactions || []).reduce((acc, reaction) => {
      acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
      return acc;
    }, {});
  }, [optimisticReactions]);
  
  const userReactions = useMemo(() => {
     return (optimisticReactions || []).filter(r => r.user_email === currentUser?.email);
  }, [optimisticReactions, currentUser]);

  useEffect(() => {
    setOptimisticReactions(post.reactions || []);
  }, [post.reactions]);

  const handleMouseEnter = () => {
    if (pickerTimeoutId) clearTimeout(pickerTimeoutId);
    setShowPicker(true);
  };

  const handleMouseLeave = () => {
    const timeoutId = setTimeout(() => setShowPicker(false), 300);
    setPickerTimeoutId(timeoutId);
  };

  const handleButtonMouseEnter = () => {
    if (pickerTimeoutId) clearTimeout(pickerTimeoutId);
  };
  
  const handleButtonMouseLeave = () => {
    const timeoutId = setTimeout(() => setShowPicker(false), 300);
    setPickerTimeoutId(timeoutId);
  };

  const handleReaction = async (reactionType) => {
    setShowPicker(false);
    if (!currentUser) {
      console.error('No user logged in');
      return;
    }

    const existingReaction = userReactions.find(r => r.reaction_type === reactionType);

    if (existingReaction) {
      // User is removing their reaction
      const initialReactions = [...optimisticReactions];
      const newReactions = optimisticReactions.filter(r => r.id !== existingReaction.id);
      setOptimisticReactions(newReactions);

      try {
        await Reaction.delete(existingReaction.id);
        if (onReactionChange) {
            onReactionChange({ ...post, reactions: newReactions });
        }
      } catch (error) {
        console.error("Error deleting reaction:", error);
        setOptimisticReactions(initialReactions);
      }

    } else {
      // User is adding a new reaction
      const tempId = `temp-${Date.now()}`;
      const newReaction = {
        id: tempId,
        post_id: post.id,
        reaction_type: reactionType,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.username || currentUser.email?.split('@')[0] || 'Anonymous',
      };
      
      const initialReactions = [...optimisticReactions];
      const newOptimisticReactions = [...optimisticReactions, newReaction];
      setOptimisticReactions(newOptimisticReactions);

      try {
        const createdReaction = await Reaction.create({
          post_id: post.id,
          reaction_type: reactionType,
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.username || currentUser.email?.split('@')[0] || 'Anonymous',
        });

        const finalReactions = newOptimisticReactions.map(r => 
            r.id === tempId ? createdReaction : r
        );
        setOptimisticReactions(finalReactions);

        if (onReactionChange) {
            onReactionChange({ ...post, reactions: finalReactions });
        }

      } catch (error) {
        console.error("Error creating reaction:", error);
        setOptimisticReactions(initialReactions);
      }
    }
  };


  return (
    <div className="relative flex items-center" onMouseLeave={handleMouseLeave}>
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute reaction-picker bottom-full mb-2 flex items-center gap-1 bg-gray-800 border border-purple-500/20 p-2 rounded-full shadow-lg"
            onMouseEnter={handleMouseEnter}
          >
            {availableReactions.map((reaction) => (
              <Button
                key={reaction.type}
                variant="ghost"
                size="icon"
                onClick={() => handleReaction(reaction.type)}
                className="w-8 h-8 rounded-full hover:bg-purple-500/20"
              >
                <span className="text-lg transition-transform duration-200 hover:scale-125">{reaction.emoji}</span>
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1">
        {Object.entries(optimisticCounts).map(([type, count]) => {
          if (count === 0) return null;
          
          const reaction = availableReactions.find(r => r.type === type);
          if (!reaction) return null;

          const hasUserReacted = userReactions.some(r => r.reaction_type === type);
          
          return (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(type)}
              className={`flex items-center gap-1 transition-colors p-2 h-auto rounded-full ${
                hasUserReacted 
                  ? 'bg-orange-500/20 text-orange-400' 
                  : 'text-gray-400 hover:text-orange-400 hover:bg-gray-700'
              }`}
              onMouseEnter={handleButtonMouseEnter}
              onMouseLeave={handleButtonMouseLeave}
            >
              <span className="text-sm">{reaction.emoji}</span>
              <span className="text-sm font-medium">{count}</span>
            </Button>
          );
        })}
        
        <Button
          variant="ghost"
          size="icon"
          onMouseEnter={handleMouseEnter}
          className="text-gray-400 hover:text-white w-8 h-8 rounded-full"
        >
          <SmilePlus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}