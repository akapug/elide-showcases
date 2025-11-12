import React, { forwardRef } from 'react';
import { PaginationProps } from '../../types/components';
import { clsx } from 'clsx';

export const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  ({ currentPage, totalPages, onPageChange, siblingCount = 1, showFirstLast = true, showPrevNext = true, size = 'md', className, ...props }, ref) => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    const sizeClasses = {
      xs: 'text-xs px-2 py-1',
      sm: 'text-sm px-3 py-1.5',
      md: 'text-base px-4 py-2',
      lg: 'text-lg px-5 py-2.5',
      xl: 'text-xl px-6 py-3'
    };

    return (
      <div ref={ref} className={clsx('flex items-center gap-1', className)} {...props}>
        {showFirstLast && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={clsx('border rounded hover:bg-gray-100 disabled:opacity-50', sizeClasses[size])}
          >
            First
          </button>
        )}
        {showPrevNext && (
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={clsx('border rounded hover:bg-gray-100 disabled:opacity-50', sizeClasses[size])}
          >
            Prev
          </button>
        )}
        {pages.slice(Math.max(0, currentPage - siblingCount - 1), Math.min(totalPages, currentPage + siblingCount)).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={clsx(
              'border rounded',
              page === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-100',
              sizeClasses[size]
            )}
          >
            {page}
          </button>
        ))}
        {showPrevNext && (
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={clsx('border rounded hover:bg-gray-100 disabled:opacity-50', sizeClasses[size])}
          >
            Next
          </button>
        )}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={clsx('border rounded hover:bg-gray-100 disabled:opacity-50', sizeClasses[size])}
          >
            Last
          </button>
        )}
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';
