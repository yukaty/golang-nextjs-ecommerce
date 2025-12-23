'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Type definition for Pagination component props
interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

// Common pagination component
export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Event handler for page change
  const handlePageChange = (newPage: number) => {
    // Get current query parameters
    const params = new URLSearchParams(searchParams.toString());
    // Update page number in query parameters
    params.set('page', String(newPage));
    // Update URL without reload
    router.push(`?${params.toString()}`);
  };

  // Define common styles for pagination buttons
  const baseClasses = 'min-w-9 h-9 rounded border border-gray-300 mx-1 cursor-pointer';
  const hover = 'hover:bg-gray-100 hover:text-gray-800';
  const active = 'bg-indigo-500 text-white border-indigo-500';
  const disabled = 'opacity-50';

  return (
    <nav className="flex justify-center items-center mt-8" aria-label="Pagination">
      {/* Previous (<) */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${baseClasses} text-gray-700 ${hover} ${currentPage === 1 ? disabled : ''}`}
      >
        &lt;
      </button>

      {/* Page numbers */}
      {Array.from({ length: totalPages }, (_, i) => {
        // Page numbers start from 1, so add 1 to array index (0-based)
        const page = i + 1;
        // Make only the current page number active
        const isActive = (page === currentPage);
        return (
          <button key={page} onClick={() => handlePageChange(page)} disabled={isActive}
            className={`${baseClasses} ${isActive ? active : 'text-gray-700 ' + hover}`}
          >
            {page}
          </button>
        );
      })}

      {/* Next (>) */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${baseClasses} text-gray-700 ${hover} ${currentPage === totalPages ? disabled : ''}`}
      >
        &gt;
      </button>
    </nav>
  );
}