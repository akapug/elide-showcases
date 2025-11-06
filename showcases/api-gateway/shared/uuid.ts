/**
 * UUID - Shared UUID utilities for API Gateway
 *
 * Re-exports UUID functionality from the conversions directory.
 * This demonstrates how multiple services (TS, Python, Ruby, Java)
 * can share the same UUID implementation via Elide.
 */

// Import from conversions directory
export { v4, validate, parse, version, isNil, generate, NIL } from '../../../conversions/uuid/elide-uuid.ts';
export { default } from '../../../conversions/uuid/elide-uuid.ts';

/**
 * Generate a request ID for API tracking
 */
export function generateRequestId(): string {
  return `req-${v4()}`;
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return `sess-${v4()}`;
}

/**
 * Generate a transaction ID for distributed tracing
 */
export function generateTransactionId(): string {
  return `txn-${v4()}`;
}
