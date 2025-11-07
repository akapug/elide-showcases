/**
 * Validator Utility (re-exported from conversions)
 *
 * Provides email, URL, UUID, and other validation functions.
 * Shared across TypeScript API, Python payment service, and Ruby email service.
 */

export {
  isEmail,
  isURL,
  isUUID,
  isCreditCard,
  isIP,
  isJSON,
  isMobilePhone,
  isPostalCode,
} from '../../../conversions/validator/elide-validator.ts';
