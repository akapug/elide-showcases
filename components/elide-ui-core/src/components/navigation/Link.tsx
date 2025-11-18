import React, { forwardRef } from 'react';
import { BaseProps, ChildrenProps } from '../../types';
import { clsx } from 'clsx';

export interface LinkProps extends BaseProps, ChildrenProps {
  href: string;
  isExternal?: boolean;
  isDisabled?: boolean;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, isExternal, isDisabled, children, className, ...props }, ref) => (
    <a
      ref={ref}
      href={isDisabled ? undefined : href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={clsx(
        'text-blue-600 hover:text-blue-800 hover:underline transition-colors',
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
);

Link.displayName = 'Link';
