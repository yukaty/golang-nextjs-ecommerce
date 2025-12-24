'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

// Type definition for review controls component props
type ReviewControlsProps = {
  productId: number;
  loggedIn: boolean;
};

// Review controls component (for product detail page)
export default function ReviewControls({ productId, loggedIn }: ReviewControlsProps) {
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  // Review form state management
  const [rating, setRating] = useState(0); // Rating (star count)
  const [clickedRating, setClickedRating] = useState(0); // Confirmed star selection
  const [content, setContent] = useState(''); // Review content
  const [submitting, setSubmitting] = useState(false); // Submission in progress flag
  const [errorMessage, setErrorMessage] = useState(''); // Error message
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Success message

  // Event handler when rating star is clicked
  const handleScoreClick = (selectedScore: number) => {
    setRating(selectedScore);
    setClickedRating(selectedScore);
  };

  // Event handler when review submit button is pressed
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault(); // Cancel default submit behavior
    setErrorMessage('');
    setSuccessMessage('');

    // Input data validation
    if (rating === 0 || !content.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    // Login required
    if (!loggedIn) {
      setErrorMessage('You must be logged in to post a review.');
      return;
    }

    // Update display during submission
    setSubmitting(true);

    try { // Send POST request to review registration API
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, content }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) { // Refresh on successful submission
        setSuccessMessage('Your review has been submitted successfully!');
        // Reset form
        setRating(0);
        setContent('');
        // Refresh to show latest reviews
        router.refresh();
      } else { // Display error info on submission failure
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to submit review.');
      }
    } catch {
      setErrorMessage('A connection error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Click handler for non-logged-in users
  const handleLoginRedirect = () => {
    // Set current page URL as redirect destination
    const redirectUrl = encodeURIComponent(pathname);
    router.push(`/login?redirect=${redirectUrl}`); // Navigate to login page
  };

  return (
    <div>
      <h2 className="mt-2">Post a Review</h2>
      {!loggedIn ? (
        <div className="text-center py-4">
          <p className="text-stone-600 mb-4">You must be logged in to post a review.</p>
          <button
            onClick={handleLoginRedirect}
            className="bg-forest-500 hover:bg-forest-600 text-white py-2 px-6 rounded-md shadow-md"
          >
            Log In to Post Review
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <label htmlFor="score" className="block text-stone-700 font-semibold mb-2">Rating</label>
            <div className="flex text-2xl text-yellow-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s} className="cursor-pointer"
                  onClick={() => handleScoreClick(s)}
                  onMouseEnter={() => setRating(s)} // Temporarily update to star under cursor
                  onMouseLeave={() => setRating(clickedRating)} // Return to last clicked star
                >
                  {s <= rating ? '★' : '☆'}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-stone-700 font-semibold mb-2">Comment</label>
            <textarea
              id="content" name="content" rows={4} value={content} disabled={submitting}
              className="w-full p-3 border border-stone-300 rounded-md focus:ring-forest-500 focus:border-forest-500 resize-y"
              placeholder="Please share your thoughts and experiences with this product."
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
            {successMessage && <p className="text-green-600">{successMessage}</p>}
          </div>

          <button
            type="submit" disabled={submitting}
            className={`w-full py-3 px-4 rounded-md
              ${submitting ? 'bg-stone-400 cursor-not-allowed' : 'bg-forest-600 hover:bg-forest-700 text-white'}
            `}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}
    </div>
  );
}