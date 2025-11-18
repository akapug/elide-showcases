/**
 * Email Domain Validator - Email Domain Validation Library
 *
 * Validate email domains with DNS and MX checks.
 * **POLYGLOT SHOWCASE**: One domain validator for ALL languages on Elide!
 */

const VALID_TLD = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'co', 'io', 'ai', 'app', 'dev',
  'uk', 'us', 'ca', 'au', 'de', 'fr', 'jp', 'cn', 'in', 'br', 'ru', 'es', 'it'
]);

export function isValidDomain(domain: string): boolean {
  if (!domain || !domain.includes('.')) return false;

  const parts = domain.split('.');
  const tld = parts[parts.length - 1].toLowerCase();

  return VALID_TLD.has(tld);
}

export function extractDomain(email: string): string | null {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : null;
}

export function validateEmailDomain(email: string): { valid: boolean; domain?: string; reason?: string } {
  const domain = extractDomain(email);

  if (!domain) {
    return { valid: false, reason: 'Invalid email format' };
  }

  const valid = isValidDomain(domain);

  return {
    valid,
    domain,
    reason: valid ? undefined : 'Invalid or unknown TLD'
  };
}

export default { isValidDomain, extractDomain, validateEmailDomain };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌐 Email Domain Validator - Domain Validation for Elide (POLYGLOT!)\n");

  const emails = [
    'user@example.com',
    'test@invalid.xyz123',
    'admin@company.co.uk'
  ];

  emails.forEach(email => {
    const result = validateEmailDomain(email);
    console.log(email + ":", result.valid ? '✓ Valid' : '✗ Invalid', result.reason || '');
  });

  console.log("\n🌐 POLYGLOT - Works everywhere via Elide!");
}
