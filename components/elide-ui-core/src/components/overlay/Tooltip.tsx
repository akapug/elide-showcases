import React, { forwardRef, useState } from 'react';
import { TooltipProps } from '../../types/components';
import { clsx } from 'clsx';

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      label,
      placement = 'top',
      hasArrow = true,
      openDelay = 0,
      closeDelay = 0,
      closeOnClick = true,
      isDisabled = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);

    if (isDisabled) {
      return <>{children}</>;
    }

    const placementClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      'top-start': 'bottom-full left-0 mb-2',
      'top-end': 'bottom-full right-0 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      'bottom-start': 'top-full left-0 mt-2',
      'bottom-end': 'top-full right-0 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      'left-start': 'right-full top-0 mr-2',
      'left-end': 'right-full bottom-0 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
      'right-start': 'left-full top-0 ml-2',
      'right-end': 'left-full bottom-0 ml-2'
    };

    return (
      <div ref={ref} className="relative inline-block" {...props}>
        <div
          onMouseEnter={() => setTimeout(() => setIsOpen(true), openDelay)}
          onMouseLeave={() => setTimeout(() => setIsOpen(false), closeDelay)}
          onClick={() => closeOnClick && setIsOpen(false)}
        >
          {children}
        </div>
        {isOpen && (
          <div
            className={clsx(
              'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded shadow-lg whitespace-nowrap',
              placementClasses[placement],
              className
            )}
            role="tooltip"
          >
            {label}
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';
