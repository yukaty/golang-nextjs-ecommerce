'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

// Type definition for ProductCard component props
export interface ProductCardProps {
  id: string; // Product ID
  title: string; // Product title
  price: number; // Product price

  imageUrl?: string; // Product image URL
  imageSize?: 300 | 400; // Image size

  rating?: number; // Review rating (average)
  reviewCount?: number; // Total review count

  showCartButton?: boolean; // Show "Add to Cart" button
  initialFavorite?: boolean; // Initial favorite state
  className?: string; // For external style adjustments
}

// Common product card component
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
  className = ''
}: ProductCardProps) {
  // Get cart management functions
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(id); // Check if item is in cart

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Event handler for cart button click
  const handleCart = () => {
    // Add to cart
    addItem({ id, title, price, imageUrl });
  };

  // Event handler for favorite button click
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product page
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

      if (res.ok) {
        setIsFavorite(!isFavorite);
      } else {
        const data = await res.json();
        if (res.status === 401) {
          // Redirect to login if not authenticated
          window.location.href = '/login';
        } else {
          console.error(data.error || 'Favorite operation failed.');
        }
      }
    } catch (err) {
      console.error('Favorite operation error:', err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Display placeholder image if no image specified
  const finalImageUrl = imageUrl
    ? `/uploads/${imageUrl}`
    : '/images/no-image.jpg';

  // Determine star rating display
  const displayStars = (avgRating: number) => {
    const rating = Math.round(avgRating); // Round
    const filledStars = '★'.repeat(rating); // Fill stars based on rating
    const emptyStars = '☆'.repeat(5 - rating); // Remaining stars are empty
    return `${filledStars}${emptyStars}`;
  };

  return (
    <Card className={`max-w-sm w-full ${className}`}>
      <CardContent className="p-2 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFavorite}
          disabled={favoriteLoading}
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-terra-600 text-terra-600' : 'text-stone-600'}`} />
        </Button>
        <Link href={`/products/${id}`}>
          <Image
            src={finalImageUrl}
            alt={title || 'Product image'}
            width={imageSize}
            height={imageSize}
            className="w-full object-contain aspect-square"
          />
        </Link>
        <div className="flex flex-col mt-2">
          <h3 className="text-sm font-semibold leading-tight mb-1">{title}</h3>
          {rating !== undefined && reviewCount !== undefined && (
            reviewCount > 0 ? (
              <p className="flex items-center text-sm mb-1">
                <span className="text-yellow-500 mr-1">{displayStars(rating || 0)}</span>
                <span className="text-stone-600">({reviewCount} reviews)</span>
              </p>
            ) : (
              <p className="text-xs text-stone-400 mt-1">No reviews yet</p>
            )
          )}
          <div className="flex justify-between items-center w-full mt-2">
            <p className="text-lg font-bold">${price.toLocaleString()}</p>
            {showCartButton && (
              <Button
                onClick={!inCart ? handleCart : undefined}
                disabled={inCart}
                variant={inCart ? "default" : "outline"}
                className={inCart ? 'bg-forest-600 hover:bg-forest-700' : 'border-forest-600 text-forest-600 hover:bg-forest-600 hover:text-white'}
              >
                {inCart ? 'In Cart' : 'Add to Cart'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}