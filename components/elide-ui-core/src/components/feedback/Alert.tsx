import React, { forwardRef } from 'react';
import { AlertProps } from '../../types/components';
import { clsx } from 'clsx';

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ status = 'info', variant = 'subtle', onClose, children, className, ...props }, ref) => {
    const statusColors = {
      info: { subtle: 'bg-blue-50 text-blue-900 border-blue-200', solid: 'bg-blue-600 text-white' },
      warning: { subtle: 'bg-yellow-50 text-yellow-900 border-yellow-200', solid: 'bg-yellow-600 text-white' },
      success: { subtle: 'bg-green-50 text-green-900 border-green-200', solid: 'bg-green-600 text-white' },
      error: { subtle: 'bg-red-50 text-red-900 border-red-200', solid: 'bg-red-600 text-white' }
    };

    const variantClasses = {
      subtle: statusColors[status].subtle,
      solid: statusColors[status].solid,
      'left-accent': `${statusColors[status].subtle} border-l-4`,
      'top-accent': `${statusColors[status].subtle} border-t-4`
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={clsx(
          'p-4 rounded-md flex items-start justify-between',
          variant !== 'solid' && 'border',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 hover:opacity-70 transition-opacity"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.5 3.5l-9 9m0-9l9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export const AlertIcon = forwardRef<SVGSVGElement, { status?: 'info' | 'warning' | 'success' | 'error' }>(
  ({ status = 'info' }, ref) => {
    const icons = {
      info: <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 10.25h-1.5v-1.5h1.5v1.5zm0-3h-1.5v-4.5h1.5v4.5z" />,
      warning: <path d="M8 1l7 12H1L8 1zm.75 9.25h-1.5v-1.5h1.5v1.5zm0-3h-1.5v-3h1.5v3z" />,
      success: <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.5 5.5l-4 4-2-2" />,
      error: <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 9.25h-1.5v-1.5h1.5v1.5zm0-3h-1.5v-4.5h1.5v4.5z" />
    };

    return (
      <svg ref={ref} width="20" height="20" viewBox="0 0 16 16" fill="currentColor" className="mr-3">
        {icons[status]}
      </svg>
    );
  }
);

AlertIcon.displayName = 'AlertIcon';

export const AlertTitle = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <div ref={ref} className={clsx('font-semibold mb-1', className)}>
      {children}
    </div>
  )
);

AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <div ref={ref} className={clsx('text-sm', className)}>
      {children}
    </div>
  )
);

AlertDescription.displayName = 'AlertDescription';
