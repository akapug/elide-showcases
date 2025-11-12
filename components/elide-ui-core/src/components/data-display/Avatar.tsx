import React, { forwardRef, useState } from 'react';
import { AvatarProps } from '../../types/components';
import { clsx } from 'clsx';

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      name,
      size = 'md',
      showBorder = false,
      borderColor = 'white',
      icon,
      loading = 'eager',
      className,
      ...props
    },
    ref
  ) => {
    const [imgError, setImgError] = useState(false);

    const sizeClasses = typeof size === 'string' ? {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-12 h-12 text-base',
      lg: 'w-16 h-16 text-lg',
      xl: 'w-24 h-24 text-2xl'
    }[size] : '';

    const getInitials = (name?: string) => {
      if (!name) return '?';
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'relative inline-flex items-center justify-center rounded-full bg-gray-300 text-gray-700 font-medium overflow-hidden',
          sizeClasses,
          showBorder && 'ring-2',
          className
        )}
        style={{ borderColor }}
        {...props}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={name}
            loading={loading}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : icon ? (
          icon
        ) : (
          getInitials(name)
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  spacing?: string;
  className?: string;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ children, max = 5, spacing = '-0.5rem', className }, ref) => {
    const childArray = React.Children.toArray(children);
    const displayChildren = max ? childArray.slice(0, max) : childArray;
    const excess = max && childArray.length > max ? childArray.length - max : 0;

    return (
      <div ref={ref} className={clsx('flex items-center', className)}>
        {displayChildren.map((child, index) => (
          <div key={index} style={{ marginLeft: index > 0 ? spacing : 0, zIndex: displayChildren.length - index }}>
            {child}
          </div>
        ))}
        {excess > 0 && (
          <div
            className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center font-medium text-sm"
            style={{ marginLeft: spacing, zIndex: 0 }}
          >
            +{excess}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';
