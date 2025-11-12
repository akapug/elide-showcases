import React, { forwardRef, useState } from 'react';
import { MenuProps, MenuItemProps } from '../../types/components';
import { clsx } from 'clsx';

export const Menu = forwardRef<HTMLDivElement, MenuProps>(
  ({ isOpen: controlledIsOpen, onOpen, onClose, autoSelect = true, closeOnBlur = true, closeOnSelect = true, placement = 'bottom-start', children, className, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const open = controlledIsOpen !== undefined ? controlledIsOpen : isOpen;

    return (
      <div ref={ref} className={clsx('relative', className)} {...props}>
        {children}
      </div>
    );
  }
);

Menu.displayName = 'Menu';

export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ children, isDisabled, icon, command, onClick, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={clsx(
        'w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-100 transition-colors',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-2">
        {icon}
        {children}
      </span>
      {command && <kbd className="text-xs text-gray-500">{command}</kbd>}
    </button>
  )
);

MenuItem.displayName = 'MenuItem';
