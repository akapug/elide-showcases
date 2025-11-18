/**
 * Validator - String Validation and Sanitization
 *
 * A library of string validators and sanitizers.
 * **POLYGLOT SHOWCASE**: One string validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/validator (~40M+ downloads/week)
 *
 * Features:
 * - Email validation
 * - URL validation
 * - Credit card validation
 * - UUID validation
 * - IP address validation
 * - String sanitization
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need string validation
 * - ONE validator works everywhere on Elide
 * - Consistent validation rules across services
 * - Share validation logic across your stack
 *
 * Use cases:
 * - Form validation
 * - API input validation
 * - Data sanitization
 * - Security validation
 *
 * Package has ~40M+ downloads/week on npm!
 */

const validator = {
  // Email validation
  isEmail(str: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(str);
  },

  // URL validation
  isURL(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  },

  // Alphanumeric validation
  isAlphanumeric(str: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(str);
  },

  // Numeric validation
  isNumeric(str: string): boolean {
    return /^-?\d+(\.\d+)?$/.test(str);
  },

  // Integer validation
  isInt(str: string): boolean {
    return /^-?\d+$/.test(str);
  },

  // UUID validation
  isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  },

  // Credit card validation (Luhn algorithm)
  isCreditCard(str: string): boolean {
    const sanitized = str.replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(sanitized)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  // IP validation
  isIP(str: string, version?: 4 | 6): boolean {
    if (version === 4 || !version) {
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (ipv4Regex.test(str)) {
        return str.split('.').every(part => {
          const num = parseInt(part);
          return num >= 0 && num <= 255;
        });
      }
    }

    if (version === 6 || !version) {
      const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      return ipv6Regex.test(str);
    }

    return false;
  },

  // Length validation
  isLength(str: string, options: { min?: number; max?: number }): boolean {
    const len = str.length;
    if (options.min !== undefined && len < options.min) return false;
    if (options.max !== undefined && len > options.max) return false;
    return true;
  },

  // Contains validation
  contains(str: string, substring: string): boolean {
    return str.includes(substring);
  },

  // Empty check
  isEmpty(str: string): boolean {
    return str.length === 0;
  },

  // JSON validation
  isJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  },

  // Sanitization methods

  // Escape HTML
  escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  // Unescape HTML
  unescape(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");
  },

  // Trim whitespace
  trim(str: string): string {
    return str.trim();
  },

  // Strip low ASCII
  stripLow(str: string): string {
    return str.replace(/[\x00-\x1F\x7F]/g, '');
  },

  // Blacklist characters
  blacklist(str: string, chars: string): string {
    const regex = new RegExp(`[${chars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`, 'g');
    return str.replace(regex, '');
  },

  // Whitelist characters
  whitelist(str: string, chars: string): string {
    const regex = new RegExp(`[^${chars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`, 'g');
    return str.replace(regex, '');
  },

  // Normalize email
  normalizeEmail(email: string): string {
    const parts = email.toLowerCase().split('@');
    if (parts.length !== 2) return email;

    let local = parts[0];
    const domain = parts[1];

    // Remove dots from Gmail
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      local = local.replace(/\./g, '');
      // Remove everything after +
      const plusIndex = local.indexOf('+');
      if (plusIndex !== -1) {
        local = local.substring(0, plusIndex);
      }
    }

    return `${local}@${domain}`;
  }
};

export default validator;

// CLI Demo
if (import.meta.url.includes("elide-validator.ts")) {
  console.log("✅ Validator - String Validation and Sanitization (POLYGLOT!)\n");

  console.log("=== Example 1: Email Validation ===");
  console.log("Valid email:", validator.isEmail("user@example.com"));
  console.log("Invalid email:", validator.isEmail("not-an-email"));
  console.log();

  console.log("=== Example 2: URL Validation ===");
  console.log("Valid URL:", validator.isURL("https://example.com"));
  console.log("Invalid URL:", validator.isURL("not a url"));
  console.log();

  console.log("=== Example 3: Credit Card Validation ===");
  console.log("Valid card:", validator.isCreditCard("4532015112830366"));
  console.log("Invalid card:", validator.isCreditCard("1234567890"));
  console.log();

  console.log("=== Example 4: UUID Validation ===");
  console.log("Valid UUID:", validator.isUUID("550e8400-e29b-41d4-a716-446655440000"));
  console.log("Invalid UUID:", validator.isUUID("not-a-uuid"));
  console.log();

  console.log("=== Example 5: IP Address Validation ===");
  console.log("Valid IPv4:", validator.isIP("192.168.1.1", 4));
  console.log("Invalid IPv4:", validator.isIP("999.999.999.999", 4));
  console.log();

  console.log("=== Example 6: String Sanitization ===");
  const dangerous = "<script>alert('XSS')</script>";
  console.log("Original:", dangerous);
  console.log("Escaped:", validator.escape(dangerous));
  console.log();

  console.log("=== Example 7: Email Normalization ===");
  console.log("Normalized:", validator.normalizeEmail("User.Name+tag@Gmail.com"));
  console.log();

  console.log("=== Example 8: String Blacklist ===");
  console.log("Remove numbers:", validator.blacklist("abc123def456", "0-9"));
  console.log();

  console.log("=== Example 9: Length Validation ===");
  console.log("Valid length:", validator.isLength("hello", { min: 3, max: 10 }));
  console.log("Too short:", validator.isLength("hi", { min: 3 }));
  console.log();

  console.log("=== Example 10: Numeric Validation ===");
  console.log("Is numeric:", validator.isNumeric("123.45"));
  console.log("Is integer:", validator.isInt("123"));
  console.log("Not integer:", validator.isInt("123.45"));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Form input validation");
  console.log("- API request validation");
  console.log("- XSS prevention");
  console.log("- Data sanitization");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast regex-based validation");
  console.log("- ~40M+ downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use for input validation in all services");
  console.log("- Consistent validation across TypeScript, Python, Ruby, Java");
  console.log("- Perfect for polyglot microservices!");
}
