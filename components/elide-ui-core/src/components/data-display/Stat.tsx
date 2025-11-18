import React, { forwardRef } from 'react';
import { BaseProps, ChildrenProps } from '../../types';
import { clsx } from 'clsx';

export const Stat = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('p-4', className)} {...props}>
      {children}
    </div>
  )
);

Stat.displayName = 'Stat';

export const StatLabel = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('text-sm text-gray-600 font-medium', className)} {...props}>
      {children}
    </div>
  )
);

StatLabel.displayName = 'StatLabel';

export const StatNumber = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('text-3xl font-bold mt-1', className)} {...props}>
      {children}
    </div>
  )
);

StatNumber.displayName = 'StatNumber';

export const StatHelpText = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('text-sm text-gray-500 mt-1', className)} {...props}>
      {children}
    </div>
  )
);

StatHelpText.displayName = 'StatHelpText';

export const StatArrow = forwardRef<SVGSVGElement, BaseProps & { type?: 'increase' | 'decrease' }>(
  ({ type = 'increase', className, ...props }, ref) => (
    <svg
      ref={ref}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="currentColor"
      className={clsx(
        'inline',
        type === 'increase' ? 'text-green-500' : 'text-red-500',
        className
      )}
      {...props}
    >
      {type === 'increase' ? (
        <path d="M7 3l4 4H3z" />
      ) : (
        <path d="M7 11L3 7h8z" />
      )}
    </svg>
  )
);

StatArrow.displayName = 'StatArrow';
