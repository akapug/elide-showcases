import React, { forwardRef } from 'react';
import { DividerProps } from '../../types/components';
import { clsx } from 'clsx';

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  ({ orientation = 'horizontal', variant = 'solid', thickness = '1px', className, ...props }, ref) => {
    const isHorizontal = orientation === 'horizontal';

    return (
      <hr
        ref={ref}
        className={clsx(
          'border-gray-300',
          isHorizontal ? 'w-full' : 'h-full',
          variant === 'dashed' && 'border-dashed',
          className
        )}
        style={{
          borderWidth: isHorizontal ? `${thickness} 0 0 0` : `0 0 0 ${thickness}`
        }}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';
