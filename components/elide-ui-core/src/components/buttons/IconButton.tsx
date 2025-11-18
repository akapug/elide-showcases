import React, { forwardRef } from 'react';
import { IconButtonProps } from '../../types/components';
import { clsx } from 'clsx';

/**
 * IconButton component - Button with icon only
 *
 * @example
 * ```tsx
 * <IconButton icon={<SearchIcon />} aria-label="Search" />
 * ```
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = 'ghost',
      size = 'md',
      colorScheme = 'gray',
      disabled = false,
      loading = false,
      isActive = false,
      className,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeClasses = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-14 w-14 text-xl'
    };

    const variantClasses = {
      primary: `bg-${colorScheme}-600 text-white hover:bg-${colorScheme}-700`,
      secondary: `bg-${colorScheme}-100 text-${colorScheme}-900 hover:bg-${colorScheme}-200`,
      success: 'bg-green-600 text-white hover:bg-green-700',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      info: 'bg-blue-600 text-white hover:bg-blue-700',
      ghost: `text-${colorScheme}-600 hover:bg-${colorScheme}-50`,
      link: `text-${colorScheme}-600 hover:bg-transparent`
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        aria-label={ariaLabel}
        className={clsx(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          isActive && 'ring-2 ring-offset-2',
          className
        )}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
