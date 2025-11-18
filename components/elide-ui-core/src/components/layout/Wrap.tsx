import React, { forwardRef } from 'react';
import { BaseProps, ChildrenProps } from '../../types';
import { clsx } from 'clsx';

export interface WrapProps extends BaseProps, ChildrenProps {
  spacing?: string | number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

export const Wrap = forwardRef<HTMLDivElement, WrapProps>(
  ({ spacing = '0.5rem', align = 'start', justify = 'start', children, className, ...props }, ref) => {
    const alignMap = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch'
    };

    const justifyMap = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around'
    };

    return (
      <div
        ref={ref}
        className={clsx('flex flex-wrap', alignMap[align], justifyMap[justify], className)}
        style={{ gap: spacing }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Wrap.displayName = 'Wrap';
