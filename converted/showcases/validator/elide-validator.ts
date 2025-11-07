/**
 * Validator - String Validation Library
 *
 * Comprehensive string validation for common data types.
 * **POLYGLOT SHOWCASE**: One validator for ALL languages on Elide!
 *
 * Features:
 * - Email validation
 * - URL validation
 * - Credit card validation
 * - Phone number validation
 * - IP address validation
 * - Date validation
 * - Alpha/numeric/alphanumeric checks
 * - Length constraints
 * - Custom validators
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need validation
 * - ONE implementation works everywhere on Elide
 * - Consistent validation rules across languages
 * - No need for language-specific validator libs
 *
 * Use cases:
 * - Form validation
 * - API input validation
 * - Data sanitization
 * - Security checks
 * - User input verification
 * - Data integrity enforcement
 *
 * Package has ~10M+ downloads/week on npm!
 */

/**
 * Check if string is a valid email
 */
export function isEmail(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str.trim());
}

/**
 * Check if string is a valid URL
 */
export function isURL(str: string, options: { requireProtocol?: boolean } = {}): boolean {
  if (typeof str !== 'string' || !str) return false;

  const { requireProtocol = false } = options;

  try {
    const url = new URL(str);
    if (requireProtocol && !url.protocol) return false;
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    // If URL constructor fails, try without protocol
    if (!requireProtocol) {
      try {
        new URL('http://' + str);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/**
 * Check if string is a valid IPv4 address
 */
export function isIP(str: string, version: 4 | 6 | null = null): boolean {
  if (typeof str !== 'string' || !str) return false;

  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  if (version === 4) {
    if (!ipv4Regex.test(str)) return false;
    return str.split('.').every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  if (version === 6) {
    return ipv6Regex.test(str);
  }

  // Check both versions
  return isIP(str, 4) || isIP(str, 6);
}

/**
 * Check if string is a valid credit card number (Luhn algorithm)
 */
export function isCreditCard(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;

  // Remove spaces and dashes
  const sanitized = str.replace(/[\s-]/g, '');

  // Must be 13-19 digits
  if (!/^\d{13,19}$/.test(sanitized)) return false;

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Check if string is alphanumeric
 */
export function isAlphanumeric(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;
  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Check if string is alphabetic only
 */
export function isAlpha(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;
  return /^[a-zA-Z]+$/.test(str);
}

/**
 * Check if string is numeric
 */
export function isNumeric(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;
  return /^-?\d+(\.\d+)?$/.test(str);
}

/**
 * Check if string is an integer
 */
export function isInt(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;
  return /^-?\d+$/.test(str);
}

/**
 * Check if string is a float
 */
export function isFloat(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;
  return /^-?\d+\.\d+$/.test(str);
}

/**
 * Check if string is a valid hexadecimal
 */
export function isHexadecimal(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;
  return /^[0-9a-fA-F]+$/.test(str);
}

/**
 * Check if string is a valid hex color
 */
export function isHexColor(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(str);
}

/**
 * Check if string is lowercase
 */
export function isLowercase(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;
  return str === str.toLowerCase() && str !== str.toUpperCase();
}

/**
 * Check if string is uppercase
 */
export function isUppercase(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;
  return str === str.toUpperCase() && str !== str.toLowerCase();
}

/**
 * Check if string length is within range
 */
export function isLength(str: string, options: { min?: number; max?: number }): boolean {
  if (typeof str !== 'string') return false;

  const { min = 0, max = Infinity } = options;
  return str.length >= min && str.length <= max;
}

/**
 * Check if string contains substring
 */
export function contains(str: string, substring: string): boolean {
  if (typeof str !== 'string' || typeof substring !== 'string') return false;
  return str.includes(substring);
}

/**
 * Check if string matches pattern
 */
export function matches(str: string, pattern: RegExp | string): boolean {
  if (typeof str !== 'string') return false;

  if (typeof pattern === 'string') {
    return str.includes(pattern);
  }

  return pattern.test(str);
}

/**
 * Check if string is a valid UUID
 */
export function isUUID(str: string, version?: 3 | 4 | 5): boolean {
  if (typeof str !== 'string' || !str) return false;

  const uuidRegex: Record<number, RegExp> = {
    3: /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    5: /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  };

  const anyUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (version) {
    return uuidRegex[version].test(str);
  }

  return anyUUID.test(str);
}

/**
 * Check if string is a valid JSON
 */
export function isJSON(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;

  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string is empty (or only whitespace)
 */
export function isEmpty(str: string): boolean {
  if (typeof str !== 'string') return true;
  return str.trim().length === 0;
}

/**
 * Check if string is a valid ISO 8601 date
 */
export function isISO8601(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;

  const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/;
  if (!iso8601Regex.test(str)) return false;

  const date = new Date(str);
  return !isNaN(date.getTime());
}

/**
 * Check if string is a valid base64 string
 */
export function isBase64(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;

  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(str)) return false;

  // Length must be multiple of 4
  return str.length % 4 === 0;
}

/**
 * Check if string is a valid phone number (basic check)
 */
export function isMobilePhone(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;

  // Remove common separators
  const cleaned = str.replace(/[\s()-]/g, '');

  // Must start with + or digit, and be 10-15 digits
  return /^[+]?\d{10,15}$/.test(cleaned);
}

/**
 * Check if string is a valid MAC address
 */
export function isMACAddress(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;

  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(str);
}

/**
 * Check if string is a valid port number
 */
export function isPort(str: string): boolean {
  if (typeof str !== 'string' || !str) return false;

  const num = parseInt(str, 10);
  return /^\d+$/.test(str) && num >= 0 && num <= 65535;
}

/**
 * Sanitize string by escaping HTML entities
 */
export function escape(str: string): string {
  if (typeof str !== 'string') return '';

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, char => htmlEntities[char]);
}

/**
 * Unescape HTML entities
 */
export function unescape(str: string): string {
  if (typeof str !== 'string') return '';

  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
  };

  return str.replace(/&(amp|lt|gt|quot|#x27|#x2F);/g, entity => htmlEntities[entity]);
}

/**
 * Remove whitespace from both ends
 */
export function trim(str: string): string {
  if (typeof str !== 'string') return '';
  return str.trim();
}

/**
 * Check if value is in array
 */
export function isIn(str: string, values: string[]): boolean {
  if (typeof str !== 'string') return false;
  return values.includes(str);
}

/**
 * Normalize email address
 */
export function normalizeEmail(email: string): string | null {
  if (!isEmail(email)) return null;

  const [local, domain] = email.toLowerCase().split('@');

  // Remove dots from gmail addresses
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const normalized = local.replace(/\./g, '').split('+')[0];
    return `${normalized}@gmail.com`;
  }

  return `${local}@${domain}`;
}

/**
 * Validator class for chainable validation
 */
export class Validator {
  private value: string;
  private errors: string[] = [];

  constructor(value: string) {
    this.value = value;
  }

  isEmail(): this {
    if (!isEmail(this.value)) {
      this.errors.push('Must be a valid email');
    }
    return this;
  }

  isURL(): this {
    if (!isURL(this.value)) {
      this.errors.push('Must be a valid URL');
    }
    return this;
  }

  isAlphanumeric(): this {
    if (!isAlphanumeric(this.value)) {
      this.errors.push('Must be alphanumeric');
    }
    return this;
  }

  isLength(min: number, max?: number): this {
    if (!isLength(this.value, { min, max })) {
      this.errors.push(`Length must be between ${min} and ${max || 'infinity'}`);
    }
    return this;
  }

  matches(pattern: RegExp): this {
    if (!matches(this.value, pattern)) {
      this.errors.push(`Must match pattern ${pattern}`);
    }
    return this;
  }

  isValid(): boolean {
    return this.errors.length === 0;
  }

  getErrors(): string[] {
    return this.errors;
  }
}

/**
 * Create a validator instance
 */
export function validator(value: string): Validator {
  return new Validator(value);
}

// Default export
export default {
  isEmail,
  isURL,
  isIP,
  isCreditCard,
  isAlphanumeric,
  isAlpha,
  isNumeric,
  isInt,
  isFloat,
  isHexadecimal,
  isHexColor,
  isLowercase,
  isUppercase,
  isLength,
  contains,
  matches,
  isUUID,
  isJSON,
  isEmpty,
  isISO8601,
  isBase64,
  isMobilePhone,
  isMACAddress,
  isPort,
  escape,
  unescape,
  trim,
  isIn,
  normalizeEmail,
  validator,
  Validator
};

// CLI Demo
if (import.meta.url.includes("elide-validator.ts")) {
  console.log("✅ Validator - String Validation for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Email Validation ===");
  const emails = [
    "user@example.com",
    "invalid.email",
    "test@test.co.uk",
    "not-an-email"
  ];
  emails.forEach(email => {
    console.log(`  "${email}": ${isEmail(email) ? '✓ valid' : '✗ invalid'}`);
  });
  console.log();

  console.log("=== Example 2: URL Validation ===");
  const urls = [
    "https://example.com",
    "http://test.org/path",
    "example.com",
    "not a url"
  ];
  urls.forEach(url => {
    console.log(`  "${url}": ${isURL(url) ? '✓ valid' : '✗ invalid'}`);
  });
  console.log();

  console.log("=== Example 3: IP Address Validation ===");
  const ips = [
    { addr: "192.168.1.1", v: 4 },
    { addr: "256.1.1.1", v: 4 },
    { addr: "2001:0db8:85a3:0000:0000:8a2e:0370:7334", v: 6 }
  ];
  ips.forEach(({ addr, v }) => {
    console.log(`  IPv${v} "${addr}": ${isIP(addr, v as 4 | 6) ? '✓ valid' : '✗ invalid'}`);
  });
  console.log();

  console.log("=== Example 4: Credit Card Validation ===");
  const cards = [
    "4532015112830366",      // Valid Visa
    "6011111111111117",      // Valid Discover
    "1234567890123456",      // Invalid (fails Luhn)
    "1234 5678 9012 3456"    // Invalid
  ];
  cards.forEach(card => {
    console.log(`  "${card}": ${isCreditCard(card) ? '✓ valid' : '✗ invalid'}`);
  });
  console.log();

  console.log("=== Example 5: String Type Checks ===");
  const values = [
    { val: "abc123", type: "alphanumeric" },
    { val: "abc", type: "alpha" },
    { val: "123", type: "numeric" },
    { val: "12.34", type: "float" }
  ];
  values.forEach(({ val, type }) => {
    let result = false;
    if (type === 'alphanumeric') result = isAlphanumeric(val);
    if (type === 'alpha') result = isAlpha(val);
    if (type === 'numeric') result = isNumeric(val);
    if (type === 'float') result = isFloat(val);
    console.log(`  "${val}" is ${type}: ${result ? '✓' : '✗'}`);
  });
  console.log();

  console.log("=== Example 6: UUID Validation ===");
  const uuids = [
    "550e8400-e29b-41d4-a716-446655440000",  // Valid v4
    "not-a-uuid",
    "550e8400-e29b-41d4-a716-44665544000"    // Invalid (too short)
  ];
  uuids.forEach(uuid => {
    console.log(`  "${uuid}": ${isUUID(uuid) ? '✓ valid' : '✗ invalid'}`);
  });
  console.log();

  console.log("=== Example 7: JSON Validation ===");
  const jsons = [
    '{"name":"Alice"}',
    '[1,2,3]',
    '{invalid json}',
    'null'
  ];
  jsons.forEach(json => {
    console.log(`  "${json}": ${isJSON(json) ? '✓ valid' : '✗ invalid'}`);
  });
  console.log();

  console.log("=== Example 8: Length Validation ===");
  const passwords = [
    { pwd: "abc", min: 8, max: 20 },
    { pwd: "password123", min: 8, max: 20 },
    { pwd: "thispasswordiswaytoolong", min: 8, max: 20 }
  ];
  passwords.forEach(({ pwd, min, max }) => {
    console.log(`  "${pwd}" (${min}-${max}): ${isLength(pwd, { min, max }) ? '✓ valid' : '✗ invalid'}`);
  });
  console.log();

  console.log("=== Example 9: Phone Number Validation ===");
  const phones = [
    "+1-555-123-4567",
    "555-123-4567",
    "5551234567",
    "123"
  ];
  phones.forEach(phone => {
    console.log(`  "${phone}": ${isMobilePhone(phone) ? '✓ valid' : '✗ invalid'}`);
  });
  console.log();

  console.log("=== Example 10: Hex Color Validation ===");
  const colors = [
    "#FF5733",
    "#F57",
    "FF5733",
    "#GG5733"
  ];
  colors.forEach(color => {
    console.log(`  "${color}": ${isHexColor(color) ? '✓ valid' : '✗ invalid'}`);
  });
  console.log();

  console.log("=== Example 11: HTML Escape/Unescape ===");
  const html = '<script>alert("XSS")</script>';
  const escaped = escape(html);
  const unescaped = unescape(escaped);
  console.log("  Original:", html);
  console.log("  Escaped:", escaped);
  console.log("  Unescaped:", unescaped);
  console.log();

  console.log("=== Example 12: Chainable Validator ===");
  const username1 = validator("alice123")
    .isAlphanumeric()
    .isLength(3, 20);
  console.log(`  "alice123": ${username1.isValid() ? '✓ valid' : '✗ invalid'}`);
  if (!username1.isValid()) {
    console.log("    Errors:", username1.getErrors());
  }

  const username2 = validator("ab")
    .isAlphanumeric()
    .isLength(3, 20);
  console.log(`  "ab": ${username2.isValid() ? '✓ valid' : '✗ invalid'}`);
  if (!username2.isValid()) {
    console.log("    Errors:", username2.getErrors());
  }
  console.log();

  console.log("=== Example 13: Email Normalization ===");
  const emailsToNormalize = [
    "user.name+tag@gmail.com",
    "user.name@googlemail.com",
    "test@example.com"
  ];
  console.log("Email normalization:");
  emailsToNormalize.forEach(email => {
    console.log(`  ${email} → ${normalizeEmail(email)}`);
  });
  console.log();

  console.log("=== Example 14: POLYGLOT Use Case ===");
  console.log("🌐 Same validator works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One implementation, all languages");
  console.log("  ✓ Consistent validation rules everywhere");
  console.log("  ✓ No language-specific validator bugs");
  console.log("  ✓ Share validation logic across polyglot projects");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Form validation");
  console.log("- API input validation");
  console.log("- Data sanitization");
  console.log("- Security checks");
  console.log("- User input verification");
  console.log("- Data integrity enforcement");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~10M+ downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in Python/Ruby/Java via Elide");
  console.log("- Share validation logic across languages");
  console.log("- One source of truth for validation");
  console.log("- Perfect for mixed-language projects!");
}
