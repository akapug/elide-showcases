import React, { forwardRef } from 'react';
import { ProgressProps } from '../../types/components';
import { clsx } from 'clsx';

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value = 0,
      max = 100,
      min = 0,
      isIndeterminate = false,
      colorScheme = 'blue',
      size = 'md',
      hasStripe = false,
      isAnimated = false,
      className,
      ...props
    },
    ref
  ) => {
    const percentage = ((value - min) / (max - min)) * 100;

    const sizeClasses = {
      xs: 'h-1',
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4',
      xl: 'h-5'
    };

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        className={clsx('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size], className)}
        {...props}
      >
        <div
          className={clsx(
            `bg-${colorScheme}-600 h-full transition-all duration-300`,
            isIndeterminate && 'animate-pulse',
            hasStripe && 'bg-gradient-to-r from-transparent via-white/20 to-transparent',
            isAnimated && 'animate-progress'
          )}
          style={{ width: isIndeterminate ? '100%' : `${percentage}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export const CircularProgress = forwardRef<SVGSVGElement, Omit<ProgressProps, 'size'> & { size?: string | number }>(
  (
    {
      value = 0,
      max = 100,
      min = 0,
      isIndeterminate = false,
      colorScheme = 'blue',
      size = 48,
      thickness = 8,
      className,
      ...props
    }: any,
    ref
  ) => {
    const percentage = ((value - min) / (max - min)) * 100;
    const circumference = 2 * Math.PI * 20;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 48 48"
        className={clsx(isIndeterminate && 'animate-spin', className)}
        {...props}
      >
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-gray-200"
        />
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={isIndeterminate ? circumference / 4 : strokeDashoffset}
          strokeLinecap="round"
          className={`text-${colorScheme}-600 transition-all duration-300`}
          transform="rotate(-90 24 24)"
        />
      </svg>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';
