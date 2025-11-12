import React, { forwardRef, useEffect } from 'react';
import { ModalProps, BaseProps, ChildrenProps } from '../../types/components';
import { clsx } from 'clsx';

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      size = 'md',
      isCentered = true,
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

    const sizeClasses = {
      xs: 'max-w-xs',
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full'
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div
          className={clsx('flex min-h-screen', isCentered && 'items-center justify-center')}
          onClick={closeOnOverlayClick ? onClose : undefined}
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
          <div
            ref={ref}
            className={clsx(
              'relative bg-white rounded-lg shadow-xl p-6 m-4',
              sizeClasses[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

export const ModalHeader = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('mb-4 text-xl font-semibold', className)} {...props}>
      {children}
    </div>
  )
);
ModalHeader.displayName = 'ModalHeader';

export const ModalBody = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('mb-4', className)} {...props}>
      {children}
    </div>
  )
);
ModalBody.displayName = 'ModalBody';

export const ModalFooter = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('flex items-center justify-end gap-2 pt-4', className)} {...props}>
      {children}
    </div>
  )
);
ModalFooter.displayName = 'ModalFooter';

export const ModalOverlay = forwardRef<HTMLDivElement, BaseProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('fixed inset-0 bg-black bg-opacity-50', className)} {...props} />
  )
);
ModalOverlay.displayName = 'ModalOverlay';
