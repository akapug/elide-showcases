/**
 * Prisma Error Classes
 */

/**
 * Base Prisma Client Error
 */
export class PrismaClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrismaClientError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Known Request Error
 */
export class PrismaClientKnownRequestError extends PrismaClientError {
  code: string;
  meta?: any;
  clientVersion?: string;

  constructor(message: string, code: string, meta?: any) {
    super(message);
    this.name = 'PrismaClientKnownRequestError';
    this.code = code;
    this.meta = meta;
    this.clientVersion = '1.0.0';
  }

  get [Symbol.toStringTag]() {
    return 'PrismaClientKnownRequestError';
  }
}

/**
 * Unknown Request Error
 */
export class PrismaClientUnknownRequestError extends PrismaClientError {
  constructor(message: string, public meta?: any) {
    super(message);
    this.name = 'PrismaClientUnknownRequestError';
  }
}

/**
 * Initialization Error
 */
export class PrismaClientInitializationError extends PrismaClientError {
  errorCode?: string;

  constructor(message: string, errorCode?: string) {
    super(message);
    this.name = 'PrismaClientInitializationError';
    this.errorCode = errorCode;
  }
}

/**
 * Validation Error
 */
export class PrismaClientValidationError extends PrismaClientError {
  constructor(message: string) {
    super(message);
    this.name = 'PrismaClientValidationError';
  }
}

/**
 * Rust Panic Error
 */
export class PrismaClientRustPanicError extends PrismaClientError {
  constructor(message: string) {
    super(message);
    this.name = 'PrismaClientRustPanicError';
  }
}

/**
 * Error code mappings
 */
export const ERROR_CODES = {
  // Common errors
  P1000: 'Authentication failed',
  P1001: 'Cannot reach database server',
  P1002: 'Database server timeout',
  P1003: 'Database does not exist',
  P1008: 'Operations timed out',
  P1009: 'Database already exists',
  P1010: 'Access denied',
  P1011: 'Error opening TLS connection',
  P1012: 'Schema validation error',
  P1013: 'Invalid database string',
  P1014: 'Model not found',
  P1015: 'Unsupported features',
  P1016: 'Incorrect number of parameters',
  P1017: 'Connection closed',

  // Query errors
  P2000: 'Value too long for column',
  P2001: 'Record not found',
  P2002: 'Unique constraint violation',
  P2003: 'Foreign key constraint violation',
  P2004: 'Constraint failed',
  P2005: 'Invalid value for field type',
  P2006: 'Invalid value provided',
  P2007: 'Data validation error',
  P2008: 'Failed to parse query',
  P2009: 'Failed to validate query',
  P2010: 'Raw query failed',
  P2011: 'Null constraint violation',
  P2012: 'Missing required value',
  P2013: 'Missing required argument',
  P2014: 'Required relation violation',
  P2015: 'Related record not found',
  P2016: 'Query interpretation error',
  P2017: 'Records not connected',
  P2018: 'Required connected records not found',
  P2019: 'Input error',
  P2020: 'Value out of range',
  P2021: 'Table does not exist',
  P2022: 'Column does not exist',
  P2023: 'Inconsistent column data',
  P2024: 'Timed out fetching connection',
  P2025: 'Record to update/delete not found',
  P2026: 'Unsupported database feature',
  P2027: 'Multiple errors occurred',
  P2028: 'Transaction API error',
  P2029: 'Query parameter limit exceeded',
  P2030: 'Full-text search index not found',
  P2031: 'MongoDB transaction error',
  P2033: 'Number out of range',
  P2034: 'Write conflict',

  // Migration errors
  P3000: 'Failed to create database',
  P3001: 'Migration failed',
  P3002: 'Migration rollback failed',
  P3003: 'Format of migrations changed',
  P3004: 'Unsupported database version',
  P3005: 'Non-empty database',
  P3006: 'Failed to apply migration',
  P3007: 'Preview features not allowed',
  P3008: 'Migration already applied',
  P3009: 'Failed migrations detected',
  P3010: 'Migration name too long',
  P3011: 'Cannot create migration with empty datasource',
  P3012: 'Cannot create migration with errors',
  P3013: 'Datasource provider mismatch',
  P3014: 'Prisma Migrate not supported',
  P3015: 'Migration file not found',
  P3016: 'Connection refused',
  P3017: 'Migration not found',
  P3018: 'Failed to apply migration',
  P3019: 'Connector error',
  P3020: 'Failed to create shadow database'
};

/**
 * Get error message for code
 */
export function getErrorMessage(code: string): string {
  return ERROR_CODES[code as keyof typeof ERROR_CODES] || 'Unknown error';
}

/**
 * Create error from code
 */
export function createError(code: string, message?: string, meta?: any): PrismaClientKnownRequestError {
  const defaultMessage = getErrorMessage(code);
  return new PrismaClientKnownRequestError(
    message || defaultMessage,
    code,
    meta
  );
}

/**
 * Check if error is Prisma error
 */
export function isPrismaError(error: any): error is PrismaClientError {
  return error instanceof PrismaClientError;
}

/**
 * Check if error is known request error
 */
export function isKnownRequestError(error: any): error is PrismaClientKnownRequestError {
  return error instanceof PrismaClientKnownRequestError;
}

/**
 * Check if error is validation error
 */
export function isValidationError(error: any): error is PrismaClientValidationError {
  return error instanceof PrismaClientValidationError;
}

/**
 * Format error for display
 */
export function formatError(error: Error): string {
  if (error instanceof PrismaClientKnownRequestError) {
    let message = `${error.name}: ${error.message}\n`;
    message += `Error code: ${error.code}\n`;

    if (error.meta) {
      message += `Meta: ${JSON.stringify(error.meta, null, 2)}\n`;
    }

    return message;
  }

  return `${error.name}: ${error.message}`;
}
