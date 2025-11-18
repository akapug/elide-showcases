import React, { forwardRef } from 'react';
import { SpinnerProps } from '../../types/components';
import { clsx } from 'clsx';

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      size = 'md',
      thickness = '4px',
      speed = '0.65s',
      emptyColor = 'gray.200',
      color = 'blue.500',
      label = 'Loading...',
      className,
      ...props
    },
    ref
  ) => {
    const sizeMap = {
      xs: '12px',
      sm: '16px',
      md: '32px',
      lg: '48px',
      xl: '64px'
    };

    const spinnerSize = typeof size === 'string' && size in sizeMap ? sizeMap[size as keyof typeof sizeMap] : size;

    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={clsx('inline-block', className)}
        {...props}
      >
        <svg
          width={spinnerSize}
          height={spinnerSize}
          viewBox="0 0 24 24"
          className="animate-spin"
          style={{ animationDuration: speed }}
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            className="opacity-25"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            className="opacity-75"
          />
        </svg>
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';
