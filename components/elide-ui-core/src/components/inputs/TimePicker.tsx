import React, { forwardRef } from 'react';
import { InputProps } from '../../types/components';
import { Input } from './Input';

export const TimePicker = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  (props, ref) => <Input ref={ref} type="time" {...props} />
);

TimePicker.displayName = 'TimePicker';
