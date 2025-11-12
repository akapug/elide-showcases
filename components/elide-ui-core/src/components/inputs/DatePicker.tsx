import React, { forwardRef } from 'react';
import { InputProps } from '../../types/components';
import { Input } from './Input';

/**
 * DatePicker - Date selection input
 */
export const DatePicker = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  (props, ref) => {
    return (
      <Input
        ref={ref}
        type="date"
        {...props}
      />
    );
  }
);

DatePicker.displayName = 'DatePicker';
