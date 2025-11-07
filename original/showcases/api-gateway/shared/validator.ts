/**
 * Validator - Shared validation utilities for API Gateway
 *
 * Re-exports validation functionality from the conversions directory.
 * Used by all services for consistent input validation across languages.
 */

// Import from conversions directory
export {
  isEmail,
  isURL,
  isIP,
  isCreditCard,
  isAlphanumeric,
  isAlpha,
  isNumeric,
  isInt,
  isFloat,
  isUUID,
  isJSON,
  isEmpty,
  isLength,
  contains,
  matches,
  escape,
  trim,
  validator,
  Validator
} from '../../../conversions/validator/elide-validator.ts';
export { default } from '../../../conversions/validator/elide-validator.ts';

/**
 * API-specific validators
 */

/**
 * Validate API key format
 */
export function isValidApiKey(key: string): boolean {
  return isLength(key, { min: 32, max: 64 }) && isAlphanumeric(key);
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  return isLength(username, { min: 3, max: 30 }) && isAlphanumeric(username);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  // At least 8 characters, contains number and special char
  return isLength(password, { min: 8 }) &&
         /\d/.test(password) &&
         /[!@#$%^&*]/.test(password);
}

/**
 * Validate pagination parameters
 */
export function isValidPagination(page: string, limit: string): boolean {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  return isInt(page) && isInt(limit) &&
         pageNum >= 1 && limitNum >= 1 && limitNum <= 100;
}
