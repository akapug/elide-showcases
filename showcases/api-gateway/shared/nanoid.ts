/**
 * Nanoid - Compact unique ID generator for API Gateway
 *
 * Re-exports nanoid functionality from the conversions directory.
 * Used for generating short, URL-friendly unique identifiers.
 */

// Import from conversions directory (assuming nanoid has similar structure)
import { nanoid, customAlphabet } from '../../../conversions/nanoid/elide-nanoid.ts';
export { nanoid, customAlphabet };

/**
 * Generate a short API key
 */
export function generateShortId(length: number = 21): string {
  return nanoid(length);
}

/**
 * Generate a slug-friendly ID
 */
export function generateSlug(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const customNanoid = customAlphabet(alphabet, 12);
  return customNanoid();
}

/**
 * Generate a numeric-only ID
 */
export function generateNumericId(length: number = 16): string {
  const customNanoid = customAlphabet('0123456789', length);
  return customNanoid();
}
