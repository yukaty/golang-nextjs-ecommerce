'use client';

import Link from 'next/link';
import { useCart, CartItem } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import CartItemCard from '@/components/CartItemCard';

export default function CartPage() {
  const { cartItems, removeItem, updateQuantity, totalPrice } = useCart();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-center mb-6">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-600">Your cart is empty.</p>
          <Link href="/products" className="text-forest-600 hover:underline">← Back to Products</Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col space-y-6">
            {cartItems.map((item: CartItem) => (
              <CartItemCard
                key={item.id}
                item={item}
                isEditable
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-t border-stone-300 pt-6">
            <div className="flex flex-col text-center sm:text-left">
              <p className="text-xl sm:text-2xl font-bold">Total: ${totalPrice.toLocaleString()}</p>
              <p className="text-sm sm:text-base text-stone-500">All prices include tax.</p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/order-confirm">
                Proceed to Checkout
              </Link>
            </Button>
          </div>
        </>
      )}
    </main>
  );
}