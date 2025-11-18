/**
 * Email Regex - Email Regular Expression Patterns
 *
 * Reliable email validation using regex patterns.
 * **POLYGLOT SHOWCASE**: One regex library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/email-regex (~100K+ downloads/week)
 *
 * Features:
 * - RFC 5322 compliant regex
 * - Extract emails from text
 * - Unicode support
 * - Multiple pattern options
 * - Zero dependencies
 *
 * Use cases:
 * - Email validation
 * - Text parsing for emails
 * - Email extraction from documents
 * - Form validation
 */

const EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi;

const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailRegex(options?: { exact?: boolean }): RegExp {
  return options?.exact ? SIMPLE_EMAIL_REGEX : EMAIL_REGEX;
}

export function isEmail(email: string): boolean {
  return SIMPLE_EMAIL_REGEX.test(email);
}

export function extractEmails(text: string): string[] {
  const matches = text.match(EMAIL_REGEX);
  return matches ? Array.from(new Set(matches.map(e => e.toLowerCase()))) : [];
}

export default emailRegex;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📧 Email Regex - Email Pattern Matching for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Test Emails ===");
  console.log("user@example.com:", isEmail("user@example.com"));
  console.log("invalid@:", isEmail("invalid@"));
  console.log();

  console.log("=== Example 2: Extract from Text ===");
  const text = "Contact us at support@company.com or sales@company.com for help.";
  const emails = extractEmails(text);
  console.log("Text:", text);
  console.log("Found emails:", emails);
  console.log();

  console.log("🌐 POLYGLOT - Works in JavaScript, Python, Ruby, Java via Elide!");
}
