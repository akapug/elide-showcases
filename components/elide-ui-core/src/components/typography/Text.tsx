import React, { forwardRef } from 'react';
import { BaseProps, ChildrenProps } from '../../types';
import { clsx } from 'clsx';

export interface TextProps extends BaseProps, ChildrenProps {
  as?: 'p' | 'span' | 'div' | 'label';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  isTruncated?: boolean;
  noOfLines?: number;
}

export const Text = forwardRef<HTMLElement, TextProps>(
  (
    {
      as: Component = 'p',
      size = 'md',
      weight = 'normal',
      align = 'left',
      color,
      isTruncated = false,
      noOfLines,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl'
    };

    const weightClasses = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold'
    };

    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify'
    };

    return (
      <Component
        ref={ref as any}
        className={clsx(
          sizeClasses[size],
          weightClasses[weight],
          alignClasses[align],
          isTruncated && 'truncate',
          noOfLines && 'line-clamp-' + noOfLines,
          className
        )}
        style={{ color }}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';
