import React, { forwardRef, useState } from 'react';
import { SwitchProps } from '../../types/components';
import { clsx } from 'clsx';

/**
 * Switch component - Toggle switch
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      isChecked,
      defaultChecked = false,
      onChange,
      disabled = false,
      size = 'md',
      colorScheme = 'blue',
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    const checked = isChecked !== undefined ? isChecked : internalChecked;

    const sizeClasses = {
      xs: { track: 'w-6 h-3', thumb: 'h-2 w-2' },
      sm: { track: 'w-8 h-4', thumb: 'h-3 w-3' },
      md: { track: 'w-11 h-6', thumb: 'h-5 w-5' },
      lg: { track: 'w-14 h-7', thumb: 'h-6 w-6' },
      xl: { track: 'w-16 h-8', thumb: 'h-7 w-7' }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      setInternalChecked(newChecked);
      onChange?.(newChecked);
    };

    return (
      <label className={clsx('inline-flex items-center cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div
            className={clsx(
              sizeClasses[size].track,
              'rounded-full transition-colors duration-200',
              checked ? `bg-${colorScheme}-600` : 'bg-gray-300',
              disabled && 'cursor-not-allowed'
            )}
          />
          <div
            className={clsx(
              sizeClasses[size].thumb,
              'absolute left-0.5 top-0.5 bg-white rounded-full transition-transform duration-200 shadow-md',
              checked && 'translate-x-full'
            )}
          />
        </div>
        {children && <span className="ml-3 text-gray-700">{children}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
