import React, { forwardRef } from 'react';
import { TextareaProps } from '../../types/components';
import { clsx } from 'clsx';

/**
 * Textarea component - Multi-line text input
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = 'md',
      variant = 'outline',
      isInvalid = false,
      resize = 'vertical',
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'w-full transition-colors duration-200 focus:outline-none';

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

    const resizeClasses = {
      none: 'resize-none',
      both: 'resize',
      horizontal: 'resize-x',
      vertical: 'resize-y'
    };

    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={clsx(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          resizeClasses[resize],
          disabled && 'opacity-50 cursor-not-allowed bg-gray-100',
          className
        )}
        aria-invalid={isInvalid}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
