import React, { forwardRef, useState } from 'react';
import { DropdownProps, DropdownItemProps } from '../../types/components';
import { clsx } from 'clsx';

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  ({ trigger, isOpen: controlledIsOpen, onOpen, onClose, placement = 'bottom-start', closeOnSelect = true, children, className, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const open = controlledIsOpen !== undefined ? controlledIsOpen : isOpen;

    return (
      <div ref={ref} className={clsx('relative inline-block', className)} {...props}>
        <div onClick={() => setIsOpen(!open)}>{trigger}</div>
        {open && (
          <div className="absolute z-50 mt-2 min-w-[200px] bg-white rounded-md shadow-lg border border-gray-200">
            {children}
          </div>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ children, onClick, isDisabled, icon, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={clsx(
        'w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 transition-colors',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
);

DropdownItem.displayName = 'DropdownItem';
