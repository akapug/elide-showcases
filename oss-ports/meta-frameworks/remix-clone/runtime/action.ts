/**
 * Action System - Form mutations and API endpoints
 *
 * Features:
 * - Form data handling
 * - Type-safe actions
 * - Error handling
 * - Progressive enhancement
 */

import { json, redirect } from './loader';

export interface ActionContext {
  request: Request;
  params: Record<string, string>;
  context: Record<string, any>;
}

export interface ActionFunction {
  (context: ActionContext): Promise<Response> | Response;
}

export class ActionExecutor {
  /**
   * Execute action
   */
  async execute(
    actionPath: string,
    context: ActionContext
  ): Promise<Response> {
    const start = performance.now();

    // Load module
    const module = await import(actionPath);
    const action = module.action as ActionFunction;

    if (!action) {
      return new Response('Action not found', { status: 404 });
    }

    // Execute action
    try {
      const response = await action(context);

      const elapsed = performance.now() - start;
      console.log(`[Action] Executed ${actionPath} in ${elapsed.toFixed(2)}ms`);

      return response;
    } catch (error) {
      console.error(`[Action] Error in ${actionPath}:`, error);

      return new Response(
        JSON.stringify({ error: String(error) }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  /**
   * Parse form data
   */
  async parseFormData(request: Request): Promise<FormData> {
    return request.formData();
  }

  /**
   * Parse JSON
   */
  async parseJSON(request: Request): Promise<any> {
    return request.json();
  }
}

/**
 * Form validation helpers
 */
export interface FieldErrors {
  [key: string]: string;
}

export interface ActionData<T = any> {
  values?: T;
  errors?: FieldErrors;
  message?: string;
}

export function badRequest<T>(data: ActionData<T>): Response {
  return json(data, { status: 400 });
}

export function unauthorized(message = 'Unauthorized'): Response {
  return json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden'): Response {
  return json({ error: message }, { status: 403 });
}

export function notFound(message = 'Not found'): Response {
  return json({ error: message }, { status: 404 });
}

export function serverError(message = 'Internal server error'): Response {
  return json({ error: message }, { status: 500 });
}

/**
 * Form validator
 */
export class FormValidator {
  private errors: FieldErrors = {};

  /**
   * Validate required field
   */
  required(name: string, value: any, message?: string): this {
    if (!value || (typeof value === 'string' && !value.trim())) {
      this.errors[name] = message || `${name} is required`;
    }
    return this;
  }

  /**
   * Validate email
   */
  email(name: string, value: string, message?: string): this {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      this.errors[name] = message || 'Invalid email address';
    }
    return this;
  }

  /**
   * Validate min length
   */
  minLength(name: string, value: string, min: number, message?: string): this {
    if (value && value.length < min) {
      this.errors[name] = message || `Minimum length is ${min}`;
    }
    return this;
  }

  /**
   * Validate max length
   */
  maxLength(name: string, value: string, max: number, message?: string): this {
    if (value && value.length > max) {
      this.errors[name] = message || `Maximum length is ${max}`;
    }
    return this;
  }

  /**
   * Check if valid
   */
  isValid(): boolean {
    return Object.keys(this.errors).length === 0;
  }

  /**
   * Get errors
   */
  getErrors(): FieldErrors {
    return { ...this.errors };
  }

  /**
   * Add custom error
   */
  addError(name: string, message: string): this {
    this.errors[name] = message;
    return this;
  }
}

export default ActionExecutor;
