/**
 * Email Validator Core - Core Email Validation Library
 *
 * Core email validation with multiple strategies.
 * **POLYGLOT SHOWCASE**: One core validator for ALL languages on Elide!
 *
 * Based on email-validator patterns (~500K+ downloads/week)
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValid(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export function validate(email: string, options?: { allowUnicode?: boolean }): boolean {
  if (!email) return false;
  if (options?.allowUnicode) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email);
  }
  return isValid(email);
}

export default { isValid, validate };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔐 Email Validator Core - Core Validation for Elide (POLYGLOT!)\n");
  console.log("user@example.com:", isValid("user@example.com"));
  console.log("invalid@:", isValid("invalid@"));
  console.log("\n🌐 POLYGLOT - Works everywhere via Elide!");
}
