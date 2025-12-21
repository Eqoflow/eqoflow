import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CommunityQuestion } from '@/entities/CommunityQuestion';
import { Loader2 } from 'lucide-react';
import AskQuestionForm from './AskQuestionForm';
import QuestionCard from './QuestionCard';

export default function CommunityQnA({ community, user, isCreator, isMember }) {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadQuestions = useCallback(async () => {
    if (!community?.id) return;
    setIsLoading(true);
    try {
      const fetchedQuestions = await CommunityQuestion.filter(
        { community_id: community.id },
        '-created_date'
      );
      setQuestions(fetchedQuestions);
    } catch (error) {
      console.error('Error loading community questions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [community?.id]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleAskQuestion = async (questionText) => {
    if (!user) return;
    await CommunityQuestion.create({
      community_id: community.id,
      question_text: questionText,
      asker_name: user.full_name,
      asker_avatar: user.avatar_url
    });
    loadQuestions();
  };

  const handleAnswerQuestion = async (questionId, answerText) => {
    await CommunityQuestion.update(questionId, {
      answer_text: answerText,
      is_answered: true
    });
    loadQuestions();
  };

  const handleDeleteQuestion = async (questionId) => {
    await CommunityQuestion.delete(questionId);
    loadQuestions(); // Refresh the list
  };

  return (
    <Card className="dark-card">
      <CardHeader className="bg-slate-950 p-6 flex flex-col space-y-1.5">
        <CardTitle className="text-white">Community Q&A</CardTitle>
      </CardHeader>
      <CardContent className="bg-slate-950 pt-0 p-6 space-y-6">
        {!isMember ?
        <p className="text-gray-400 text-center">You must join this community to ask questions.</p> :

        <>
            <AskQuestionForm onSubmit={handleAskQuestion} />

            {isLoading ?
          <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div> :
          questions.length > 0 ?
          <div className="space-y-4">
                {questions.map((q) =>
            <QuestionCard
              key={q.id}
              question={q}
              isCreator={isCreator}
              onAnswerSubmit={handleAnswerQuestion}
              onDelete={handleDeleteQuestion} />

            )}
              </div> :

          <p className="text-gray-400 text-center py-4">No questions have been asked yet. Be the first!</p>
          }
          </>
        }
      </CardContent>
    </Card>);

}