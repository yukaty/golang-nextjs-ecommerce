'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

const BASE_BUTTON_CLASSES = 'min-w-9 h-9 rounded border border-stone-300 mx-1 cursor-pointer text-stone-700 hover:bg-stone-100 hover:text-stone-800 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2';
const ACTIVE_BUTTON_CLASSES = 'bg-forest-500 text-white border-forest-500';
const DISABLED_BUTTON_CLASSES = 'opacity-50 cursor-not-allowed';

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`?${params.toString()}`);
  };

  return (
    <nav className="flex justify-center items-center mt-8" aria-label="Pagination">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          BASE_BUTTON_CLASSES,
          currentPage === 1 && DISABLED_BUTTON_CLASSES
        )}
        aria-label="Go to previous page"
      >
        &lt;
      </button>

      {Array.from({ length: totalPages }, (_, i) => {
        const page = i + 1;
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            disabled={isActive}
            className={cn(
              BASE_BUTTON_CLASSES,
              isActive && ACTIVE_BUTTON_CLASSES
            )}
            aria-label={`Go to page ${page}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          BASE_BUTTON_CLASSES,
          currentPage === totalPages && DISABLED_BUTTON_CLASSES
        )}
        aria-label="Go to next page"
      >
        &gt;
      </button>
    </nav>
  );
}