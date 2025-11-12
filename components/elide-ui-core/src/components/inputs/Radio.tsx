import React, { forwardRef } from 'react';
import { RadioProps } from '../../types/components';
import { clsx } from 'clsx';

/**
 * Radio component
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      isChecked,
      isInvalid = false,
      defaultChecked,
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
    const sizeClasses = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-7 w-7'
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked);
    };

    return (
      <label className={clsx('inline-flex items-center cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
        <input
          ref={ref}
          type="radio"
          checked={isChecked}
          defaultChecked={defaultChecked}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={isInvalid}
          className={clsx(
            sizeClasses[size],
            'border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors',
            isInvalid && 'border-red-500',
            disabled && 'cursor-not-allowed'
          )}
          {...props}
        />
        {children && <span className="ml-2 text-gray-700">{children}</span>}
      </label>
    );
  }
);

Radio.displayName = 'Radio';
