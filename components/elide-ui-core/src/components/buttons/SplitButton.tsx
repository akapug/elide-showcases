import React, { forwardRef, useState } from 'react';
import { ButtonProps } from '../../types/components';
import { Button } from './Button';
import { clsx } from 'clsx';

export interface SplitButtonProps extends ButtonProps {
  menuItems?: Array<{ label: string; onClick: () => void; disabled?: boolean }>;
}

/**
 * SplitButton - Button with dropdown menu
 */
export const SplitButton = forwardRef<HTMLButtonElement, SplitButtonProps>(
  ({ children, menuItems = [], className, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative inline-flex">
        <Button ref={ref} className={clsx('rounded-r-none', className)} {...props}>
          {children}
        </Button>
        <Button
          className="rounded-l-none border-l border-white/20 px-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 9L1 4h10z" />
          </svg>
        </Button>
        {isOpen && (
          <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-md last:rounded-b-md"
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

SplitButton.displayName = 'SplitButton';
