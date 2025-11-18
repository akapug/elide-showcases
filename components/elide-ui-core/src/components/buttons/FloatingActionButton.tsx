import React, { forwardRef } from 'react';
import { ButtonProps } from '../../types/components';
import { clsx } from 'clsx';

export interface FABProps extends ButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  extended?: boolean;
}

/**
 * FloatingActionButton (FAB) - Floating button for primary actions
 */
export const FloatingActionButton = forwardRef<HTMLButtonElement, FABProps>(
  (
    {
      position = 'bottom-right',
      extended = false,
      className,
      children,
      leftIcon,
      size = 'lg',
      ...props
    },
    ref
  ) => {
    const positionClasses = {
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4'
    };

    const baseClasses = extended
      ? 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200'
      : 'flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200';

    return (
      <button
        ref={ref}
        className={clsx(
          'fixed z-50',
          positionClasses[position],
          baseClasses,
          'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          className
        )}
        {...props}
      >
        {leftIcon}
        {extended && children}
      </button>
    );
  }
);

FloatingActionButton.displayName = 'FloatingActionButton';
