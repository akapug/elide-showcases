/**
 * Yup - Schema Validation for Elide
 * 100% API compatible with Yup, optimized for Elide's polyglot runtime
 *
 * @example
 * ```typescript
 * import * as yup from './yup';
 *
 * const userSchema = yup.object({
 *   name: yup.string().required(),
 *   email: yup.string().email().required(),
 *   age: yup.number().positive().integer(),
 * });
 *
 * await userSchema.validate({ name: 'John', email: 'john@example.com', age: 30 });
 * ```
 */

// Export all schema types
export { mixed, Schema } from './mixed';
export { string, StringSchema } from './string';
export { number, NumberSchema } from './number';
export { boolean, BooleanSchema } from './boolean';
export { date, DateSchema } from './date';
export { array, ArraySchema } from './array';
export { object, ObjectSchema, ObjectShape } from './object';

// Export utilities
export { ref, Reference } from './ref';
export {
  ValidationError,
  ValidateOptions,
  TestContext,
  Message,
  SchemaDescription,
} from './errors';

// Export test helpers
export { TestFunction, TestOptions, WhenOptions } from './mixed';

// Default export for compatibility
import * as yup from './yup';
export default yup;
