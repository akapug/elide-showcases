import React, { forwardRef } from 'react';
import { InputProps } from '../../types/components';
import { Input } from './Input';

export const ColorPicker = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  (props, ref) => <Input ref={ref} type="color" className="h-10 w-20 cursor-pointer" {...props} />
);

ColorPicker.displayName = 'ColorPicker';
