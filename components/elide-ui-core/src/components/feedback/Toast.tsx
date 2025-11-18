import React, { forwardRef } from 'react';
import { ToastProps } from '../../types/components';
import { Alert } from './Alert';

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      title,
      description,
      duration = 5000,
      isClosable = true,
      position = 'top-right',
      status = 'info',
      variant = 'solid',
      onClose,
      ...props
    },
    ref
  ) => {
    return (
      <Alert
        ref={ref}
        status={status}
        variant={variant}
        onClose={isClosable ? onClose : undefined}
        className="shadow-lg"
        {...props}
      >
        {title && <div className="font-semibold">{title}</div>}
        {description && <div className="text-sm mt-1">{description}</div>}
      </Alert>
    );
  }
);

Toast.displayName = 'Toast';
