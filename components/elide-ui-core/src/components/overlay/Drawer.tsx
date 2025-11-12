import React, { forwardRef, useEffect } from 'react';
import { DrawerProps, BaseProps, ChildrenProps } from '../../types/components';
import { clsx } from 'clsx';

export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(
  (
    {
      isOpen,
      onClose,
      placement = 'right',
      size = 'md',
      closeOnOverlayClick = true,
      closeOnEsc = true,
      blockScrollOnMount = true,
      children,
      className,
      ...props
    },
    ref
  ) => {
    useEffect(() => {
      if (isOpen && blockScrollOnMount) {
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = '';
        };
      }
    }, [isOpen, blockScrollOnMount]);

    useEffect(() => {
      if (isOpen && closeOnEsc) {
        const handleEsc = (e: KeyboardEvent) => {
          if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
      }
    }, [isOpen, closeOnEsc, onClose]);

    if (!isOpen) return null;

    const placementClasses = {
      left: 'left-0 top-0 bottom-0',
      right: 'right-0 top-0 bottom-0',
      top: 'top-0 left-0 right-0',
      bottom: 'bottom-0 left-0 right-0'
    };

    const sizeClasses = {
      xs: placement === 'left' || placement === 'right' ? 'w-64' : 'h-48',
      sm: placement === 'left' || placement === 'right' ? 'w-80' : 'h-64',
      md: placement === 'left' || placement === 'right' ? 'w-96' : 'h-80',
      lg: placement === 'left' || placement === 'right' ? 'w-[32rem]' : 'h-96',
      xl: placement === 'left' || placement === 'right' ? 'w-[48rem]' : 'h-[32rem]',
      full: 'w-full h-full'
    };

    return (
      <div className="fixed inset-0 z-50">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />
        <div
          ref={ref}
          className={clsx(
            'fixed bg-white shadow-xl',
            placementClasses[placement],
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <div className="h-full overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    );
  }
);

Drawer.displayName = 'Drawer';

export const DrawerHeader = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('mb-4 text-xl font-semibold', className)} {...props}>
      {children}
    </div>
  )
);
DrawerHeader.displayName = 'DrawerHeader';

export const DrawerBody = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('mb-4', className)} {...props}>
      {children}
    </div>
  )
);
DrawerBody.displayName = 'DrawerBody';

export const DrawerFooter = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('flex items-center justify-end gap-2 pt-4 border-t', className)} {...props}>
      {children}
    </div>
  )
);
DrawerFooter.displayName = 'DrawerFooter';
