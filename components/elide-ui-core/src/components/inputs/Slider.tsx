import React, { forwardRef, useState } from 'react';
import { SliderProps } from '../../types/components';
import { clsx } from 'clsx';

/**
 * Slider component - Range input
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value: controlledValue,
      defaultValue = 50,
      min = 0,
      max = 100,
      step = 1,
      onChange,
      onChangeEnd,
      isDisabled = false,
      colorScheme = 'blue',
      size = 'md',
      orientation = 'horizontal',
      className,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const percentage = ((value - min) / (max - min)) * 100;

    const sizeClasses = {
      xs: 'h-1',
      sm: 'h-1.5',
      md: 'h-2',
      lg: 'h-2.5',
      xl: 'h-3'
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      setInternalValue(newValue);
      onChange?.(newValue);
    };

    const handleMouseUp = () => {
      onChangeEnd?.(value);
    };

    return (
      <div className={clsx('relative w-full', orientation === 'vertical' && 'h-full w-auto', className)}>
        <div
          className={clsx(
            'rounded-full bg-gray-200 relative',
            sizeClasses[size],
            orientation === 'vertical' && 'h-full w-2'
          )}
        >
          <div
            className={clsx('absolute rounded-full bg-blue-600 h-full', sizeClasses[size])}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          disabled={isDisabled}
          className={clsx(
            'absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer',
            isDisabled && 'cursor-not-allowed',
            orientation === 'vertical' && 'h-full w-auto'
          )}
          {...props}
        />
        <div
          className={clsx(
            'absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-blue-600',
            isDisabled && 'opacity-50'
          )}
          style={{ left: `calc(${percentage}% - 0.5rem)` }}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';
