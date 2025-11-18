import React, { forwardRef } from 'react';
import { CardProps, BaseProps, ChildrenProps } from '../../types/components';
import { clsx } from 'clsx';

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'elevated', size = 'md', children, className, ...props }, ref) => {
    const variantClasses = {
      elevated: 'shadow-md',
      outline: 'border border-gray-200',
      filled: 'bg-gray-50',
      unstyled: ''
    };

    const sizeClasses = {
      xs: 'p-2',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8'
    };

    return (
      <div
        ref={ref}
        className={clsx('rounded-lg bg-white', variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('mb-4', className)} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardBody = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
);
CardBody.displayName = 'CardBody';

export const CardFooter = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('mt-4 pt-4 border-t border-gray-200', className)} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';
