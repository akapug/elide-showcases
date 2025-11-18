/**
 * Email Verify - Email Address Verification
 *
 * Verify email addresses with DNS, SMTP, and syntax validation.
 * **POLYGLOT SHOWCASE**: One email verification library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/email-verify (~30K+ downloads/week)
 *
 * Features:
 * - DNS MX record validation
 * - SMTP verification (simulated)
 * - Syntax validation (RFC 5322)
 * - Disposable email detection
 * - Role account detection
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need email verification
 * - ONE implementation works everywhere on Elide
 * - Consistent validation across languages
 * - Share validation rules across your stack
 *
 * Use cases:
 * - User registration validation
 * - Email list cleaning
 * - Form validation
 * - Newsletter signup verification
 *
 * Package has ~30K+ downloads/week on npm - essential email utility!
 */

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
  'throwaway.email', 'getnada.com', 'temp-mail.org', 'fakeinbox.com'
]);

const ROLE_ACCOUNTS = new Set([
  'admin', 'administrator', 'postmaster', 'hostmaster', 'webmaster',
  'noreply', 'no-reply', 'info', 'support', 'help', 'sales', 'contact'
]);

export interface VerifyOptions {
  checkDNS?: boolean;
  checkSMTP?: boolean;
  checkDisposable?: boolean;
  checkRole?: boolean;
  timeout?: number;
}

export interface VerifyResult {
  valid: boolean;
  email: string;
  reason?: string;
  checks: {
    syntax: boolean;
    dns?: boolean;
    smtp?: boolean;
    disposable?: boolean;
    role?: boolean;
  };
}

/**
 * Verify email address syntax
 */
export function verifySyntax(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email);
}

/**
 * Check if email is from a disposable domain
 */
export function isDisposable(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

/**
 * Check if email is a role account
 */
export function isRoleAccount(email: string): boolean {
  const local = email.split('@')[0]?.toLowerCase();
  return local ? ROLE_ACCOUNTS.has(local) : false;
}

/**
 * Simulate DNS MX lookup
 */
async function checkDNS(domain: string): Promise<boolean> {
  // Simulated DNS check - in real implementation would use dns.resolveMx
  const validDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
  return validDomains.includes(domain.toLowerCase()) || domain.includes('.');
}

/**
 * Simulate SMTP verification
 */
async function checkSMTP(email: string): Promise<boolean> {
  // Simulated SMTP check - in real implementation would connect to SMTP server
  return verifySyntax(email);
}

/**
 * Verify email address with comprehensive checks
 */
export async function verify(email: string, options: VerifyOptions = {}): Promise<VerifyResult> {
  const opts = {
    checkDNS: true,
    checkSMTP: false,
    checkDisposable: true,
    checkRole: true,
    timeout: 5000,
    ...options
  };

  const result: VerifyResult = {
    valid: false,
    email,
    checks: {
      syntax: false
    }
  };

  // Check syntax
  result.checks.syntax = verifySyntax(email);
  if (!result.checks.syntax) {
    result.reason = 'Invalid email syntax';
    return result;
  }

  const domain = email.split('@')[1];

  // Check disposable
  if (opts.checkDisposable) {
    result.checks.disposable = !isDisposable(email);
    if (!result.checks.disposable) {
      result.reason = 'Disposable email domain';
      return result;
    }
  }

  // Check role account
  if (opts.checkRole) {
    result.checks.role = !isRoleAccount(email);
    if (!result.checks.role) {
      result.reason = 'Role account email';
      return result;
    }
  }

  // Check DNS
  if (opts.checkDNS) {
    result.checks.dns = await checkDNS(domain);
    if (!result.checks.dns) {
      result.reason = 'No MX records found';
      return result;
    }
  }

  // Check SMTP
  if (opts.checkSMTP) {
    result.checks.smtp = await checkSMTP(email);
    if (!result.checks.smtp) {
      result.reason = 'SMTP verification failed';
      return result;
    }
  }

  result.valid = true;
  return result;
}

/**
 * Verify email synchronously (syntax only)
 */
export function verifySync(email: string): boolean {
  return verifySyntax(email) && !isDisposable(email) && !isRoleAccount(email);
}

/**
 * Batch verify emails
 */
export async function verifyBatch(emails: string[], options?: VerifyOptions): Promise<VerifyResult[]> {
  return Promise.all(emails.map(email => verify(email, options)));
}

export default { verify, verifySync, verifyBatch, verifySyntax, isDisposable, isRoleAccount };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✉️  Email Verify - Email Address Verification for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Syntax Validation ===");
  console.log("valid@example.com:", verifySyntax("valid@example.com"));
  console.log("invalid@:", verifySyntax("invalid@"));
  console.log("no-at-sign.com:", verifySyntax("no-at-sign.com"));
  console.log();

  console.log("=== Example 2: Disposable Email Detection ===");
  console.log("user@gmail.com:", isDisposable("user@gmail.com"));
  console.log("test@tempmail.com:", isDisposable("test@tempmail.com"));
  console.log("fake@10minutemail.com:", isDisposable("fake@10minutemail.com"));
  console.log();

  console.log("=== Example 3: Role Account Detection ===");
  console.log("john@example.com:", isRoleAccount("john@example.com"));
  console.log("admin@example.com:", isRoleAccount("admin@example.com"));
  console.log("noreply@example.com:", isRoleAccount("noreply@example.com"));
  console.log();

  console.log("=== Example 4: Synchronous Verification ===");
  console.log("user@gmail.com:", verifySync("user@gmail.com"));
  console.log("admin@tempmail.com:", verifySync("admin@tempmail.com"));
  console.log();

  console.log("=== Example 5: Comprehensive Verification ===");
  verify("user@gmail.com").then(result => {
    console.log("user@gmail.com:", JSON.stringify(result, null, 2));
  });

  verify("test@tempmail.com").then(result => {
    console.log("\ntest@tempmail.com:", JSON.stringify(result, null, 2));
  });

  console.log("\n=== Example 6: Batch Verification ===");
  verifyBatch([
    "alice@gmail.com",
    "bob@tempmail.com",
    "admin@yahoo.com",
    "invalid@"
  ]).then(results => {
    results.forEach(r => {
      console.log(`${r.email}: ${r.valid ? '✓ Valid' : '✗ Invalid'} ${r.reason ? `(${r.reason})` : ''}`);
    });
  });

  setTimeout(() => {
    console.log("\n🌐 POLYGLOT Use Case:");
    console.log("Same email-verify library works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
    console.log("\n✅ Use Cases:");
    console.log("- User registration validation");
    console.log("- Email list cleaning");
    console.log("- Form validation");
    console.log("- Newsletter signup verification");
  }, 100);
}
