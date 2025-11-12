import React, { forwardRef, useRef, useState } from 'react';
import { BaseProps } from '../../types';
import { clsx } from 'clsx';

export interface PinInputProps extends BaseProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  mask?: boolean;
  type?: 'alphanumeric' | 'number';
}

/**
 * PinInput - PIN/OTP input component
 */
export const PinInput = forwardRef<HTMLDivElement, PinInputProps>(
  ({ length = 4, value = '', onChange, onComplete, mask = false, type = 'number', className }, ref) => {
    const [pins, setPins] = useState(value.split('').slice(0, length));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, val: string) => {
      const newPins = [...pins];
      newPins[index] = val;
      setPins(newPins);

      const newValue = newPins.join('');
      onChange?.(newValue);

      if (val && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      if (newValue.length === length) {
        onComplete?.(newValue);
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !pins[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    };

    return (
      <div ref={ref} className={clsx('flex gap-2', className)}>
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type={mask ? 'password' : 'text'}
            inputMode={type === 'number' ? 'numeric' : 'text'}
            maxLength={1}
            value={pins[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-12 text-center text-lg border-2 border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
        ))}
      </div>
    );
  }
);

PinInput.displayName = 'PinInput';
