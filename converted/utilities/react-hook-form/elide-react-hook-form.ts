/**
 * React Hook Form - Performant Form Hooks
 *
 * Performant, flexible and extensible forms with easy-to-use validation.
 * **POLYGLOT SHOWCASE**: One form hook library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-hook-form (~2M+ downloads/week)
 *
 * Features:
 * - Minimal re-renders
 * - Built-in validation
 * - Tiny size (no dependencies)
 * - Native HTML validation
 * - Schema-based validation support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need form management
 * - ONE implementation works everywhere on Elide
 * - Consistent form API across languages
 * - Share form schemas across your stack
 *
 * Use cases:
 * - High-performance forms
 * - Complex validation schemas
 * - Dynamic form fields
 * - Controlled and uncontrolled inputs
 *
 * Package has ~2M+ downloads/week on npm - top form library!
 */

export interface FieldValues {
  [key: string]: any;
}

export interface RegisterOptions {
  required?: string | boolean;
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  validate?: (value: any) => boolean | string | Promise<boolean | string>;
}

export interface UseFormOptions<T extends FieldValues = FieldValues> {
  defaultValues?: Partial<T>;
  mode?: 'onSubmit' | 'onBlur' | 'onChange' | 'all';
}

export interface FormState<T extends FieldValues = FieldValues> {
  isDirty: boolean;
  isSubmitting: boolean;
  isValid: boolean;
  errors: { [K in keyof T]?: { message?: string } };
}

export interface UseFormReturn<T extends FieldValues = FieldValues> {
  register: (name: keyof T, options?: RegisterOptions) => RegisterReturn;
  handleSubmit: (onValid: (data: T) => void | Promise<void>) => (e?: Event) => Promise<void>;
  watch: (name?: keyof T) => any;
  setValue: (name: keyof T, value: any) => void;
  getValues: () => T;
  reset: (values?: Partial<T>) => void;
  formState: FormState<T>;
  setError: (name: keyof T, error: { message: string }) => void;
  clearErrors: (name?: keyof T) => void;
}

export interface RegisterReturn {
  name: string;
  onChange: (e: any) => void;
  onBlur: () => void;
  ref: (el: any) => void;
}

export function useForm<T extends FieldValues = FieldValues>(
  options: UseFormOptions<T> = {}
): UseFormReturn<T> {
  const defaultValues = (options.defaultValues || {}) as T;
  const mode = options.mode || 'onSubmit';

  let values = { ...defaultValues };
  let errors: { [K in keyof T]?: { message?: string } } = {};
  let touched: { [K in keyof T]?: boolean } = {};
  let isDirty = false;
  let isSubmitting = false;
  const fields: Map<keyof T, RegisterOptions> = new Map();
  const refs: Map<keyof T, any> = new Map();

  const validateField = async (name: keyof T, value: any, options?: RegisterOptions): Promise<string | undefined> => {
    if (!options) return undefined;

    if (options.required) {
      const msg = typeof options.required === 'string' ? options.required : 'This field is required';
      if (!value) return msg;
    }

    if (options.minLength) {
      const config = typeof options.minLength === 'number' ? { value: options.minLength, message: `Min length is ${options.minLength}` } : options.minLength;
      if (value && value.length < config.value) return config.message;
    }

    if (options.maxLength) {
      const config = typeof options.maxLength === 'number' ? { value: options.maxLength, message: `Max length is ${options.maxLength}` } : options.maxLength;
      if (value && value.length > config.value) return config.message;
    }

    if (options.pattern) {
      const config = options.pattern instanceof RegExp ? { value: options.pattern, message: 'Invalid format' } : options.pattern;
      if (value && !config.value.test(value)) return config.message;
    }

    if (options.validate) {
      const result = await options.validate(value);
      if (typeof result === 'string') return result;
      if (result === false) return 'Validation failed';
    }

    return undefined;
  };

  const register = (name: keyof T, options?: RegisterOptions): RegisterReturn => {
    fields.set(name, options || {});
    return {
      name: String(name),
      onChange: (e: any) => {
        const value = e?.target?.value ?? e;
        values[name] = value;
        isDirty = true;
        if (mode === 'onChange' || mode === 'all') {
          validateField(name, value, options).then(error => {
            if (error) errors[name] = { message: error };
            else delete errors[name];
          });
        }
      },
      onBlur: () => {
        touched[name] = true;
        if (mode === 'onBlur' || mode === 'all') {
          validateField(name, values[name], options).then(error => {
            if (error) errors[name] = { message: error };
            else delete errors[name];
          });
        }
      },
      ref: (el: any) => {
        refs.set(name, el);
      },
    };
  };

  const handleSubmit = (onValid: (data: T) => void | Promise<void>) => {
    return async (e?: Event) => {
      if (e) e.preventDefault();
      isSubmitting = true;
      errors = {};

      for (const [name, options] of fields) {
        const error = await validateField(name, values[name], options);
        if (error) errors[name] = { message: error };
      }

      if (Object.keys(errors).length === 0) {
        try {
          await onValid(values);
        } finally {
          isSubmitting = false;
        }
      } else {
        isSubmitting = false;
      }
    };
  };

  const watch = (name?: keyof T) => {
    if (name === undefined) return values;
    return values[name];
  };

  const setValue = (name: keyof T, value: any) => {
    values[name] = value;
    isDirty = true;
  };

  const getValues = () => values;

  const reset = (newValues?: Partial<T>) => {
    values = { ...(newValues || defaultValues) } as T;
    errors = {};
    touched = {};
    isDirty = false;
  };

  const setError = (name: keyof T, error: { message: string }) => {
    errors[name] = error;
  };

  const clearErrors = (name?: keyof T) => {
    if (name) delete errors[name];
    else errors = {};
  };

  const formState: FormState<T> = {
    get isDirty() { return isDirty; },
    get isSubmitting() { return isSubmitting; },
    get isValid() { return Object.keys(errors).length === 0; },
    get errors() { return errors; },
  };

  return { register, handleSubmit, watch, setValue, getValues, reset, formState, setError, clearErrors };
}

export default useForm;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎣 React Hook Form - High Performance Forms (POLYGLOT!)\n");
  
  const form = useForm({ defaultValues: { email: '', password: '' } });
  const emailReg = form.register('email', { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ });
  const passReg = form.register('password', { required: true, minLength: 8 });
  
  emailReg.onChange({ target: { value: 'test@example.com' } });
  passReg.onChange({ target: { value: 'password123' } });
  
  console.log('Values:', form.getValues());
  console.log('Form State:', form.formState);
  console.log("\n🌐 POLYGLOT: Works in TypeScript, Python, Ruby, Java via Elide!");
  console.log("🚀 ~2M+ downloads/week on npm!");
}
