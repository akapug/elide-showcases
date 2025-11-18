import React, { forwardRef } from 'react';
import { KbdProps } from '../../types/components';
import { clsx } from 'clsx';

export const Kbd = forwardRef<HTMLElement, KbdProps>(
  ({ children, className, ...props }, ref) => (
    <kbd
      ref={ref}
      className={clsx(
        'px-2 py-1 rounded bg-gray-100 border border-gray-300 text-sm font-mono shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  )
);

Kbd.displayName = 'Kbd';
