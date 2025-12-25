'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { CONNECTION_ERROR_MESSAGE } from '@/lib/constants';
import { handleApiResponse } from '@/lib/api';

interface FavoriteControlsProps {
  productId: number;
  initialFavorite: boolean;
}

export default function FavoriteControls({ productId, initialFavorite }: FavoriteControlsProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [loading, setLoading] = useState(false);

  const handleToggleFavorite = async () => {
    setLoading(true);
    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      const body = method === 'POST' ? JSON.stringify({ productId }) : null;
      const url = method === 'DELETE' ? `/api/favorites/${productId}` : `/api/favorites`;

      const res = await fetch(url, {
        method: method,
        body: body,
        headers: { 'Content-Type': 'application/json' }
      });

      const { error } = await handleApiResponse<unknown>(res);

      if (error) {
        alert(error);
        return;
      }

      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Favorite operation error:', err);
      alert(CONNECTION_ERROR_MESSAGE);
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