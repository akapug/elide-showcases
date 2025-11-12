import React, { forwardRef } from 'react';
import { CodeProps } from '../../types/components';
import { clsx } from 'clsx';

export const Code = forwardRef<HTMLElement, CodeProps>(
  ({ colorScheme = 'gray', variant = 'subtle', children, className, ...props }, ref) => {
    const variantClasses = {
      solid: `bg-${colorScheme}-600 text-white`,
      subtle: `bg-${colorScheme}-100 text-${colorScheme}-800`,
      outline: `border border-${colorScheme}-300 text-${colorScheme}-700`
    };

    return (
      <code
        ref={ref}
        className={clsx(
          'px-1.5 py-0.5 rounded font-mono text-sm',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  }
);

Code.displayName = 'Code';
