import React, { forwardRef } from 'react';
import { StepperProps, BaseProps, ChildrenProps } from '../../types/components';
import { clsx } from 'clsx';

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(
  ({ activeStep, orientation = 'horizontal', colorScheme = 'blue', size = 'md', children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'flex',
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child, index) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { ...child.props, _index: index, _activeStep: activeStep } as any)
          : child
      )}
    </div>
  )
);

Stepper.displayName = 'Stepper';

export const Step = forwardRef<HTMLDivElement, BaseProps & ChildrenProps & { _index?: number; _activeStep?: number }>(
  ({ children, _index = 0, _activeStep = 0, className, ...props }, ref) => {
    const isActive = _index === _activeStep;
    const isCompleted = _index < _activeStep;

    return (
      <div ref={ref} className={clsx('flex items-center', className)} {...props}>
        <div className={clsx(
          'flex items-center justify-center w-8 h-8 rounded-full border-2',
          isCompleted ? 'bg-blue-600 border-blue-600 text-white' : isActive ? 'border-blue-600 text-blue-600' : 'border-gray-300 text-gray-400'
        )}>
          {isCompleted ? '✓' : _index + 1}
        </div>
        {children}
      </div>
    );
  }
);

Step.displayName = 'Step';
