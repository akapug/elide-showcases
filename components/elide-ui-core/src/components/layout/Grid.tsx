import React, { forwardRef } from 'react';
import { GridProps } from '../../types/components';
import { clsx } from 'clsx';

/**
 * Grid - CSS Grid layout component
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(
  (
    {
      templateColumns,
      templateRows,
      gap,
      columnGap,
      rowGap,
      autoFlow,
      autoColumns,
      autoRows,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx('grid', className)}
        style={{
          gridTemplateColumns: templateColumns,
          gridTemplateRows: templateRows,
          gap,
          columnGap,
          rowGap,
          gridAutoFlow: autoFlow,
          gridAutoColumns: autoColumns,
          gridAutoRows: autoRows
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';
