'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CONNECTION_ERROR_MESSAGE } from '@/lib/constants';
import { handleApiResponse } from '@/lib/api';

interface ReviewControlsProps {
  productId: number;
  loggedIn: boolean;
}

export default function ReviewControls({ productId, loggedIn }: ReviewControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [rating, setRating] = useState(0);
  const [clickedRating, setClickedRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleScoreClick = (selectedScore: number) => {
    setRating(selectedScore);
    setClickedRating(selectedScore);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (rating === 0 || !content.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (!loggedIn) {
      setErrorMessage('You must be logged in to post a review.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, content }),
        headers: { 'Content-Type': 'application/json' }
      });

      const { error } = await handleApiResponse<unknown>(res);

      if (error) {
        setErrorMessage(error);
        return;
      }

      setSuccessMessage('Your review has been submitted successfully!');
      setRating(0);
      setContent('');
      router.refresh();
    } catch {
      setErrorMessage(CONNECTION_ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginRedirect = () => {
    const redirectUrl = encodeURIComponent(pathname);
    router.push(`/login?redirect=${redirectUrl}`);
  };

  return (
    <div>
      <h2 className="mt-2">Post a Review</h2>
      {!loggedIn ? (
        <div className="text-center py-4">
          <p className="text-stone-600 mb-4">You must be logged in to post a review.</p>
          <Button onClick={handleLoginRedirect}>
            Log In to Post Review
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <Label htmlFor="score" className="font-semibold mb-2">Rating</Label>
            <div className="flex text-2xl text-yellow-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className="cursor-pointer"
                  onClick={() => handleScoreClick(s)}
                  onMouseEnter={() => setRating(s)}
                  onMouseLeave={() => setRating(clickedRating)}
                >
                  {s <= rating ? '★' : '☆'}
                </span>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="content" className="font-semibold mb-2">Comment</Label>
            <textarea
              id="content"
              name="content"
              rows={4}
              value={content}
              disabled={submitting}
              className={cn(
                "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              )}
              placeholder="Please share your thoughts and experiences with this product."
              onChange={(e) => setContent(e.target.value)}
            />
            {errorMessage && <p className="text-red-500 mt-1">{errorMessage}</p>}
            {successMessage && <p className="text-green-600 mt-1">{successMessage}</p>}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      )}
    </div>
  );
}