import React, { forwardRef, useState } from 'react';
import { BaseProps } from '../../types';
import { clsx } from 'clsx';

export interface RangeSliderProps extends BaseProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: [number, number];
  value?: [number, number];
  onChange?: (value: [number, number]) => void;
}

export const RangeSlider = forwardRef<HTMLDivElement, RangeSliderProps>(
  ({ min = 0, max = 100, step = 1, defaultValue = [25, 75], value, onChange, className }, ref) => {
    const [range, setRange] = useState(value || defaultValue);

    const handleChange = (index: 0 | 1, newValue: number) => {
      const newRange: [number, number] = [...range] as [number, number];
      newRange[index] = newValue;
      setRange(newRange);
      onChange?.(newRange);
    };

    return (
      <div ref={ref} className={clsx('relative w-full h-2', className)}>
        <div className="absolute w-full h-2 bg-gray-200 rounded-full" />
        <div
          className="absolute h-2 bg-blue-600 rounded-full"
          style={{
            left: `${((range[0] - min) / (max - min)) * 100}%`,
            right: `${100 - ((range[1] - min) / (max - min)) * 100}%`
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={range[0]}
          onChange={(e) => handleChange(0, parseFloat(e.target.value))}
          className="absolute w-full opacity-0 cursor-pointer"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={range[1]}
          onChange={(e) => handleChange(1, parseFloat(e.target.value))}
          className="absolute w-full opacity-0 cursor-pointer"
        />
      </div>
    );
  }
);

RangeSlider.displayName = 'RangeSlider';
