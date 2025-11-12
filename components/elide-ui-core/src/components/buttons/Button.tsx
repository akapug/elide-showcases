import React, { forwardRef } from 'react';
import { ButtonProps } from '../../types/components';
import { clsx } from 'clsx';

/**
 * Button component - Primary interactive element
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      colorScheme = 'blue',
      disabled = false,
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      isActive = false,
      loadingText,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeClasses = {
      xs: 'px-2 py-1 text-xs rounded',
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-md',
      lg: 'px-6 py-3 text-lg rounded-lg',
      xl: 'px-8 py-4 text-xl rounded-lg'
    };

    const variantClasses = {
      primary: `bg-${colorScheme}-600 text-white hover:bg-${colorScheme}-700 focus:ring-${colorScheme}-500`,
      secondary: `bg-${colorScheme}-100 text-${colorScheme}-900 hover:bg-${colorScheme}-200 focus:ring-${colorScheme}-500`,
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      info: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      ghost: `text-${colorScheme}-600 hover:bg-${colorScheme}-50 focus:ring-${colorScheme}-500`,
      link: `text-${colorScheme}-600 hover:underline focus:ring-${colorScheme}-500`
    };

    const widthClass = fullWidth ? 'w-full' : '';
    const activeClass = isActive ? 'ring-2 ring-offset-2' : '';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={clsx(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          widthClass,
          activeClass,
          className
        )}
        {...props}
      >
        {loading && !loadingText && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
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
        )}
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {loading && loadingText ? loadingText : children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
