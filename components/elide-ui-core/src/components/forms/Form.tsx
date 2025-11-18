import React, { forwardRef } from 'react';
import { FormProps, FormControlProps, FormLabelProps, FormHelperTextProps, FormErrorMessageProps } from '../../types/components';
import { clsx } from 'clsx';

export const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ onSubmit, children, className, ...props }, ref) => (
    <form ref={ref} onSubmit={onSubmit} className={className} {...props}>
      {children}
    </form>
  )
);

Form.displayName = 'Form';

export const FormControl = forwardRef<HTMLDivElement, FormControlProps>(
  ({ isInvalid, isRequired, isDisabled, isReadOnly, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('mb-4', isDisabled && 'opacity-50', className)}
      {...props}
    >
      {children}
    </div>
  )
);

FormControl.displayName = 'FormControl';

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ htmlFor, isRequired, children, className, ...props }, ref) => (
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={clsx('block text-sm font-medium text-gray-700 mb-1', className)}
      {...props}
    >
      {children}
      {isRequired && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
);

FormLabel.displayName = 'FormLabel';

export const FormHelperText = forwardRef<HTMLDivElement, FormHelperTextProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={clsx('text-sm text-gray-600 mt-1', className)} {...props}>
      {children}
    </div>
  )
);

FormHelperText.displayName = 'FormHelperText';

export const FormErrorMessage = forwardRef<HTMLDivElement, FormErrorMessageProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} role="alert" className={clsx('text-sm text-red-600 mt-1', className)} {...props}>
      {children}
    </div>
  )
);

FormErrorMessage.displayName = 'FormErrorMessage';

export const FieldSet = forwardRef<HTMLFieldSetElement, { legend?: string; children?: React.ReactNode; className?: string }>(
  ({ legend, children, className, ...props }, ref) => (
    <fieldset ref={ref} className={clsx('border border-gray-300 rounded-md p-4', className)} {...props}>
      {legend && <legend className="px-2 text-sm font-medium">{legend}</legend>}
      {children}
    </fieldset>
  )
);

FieldSet.displayName = 'FieldSet';
