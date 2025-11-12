import React, { forwardRef } from 'react';
import { SelectProps } from '../../types/components';
import { clsx } from 'clsx';

/**
 * Select component - Dropdown select input
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      variant = 'outline',
      isInvalid = false,
      icon,
      disabled = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'w-full transition-colors duration-200 focus:outline-none appearance-none pr-10';

    const sizeClasses = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-5 py-3 text-lg',
      xl: 'px-6 py-4 text-xl'
    };

    const variantClasses = {
      outline: `border ${
        isInvalid
          ? 'border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
      } rounded-md bg-white`,
      filled: `border-2 border-transparent ${
        isInvalid ? 'bg-red-50' : 'bg-gray-100'
      } focus:bg-white focus:border-blue-500 rounded-md`,
      flushed: `border-b-2 ${
        isInvalid ? 'border-red-500' : 'border-gray-300'
      } focus:border-blue-500 rounded-none px-0`,
      unstyled: 'border-none p-0'
    };

    return (
      <div className="relative w-full">
        <select
          ref={ref}
          disabled={disabled}
          className={clsx(
            baseClasses,
            sizeClasses[size],
            variantClasses[variant],
            disabled && 'opacity-50 cursor-not-allowed bg-gray-100',
            className
          )}
          aria-invalid={isInvalid}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          {icon || (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 9L1 4h10z" />
            </svg>
          )}
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
