import React, { forwardRef } from 'react';
import { BaseProps } from '../../types';

export const Spacer = forwardRef<HTMLDivElement, BaseProps>(
  (props, ref) => <div ref={ref} className="flex-1" {...props} />
);

Spacer.displayName = 'Spacer';
