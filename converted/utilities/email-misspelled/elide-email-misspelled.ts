/**
 * Email Misspelled - Email Misspelling Detection
 *
 * Detect misspellings in email addresses.
 * **POLYGLOT SHOWCASE**: One misspelling detector for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/email-misspelled (~10K+ downloads/week)
 */

const COMMON_MISSPELLINGS = new Map([
  ['gmial', 'gmail'],
  ['gmai', 'gmail'],
  ['yahooo', 'yahoo'],
  ['yaho', 'yahoo'],
  ['hotmial', 'hotmail'],
  ['outlok', 'outlook'],
]);

export function isMisspelled(email: string): boolean {
  const domain = email.split('@')[1];
  if (!domain) return false;

  const name = domain.split('.')[0]?.toLowerCase();
  return name ? COMMON_MISSPELLINGS.has(name) : false;
}

export function correctMisspelling(email: string): string | null {
  const parts = email.split('@');
  if (parts.length !== 2) return null;

  const [local, domain] = parts;
  const domainParts = domain.split('.');
  const name = domainParts[0]?.toLowerCase();

  const correction = name ? COMMON_MISSPELLINGS.get(name) : null;
  if (correction) {
    domainParts[0] = correction;
    return local + '@' + domainParts.join('.');
  }

  return null;
}

export default { isMisspelled, correctMisspelling };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📝 Email Misspelled - Misspelling Detection for Elide (POLYGLOT!)\n");

  ['user@gmial.com', 'test@gmail.com'].forEach(email => {
    console.log(email + ":", isMisspelled(email) ? correctMisspelling(email) : 'Correct');
  });

  console.log("\n🌐 POLYGLOT - Works everywhere via Elide!");
}
