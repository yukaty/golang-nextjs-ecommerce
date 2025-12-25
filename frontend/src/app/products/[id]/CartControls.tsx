'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart, CartItem } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const MAX_CART_QUANTITY = 10;

interface CartControlsProps {
  cartItem: Omit<CartItem, 'quantity'>;
  stock: number;
  loggedIn: boolean;
}

export default function CartControls({ cartItem, stock, loggedIn }: CartControlsProps) {
  const router = useRouter();
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(cartItem.id);
  const [quantity, setQuantity] = useState(1);

  const quantityOptions = Array.from(
    { length: Math.min(stock, MAX_CART_QUANTITY) },
    (_, i) => i + 1
  );

  const handleCart = () => {
    addItem({ ...cartItem }, quantity);
  };

  const handleOrder = () => {
    if (!inCart) {
      addItem({ ...cartItem }, quantity);
    }
    router.push('/order-confirm');
  };

  if (stock === 0) return null;

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-end gap-4">
        <div className="flex flex-col">
          <Label htmlFor="quantity" className="text-sm">
            Quantity
          </Label>
          <select
            id="quantity"
            name="quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className={cn(
              "h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            {quantityOptions.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={!inCart ? handleCart : undefined}
          disabled={inCart}
          variant={inCart ? 'secondary' : 'default'}
          className="min-w-[130px]"
        >
          {inCart ? 'In Cart' : 'Add to Cart'}
        </Button>

        {loggedIn && (
          <Button
            onClick={handleOrder}
            variant="outline"
          >
            Proceed to Checkout
          </Button>
        )}
      </div>
    </div>
  );
}