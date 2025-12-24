'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

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
    <Button
      onClick={handleToggleFavorite}
      disabled={loading}
      variant="outline"
      className={isFavorite ? 'border-terra-600 text-terra-600 hover:bg-terra-600 hover:text-white' : 'border-forest-600 text-forest-600 hover:bg-forest-600 hover:text-white'}
    >
      <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-terra-600' : ''}`} />
      {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
    </Button>
  );
}