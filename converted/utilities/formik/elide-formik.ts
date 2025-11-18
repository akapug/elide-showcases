/**
 * Formik - Form Library for React
 *
 * Build forms in React without tears.
 * **POLYGLOT SHOWCASE**: One form library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/formik (~1M+ downloads/week)
 *
 * Features:
 * - Form state management
 * - Validation (sync and async)
 * - Error handling
 * - Field-level and form-level validation
 * - Touched/dirty tracking
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need forms
 * - ONE implementation works everywhere on Elide
 * - Consistent form handling across languages
 * - Share validation logic across your stack
 *
 * Use cases:
 * - User registration forms
 * - Contact forms
 * - Multi-step wizards
 * - Dynamic form fields
 *
 * Package has ~1M+ downloads/week on npm - essential form utility!
 */

export interface FormikValues {
  [key: string]: any;
}

export interface FormikErrors<Values = FormikValues> {
  [K in keyof Values]?: Values[K] extends object ? FormikErrors<Values[K]> : string;
}

export interface FormikTouched<Values = FormikValues> {
  [K in keyof Values]?: Values[K] extends object ? FormikTouched<Values[K]> : boolean;
}

export interface FormikState<Values = FormikValues> {
  values: Values;
  errors: FormikErrors<Values>;
  touched: FormikTouched<Values>;
  isSubmitting: boolean;
  isValidating: boolean;
  submitCount: number;
}

export type FormikValidation<Values = FormikValues> = (
  values: Values
) => FormikErrors<Values> | Promise<FormikErrors<Values>>;

export interface FormikConfig<Values = FormikValues> {
  initialValues: Values;
  validate?: FormikValidation<Values>;
  onSubmit: (values: Values, helpers: FormikHelpers<Values>) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface FormikHelpers<Values = FormikValues> {
  setFieldValue: (field: keyof Values, value: any) => void;
  setFieldError: (field: keyof Values, error: string) => void;
  setFieldTouched: (field: keyof Values, touched: boolean) => void;
  setErrors: (errors: FormikErrors<Values>) => void;
  setTouched: (touched: FormikTouched<Values>) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  resetForm: () => void;
  validateForm: () => Promise<FormikErrors<Values>>;
  validateField: (field: keyof Values) => Promise<void>;
}

export class Formik<Values = FormikValues> {
  private state: FormikState<Values>;
  private config: FormikConfig<Values>;
  private listeners: Array<(state: FormikState<Values>) => void> = [];

  constructor(config: FormikConfig<Values>) {
    this.config = config;
    this.state = {
      values: { ...config.initialValues },
      errors: {},
      touched: {},
      isSubmitting: false,
      isValidating: false,
      submitCount: 0,
    };
  }

  subscribe(listener: (state: FormikState<Values>) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  private setState(updates: Partial<FormikState<Values>>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  getState(): FormikState<Values> { return this.state; }

  getHelpers(): FormikHelpers<Values> {
    return {
      setFieldValue: this.setFieldValue.bind(this),
      setFieldError: this.setFieldError.bind(this),
      setFieldTouched: this.setFieldTouched.bind(this),
      setErrors: this.setErrors.bind(this),
      setTouched: this.setTouched.bind(this),
      setSubmitting: this.setSubmitting.bind(this),
      resetForm: this.resetForm.bind(this),
      validateForm: this.validateForm.bind(this),
      validateField: this.validateField.bind(this),
    };
  }

  setFieldValue(field: keyof Values, value: any): void {
    const values = { ...this.state.values, [field]: value };
    this.setState({ values });
    if (this.config.validateOnChange) this.validateForm();
  }

  setFieldError(field: keyof Values, error: string): void {
    const errors = { ...this.state.errors, [field]: error };
    this.setState({ errors });
  }

  setFieldTouched(field: keyof Values, touched: boolean = true): void {
    const touchedState = { ...this.state.touched, [field]: touched };
    this.setState({ touched: touchedState });
    if (this.config.validateOnBlur && touched) this.validateField(field);
  }

  setErrors(errors: FormikErrors<Values>): void {
    this.setState({ errors });
  }

  setTouched(touched: FormikTouched<Values>): void {
    this.setState({ touched });
  }

  setSubmitting(isSubmitting: boolean): void {
    this.setState({ isSubmitting });
  }

  resetForm(): void {
    this.setState({
      values: { ...this.config.initialValues },
      errors: {},
      touched: {},
      isSubmitting: false,
      isValidating: false,
      submitCount: 0,
    });
  }

  async validateForm(): Promise<FormikErrors<Values>> {
    if (!this.config.validate) return {};
    this.setState({ isValidating: true });
    try {
      const errors = await this.config.validate(this.state.values);
      this.setState({ errors, isValidating: false });
      return errors;
    } catch (err) {
      this.setState({ isValidating: false });
      throw err;
    }
  }

  async validateField(field: keyof Values): Promise<void> {
    const errors = await this.validateForm();
    const fieldError = errors[field];
    if (fieldError) this.setFieldError(field, fieldError as string);
  }

  async handleSubmit(e?: Event): Promise<void> {
    if (e) e.preventDefault();
    this.setState({ isSubmitting: true, submitCount: this.state.submitCount + 1 });
    const errors = await this.validateForm();
    if (Object.keys(errors).length > 0) {
      this.setState({ isSubmitting: false });
      return;
    }
    try {
      await this.config.onSubmit(this.state.values, this.getHelpers());
      this.setState({ isSubmitting: false });
    } catch (err) {
      this.setState({ isSubmitting: false });
      throw err;
    }
  }

  handleChange(field: keyof Values) {
    return (e: any) => {
      const value = e?.target?.value ?? e;
      this.setFieldValue(field, value);
    };
  }

  handleBlur(field: keyof Values) {
    return () => this.setFieldTouched(field, true);
  }
}

export function createFormik<Values = FormikValues>(config: FormikConfig<Values>): Formik<Values> {
  return new Formik(config);
}

export const validators = {
  required: (message = 'Required') => (value: any) => !value ? message : undefined,
  email: (message = 'Invalid email') => (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return value && !regex.test(value) ? message : undefined;
  },
  minLength: (min: number, message?: string) => (value: string) => {
    const msg = message || `Must be at least ${min} characters`;
    return value && value.length < min ? msg : undefined;
  },
  maxLength: (max: number, message?: string) => (value: string) => {
    const msg = message || `Must be no more than ${max} characters`;
    return value && value.length > max ? msg : undefined;
  },
  pattern: (regex: RegExp, message = 'Invalid format') => (value: string) =>
    value && !regex.test(value) ? message : undefined,
  compose: (...validators: Array<(value: any) => string | undefined>) => (value: any) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  },
};

export default createFormik;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📝 Formik - Form Management for Elide (POLYGLOT!)\n");
  const form = createFormik({
    initialValues: { email: '', password: '' },
    validate: (values) => {
      const errors: any = {};
      if (!values.email) errors.email = 'Required';
      if (!values.password || values.password.length < 8) errors.password = 'Min 8 chars';
      return errors;
    },
    onSubmit: async (values) => console.log('Submitted:', values),
  });
  form.setFieldValue('email', 'test@example.com');
  form.setFieldValue('password', 'password123');
  console.log('State:', form.getState());
  console.log("\n🌐 POLYGLOT: Works in TypeScript, Python, Ruby, Java via Elide!");
  console.log("🚀 ~1M+ downloads/week on npm!");
}
