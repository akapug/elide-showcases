/**
 * Email Validator
 * Validate and parse email addresses
 */

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function isValid(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  // Basic length check
  if (email.length > 254) return false;

  // Check basic format
  if (!EMAIL_REGEX.test(email)) return false;

  // Check local part length
  const [local] = email.split('@');
  if (local.length > 64) return false;

  return true;
}

export interface ParsedEmail {
  local: string;
  domain: string;
  full: string;
}

export function parse(email: string): ParsedEmail | null {
  if (!isValid(email)) return null;

  const [local, domain] = email.split('@');

  return {
    local,
    domain,
    full: email
  };
}

export function normalize(email: string): string | null {
  if (!isValid(email)) return null;

  // Lowercase domain
  const [local, domain] = email.split('@');
  return `${local}@${domain.toLowerCase()}`;
}

export function getDomain(email: string): string | null {
  const parsed = parse(email);
  return parsed ? parsed.domain : null;
}

export function getUsername(email: string): string | null {
  const parsed = parse(email);
  return parsed ? parsed.local : null;
}

export function isDisposable(email: string): boolean {
  const disposableDomains = [
    'tempmail.com', '10minutemail.com', 'guerrillamail.com',
    'mailinator.com', 'throwaway.email'
  ];

  const domain = getDomain(email);
  return domain ? disposableDomains.includes(domain.toLowerCase()) : false;
}

export function suggestTypos(email: string): string[] {
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = getDomain(email);

  if (!domain) return [];

  const suggestions: string[] = [];

  // Check for common typos
  const typos: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com'
  };

  const suggested = typos[domain.toLowerCase()];
  if (suggested) {
    const local = getUsername(email);
    suggestions.push(`${local}@${suggested}`);
  }

  return suggestions;
}

// CLI demo
if (import.meta.url.includes("email-validator.ts")) {
  console.log("Email Validator Demo\n");

  const emails = [
    "valid@example.com",
    "user.name+tag@example.co.uk",
    "invalid@",
    "@invalid.com",
    "no-at-sign.com",
    "user@domain",
    "user@tempmail.com"
  ];

  emails.forEach(email => {
    console.log(`"${email}"`);
    console.log(`  Valid: ${isValid(email)}`);

    if (isValid(email)) {
      console.log(`  Domain: ${getDomain(email)}`);
      console.log(`  Username: ${getUsername(email)}`);
      console.log(`  Normalized: ${normalize(email)}`);
      console.log(`  Disposable: ${isDisposable(email)}`);
    }

    const suggestions = suggestTypos(email);
    if (suggestions.length > 0) {
      console.log(`  Suggestions: ${suggestions.join(', ')}`);
    }

    console.log();
  });

  console.log("✅ Email validator test passed");
}
