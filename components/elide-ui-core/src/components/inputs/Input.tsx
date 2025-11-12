import React, { forwardRef } from 'react';
import { InputProps } from '../../types/components';
import { clsx } from 'clsx';

/**
 * Input component - Text input field
 *
 * @example
 * ```tsx
 * <Input
 *   placeholder="Enter text..."
 *   size="md"
 *   variant="outline"
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'outline',
      isInvalid = false,
      leftElement,
      rightElement,
      leftAddon,
      rightAddon,
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

    const disabledClasses = disabled
      ? 'opacity-50 cursor-not-allowed bg-gray-100'
      : '';

    const inputElement = (
      <input
        ref={ref}
        disabled={disabled}
        className={clsx(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          disabledClasses,
          leftElement && 'pl-10',
          rightElement && 'pr-10',
          className
        )}
        aria-invalid={isInvalid}
        {...props}
      />
    );

    if (leftElement || rightElement || leftAddon || rightAddon) {
      return (
        <div className="relative flex items-center w-full">
          {leftAddon && (
            <div className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-gray-600">
              {leftAddon}
            </div>
          )}
          <div className="relative flex-1">
            {leftElement && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {leftElement}
              </div>
            )}
            {inputElement}
            {rightElement && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {rightElement}
              </div>
            )}
          </div>
          {rightAddon && (
            <div className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-600">
              {rightAddon}
            </div>
          )}
        </div>
      );
    }

    return inputElement;
  }
);

Input.displayName = 'Input';
