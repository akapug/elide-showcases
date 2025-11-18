/**
 * Yup Validation Errors
 * Compatible error handling for schema validation
 */

export class ValidationError extends Error {
  value: any;
  path?: string;
  type?: string;
  errors: string[];
  inner: ValidationError[];
  params?: Record<string, any>;

  constructor(
    message: string | string[],
    value?: any,
    path?: string,
    type?: string,
    params?: Record<string, any>
  ) {
    const messages = Array.isArray(message) ? message : [message];
    super(messages[0]);

    this.name = 'ValidationError';
    this.value = value;
    this.path = path;
    this.type = type;
    this.errors = messages;
    this.inner = [];
    this.params = params;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  static formatError(message: string, params: Record<string, any>): string {
    return message.replace(/\$\{(\w+)\}/g, (_, key) => {
      return params[key] !== undefined ? String(params[key]) : `\${${key}}`;
    });
  }

  static isError(err: any): err is ValidationError {
    return err && err.name === 'ValidationError';
  }
}

export interface TestContext {
  path: string;
  parent: any;
  schema: any;
  options: ValidateOptions;
  originalValue: any;
  createError: (params?: { message?: string; path?: string; type?: string }) => ValidationError;
}

export interface ValidateOptions {
  strict?: boolean;
  abortEarly?: boolean;
  stripUnknown?: boolean;
  recursive?: boolean;
  context?: any;
  [key: string]: any;
}

export type Message = string | ((params: Record<string, any>) => string);

export interface SchemaDescription {
  type: string;
  label?: string;
  meta?: any;
  oneOf?: any[];
  notOneOf?: any[];
  nullable?: boolean;
  optional?: boolean;
  tests?: Array<{ name?: string; params?: any }>;
}
