'use client';

import { useState } from 'react';

// Type definition for favorite controls component props
interface FavoriteControlsProps {
  productId: number;
  initialFavorite: boolean;
}

// Favorite controls component
export default function FavoriteControls({ productId, initialFavorite }: FavoriteControlsProps) {
  // Favorite status state
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  // Processing state
  const [loading, setLoading] = useState(false);

  // Event handler when favorite button is clicked
  const handleToggleFavorite = async () => {
    setLoading(true); // Disable button during processing
    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      const body = method === 'POST' ? JSON.stringify({ productId }) : null;
      const url = method === 'DELETE' ? `/api/favorites/${productId}` : `/api/favorites`;

      // Send POST or DELETE request to favorite add/remove API
      const res = await fetch(url, {
        method: method,
        body: body,
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        // Flip state on success
        setIsFavorite(!isFavorite);
      } else {
        const data = await res.json();
        alert(data.error || 'Operation failed.');
      }
    } catch (err) {
      console.error('Favorite operation error:', err);
      alert('A connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite} disabled={loading}
      className="text-teal-800 hover:underline cursor-pointer"
      style={{ fontFamily: 'sans-serif' }}
    >
      {isFavorite ? '♥ Remove from Favorites' : '♡ Add to Favorites'}
    </button>
  );
}