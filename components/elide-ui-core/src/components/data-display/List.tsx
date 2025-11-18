import React, { forwardRef } from 'react';
import { ListProps, BaseProps, ChildrenProps } from '../../types/components';
import { clsx } from 'clsx';

export const List = forwardRef<HTMLUListElement, ListProps>(
  ({ spacing = '0.5rem', styleType, stylePosition = 'outside', children, className, ...props }, ref) => {
    return (
      <ul
        ref={ref}
        className={clsx(
          '[&>li]:mb-2',
          stylePosition === 'inside' && 'list-inside',
          stylePosition === 'outside' && 'list-outside',
          className
        )}
        style={{ listStyleType: styleType }}
        {...props}
      >
        {children}
      </ul>
    );
  }
);

List.displayName = 'List';

export const ListItem = forwardRef<HTMLLIElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <li ref={ref} className={clsx('flex items-start', className)} {...props}>
      {children}
    </li>
  )
);

ListItem.displayName = 'ListItem';

export const OrderedList = forwardRef<HTMLOListElement, ListProps>(
  ({ children, className, ...props }, ref) => (
    <List as="ol" ref={ref as any} className={clsx('list-decimal pl-5', className)} {...props}>
      {children}
    </List>
  )
);

OrderedList.displayName = 'OrderedList';

export const UnorderedList = forwardRef<HTMLUListElement, ListProps>(
  ({ children, className, ...props }, ref) => (
    <List ref={ref} className={clsx('list-disc pl-5', className)} {...props}>
      {children}
    </List>
  )
);

UnorderedList.displayName = 'UnorderedList';
