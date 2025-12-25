'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { SUCCESS_MESSAGE_STYLE } from '@/lib/constants';

const MENU_ITEM_STYLE = "w-full flex items-center px-4 pt-4 border border-stone-300 rounded shadow-lg hover:ring-2 hover:ring-forest-200 hover:shadow-xl hover:bg-stone-100";

export default function AccountPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();

  useEffect(() => {
    if (sessionId) {
      clearCart();
    }
  }, [sessionId, clearCart]);

  const message =
    searchParams.get('edited') ? 'Your account information has been updated.' :
    searchParams.get('password-changed') ? 'Your password has been changed.' :
    null;

  return (
    <>
      {sessionId && (
        <div className="w-full bg-green-100 text-green-800 p-3 text-center shadow-md flex flex-col items-center justify-center mb-6 rounded-md">
          <p className="text-xl font-bold mt-4">Thank you for your order!</p>
          <p>Please wait for your items to arrive.</p>
        </div>
      )}
      {message && (
        <div className={SUCCESS_MESSAGE_STYLE}>
          {message}
        </div>
      )}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-center mb-8">My Account</h1>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <Link href="/account/edit" className={MENU_ITEM_STYLE}>
            <div className="flex flex-col text-left">
              <h2 className="mt-0 font-medium">Edit Profile</h2>
              <p className="text-stone-600">Update your name and email address</p>
            </div>
          </Link>

          <Link href="/account/password" className={MENU_ITEM_STYLE}>
            <div className="flex flex-col text-left">
              <h2 className="mt-0 font-medium">Change Password</h2>
              <p className="text-stone-600">Update your password</p>
            </div>
          </Link>

          <Link href="/account/orders" className={MENU_ITEM_STYLE}>
            <div className="flex flex-col text-left">
              <h2 className="mt-0 font-medium">Order History</h2>
              <p className="text-stone-600">View your past orders</p>
            </div>
          </Link>

          <Link href="/account/favorites" className={MENU_ITEM_STYLE}>
            <div className="flex flex-col text-left">
              <h2 className="mt-0 font-medium">Favorite Products</h2>
              <p className="text-stone-600">View your favorite items</p>
            </div>
          </Link>

          <form method="POST" action="/api/auth/logout">
            <button type="submit" className={MENU_ITEM_STYLE}>
              <div className="flex flex-col text-left">
                <h2 className="mt-0 font-medium">Log Out</h2>
                <p className="text-stone-600">Sign out of your account</p>
              </div>
            </button>
          </form>
        </div>
      </main>
    </>
  );
}