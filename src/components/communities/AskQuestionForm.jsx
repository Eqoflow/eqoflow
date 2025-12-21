import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

export default function AskQuestionForm({ onSubmit }) {
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setIsSubmitting(true);
    await onSubmit(questionText);
    setQuestionText('');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-black/20 rounded-lg">
      <h4 className="font-semibold text-white mb-2">Ask a Question</h4>
      <Textarea
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        placeholder="Type your question for the creator..."
        className="bg-black/30 border-purple-500/30 text-white"
        required
      />
      <Button
        type="submit"
        disabled={isSubmitting || !questionText.trim()}
        className="mt-2 w-full bg-gradient-to-r from-purple-600 to-pink-500"
      >
        <Send className="w-4 h-4 mr-2" />
        {isSubmitting ? 'Submitting...' : 'Submit Question'}
      </Button>
    </form>
  );
}