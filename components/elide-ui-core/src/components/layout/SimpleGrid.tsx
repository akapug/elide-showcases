import React, { forwardRef } from 'react';
import { BaseProps, ChildrenProps } from '../../types';
import { clsx } from 'clsx';

export interface SimpleGridProps extends BaseProps, ChildrenProps {
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  spacing?: string | number;
  minChildWidth?: string;
}

export const SimpleGrid = forwardRef<HTMLDivElement, SimpleGridProps>(
  ({ columns = 1, spacing = '1rem', minChildWidth, children, className, ...props }, ref) => {
    let gridTemplateColumns;

    if (minChildWidth) {
      gridTemplateColumns = `repeat(auto-fit, minmax(${minChildWidth}, 1fr))`;
    } else if (typeof columns === 'number') {
      gridTemplateColumns = `repeat(${columns}, 1fr)`;
    }

    return (
      <div
        ref={ref}
        className={clsx('grid', className)}
        style={{ gridTemplateColumns, gap: spacing }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SimpleGrid.displayName = 'SimpleGrid';
