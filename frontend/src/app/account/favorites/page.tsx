'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useCart, CartItem } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CONNECTION_ERROR_MESSAGE } from '@/lib/constants';
import { handleApiResponse } from '@/lib/api';

type FavoriteProduct = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const { addItem, isInCart } = useCart();

  useEffect(() => {
    const getFavorites = async () => {
      try {
        const res = await fetch('/api/favorites', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load favorites list.');
        const data: FavoriteProduct[] = await res.json();
        setFavorites(data);
      } catch (err) {
        console.error(err);
      }
    };
    getFavorites();
  }, []);

  const handleCart = (item: FavoriteProduct) => {
    const cartItem: CartItem = {
      id: item.id.toString(),
      title: item.name,
      price: item.price,
      imageUrl: item.image_url ?? '',
      quantity: 1
    };
    addItem(cartItem);
  };

  const handleRemoveFavorite = async (productId: number) => {
    if (!confirm('Are you sure you want to remove this item from your favorites?')) return;

    try {
      const res = await fetch(`/api/favorites/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const { error } = await handleApiResponse<unknown>(res);

      if (error) {
        alert(error);
        return;
      }

      setFavorites((prev) => prev.filter((item) => item.id !== productId));
    } catch (err) {
      console.error('Favorites removal error:', err);
      alert(CONNECTION_ERROR_MESSAGE);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="my-4">
        <Link href="/account" className="text-forest-600 hover:underline">
          ← Back to My Account
        </Link>
      </div>
      <h1 className="text-center mb-6">Favorite Products</h1>
      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-600">You have no favorite products yet.</p>
          <Link href="/products" className="text-forest-600 hover:underline">← Browse products to find favorites</Link>
        </div>
      ) : (
        <div className="flex flex-col space-y-4 sm:space-y-6">
          {favorites.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 border border-stone-200 rounded-lg p-4 sm:p-6 shadow-sm bg-white">
              <Link href={`/products/${item.id}`} className="flex-shrink-0 self-center sm:self-auto">
                <Image
                  src={item.image_url ? `/uploads/${item.image_url}` : '/images/no-image.jpg'}
                  alt={item.name}
                  width={120}
                  height={120}
                  className="object-contain w-24 h-24 sm:w-30 sm:h-30"
                />
              </Link>

              <div className="flex-1 flex flex-col justify-between gap-2 sm:gap-4 text-center sm:text-left">
                <h2 className="text-lg sm:text-xl font-semibold">{item.name}</h2>
                <p className="text-forest-600 font-bold text-base sm:text-lg">
                  ${item.price.toLocaleString()}
                  <span className="text-sm sm:text-base font-normal text-stone-500"> (incl. tax)</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-col items-stretch sm:items-end gap-3 sm:gap-4">
                <Button
                  onClick={!isInCart(item.id.toString()) ? () => handleCart(item) : undefined}
                  disabled={isInCart(item.id.toString())}
                  variant={isInCart(item.id.toString()) ? 'secondary' : 'default'}
                  className="w-full sm:w-auto sm:min-w-[150px]"
                >
                  {isInCart(item.id.toString()) ? 'In Cart' : 'Add to Cart'}
                </Button>
                <Button
                  onClick={() => handleRemoveFavorite(item.id)}
                  variant="destructive"
                  className="w-full sm:w-auto sm:min-w-[150px]"
                >
                  Remove from Favorites
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}