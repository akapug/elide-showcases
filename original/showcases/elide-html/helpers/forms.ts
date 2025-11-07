/**
 * ElideHTML - Form Helpers
 *
 * Form handling, validation, and CSRF protection.
 */

import { html, HtmlNode } from '../runtime/renderer.ts';
import { hx } from './htmx-helpers.ts';

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface FieldDefinition {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  value?: any;
  required?: boolean;
  rules?: ValidationRule[];
  options?: { value: string; label: string }[];
}

export interface FormData {
  [key: string]: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data: FormData;
}

/**
 * Form validator
 */
export class FormValidator {
  private rules: Map<string, ValidationRule[]> = new Map();

  /**
   * Add validation rule
   */
  addRule(field: string, rule: ValidationRule): this {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(rule);
    return this;
  }

  /**
   * Validate form data
   */
  validate(data: FormData): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [field, rules] of this.rules.entries()) {
      const value = data[field];

      for (const rule of rules) {
        const error = this.validateRule(field, value, rule);
        if (error) {
          errors.push(error);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data,
    };
  }

  /**
   * Validate a single rule
   */
  private validateRule(
    field: string,
    value: any,
    rule: ValidationRule
  ): ValidationError | null {
    switch (rule.type) {
      case 'required':
        if (!value || value.toString().trim() === '') {
          return { field, message: rule.message };
        }
        break;

      case 'email':
        if (value && !this.isEmail(value)) {
          return { field, message: rule.message };
        }
        break;

      case 'min':
        if (value && value.length < rule.value) {
          return { field, message: rule.message };
        }
        break;

      case 'max':
        if (value && value.length > rule.value) {
          return { field, message: rule.message };
        }
        break;

      case 'pattern':
        if (value && !new RegExp(rule.value).test(value)) {
          return { field, message: rule.message };
        }
        break;

      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          return { field, message: rule.message };
        }
        break;
    }

    return null;
  }

  /**
   * Check if string is valid email
   */
  private isEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

/**
 * Form builder
 */
export class FormBuilder {
  private fields: FieldDefinition[] = [];
  private action = '';
  private method: 'get' | 'post' = 'post';
  private htmxEnabled = false;
  private htmxTarget?: string;
  private htmxSwap?: string;
  private validator: FormValidator = new FormValidator();
  private csrfToken?: string;

  /**
   * Set form action
   */
  setAction(action: string): this {
    this.action = action;
    return this;
  }

  /**
   * Set form method
   */
  setMethod(method: 'get' | 'post'): this {
    this.method = method;
    return this;
  }

  /**
   * Enable htmx
   */
  htmx(target?: string, swap?: string): this {
    this.htmxEnabled = true;
    this.htmxTarget = target;
    this.htmxSwap = swap;
    return this;
  }

  /**
   * Add CSRF token
   */
  csrf(token: string): this {
    this.csrfToken = token;
    return this;
  }

  /**
   * Add a field
   */
  field(field: FieldDefinition): this {
    this.fields.push(field);

    // Add validation rules
    if (field.rules) {
      for (const rule of field.rules) {
        this.validator.addRule(field.name, rule);
      }
    }

    return this;
  }

  /**
   * Add text field
   */
  text(name: string, label: string, options?: Partial<FieldDefinition>): this {
    return this.field({
      name,
      label,
      type: 'text',
      ...options,
    });
  }

  /**
   * Add email field
   */
  email(name: string, label: string, options?: Partial<FieldDefinition>): this {
    return this.field({
      name,
      label,
      type: 'email',
      ...options,
    });
  }

  /**
   * Add password field
   */
  password(name: string, label: string, options?: Partial<FieldDefinition>): this {
    return this.field({
      name,
      label,
      type: 'password',
      ...options,
    });
  }

  /**
   * Add textarea field
   */
  textarea(name: string, label: string, options?: Partial<FieldDefinition>): this {
    return this.field({
      name,
      label,
      type: 'textarea',
      ...options,
    });
  }

  /**
   * Add select field
   */
  select(
    name: string,
    label: string,
    options: { value: string; label: string }[],
    fieldOptions?: Partial<FieldDefinition>
  ): this {
    return this.field({
      name,
      label,
      type: 'select',
      options,
      ...fieldOptions,
    });
  }

  /**
   * Validate form data
   */
  validate(data: FormData): ValidationResult {
    return this.validator.validate(data);
  }

  /**
   * Render the form
   */
  render(errors?: ValidationError[], values?: FormData): HtmlNode {
    const formAttrs: any = {
      action: this.action,
      method: this.method,
    };

    if (this.htmxEnabled) {
      const hxAttrs = hx().post(this.action).validate();

      if (this.htmxTarget) {
        hxAttrs.target(this.htmxTarget);
      }

      if (this.htmxSwap) {
        hxAttrs.swap(this.htmxSwap as any);
      }

      Object.assign(formAttrs, hxAttrs.build());
    }

    const errorMap = new Map(errors?.map((e) => [e.field, e.message]) || []);

    return html.form(
      formAttrs,
      this.csrfToken
        ? html.input({
            type: 'hidden',
            name: '_csrf',
            value: this.csrfToken,
          })
        : null,
      ...this.fields.map((field) => this.renderField(field, errorMap, values)),
      html.div(
        { class: 'form-actions' },
        html.button({ type: 'submit', class: 'btn btn-primary' }, 'Submit')
      )
    );
  }

  /**
   * Render a single field
   */
  private renderField(
    field: FieldDefinition,
    errors: Map<string, string>,
    values?: FormData
  ): HtmlNode {
    const error = errors.get(field.name);
    const value = values?.[field.name] ?? field.value;

    if (field.type === 'textarea') {
      return html.div(
        { class: 'form-group' },
        html.label({ for: field.name }, field.label),
        html.textarea(
          {
            name: field.name,
            id: field.name,
            placeholder: field.placeholder,
            required: field.required,
            class: error ? 'form-control is-invalid' : 'form-control',
          },
          value
        ),
        error ? html.div({ class: 'invalid-feedback' }, error) : null
      );
    }

    if (field.type === 'select') {
      return html.div(
        { class: 'form-group' },
        html.label({ for: field.name }, field.label),
        html.select(
          {
            name: field.name,
            id: field.name,
            required: field.required,
            class: error ? 'form-control is-invalid' : 'form-control',
          },
          ...(field.options || []).map((opt) =>
            html.option(
              {
                value: opt.value,
                selected: opt.value === value,
              },
              opt.label
            )
          )
        ),
        error ? html.div({ class: 'invalid-feedback' }, error) : null
      );
    }

    return html.div(
      { class: 'form-group' },
      html.label({ for: field.name }, field.label),
      html.input({
        type: field.type || 'text',
        name: field.name,
        id: field.name,
        value,
        placeholder: field.placeholder,
        required: field.required,
        class: error ? 'form-control is-invalid' : 'form-control',
      }),
      error ? html.div({ class: 'invalid-feedback' }, error) : null
    );
  }
}

/**
 * Create a new form builder
 */
export function form(action: string, method: 'get' | 'post' = 'post'): FormBuilder {
  return new FormBuilder().setAction(action).setMethod(method);
}

/**
 * CSRF token generator
 */
export class CsrfProtection {
  private tokens: Map<string, { token: string; expiresAt: number }> = new Map();
  private ttl = 3600000; // 1 hour

  /**
   * Generate a CSRF token for a session
   */
  generate(sessionId: string): string {
    const token = this.randomToken();
    this.tokens.set(sessionId, {
      token,
      expiresAt: Date.now() + this.ttl,
    });
    return token;
  }

  /**
   * Verify a CSRF token
   */
  verify(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);

    if (!stored) {
      return false;
    }

    if (Date.now() > stored.expiresAt) {
      this.tokens.delete(sessionId);
      return false;
    }

    return stored.token === token;
  }

  /**
   * Delete a token
   */
  delete(sessionId: string): void {
    this.tokens.delete(sessionId);
  }

  /**
   * Clean up expired tokens
   */
  cleanup(): void {
    const now = Date.now();
    for (const [sessionId, { expiresAt }] of this.tokens.entries()) {
      if (now > expiresAt) {
        this.tokens.delete(sessionId);
      }
    }
  }

  /**
   * Generate random token
   */
  private randomToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export const csrf = new CsrfProtection();

/**
 * Common validation rules
 */
export const rules = {
  required: (message = 'This field is required'): ValidationRule => ({
    type: 'required',
    message,
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    type: 'email',
    message,
  }),

  min: (length: number, message?: string): ValidationRule => ({
    type: 'min',
    value: length,
    message: message || `Minimum length is ${length} characters`,
  }),

  max: (length: number, message?: string): ValidationRule => ({
    type: 'max',
    value: length,
    message: message || `Maximum length is ${length} characters`,
  }),

  pattern: (pattern: string, message: string): ValidationRule => ({
    type: 'pattern',
    value: pattern,
    message,
  }),

  custom: (validator: (value: any) => boolean, message: string): ValidationRule => ({
    type: 'custom',
    validator,
    message,
  }),
};
