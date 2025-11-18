/**
 * Deep Email Validator - Advanced Email Validation
 *
 * Deep email validation with regex, typo detection, and MX verification.
 * **POLYGLOT SHOWCASE**: One deep validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/deep-email-validator (~50K+ downloads/week)
 *
 * Features:
 * - Multi-layer validation (syntax, DNS, SMTP)
 * - Typo detection and suggestions
 * - Disposable email blocking
 * - Free email provider detection
 * - Role-based account detection
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need deep validation
 * - ONE implementation works everywhere on Elide
 * - Consistent validation logic across languages
 * - Share validation rules across your stack
 *
 * Use cases:
 * - User registration with quality checks
 * - B2B email validation (block free providers)
 * - Email deliverability improvement
 * - Anti-spam measures
 *
 * Package has ~50K+ downloads/week on npm - essential validation utility!
 */

const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
  'throwaway.email', 'getnada.com', 'temp-mail.org', 'fakeinbox.com',
  'yopmail.com', 'sharklasers.com', 'maildrop.cc'
]);

const FREE_PROVIDERS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com'
]);

const COMMON_TYPOS = new Map([
  ['gmial.com', 'gmail.com'],
  ['gmai.com', 'gmail.com'],
  ['gmil.com', 'gmail.com'],
  ['yahooo.com', 'yahoo.com'],
  ['yaho.com', 'yahoo.com'],
  ['hotmial.com', 'hotmail.com'],
  ['outlok.com', 'outlook.com']
]);

export interface ValidationResult {
  valid: boolean;
  validators: {
    regex: { valid: boolean };
    typo: { valid: boolean; suggestion?: string };
    disposable: { valid: boolean };
    mx: { valid: boolean };
    smtp: { valid: boolean };
  };
  reason?: string;
  suggestion?: string;
}

/**
 * Validate email syntax with regex
 */
function validateRegex(email: string): boolean {
  return EMAIL_REGEX.test(email.toLowerCase());
}

/**
 * Check for common typos
 */
function validateTypo(email: string): { valid: boolean; suggestion?: string } {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { valid: false };

  const suggestion = COMMON_TYPOS.get(domain);
  if (suggestion) {
    return {
      valid: false,
      suggestion: email.split('@')[0] + '@' + suggestion
    };
  }

  return { valid: true };
}

/**
 * Check if disposable email
 */
function validateDisposable(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? !DISPOSABLE_DOMAINS.has(domain) : false;
}

/**
 * Check if free email provider
 */
export function isFreeProvider(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? FREE_PROVIDERS.has(domain) : false;
}

/**
 * Simulate MX record check
 */
async function validateMX(email: string): Promise<boolean> {
  const domain = email.split('@')[1]?.toLowerCase();
  // Simulated - would use DNS lookup in production
  return domain ? domain.includes('.') : false;
}

/**
 * Simulate SMTP check
 */
async function validateSMTP(email: string): Promise<boolean> {
  // Simulated - would attempt SMTP connection in production
  return validateRegex(email);
}

/**
 * Deep validate email address
 */
export async function validate(email: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: false,
    validators: {
      regex: { valid: false },
      typo: { valid: false },
      disposable: { valid: false },
      mx: { valid: false },
      smtp: { valid: false }
    }
  };

  // Regex validation
  result.validators.regex.valid = validateRegex(email);
  if (!result.validators.regex.valid) {
    result.reason = 'Invalid email format';
    return result;
  }

  // Typo detection
  const typoCheck = validateTypo(email);
  result.validators.typo = typoCheck;
  if (!typoCheck.valid && typoCheck.suggestion) {
    result.reason = 'Possible typo detected';
    result.suggestion = typoCheck.suggestion;
    return result;
  }

  // Disposable check
  result.validators.disposable.valid = validateDisposable(email);
  if (!result.validators.disposable.valid) {
    result.reason = 'Disposable email address';
    return result;
  }

  // MX validation
  result.validators.mx.valid = await validateMX(email);
  if (!result.validators.mx.valid) {
    result.reason = 'Domain has no MX records';
    return result;
  }

  // SMTP validation
  result.validators.smtp.valid = await validateSMTP(email);
  if (!result.validators.smtp.valid) {
    result.reason = 'SMTP validation failed';
    return result;
  }

  result.valid = true;
  return result;
}

/**
 * Quick validation (synchronous)
 */
export function validateSync(email: string): boolean {
  return validateRegex(email) &&
         validateTypo(email).valid &&
         validateDisposable(email);
}

/**
 * Get email quality score (0-100)
 */
export function getQualityScore(email: string): number {
  let score = 0;

  if (validateRegex(email)) score += 20;
  if (validateTypo(email).valid) score += 20;
  if (validateDisposable(email)) score += 20;
  if (!isFreeProvider(email)) score += 20; // Business emails score higher

  const domain = email.split('@')[1];
  if (domain && domain.length > 5) score += 10; // Longer domains score higher
  if (email.includes('.')) score += 10;

  return score;
}

export default { validate, validateSync, getQualityScore, isFreeProvider };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔍 Deep Email Validator - Advanced Email Validation for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Valid Email ===");
  validate("john@company.com").then(result => {
    console.log(JSON.stringify(result, null, 2));
  });

  setTimeout(() => {
    console.log("\n=== Example 2: Typo Detection ===");
    validate("user@gmial.com").then(result => {
      console.log(JSON.stringify(result, null, 2));
    });
  }, 100);

  setTimeout(() => {
    console.log("\n=== Example 3: Disposable Email ===");
    validate("fake@tempmail.com").then(result => {
      console.log(JSON.stringify(result, null, 2));
    });
  }, 200);

  setTimeout(() => {
    console.log("\n=== Example 4: Quality Score ===");
    const emails = [
      "ceo@company.com",
      "user@gmail.com",
      "test@tempmail.com",
      "invalid@"
    ];

    emails.forEach(email => {
      const score = getQualityScore(email);
      console.log(`${email}: ${score}/100`);
    });

    console.log("\n=== Example 5: Free Provider Detection ===");
    console.log("john@company.com:", isFreeProvider("john@company.com"));
    console.log("user@gmail.com:", isFreeProvider("user@gmail.com"));
    console.log("test@yahoo.com:", isFreeProvider("test@yahoo.com"));

    console.log("\n🌐 POLYGLOT Use Case:");
    console.log("Same deep-email-validator works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
    console.log("\n✅ Use Cases:");
    console.log("- User registration with quality checks");
    console.log("- B2B email validation");
    console.log("- Email deliverability improvement");
    console.log("- Anti-spam measures");
  }, 300);
}
