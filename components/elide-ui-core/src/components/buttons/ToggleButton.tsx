import React, { forwardRef, useState } from 'react';
import { ButtonProps } from '../../types/components';
import { Button } from './Button';

export interface ToggleButtonProps extends Omit<ButtonProps, 'isActive'> {
  defaultPressed?: boolean;
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
}

/**
 * ToggleButton component - Button with toggle state
 */
export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  (
    {
      defaultPressed = false,
      pressed: controlledPressed,
      onPressedChange,
      onClick,
      ...props
    },
    ref
  ) => {
    const [internalPressed, setInternalPressed] = useState(defaultPressed);
    const isControlled = controlledPressed !== undefined;
    const pressed = isControlled ? controlledPressed : internalPressed;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const newPressed = !pressed;
      if (!isControlled) {
        setInternalPressed(newPressed);
      }
      onPressedChange?.(newPressed);
      onClick?.(e);
    };

    return (
      <Button
        ref={ref}
        isActive={pressed}
        aria-pressed={pressed}
        onClick={handleClick}
        {...props}
      />
    );
  }
);

ToggleButton.displayName = 'ToggleButton';
