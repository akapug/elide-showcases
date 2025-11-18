/**
 * Email Typo - Email Typo Detection and Correction
 *
 * Detect and correct common email typos.
 * **POLYGLOT SHOWCASE**: One typo detector for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/email-typo (~20K+ downloads/week)
 */

const TYPO_MAP = new Map([
  ['gmial.com', 'gmail.com'],
  ['gmai.com', 'gmail.com'],
  ['gmil.com', 'gmail.com'],
  ['yahooo.com', 'yahoo.com'],
  ['yaho.com', 'yahoo.com'],
  ['hotmial.com', 'hotmail.com'],
  ['outlok.com', 'outlook.com'],
]);

export function detectTypo(email: string): { hasTypo: boolean; suggestion?: string } {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { hasTypo: false };

  const correction = TYPO_MAP.get(domain);
  if (correction) {
    return {
      hasTypo: true,
      suggestion: email.split('@')[0] + '@' + correction
    };
  }

  return { hasTypo: false };
}

export function correctTypo(email: string): string {
  const result = detectTypo(email);
  return result.suggestion || email;
}

export default { detectTypo, correctTypo };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔍 Email Typo - Typo Detection for Elide (POLYGLOT!)\n");

  ['user@gmial.com', 'test@gmail.com', 'admin@hotmial.com'].forEach(email => {
    const result = detectTypo(email);
    console.log(email + ":", result.hasTypo ? result.suggestion : 'No typo');
  });

  console.log("\n🌐 POLYGLOT - Works everywhere via Elide!");
}
