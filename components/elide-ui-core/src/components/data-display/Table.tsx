import React, { forwardRef } from 'react';
import { TableProps, BaseProps, ChildrenProps } from '../../types/components';
import { clsx } from 'clsx';

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ variant = 'simple', size = 'md', colorScheme = 'gray', children, className, ...props }, ref) => {
    const variantClasses = {
      simple: 'border-collapse',
      striped: 'border-collapse [&_tbody_tr:nth-child(even)]:bg-gray-50',
      unstyled: ''
    };

    const sizeClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl'
    };

    return (
      <table
        ref={ref}
        className={clsx('w-full', variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </table>
    );
  }
);

Table.displayName = 'Table';

export const Thead = forwardRef<HTMLTableSectionElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <thead ref={ref} className={clsx('border-b-2 border-gray-300', className)} {...props}>
      {children}
    </thead>
  )
);
Thead.displayName = 'Thead';

export const Tbody = forwardRef<HTMLTableSectionElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <tbody ref={ref} className={className} {...props}>
      {children}
    </tbody>
  )
);
Tbody.displayName = 'Tbody';

export const Tr = forwardRef<HTMLTableRowElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <tr ref={ref} className={clsx('border-b border-gray-200', className)} {...props}>
      {children}
    </tr>
  )
);
Tr.displayName = 'Tr';

export const Th = forwardRef<HTMLTableCellElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <th ref={ref} className={clsx('px-4 py-3 text-left font-semibold', className)} {...props}>
      {children}
    </th>
  )
);
Th.displayName = 'Th';

export const Td = forwardRef<HTMLTableCellElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <td ref={ref} className={clsx('px-4 py-3', className)} {...props}>
      {children}
    </td>
  )
);
Td.displayName = 'Td';
