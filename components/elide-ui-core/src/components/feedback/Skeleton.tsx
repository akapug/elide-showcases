import React, { forwardRef } from 'react';
import { SkeletonProps } from '../../types/components';
import { clsx } from 'clsx';

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      isLoaded = false,
      fadeDuration = 0.4,
      speed = 0.8,
      startColor = '#e2e8f0',
      endColor = '#cbd5e0',
      children,
      className,
      ...props
    },
    ref
  ) => {
    if (isLoaded) {
      return <>{children}</>;
    }

    return (
      <div
        ref={ref}
        className={clsx('animate-pulse bg-gray-200 rounded', className)}
        style={{
          animationDuration: `${speed}s`,
          background: `linear-gradient(90deg, ${startColor} 0%, ${endColor} 50%, ${startColor} 100%)`
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

export const SkeletonText = forwardRef<HTMLDivElement, { noOfLines?: number; spacing?: string; className?: string }>(
  ({ noOfLines = 3, spacing = '0.5rem', className }, ref) => (
    <div ref={ref} className={clsx('space-y-2', className)} style={{ gap: spacing }}>
      {Array.from({ length: noOfLines }).map((_, i) => (
        <Skeleton key={i} className={clsx('h-4', i === noOfLines - 1 && 'w-4/5')} />
      ))}
    </div>
  )
);

SkeletonText.displayName = 'SkeletonText';

export const SkeletonCircle = forwardRef<HTMLDivElement, { size?: string; className?: string }>(
  ({ size = '48px', className }, ref) => (
    <Skeleton ref={ref} className={clsx('rounded-full', className)} style={{ width: size, height: size }} />
  )
);

SkeletonCircle.displayName = 'SkeletonCircle';
