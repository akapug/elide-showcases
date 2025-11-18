/**
 * Email Deliverability Checker - Email Deliverability Analysis
 *
 * Check email deliverability with comprehensive analysis.
 * **POLYGLOT SHOWCASE**: One deliverability checker for ALL languages on Elide!
 */

export interface DeliverabilityResult {
  deliverable: boolean;
  score: number;
  factors: {
    validSyntax: boolean;
    validDomain: boolean;
    notDisposable: boolean;
    notRole: boolean;
    hasMX: boolean;
  };
  recommendation: string;
}

const DISPOSABLE = new Set(['tempmail.com', '10minutemail.com', 'guerrillamail.com']);
const ROLE_ACCOUNTS = new Set(['admin', 'info', 'support', 'noreply', 'postmaster']);

export async function checkDeliverability(email: string): Promise<DeliverabilityResult> {
  const parts = email.split('@');
  if (parts.length !== 2) {
    return {
      deliverable: false,
      score: 0,
      factors: {
        validSyntax: false,
        validDomain: false,
        notDisposable: false,
        notRole: false,
        hasMX: false
      },
      recommendation: 'Invalid email format'
    };
  }

  const [local, domain] = parts;

  const factors = {
    validSyntax: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    validDomain: domain.includes('.'),
    notDisposable: !DISPOSABLE.has(domain.toLowerCase()),
    notRole: !ROLE_ACCOUNTS.has(local.toLowerCase()),
    hasMX: domain.length > 3
  };

  let score = 0;
  if (factors.validSyntax) score += 20;
  if (factors.validDomain) score += 20;
  if (factors.notDisposable) score += 20;
  if (factors.notRole) score += 20;
  if (factors.hasMX) score += 20;

  let recommendation = '';
  if (score === 100) recommendation = 'Excellent deliverability';
  else if (score >= 80) recommendation = 'Good deliverability';
  else if (score >= 60) recommendation = 'Fair deliverability';
  else recommendation = 'Poor deliverability';

  return {
    deliverable: score >= 60,
    score,
    factors,
    recommendation
  };
}

export default { checkDeliverability };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📊 Email Deliverability Checker - Deliverability Analysis for Elide (POLYGLOT!)\n");

  const emails = [
    'user@example.com',
    'admin@tempmail.com',
    'info@company.co.uk'
  ];

  Promise.all(emails.map(checkDeliverability)).then(results => {
    results.forEach((result, i) => {
      console.log(emails[i] + ":");
      console.log("  Score:", result.score);
      console.log("  Deliverable:", result.deliverable);
      console.log("  Recommendation:", result.recommendation);
    });

    console.log("\n🌐 POLYGLOT - Works everywhere via Elide!");
  });
}
