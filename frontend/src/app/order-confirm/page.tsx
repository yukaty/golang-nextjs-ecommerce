'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, CartItem } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ERROR_MESSAGE_STYLE } from '@/lib/constants';
import CartItemCard from '@/components/CartItemCard';

const SHIPPING_COST = 500;

export default function OrderConfirmPage() {
  const router = useRouter();
  const { cartItems, totalPrice } = useCart();
  const finalPrice = totalPrice + SHIPPING_COST;
  const [address, setAddress] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleConfirmPayment = async () => {
    if (!address.trim()) {
      setErrorMessage('Please enter your shipping address.');
      return;
    }
    if (!isAgreed) {
      setErrorMessage('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    const checkoutRes = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cartItems, address }),
    });
    if (!checkoutRes.ok) {
      setErrorMessage('[frontend] Failed to generate payment page.');
      return;
    }
    const checkoutData = await checkoutRes.json();
    if (checkoutData.url) {
      router.push(checkoutData.url);
    }
  };

  const handleCancel = () => {
    if (confirm('Your entered information will be discarded. Are you sure?')) {
      router.push('/cart');
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-center mb-6">Confirm Your Order</h1>
      {errorMessage && (
        <p className={`${ERROR_MESSAGE_STYLE} mb-4`}>{errorMessage}</p>
      )}

      {cartItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-600">Your cart is empty.</p>
          <Link href="/products" className="text-forest-600 hover:underline">← Back to Products</Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col space-y-6">
            {cartItems.map((item: CartItem) => (
              <CartItemCard key={item.id} item={item} />
            ))}
          </div>

          <div className="mt-8 border-t border-stone-300 pt-6">
            <Label htmlFor="address" className="font-bold mb-1">
              Shipping Address <Badge variant="destructive" className="ml-2">Required</Badge>
            </Label>
            <textarea
              id="address"
              value={address}
              placeholder="Enter your shipping address"
              required
              className={cn(
                "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center pb-2 font-semibold">
              <span>Subtotal:</span><span>${totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-stone-300 font-semibold">
              <span>Shipping:</span><span>${SHIPPING_COST.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-4 text-green-600 text-2xl font-bold">
              <span>Total:</span><span>${finalPrice.toLocaleString()}</span>
            </div>

            <p className="text-stone-500 text-sm mt-2 text-right">
              All prices include tax. Payment is processed via Stripe credit card payment.
            </p>
          </div>

          <div className="mt-8">
            <p className="text-sm">
              Before confirming your order, please read our{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-forest-600 font-bold underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-forest-600 font-bold underline">
                Privacy Policy
              </Link>
              .<br/>By checking the agreement box, you are deemed to have agreed to the above terms.
            </p>
            <div className="mt-6 flex items-center">
              <input
                type="checkbox"
                id="agreement-checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="h-4 w-4 text-forest-600 border-stone-300 rounded focus:ring-forest-500"
              />
              <Label htmlFor="agreement-checkbox" className="ml-2 text-base font-semibold text-stone-800 leading-snug">
                I agree to the Terms of Service and Privacy Policy
              </Label>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <Button
              onClick={handleConfirmPayment}
              disabled={!isAgreed || !address.trim()}
              variant={isAgreed && address.trim() ? 'default' : 'secondary'}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Proceed to Payment
            </Button>
            <Button
              type="button"
              onClick={handleCancel}
              variant="secondary"
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </main>
  );
}