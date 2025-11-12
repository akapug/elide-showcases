import React, { forwardRef } from 'react';
import { BoxProps } from '../../types/components';
import { clsx } from 'clsx';

/**
 * Box - Fundamental layout component
 */
export const Box = forwardRef<HTMLDivElement, BoxProps>(
  ({ as: Component = 'div', children, className, ...props }, ref) => {
    return (
      <Component ref={ref} className={clsx(className)} {...props}>
        {children}
      </Component>
    );
  }
);

Box.displayName = 'Box';
