'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { handleApiResponse } from '@/lib/api';

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  imageSize?: 300 | 400;
  rating?: number;
  reviewCount?: number;
  showCartButton?: boolean;
  initialFavorite?: boolean;
  className?: string;
  variant?: 'default' | 'minimal';
}

const displayStars = (avgRating: number) => {
  const rating = Math.round(avgRating);
  const filledStars = '★'.repeat(rating);
  const emptyStars = '☆'.repeat(5 - rating);
  return `${filledStars}${emptyStars}`;
};

export default function ProductCard({
  id,
  title,
  price,
  imageUrl,
  imageSize = 300,
  rating,
  reviewCount,
  showCartButton = false,
  initialFavorite = false,
  className = '',
  variant = 'default'
}: ProductCardProps) {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(id);
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const handleCart = () => {
    addItem({ id, title, price, imageUrl });
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setFavoriteLoading(true);
    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      const body = method === 'POST' ? JSON.stringify({ productId: Number(id) }) : null;
      const url = method === 'DELETE' ? `/api/favorites/${id}` : `/api/favorites`;

      const res = await fetch(url, {
        method: method,
        body: body,
        headers: { 'Content-Type': 'application/json' }
      });

      const { error } = await handleApiResponse<unknown>(res);

      if (error) {
        if (res.status === 401) {
          window.location.href = '/login';
        } else {
          console.error(error);
        }
        return;
      }

      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Favorite operation error:', err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const finalImageUrl = imageUrl ? `/uploads/${imageUrl}` : '/images/no-image.jpg';

  if (variant === 'minimal') {
    return (
      <Link href={`/products/${id}`} className={`block group ${className}`}>
        <div className="relative overflow-hidden rounded-lg bg-stone-100 mb-2">
          <Image
            src={finalImageUrl}
            alt={title || 'Product image'}
            width={imageSize}
            height={imageSize}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
            className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white shadow-sm transition-all duration-200 w-8 h-8"
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-terra-600 text-terra-600' : 'text-stone-600'}`} />
          </Button>
        </div>
      </Link>
    );
  }

  return (
    <Card className={`group max-w-sm w-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}>
      <CardContent className="p-3 sm:p-4 relative flex flex-col h-full">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFavorite}
          disabled={favoriteLoading}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 bg-white/90 hover:bg-white shadow-sm transition-all duration-200"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isFavorite ? 'fill-terra-600 text-terra-600' : 'text-stone-600'}`} />
        </Button>
        <Link href={`/products/${id}`} className="block mb-3 sm:mb-4">
          <div className="relative overflow-hidden rounded-lg bg-stone-100 aspect-square">
            <Image
              src={finalImageUrl}
              alt={title || 'Product image'}
              width={imageSize}
              height={imageSize}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>
        <div className="flex flex-col space-y-1.5 sm:space-y-2 flex-1">
          <h3 className="text-sm sm:text-base font-semibold leading-tight text-stone-900 line-clamp-2">
            {title}
          </h3>
          {rating !== undefined && reviewCount !== undefined && (
            reviewCount > 0 ? (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500 text-xs sm:text-sm">{displayStars(rating || 0)}</span>
                <span className="text-xs text-stone-600">({reviewCount})</span>
              </div>
            ) : (
              <p className="text-xs text-stone-400">No reviews yet</p>
            )
          )}
          <div className="flex justify-between items-center gap-2 pt-1 sm:pt-2 mt-auto">
            <p className="text-base sm:text-xl font-bold text-forest-700">${price.toLocaleString()}</p>
            {showCartButton && (
              <Button
                onClick={!inCart ? handleCart : undefined}
                disabled={inCart}
                size="sm"
                variant={inCart ? 'default' : 'outline'}
                className={cn(
                  'transition-colors',
                  inCart && 'bg-forest-600 hover:bg-forest-700',
                  !inCart && 'border-forest-600 text-forest-600 hover:bg-forest-600 hover:text-white'
                )}
              >
                {inCart ? 'In Cart' : 'Add'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}