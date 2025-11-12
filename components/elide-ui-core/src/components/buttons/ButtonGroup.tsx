import React, { forwardRef } from 'react';
import { ButtonGroupProps } from '../../types/components';
import { clsx } from 'clsx';

/**
 * ButtonGroup component - Groups buttons together
 *
 * @example
 * ```tsx
 * <ButtonGroup isAttached>
 *   <Button>One</Button>
 *   <Button>Two</Button>
 *   <Button>Three</Button>
 * </ButtonGroup>
 * ```
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      children,
      variant,
      size,
      colorScheme,
      isAttached = false,
      spacing = '0.5rem',
      className,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex';
    const attachedClasses = isAttached
      ? '[&>*:not(:first-child)]:ml-0 [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none [&>*:not(:first-child)]:border-l-0'
      : '';

    return (
      <div
        ref={ref}
        role="group"
        className={clsx(baseClasses, attachedClasses, className)}
        style={{ gap: isAttached ? 0 : spacing }}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              ...(variant && { variant }),
              ...(size && { size }),
              ...(colorScheme && { colorScheme }),
              ...child.props
            } as any);
          }
          return child;
        })}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';
