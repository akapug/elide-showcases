import React, { forwardRef } from 'react';
import { ContainerProps } from '../../types/components';
import { clsx } from 'clsx';

/**
 * Container - Responsive container with max-width
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ maxWidth = 'lg', centerContent = false, children, className, ...props }, ref) => {
    const maxWidthMap = {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      '2xl': 'max-w-screen-2xl',
      full: 'max-w-full'
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'mx-auto px-4',
          maxWidthMap[maxWidth],
          centerContent && 'flex items-center justify-center',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';
