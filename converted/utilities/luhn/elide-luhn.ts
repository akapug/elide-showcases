/**
 * Luhn - Luhn Algorithm Validator
 *
 * Luhn algorithm for credit card and identification number validation.
 * **POLYGLOT SHOWCASE**: One Luhn validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/luhn (~300K+ downloads/week)
 *
 * Features:
 * - Luhn algorithm validation
 * - Check digit generation
 * - Fast validation
 * - Zero dependencies
 *
 * Package has ~300K+ downloads/week on npm!
 */

const luhn = {
  validate(num: string): boolean {
    const sanitized = num.replace(/\D/g, '');

    if (sanitized.length === 0) return false;

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

  generate(num: string): string {
    const sanitized = num.replace(/\D/g, '');

    let sum = 0;
    let isEven = true;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return sanitized + checkDigit;
  }
};

export default luhn;

if (import.meta.url.includes("elide-luhn.ts")) {
  console.log("✅ Luhn Algorithm Validator (POLYGLOT!)\n");
  console.log("Valid:", luhn.validate("4532015112830366"));
  console.log("Invalid:", luhn.validate("1234567890"));
  console.log("Generate check digit:", luhn.generate("453201511283036"));
  console.log("\n~300K+ downloads/week on npm!");
}
