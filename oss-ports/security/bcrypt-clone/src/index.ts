/**
 * @elide/bcrypt - Production-ready Password Hashing
 * Secure bcrypt implementation for Elide applications
 *
 * @module @elide/bcrypt
 * @author Elide Security Team
 * @license MIT
 */

// Core functions
export {
  genSalt,
  genSaltSync,
  hash,
  hashSync,
  compare,
  compareSync,
  getRounds
} from './core/bcrypt';

// Utilities
export {
  validatePasswordStrength,
  generatePassword,
  hashBatch,
  verifyAgainstMultiple,
  estimateCrackTime,
  type PasswordStrengthOptions,
  type PasswordValidationResult
} from './utils/helpers';

/**
 * Version information
 */
export const VERSION = '1.0.0';

/**
 * Default export
 */
import {
  genSalt,
  genSaltSync,
  hash,
  hashSync,
  compare,
  compareSync,
  getRounds
} from './core/bcrypt';

export default {
  genSalt,
  genSaltSync,
  hash,
  hashSync,
  compare,
  compareSync,
  getRounds
};
