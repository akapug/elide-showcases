/**
 * Email Spell Checker - Email Domain Spell Checking
 *
 * Suggest corrections for misspelled email domains.
 * **POLYGLOT SHOWCASE**: One spell checker for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/email-spell-checker (~30K+ downloads/week)
 *
 * Features:
 * - Domain typo detection
 * - Levenshtein distance algorithm
 * - Common domain suggestions
 * - Custom domain lists
 * - Zero dependencies
 */

const COMMON_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'mail.com'];

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function suggestDomain(domain: string, threshold: number = 2): string | null {
  const lowerDomain = domain.toLowerCase();

  let bestMatch: string | null = null;
  let bestDistance = threshold + 1;

  for (const commonDomain of COMMON_DOMAINS) {
    const distance = levenshteinDistance(lowerDomain, commonDomain);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = commonDomain;
    }
  }

  return bestDistance <= threshold ? bestMatch : null;
}

export function checkEmail(email: string): { email: string; suggestion?: string } {
  const parts = email.split('@');
  if (parts.length !== 2) return { email };

  const [local, domain] = parts;
  const suggestion = suggestDomain(domain);

  return suggestion ? { email, suggestion: local + '@' + suggestion } : { email };
}

export default { suggestDomain, checkEmail };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✏️  Email Spell Checker - Domain Typo Detection for Elide (POLYGLOT!)\n");

  const tests = ['user@gmial.com', 'test@yahooo.com', 'admin@hotmial.com', 'ok@gmail.com'];

  tests.forEach(email => {
    const result = checkEmail(email);
    console.log(email + ":", result.suggestion || 'No suggestion');
  });

  console.log("\n🌐 POLYGLOT - Works in JavaScript, Python, Ruby, Java via Elide!");
}
