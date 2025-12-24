'use client';

import Image from 'next/image';
import { CartItem } from '@/hooks/useCart';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CartItemCardProps {
  item: CartItem; // Individual cart item data
  isEditable?: boolean; // Allow editing of cart information
  // Event handler for quantity change
  onUpdateQuantity?: (id: string, quantity: number) => void;
  // Event handler for item removal
  onRemove?: (id: string) => void;
}

// Cart item card component
export default function CartItemCard({
  item,
  isEditable,
  onUpdateQuantity,
  onRemove
}: CartItemCardProps) {
  // Quantity selection options (1-10)
  const quantityOptions = Array.from({ length: 10 }, (_, i) => (
    <option key={i + 1} value={i + 1}>{i + 1}</option>
  ));

  return (
    <Card>
      <CardContent className="flex items-center gap-12 p-8">
        <Image
          src={item.imageUrl ? `/uploads/${item.imageUrl}` : '/images/no-image.jpg'}
          alt={item.title}
          width={120}
          height={120}
          className="object-contain"
        />
        <div className="grow">
          <h2 className="text-xl">{item.title}</h2>
          <p className="text-forest-600 font-bold text-xl">
            ${item.price.toLocaleString()}
            <span className="text-base font-normal text-stone-500"> (incl. tax)</span>
          </p>
          {isEditable ? (
            <div className="flex items-center mt-2 gap-4">
              <label htmlFor={`quantity-${item.id}`} className="text-sm text-stone-700">
                  Quantity
              </label>
              <select
                  id={`quantity-${item.id}`}
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity && onUpdateQuantity(item.id, Number(e.target.value))}
                  className="border border-stone-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-forest-600"
              >
                  {quantityOptions}
              </select>
              <Button
                  onClick={() => onRemove && onRemove(item.id)}
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
              >
                  Remove
              </Button>
            </div>
          ) : (
            <p className="text-lg font-semibold">Quantity: {item.quantity}</p>
          )}
        </div>
        <p className="text-right font-semibold text-lg w-32">
          Subtotal: ${(item.price * item.quantity).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}