'use client';

import Image from 'next/image';
import { CartItem } from '@/hooks/useCart';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const MAX_QUANTITY = 10;

interface CartItemCardProps {
  item: CartItem;
  isEditable?: boolean;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
}

export default function CartItemCard({
  item,
  isEditable,
  onUpdateQuantity,
  onRemove
}: CartItemCardProps) {
  const quantityOptions = Array.from({ length: MAX_QUANTITY }, (_, i) => i + 1);

  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 lg:gap-12 p-4 sm:p-6 lg:p-8">
        <Image
          src={item.imageUrl ? `/uploads/${item.imageUrl}` : '/images/no-image.jpg'}
          alt={item.title}
          width={120}
          height={120}
          className="object-contain w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 self-center sm:self-auto"
        />
        <div className="grow flex flex-col gap-2 sm:gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-center sm:text-left">{item.title}</h2>
          <p className="text-forest-600 font-bold text-lg sm:text-xl text-center sm:text-left">
            ${item.price.toLocaleString()}
            <span className="text-sm sm:text-base font-normal text-stone-500"> (incl. tax)</span>
          </p>
          {isEditable ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center mt-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4">
                <Label htmlFor={`quantity-${item.id}`} className="text-sm whitespace-nowrap">
                  Quantity
                </Label>
                <select
                  id={`quantity-${item.id}`}
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity && onUpdateQuantity(item.id, Number(e.target.value))}
                  className={cn(
                    "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm flex-1 sm:flex-initial",
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
                onClick={() => onRemove && onRemove(item.id)}
                variant="ghost"
                className="text-red-600 hover:text-red-700 w-full sm:w-auto"
              >
                Remove
              </Button>
            </div>
          ) : (
            <p className="text-base sm:text-lg font-semibold text-center sm:text-left">Quantity: {item.quantity}</p>
          )}
        </div>
        <div className="flex justify-between sm:block sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
          <span className="sm:hidden font-semibold">Subtotal:</span>
          <p className="font-semibold text-base sm:text-lg sm:w-32">
            <span className="sm:hidden">${(item.price * item.quantity).toLocaleString()}</span>
            <span className="hidden sm:inline">Subtotal: ${(item.price * item.quantity).toLocaleString()}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}