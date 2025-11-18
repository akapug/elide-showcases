import React, { forwardRef } from 'react';
import { BadgeProps } from '../../types/components';
import { clsx } from 'clsx';

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'solid', colorScheme = 'gray', size = 'md', children, className, ...props }, ref) => {
    const variantClasses = {
      solid: `bg-${colorScheme}-600 text-white`,
      subtle: `bg-${colorScheme}-100 text-${colorScheme}-800`,
      outline: `border border-${colorScheme}-600 text-${colorScheme}-600`
    };

    const sizeClasses = {
      xs: 'px-1 py-0.5 text-xs',
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2 py-1 text-sm',
      lg: 'px-3 py-1 text-base',
      xl: 'px-4 py-1.5 text-lg'
    };

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center font-medium rounded-full',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
