import React, { forwardRef } from 'react';
import { IconButtonProps } from '../../types/components';
import { IconButton } from './IconButton';

/**
 * CloseButton component - Specialized button for closing overlays
 */
export const CloseButton = forwardRef<HTMLButtonElement, Omit<IconButtonProps, 'icon'>>(
  ({ 'aria-label': ariaLabel = 'Close', ...props }, ref) => {
    return (
      <IconButton
        ref={ref}
        icon={
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        }
        aria-label={ariaLabel}
        {...props}
      />
    );
  }
);

CloseButton.displayName = 'CloseButton';
