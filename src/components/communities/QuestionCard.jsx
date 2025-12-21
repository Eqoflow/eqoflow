import React, { useState } from 'react';
import { User, Crown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';

export default function QuestionCard({ question, isCreator, onAnswerSubmit, onDelete }) {
  const [answerText, setAnswerText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) return;
    setIsSubmitting(true);
    await onAnswerSubmit(question.id, answerText);
    setIsSubmitting(false);
    setIsReplying(false);
    setAnswerText('');
  };
  
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this question? This cannot be undone.")) {
      onDelete(question.id);
    }
  };

  return (
    <div className="p-4 bg-black/30 rounded-lg space-y-4 group">
      {/* Question part */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
          {question.asker_avatar ? (
            <img src={question.asker_avatar} alt="asker avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{question.asker_name || 'Anonymous'}</span>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(question.created_date), { addSuffix: true })}
            </span>
          </div>
          <p className="text-gray-300 mt-1">{question.question_text}</p>
        </div>
        {isCreator && (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-gray-500 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDelete}
            title="Delete question"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Answer part */}
      {question.is_answered ? (
        <div className="pl-11 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-purple-400">Creator's Answer</span>
            </div>
            <p className="text-gray-300 mt-1">{question.answer_text}</p>
          </div>
        </div>
      ) : isCreator ? (
        <div className="pl-11">
          {!isReplying ? (
            <Button variant="outline" size="sm" onClick={() => setIsReplying(true)} className="border-purple-500/30 text-white hover:bg-purple-500/10">
              Answer Question
            </Button>
          ) : (
            <form onSubmit={handleAnswerSubmit} className="space-y-2">
              <Textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Write your answer..."
                className="bg-black/20 border-purple-500/20 text-white"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsReplying(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                  {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}