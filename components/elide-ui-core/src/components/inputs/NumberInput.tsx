import React, { forwardRef } from 'react';
import { InputProps } from '../../types/components';
import { Input } from './Input';

export interface NumberInputProps extends Omit<InputProps, 'type'> {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

/**
 * NumberInput - Number input with increment/decrement controls
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ min, max, step = 1, precision, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="number"
        min={min}
        max={max}
        step={step}
        rightElement={
          <div className="flex flex-col">
            <button type="button" className="text-xs hover:bg-gray-100 px-1">▲</button>
            <button type="button" className="text-xs hover:bg-gray-100 px-1">▼</button>
          </div>
        }
        {...props}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';
