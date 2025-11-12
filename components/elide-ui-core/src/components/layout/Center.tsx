import React, { forwardRef } from 'react';
import { BoxProps } from '../../types/components';
import { clsx } from 'clsx';

export const Center = forwardRef<HTMLDivElement, BoxProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('flex items-center justify-center', className)} {...props}>
      {children}
    </div>
  )
);

Center.displayName = 'Center';
