import React, { forwardRef } from 'react';
import { ButtonProps } from '../../types/components';
import { Button } from './Button';

/**
 * LoadingButton - Button with built-in loading state management
 */
export const LoadingButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ loading = false, disabled, children, loadingText = 'Loading...', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        loading={loading}
        disabled={disabled || loading}
        loadingText={loadingText}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
