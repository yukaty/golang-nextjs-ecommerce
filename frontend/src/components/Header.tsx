'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Heart, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { type AuthUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  user: AuthUser | null;
}

const MENU_ITEM_STYLE = 'block px-4 py-2 text-sm text-stone-700 hover:bg-stone-100';

export default function Header({ user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { totalQuantity } = useCart();
  const [displayQuantity, setDisplayQuantity] = useState(0);
  const searchParams = useSearchParams();
  const perPage = searchParams.get('perPage') || '16';
  const sort = searchParams.get('sort') || 'new';
  const keyword = searchParams.get('keyword') || '';

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    setDisplayQuantity(totalQuantity);
  }, [totalQuantity]);

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="shrink-0">
          <Link href="/">
            <Image src="/images/gotrailhead-logo.webp" alt="GoTrailhead" width={910} height={200} className="w-45 md:w-62.5 h-auto object-contain"/>
          </Link>
        </div>

        <nav className="hidden md:block grow text-center mt-8">
          <ul className="inline-flex divide-x divide-stone-300 list-none">
            <li className="border-r border-stone-300">
              <Link href="/" className="block w-30 py-3 hover:bg-stone-200 rounded-sm">Home</Link>
            </li>
            <li className="border-r border-stone-300">
              <Link href="/products" className="block w-30 py-3 hover:bg-stone-200 rounded-sm">Products</Link>
            </li>
            <li>
              <Link href="/contact" className="block w-30 py-3 hover:bg-stone-200 rounded-sm">Contact</Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center space-x-3 md:space-x-6 shrink-0">
          <form action="/products" method="GET" className="hidden sm:block">
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="perPage" value={perPage} />
            <input type="hidden" name="sort" value={sort} />
            <input
              type="text"
              name="keyword"
              placeholder="Search..."
              defaultValue={keyword}
              className="border border-stone-300 rounded-md py-1 px-3 text-sm focus:ring-2 focus:ring-forest-600"
            />
          </form>
          <Link href="/account/favorites">
            <Heart className="w-6 h-6" />
          </Link>
          <Link href="/cart" className="relative">
            <ShoppingCart className="w-6 h-6" />
            {displayQuantity > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 text-black flex items-center justify-center rounded-full ring-2 ring-white text-xs font-semibold">
                {displayQuantity > 9 ? '9+' : displayQuantity}
              </span>
            )}
          </Link>
          <div className="relative" ref={menuRef}>
            <button onClick={toggleMenu} className="cursor-pointer inline-flex items-center justify-center relative">
              <User className="w-6 h-6 mt-2" />
              {user && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white" />
              )}
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-stone-300">
                {user ? (
                  <>
                    <Link href="/account" onClick={closeMenu} className={MENU_ITEM_STYLE}>
                      My Account
                    </Link>
                    <form method="POST" action="/api/auth/logout">
                      <button type="submit" className={cn(MENU_ITEM_STYLE, 'w-full text-left')}>
                        Logout
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={closeMenu} className={MENU_ITEM_STYLE}>
                      Login
                    </Link>
                    <Link href="/register" onClick={closeMenu} className={MENU_ITEM_STYLE}>
                      Register
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}