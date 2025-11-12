import React, { forwardRef, useState, createContext, useContext } from 'react';
import { TabsProps, TabProps, BaseProps, ChildrenProps } from '../../types/components';
import { clsx } from 'clsx';

const TabsContext = createContext<{ index: number; onChange: (index: number) => void } | null>(null);

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      index: controlledIndex,
      defaultIndex = 0,
      onChange,
      variant = 'line',
      colorScheme = 'blue',
      size = 'md',
      orientation = 'horizontal',
      isFitted = false,
      isLazy = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [internalIndex, setInternalIndex] = useState(defaultIndex);
    const index = controlledIndex !== undefined ? controlledIndex : internalIndex;

    const handleChange = (newIndex: number) => {
      setInternalIndex(newIndex);
      onChange?.(newIndex);
    };

    return (
      <TabsContext.Provider value={{ index, onChange: handleChange }}>
        <div
          ref={ref}
          className={clsx(orientation === 'vertical' ? 'flex' : '', className)}
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = 'Tabs';

export const TabList = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="tablist"
        className={clsx('flex border-b border-gray-200', className)}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { ...child.props, _index: index } as any);
          }
          return child;
        })}
      </div>
    );
  }
);

TabList.displayName = 'TabList';

export const Tab = forwardRef<HTMLButtonElement, TabProps & { _index?: number }>(
  ({ children, isDisabled, _index, className, ...props }, ref) => {
    const context = useContext(TabsContext);
    const isSelected = context?.index === _index;

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isSelected}
        disabled={isDisabled}
        onClick={() => context?.onChange(_index!)}
        className={clsx(
          'px-4 py-2 font-medium transition-colors',
          isSelected
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-600 hover:text-gray-800',
          isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Tab.displayName = 'Tab';

export const TabPanels = forwardRef<HTMLDivElement, BaseProps & ChildrenProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
);

TabPanels.displayName = 'TabPanels';

export const TabPanel = forwardRef<HTMLDivElement, BaseProps & ChildrenProps & { _index?: number }>(
  ({ children, _index, className, ...props }, ref) => {
    const context = useContext(TabsContext);
    const isSelected = context?.index === _index;

    if (!isSelected) return null;

    return (
      <div ref={ref} role="tabpanel" className={clsx('pt-4', className)} {...props}>
        {children}
      </div>
    );
  }
);

TabPanel.displayName = 'TabPanel';
