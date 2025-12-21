import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, CheckCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';

export default function ReviewCard({ review, isCreator, onResponseAdded }) {
  const [isReplying, setIsReplying] = useState(false);
  const [response, setResponse] = useState(review.creator_response || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      alert('Please enter a response');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.SkillReview.update(review.id, {
        creator_response: response.trim()
      });

      alert('✅ Response posted successfully!');
      setIsReplying(false);
      if (onResponseAdded) onResponseAdded();
    } catch (error) {
      console.error('Error posting response:', error);
      alert('Failed to post response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="dark-card border-purple-500/20">
      <CardContent className="p-6">
        {/* Reviewer Info */}
        <div className="flex items-start gap-4 mb-4">
          <img
            src={review.reviewer_avatar || `https://api.dicebear.com/6x/initials/svg?seed=${review.reviewer_name}`}
            alt={review.reviewer_name}
            className="w-12 h-12 rounded-full" />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-white">{review.reviewer_name}</h4>
              {review.is_verified_purchase &&
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified Purchase
                </Badge>
              }
              {review.is_featured &&
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  ⭐ Featured
                </Badge>
              }
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) =>
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                  star <= review.rating ?
                  'fill-yellow-400 text-yellow-400' :
                  'text-gray-600'}`
                  } />

                )}
              </div>
              <span className="text-xs text-gray-500">
                {format(new Date(review.created_date), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>

        {/* Review Text */}
        <p className="text-gray-300 mb-4">{review.review_text}</p>

        {/* Creator Response */}
        {review.creator_response &&
        <div className="ml-8 mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-300">Creator Response</span>
            </div>
            <p className="text-gray-300 text-sm">{review.creator_response}</p>
          </div>
        }

        {/* Reply Button/Form (Only for Creator) */}
        {isCreator && !review.creator_response &&
        <div className="mt-4">
            {!isReplying ?
          <Button
            onClick={() => setIsReplying(true)}
            variant="outline"
            size="sm" className="bg-background text-slate-50 px-3 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 border-purple-500/30 hover:bg-purple-500/10">


                <MessageSquare className="w-4 h-4 mr-2" />
                Respond to Review
              </Button> :

          <div className="space-y-3">
                <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Thank the reviewer or address their feedback..."
              className="bg-black/20 border-purple-500/30 text-white"
              rows={3}
              maxLength={500} />

                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">{response.length}/500 characters</p>
                  <div className="flex gap-2">
                    <Button
                  onClick={() => {
                    setIsReplying(false);
                    setResponse(review.creator_response || '');
                  }}
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting} className="bg-background text-slate-950 px-3 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 border-gray-600 hover:bg-gray-700">


                      Cancel
                    </Button>
                    <Button
                  onClick={handleSubmitResponse}
                  size="sm"
                  disabled={isSubmitting || !response.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">

                      {isSubmitting ?
                  <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Posting...
                        </> :

                  'Post Response'
                  }
                    </Button>
                  </div>
                </div>
              </div>
          }
          </div>
        }
      </CardContent>
    </Card>);

}