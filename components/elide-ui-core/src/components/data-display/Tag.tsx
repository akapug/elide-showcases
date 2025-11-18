import React, { forwardRef } from 'react';
import { TagProps } from '../../types/components';
import { Badge } from './Badge';
import { clsx } from 'clsx';

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ onClose, leftIcon, rightIcon, children, className, ...props }, ref) => {
    return (
      <Badge
        ref={ref}
        className={clsx('inline-flex items-center gap-1', className)}
        {...props}
      >
        {leftIcon}
        {children}
        {rightIcon}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-1 hover:bg-black/10 rounded-full p-0.5"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M9.5 3.5L3.5 9.5M3.5 3.5l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </Badge>
    );
  }
);

Tag.displayName = 'Tag';
