/**
 * UUID Utility (re-exported from conversions)
 *
 * Provides UUID generation and validation functionality.
 * Shared across TypeScript API, Python payment service, and Ruby email service.
 */

export { v4, validate, version } from '../../conversions/uuid/index.ts';
