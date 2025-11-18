import React, { forwardRef } from 'react';
import { BreadcrumbProps, BaseProps, ChildrenProps } from '../../types/components';
import { clsx } from 'clsx';

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ separator = '/', spacing = '0.5rem', children, className, ...props }, ref) => (
    <nav ref={ref} aria-label="breadcrumb" className={className} {...props}>
      <ol className="flex items-center">
        {React.Children.map(children, (child, index) => (
          <>
            {index > 0 && <span className="mx-2 text-gray-400">{separator}</span>}
            {child}
          </>
        ))}
      </ol>
    </nav>
  )
);

Breadcrumb.displayName = 'Breadcrumb';

export const BreadcrumbItem = forwardRef<HTMLLIElement, BaseProps & ChildrenProps & { isCurrentPage?: boolean }>(
  ({ children, isCurrentPage, className, ...props }, ref) => (
    <li
      ref={ref}
      className={clsx(isCurrentPage ? 'text-gray-900 font-medium' : 'text-gray-600', className)}
      aria-current={isCurrentPage ? 'page' : undefined}
      {...props}
    >
      {children}
    </li>
  )
);

BreadcrumbItem.displayName = 'BreadcrumbItem';

export const BreadcrumbLink = forwardRef<HTMLAnchorElement, { href: string; children: React.ReactNode; className?: string }>(
  ({ href, children, className, ...props }, ref) => (
    <a ref={ref} href={href} className={clsx('hover:text-blue-600 transition-colors', className)} {...props}>
      {children}
    </a>
  )
);

BreadcrumbLink.displayName = 'BreadcrumbLink';
