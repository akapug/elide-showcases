/**
 * Email Normalization - Email Address Normalization
 *
 * Normalize email addresses to canonical form.
 * **POLYGLOT SHOWCASE**: One normalizer for ALL languages on Elide!
 */

export function normalize(email: string): string {
  let [local, domain] = email.split('@');

  // Lowercase domain
  domain = domain.toLowerCase();

  // Gmail-specific: remove dots and plus aliases
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.toLowerCase().replace(/\./g, '').split('+')[0];
    domain = 'gmail.com';
  } else {
    local = local.toLowerCase();
  }

  return `${local}@${domain}`;
}

export function normalizeAll(emails: string[]): string[] {
  return [...new Set(emails.map(normalize))];
}

export default { normalize, normalizeAll };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Email Normalization - Email Normalization for Elide (POLYGLOT!)\n");

  console.log("john.doe+spam@gmail.com:", normalize("john.doe+spam@gmail.com"));
  console.log("JOHN@EXAMPLE.COM:", normalize("JOHN@EXAMPLE.COM"));

  console.log("\n🌐 POLYGLOT - Works everywhere via Elide!");
}
