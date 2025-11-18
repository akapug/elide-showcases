import React, { forwardRef } from 'react';
import { FlexProps } from '../../types/components';
import { clsx } from 'clsx';

/**
 * Flex - Flexbox layout component
 */
export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      direction = 'row',
      align = 'stretch',
      justify = 'start',
      wrap = 'nowrap',
      gap,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const directionMap = {
      row: 'flex-row',
      'row-reverse': 'flex-row-reverse',
      column: 'flex-col',
      'column-reverse': 'flex-col-reverse'
    };

    const alignMap = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline'
    };

    const justifyMap = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly'
    };

    const wrapMap = {
      nowrap: 'flex-nowrap',
      wrap: 'flex-wrap',
      'wrap-reverse': 'flex-wrap-reverse'
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'flex',
          directionMap[direction],
          alignMap[align],
          justifyMap[justify],
          wrapMap[wrap],
          className
        )}
        style={{ gap }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Flex.displayName = 'Flex';
