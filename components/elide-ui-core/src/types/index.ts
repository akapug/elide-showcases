import { ReactNode, CSSProperties } from 'react';

// Base types for all components
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'ghost' | 'link';
export type ColorScheme = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'pink' | 'gray' | 'cyan' | 'orange' | 'teal';

// Theme types
export interface Theme {
  colors: {
    primary: ColorPalette;
    secondary: ColorPalette;
    success: ColorPalette;
    warning: ColorPalette;
    danger: ColorPalette;
    info: ColorPalette;
    gray: ColorPalette;
  };
  spacing: SpacingScale;
  typography: Typography;
  breakpoints: Breakpoints;
  shadows: Shadows;
  radii: Radii;
  transitions: Transitions;
}

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface SpacingScale {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  56: string;
  64: string;
}

export interface Typography {
  fonts: {
    body: string;
    heading: string;
    mono: string;
  };
  fontSizes: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  fontWeights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface Breakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface Shadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

export interface Radii {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
}

export interface Transitions {
  fast: string;
  normal: string;
  slow: string;
}

// Common component props
export interface BaseProps {
  className?: string;
  style?: CSSProperties;
  id?: string;
  'data-testid'?: string;
}

export interface InteractiveProps {
  disabled?: boolean;
  loading?: boolean;
  readOnly?: boolean;
}

export interface ChildrenProps {
  children?: ReactNode;
}

export interface AsProps {
  as?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
}

// Accessibility props
export interface AriaProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-disabled'?: boolean;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-selected'?: boolean;
  role?: string;
}

// Position types
export type Position = 'top' | 'bottom' | 'left' | 'right';
export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

// Alignment types
export type Align = 'start' | 'center' | 'end' | 'stretch';
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

// Responsive types
export type Responsive<T> = T | { sm?: T; md?: T; lg?: T; xl?: T; '2xl'?: T };

// Animation types
export type AnimationVariant = 'fade' | 'scale' | 'slide' | 'bounce' | 'rotate';
export type AnimationDuration = 'fast' | 'normal' | 'slow';

// Form types
export interface FormControlProps {
  id?: string;
  name?: string;
  value?: any;
  defaultValue?: any;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
}

export interface FormFieldProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  isRequired?: boolean;
  isInvalid?: boolean;
}

// Export all types
export * from './components';
