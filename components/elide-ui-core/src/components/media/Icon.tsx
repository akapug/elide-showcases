import React, { forwardRef } from 'react';
import { IconProps } from '../../types/components';
import { clsx } from 'clsx';

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ as: IconComponent, viewBox = '0 0 24 24', boxSize = '1em', color = 'currentColor', className, ...props }, ref) => {
    if (IconComponent) {
      return <IconComponent ref={ref} className={className} style={{ width: boxSize, height: boxSize, color }} {...props} />;
    }

    return (
      <svg
        ref={ref}
        viewBox={viewBox}
        className={clsx('inline-block', className)}
        style={{ width: boxSize, height: boxSize }}
        fill={color}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';

export const createIcon = (options: { displayName: string; viewBox?: string; path: React.ReactNode }) => {
  const IconComponent = forwardRef<SVGSVGElement, Omit<IconProps, 'as'>>((props, ref) => (
    <Icon ref={ref} viewBox={options.viewBox} {...props}>
      {options.path}
    </Icon>
  ));

  IconComponent.displayName = options.displayName;
  return IconComponent;
};

// Common icons
export const CheckIcon = createIcon({
  displayName: 'CheckIcon',
  path: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
});

export const CloseIcon = createIcon({
  displayName: 'CloseIcon',
  path: <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
});

export const ChevronDownIcon = createIcon({
  displayName: 'ChevronDownIcon',
  path: <path d="M7 10l5 5 5-5z" />
});

export const SearchIcon = createIcon({
  displayName: 'SearchIcon',
  path: <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
});

export const WarningIcon = createIcon({
  displayName: 'WarningIcon',
  path: <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
});

export const InfoIcon = createIcon({
  displayName: 'InfoIcon',
  path: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
});
