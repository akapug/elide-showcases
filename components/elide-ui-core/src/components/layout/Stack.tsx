import React, { forwardRef, Children, Fragment } from 'react';
import { StackProps } from '../../types/components';
import { Flex } from './Flex';

/**
 * Stack - Flexbox stack with spacing
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ spacing = '1rem', divider, children, direction = 'column', ...props }, ref) => {
    const childArray = Children.toArray(children);

    return (
      <Flex ref={ref} direction={direction} {...props}>
        {childArray.map((child, index) => (
          <Fragment key={index}>
            {child}
            {divider && index < childArray.length - 1 && (
              <div style={{ margin: `calc(${spacing} / 2) 0` }}>{divider}</div>
            )}
            {!divider && index < childArray.length - 1 && (
              <div style={direction === 'column' ? { height: spacing } : { width: spacing }} />
            )}
          </Fragment>
        ))}
      </Flex>
    );
  }
);

Stack.displayName = 'Stack';

export const VStack = forwardRef<HTMLDivElement, StackProps>((props, ref) => (
  <Stack ref={ref} direction="column" {...props} />
));
VStack.displayName = 'VStack';

export const HStack = forwardRef<HTMLDivElement, StackProps>((props, ref) => (
  <Stack ref={ref} direction="row" {...props} />
));
HStack.displayName = 'HStack';
