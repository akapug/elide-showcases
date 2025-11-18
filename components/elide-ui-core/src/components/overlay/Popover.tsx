import React, { forwardRef, useState } from 'react';
import { PopoverProps, BaseProps, ChildrenProps } from '../../types/components';
import { clsx } from 'clsx';

export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      isOpen: controlledIsOpen,
      onOpen,
      onClose,
      trigger = 'click',
      placement = 'bottom',
      closeOnBlur = true,
      closeOnEsc = true,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const open = controlledIsOpen !== undefined ? controlledIsOpen : isOpen;

    return (
      <div ref={ref} className={clsx('relative inline-block', className)} {...props}>
        {children}
      </div>
    );
  }
);

Popover.displayName = 'Popover';

export const PopoverTrigger = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props}>
      {children}
    </div>
  )
);
PopoverTrigger.displayName = 'PopoverTrigger';

export const PopoverContent = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'absolute z-50 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
PopoverContent.displayName = 'PopoverContent';

export const PopoverHeader = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('mb-2 font-semibold', className)} {...props}>
      {children}
    </div>
  )
);
PopoverHeader.displayName = 'PopoverHeader';

export const PopoverBody = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
);
PopoverBody.displayName = 'PopoverBody';

export const PopoverFooter = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('mt-3 pt-3 border-t', className)} {...props}>
      {children}
    </div>
  )
);
PopoverFooter.displayName = 'PopoverFooter';
