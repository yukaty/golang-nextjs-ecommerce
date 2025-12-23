'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';

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
  className = ''
}: ProductCardProps) {
  // Get cart management functions
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(id); // Check if item is in cart

  // Event handler for cart button click
  const handleCart = () => {
    // Add to cart
    addItem({ id, title, price, imageUrl });
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
    <div className={`
      flex flex-col bg-white max-w-sm w-full p-2
      ${className}
    `}>
      <Link href={`/products/${id}`}>
        <Image
          src={finalImageUrl}
          alt={title || 'Product image'}
          width={imageSize}
          height={imageSize}
          className="w-full object-contain aspect-square"
        />
      </Link>
      <div className="flex flex-col">
        <h3 className="text-sm font-semibold leading-tight mb-1">{title}</h3>
        {rating !== undefined && reviewCount !== undefined && (
          reviewCount > 0 ? (
            <p className="flex items-center text-sm mb-1">
              <span className="text-yellow-500 mr-1">{displayStars(rating || 0)}</span>
              <span className="text-gray-600">({reviewCount} reviews)</span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">No reviews yet</p>
          )
        )}
        <div className="flex justify-between items-center w-full mt-2">
          <p className="text-lg font-bold">${price.toLocaleString()}</p>
          {showCartButton && (
            <button
              onClick={!inCart ? handleCart : undefined}
              disabled={inCart}
              className={`border py-2 px-4 rounded-sm
                ${inCart ? 'bg-indigo-500 text-white' : 'border-indigo-500 text-indigo-500 hover:bg-indigo-400 hover:text-white'}
              `}
            >
              {inCart ? 'In Cart' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}