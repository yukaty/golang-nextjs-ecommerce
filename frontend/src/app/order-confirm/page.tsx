'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, CartItem } from '@/hooks/useCart';
import CartItemCard from '@/components/CartItemCard';

// Shipping cost
const SHIPPING_COST = 500; // Fixed at $5.00

// Order confirmation page
export default function OrderConfirmPage() {
  const router = useRouter();
  const { cartItems, totalPrice } = useCart(); // Get cart information and control functions
  const finalPrice = totalPrice + SHIPPING_COST; // Final total including shipping

  const [address, setAddress] = useState(''); // Shipping address
  const [isAgreed, setIsAgreed] = useState(false); // Agreement checkbox status
  const [errorMessage, setErrorMessage] = useState(''); // Error message

  // Event handler when payment button is clicked
  const handleConfirmPayment = async () => {
    if (!address.trim()) {
      setErrorMessage('Please enter your shipping address.');
      return;
    }
    if (!isAgreed) {
      setErrorMessage('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    // Create Stripe Checkout session
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
      router.push(checkoutData.url); // Navigate to payment page
    }
  };

  // Event handler for cancel button
  const handleCancel = () => {
    // Display confirmation dialog
    if (confirm('Your entered information will be discarded. Are you sure?')) {
      router.push('/cart'); // Navigate to cart page
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-center mb-6">Confirm Your Order</h1>
      {errorMessage && (
        <p className="text-red-600 text-center mb-4">{errorMessage}</p>
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
            <label className="block font-bold mb-1" htmlFor="address">
              Shipping Address<span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-md">Required</span>
            </label>
            <textarea
              id="address" value={address} placeholder="Enter your shipping address" required
              className="w-full border border-stone-300 px-3 py-2 rounded-sm focus:ring-2 focus:ring-forest-500"
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
                type="checkbox" id="agreement-checkbox" checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="h-4 w-4 text-forest-600 border-stone-300 rounded focus:ring-forest-500"
              />
              <label htmlFor="agreement-checkbox" className="ml-2 text-base font-semibold text-stone-800 leading-snug">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center">
            <button
              onClick={handleConfirmPayment}
              disabled={!isAgreed || !address.trim()}
              className={`py-2 px-6 rounded-sm text-white ${
                isAgreed && address.trim()
                  ? 'bg-forest-500 hover:bg-forest-600'
                  : 'bg-stone-400 cursor-not-allowed'
              }`}
            >
              Proceed to Payment
            </button>
            <button
              type="button" onClick={handleCancel}
              className="bg-stone-200 hover:bg-stone-300 text-stone-700 py-2 px-6 rounded-sm"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </main>
  );
}