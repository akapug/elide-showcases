import React, { forwardRef } from 'react';
import { BaseProps, ChildrenProps } from '../../types';

export interface AspectRatioProps extends BaseProps, ChildrenProps {
  ratio?: number;
}

export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 16 / 9, children, className, ...props }, ref) => (
    <div ref={ref} className={className} style={{ position: 'relative', paddingBottom: `${(1 / ratio) * 100}%` }} {...props}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  )
);

AspectRatio.displayName = 'AspectRatio';
