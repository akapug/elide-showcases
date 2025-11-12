import React, { forwardRef, useState, createContext, useContext } from 'react';
import { AccordionProps, AccordionItemProps, BaseProps, ChildrenProps } from '../../types/components';
import { clsx } from 'clsx';

const AccordionContext = createContext<any>(null);

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ allowMultiple = false, allowToggle = false, defaultIndex, index, onChange, children, className, ...props }, ref) => {
    const [expandedItems, setExpandedItems] = useState<number[]>(
      defaultIndex !== undefined
        ? Array.isArray(defaultIndex)
          ? defaultIndex
          : [defaultIndex]
        : []
    );

    const toggleItem = (itemIndex: number) => {
      setExpandedItems((prev) => {
        if (allowMultiple) {
          return prev.includes(itemIndex)
            ? prev.filter((i) => i !== itemIndex)
            : [...prev, itemIndex];
        }
        return prev.includes(itemIndex) && allowToggle ? [] : [itemIndex];
      });
    };

    return (
      <AccordionContext.Provider value={{ expandedItems, toggleItem }}>
        <div ref={ref} className={className} {...props}>
          {React.Children.map(children, (child, index) =>
            React.isValidElement(child)
              ? React.cloneElement(child, { ...child.props, _index: index } as any)
              : child
          )}
        </div>
      </AccordionContext.Provider>
    );
  }
);

Accordion.displayName = 'Accordion';

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps & { _index?: number }>(
  ({ children, isDisabled, _index, className, ...props }, ref) => {
    const context = useContext(AccordionContext);
    const isExpanded = context?.expandedItems.includes(_index);

    return (
      <div ref={ref} className={clsx('border-b border-gray-200', className)} {...props}>
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { ...child.props, _index, _isExpanded: isExpanded, _isDisabled: isDisabled } as any)
            : child
        )}
      </div>
    );
  }
);

AccordionItem.displayName = 'AccordionItem';

export const AccordionButton = forwardRef<HTMLButtonElement, BaseProps & ChildrenProps & { _index?: number; _isExpanded?: boolean; _isDisabled?: boolean }>(
  ({ children, _index, _isExpanded, _isDisabled, className, ...props }, ref) => {
    const context = useContext(AccordionContext);

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => context?.toggleItem(_index)}
        disabled={_isDisabled}
        className={clsx(
          'w-full flex items-center justify-between px-4 py-3 text-left font-medium hover:bg-gray-50 transition-colors',
          _isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className={clsx('transform transition-transform', _isExpanded && 'rotate-180')}
          fill="currentColor"
        >
          <path d="M4 6l4 4 4-4z" />
        </svg>
      </button>
    );
  }
);

AccordionButton.displayName = 'AccordionButton';

export const AccordionPanel = forwardRef<HTMLDivElement, BaseProps & ChildrenProps & { _isExpanded?: boolean }>(
  ({ children, _isExpanded, className, ...props }, ref) => {
    if (!_isExpanded) return null;

    return (
      <div ref={ref} className={clsx('px-4 py-3', className)} {...props}>
        {children}
      </div>
    );
  }
);

AccordionPanel.displayName = 'AccordionPanel';
