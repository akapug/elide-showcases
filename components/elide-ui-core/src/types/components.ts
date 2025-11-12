import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { BaseProps, InteractiveProps, ChildrenProps, Size, Variant, ColorScheme, Placement, AriaProps } from './index';

// Button types
export interface ButtonProps extends BaseProps, InteractiveProps, ChildrenProps, ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  colorScheme?: ColorScheme;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isActive?: boolean;
  loadingText?: string;
}

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: ReactNode;
  'aria-label': string;
}

export interface ButtonGroupProps extends BaseProps, ChildrenProps {
  variant?: Variant;
  size?: Size;
  colorScheme?: ColorScheme;
  isAttached?: boolean;
  spacing?: string;
}

// Input types
export interface InputProps extends BaseProps, InteractiveProps, InputHTMLAttributes<HTMLInputElement> {
  size?: Size;
  variant?: 'outline' | 'filled' | 'flushed' | 'unstyled';
  isInvalid?: boolean;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

export interface TextareaProps extends BaseProps, InteractiveProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: Size;
  variant?: 'outline' | 'filled' | 'flushed' | 'unstyled';
  isInvalid?: boolean;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

export interface SelectProps extends BaseProps, InteractiveProps, SelectHTMLAttributes<HTMLSelectElement> {
  size?: Size;
  variant?: 'outline' | 'filled' | 'flushed' | 'unstyled';
  isInvalid?: boolean;
  icon?: ReactNode;
}

export interface CheckboxProps extends BaseProps, InteractiveProps {
  isChecked?: boolean;
  isIndeterminate?: boolean;
  isInvalid?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  value?: string;
  name?: string;
  children?: ReactNode;
  size?: Size;
  colorScheme?: ColorScheme;
}

export interface RadioProps extends Omit<CheckboxProps, 'isIndeterminate'> {}

export interface SwitchProps extends BaseProps, InteractiveProps {
  isChecked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: Size;
  colorScheme?: ColorScheme;
  children?: ReactNode;
}

// Layout types
export interface BoxProps extends BaseProps, ChildrenProps {
  as?: keyof JSX.IntrinsicElements;
}

export interface FlexProps extends BoxProps {
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: string | number;
}

export interface GridProps extends BoxProps {
  templateColumns?: string;
  templateRows?: string;
  gap?: string | number;
  columnGap?: string | number;
  rowGap?: string | number;
  autoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense';
  autoColumns?: string;
  autoRows?: string;
}

export interface StackProps extends FlexProps {
  spacing?: string | number;
  divider?: ReactNode;
}

export interface ContainerProps extends BoxProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centerContent?: boolean;
}

// Overlay types
export interface ModalProps extends BaseProps, ChildrenProps {
  isOpen: boolean;
  onClose: () => void;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  isCentered?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  blockScrollOnMount?: boolean;
  preserveScrollBarGap?: boolean;
  returnFocusOnClose?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
  finalFocusRef?: React.RefObject<HTMLElement>;
}

export interface DrawerProps extends Omit<ModalProps, 'isCentered'> {
  placement?: 'left' | 'right' | 'top' | 'bottom';
}

export interface PopoverProps extends BaseProps, ChildrenProps {
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  trigger?: 'click' | 'hover' | 'focus';
  placement?: Placement;
  closeOnBlur?: boolean;
  closeOnEsc?: boolean;
  returnFocusOnClose?: boolean;
}

export interface TooltipProps extends BaseProps, ChildrenProps {
  label: ReactNode;
  placement?: Placement;
  hasArrow?: boolean;
  openDelay?: number;
  closeDelay?: number;
  closeOnClick?: boolean;
  isDisabled?: boolean;
}

// Data display types
export interface TableProps extends BaseProps, ChildrenProps {
  variant?: 'simple' | 'striped' | 'unstyled';
  size?: Size;
  colorScheme?: ColorScheme;
}

export interface AvatarProps extends BaseProps {
  src?: string;
  name?: string;
  size?: Size | string;
  showBorder?: boolean;
  borderColor?: string;
  icon?: ReactNode;
  loading?: 'eager' | 'lazy';
}

export interface BadgeProps extends BaseProps, ChildrenProps {
  variant?: 'solid' | 'subtle' | 'outline';
  colorScheme?: ColorScheme;
  size?: Size;
}

export interface TagProps extends BadgeProps {
  onClose?: () => void;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export interface CardProps extends BoxProps {
  variant?: 'elevated' | 'outline' | 'filled' | 'unstyled';
  size?: Size;
}

// Feedback types
export interface AlertProps extends BaseProps, ChildrenProps {
  status?: 'info' | 'warning' | 'success' | 'error';
  variant?: 'subtle' | 'solid' | 'left-accent' | 'top-accent';
  onClose?: () => void;
}

export interface ToastProps extends AlertProps {
  title?: string;
  description?: string;
  duration?: number;
  isClosable?: boolean;
  position?: 'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right';
}

export interface ProgressProps extends BaseProps {
  value?: number;
  max?: number;
  min?: number;
  isIndeterminate?: boolean;
  colorScheme?: ColorScheme;
  size?: Size;
  hasStripe?: boolean;
  isAnimated?: boolean;
}

export interface SpinnerProps extends BaseProps {
  size?: Size | string;
  thickness?: string;
  speed?: string;
  emptyColor?: string;
  color?: string;
  label?: string;
}

export interface SkeletonProps extends BaseProps {
  isLoaded?: boolean;
  fadeDuration?: number;
  speed?: number;
  startColor?: string;
  endColor?: string;
  children?: ReactNode;
}

// Navigation types
export interface MenuProps extends BaseProps, ChildrenProps {
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  autoSelect?: boolean;
  closeOnBlur?: boolean;
  closeOnSelect?: boolean;
  placement?: Placement;
}

export interface MenuItemProps extends BaseProps, ChildrenProps {
  isDisabled?: boolean;
  icon?: ReactNode;
  command?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps extends BaseProps, ChildrenProps {
  separator?: ReactNode;
  spacing?: string | number;
}

export interface PaginationProps extends BaseProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  size?: Size;
}

export interface StepperProps extends BaseProps, ChildrenProps {
  activeStep: number;
  orientation?: 'horizontal' | 'vertical';
  colorScheme?: ColorScheme;
  size?: Size;
}

// Form types
export interface FormProps extends BaseProps, ChildrenProps {
  onSubmit?: (e: React.FormEvent) => void;
}

export interface FormControlProps extends BaseProps, ChildrenProps {
  isInvalid?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
}

export interface FormLabelProps extends BaseProps, ChildrenProps {
  htmlFor?: string;
  isRequired?: boolean;
}

export interface FormHelperTextProps extends BaseProps, ChildrenProps {}

export interface FormErrorMessageProps extends BaseProps, ChildrenProps {}

// Tabs types
export interface TabsProps extends BaseProps, ChildrenProps {
  index?: number;
  defaultIndex?: number;
  onChange?: (index: number) => void;
  variant?: 'line' | 'enclosed' | 'soft-rounded' | 'solid-rounded' | 'unstyled';
  colorScheme?: ColorScheme;
  size?: Size;
  orientation?: 'horizontal' | 'vertical';
  isFitted?: boolean;
  isLazy?: boolean;
}

export interface TabProps extends BaseProps, ChildrenProps {
  isDisabled?: boolean;
}

// Accordion types
export interface AccordionProps extends BaseProps, ChildrenProps {
  allowMultiple?: boolean;
  allowToggle?: boolean;
  defaultIndex?: number | number[];
  index?: number | number[];
  onChange?: (index: number | number[]) => void;
}

export interface AccordionItemProps extends BaseProps, ChildrenProps {
  isDisabled?: boolean;
}

// Dropdown types
export interface DropdownProps extends BaseProps, ChildrenProps {
  trigger: ReactNode;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  placement?: Placement;
  closeOnSelect?: boolean;
}

export interface DropdownItemProps extends BaseProps, ChildrenProps {
  onClick?: () => void;
  isDisabled?: boolean;
  icon?: ReactNode;
}

// Slider types
export interface SliderProps extends BaseProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  isDisabled?: boolean;
  colorScheme?: ColorScheme;
  size?: Size;
  orientation?: 'horizontal' | 'vertical';
}

// Other component types
export interface DividerProps extends BaseProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed';
  thickness?: string;
}

export interface ImageProps extends BaseProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  loading?: 'eager' | 'lazy';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  htmlWidth?: string | number;
  htmlHeight?: string | number;
}

export interface CodeProps extends BaseProps, ChildrenProps {
  colorScheme?: ColorScheme;
  variant?: 'solid' | 'subtle' | 'outline';
}

export interface KbdProps extends BaseProps, ChildrenProps {}

export interface ListProps extends BaseProps, ChildrenProps {
  spacing?: string | number;
  styleType?: string;
  stylePosition?: 'inside' | 'outside';
}

export interface IconProps extends BaseProps {
  as?: React.ComponentType;
  viewBox?: string;
  boxSize?: string | number;
  color?: string;
}
