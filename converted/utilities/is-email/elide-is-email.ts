/**
 * is-email - Email Validation
 * Based on https://www.npmjs.com/package/is-email (~3M downloads/week)
 *
 * Features:
 * - RFC-compliant email validation
 * - Fast regex-based checking
 * - Domain validation
 * - No external dependencies
 *
 * Polyglot Benefits:
 * - Pure TypeScript implementation
 * - Zero dependencies
 * - Works in TypeScript, Python, Ruby, Java via Elide
 */

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function isEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }

  if (email.length > 254) {
    return false;
  }

  if (!emailRegex.test(email)) {
    return false;
  }

  // Check parts
  const parts = email.split('@');
  if (parts[0].length > 64) {
    return false;
  }

  const domainParts = parts[1].split('.');
  if (domainParts.some(part => part.length > 63)) {
    return false;
  }

  return true;
}

export default isEmail;
export { isEmail };

if (import.meta.url.includes("elide-is-email.ts")) {
  console.log("✅ is-email - Email Validation (POLYGLOT!)\n");

  const testCases = [
    'user@example.com',
    'user.name@example.com',
    'user+tag@example.co.uk',
    'invalid@',
    '@invalid.com',
    'no-at-sign.com',
    'user@example',
    'user @example.com',
    'user@.com',
    'a'.repeat(65) + '@example.com',
    'valid_email123@test-domain.org'
  ];

  testCases.forEach(email => {
    console.log(`${email.padEnd(40)} => ${isEmail(email) ? '✓ Valid' : '✗ Invalid'}`);
  });

  console.log("\n🔒 ~3M downloads/week | RFC-compliant validation");
  console.log("🚀 Fast regex | Domain checks | Length limits\n");
}
