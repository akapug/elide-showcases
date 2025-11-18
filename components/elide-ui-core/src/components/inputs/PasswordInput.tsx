import React, { forwardRef, useState } from 'react';
import { InputProps } from '../../types/components';
import { Input } from './Input';

/**
 * PasswordInput - Password input with show/hide toggle
 */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  (props, ref) => {
    const [show, setShow] = useState(false);

    return (
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        rightElement={
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
