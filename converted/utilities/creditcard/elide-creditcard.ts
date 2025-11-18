/**
 * Credit Card - Credit Card Validation
 *
 * Credit card validation using Luhn algorithm.
 * **POLYGLOT SHOWCASE**: One credit card validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/creditcard (~200K+ downloads/week)
 *
 * Features:
 * - Luhn algorithm validation
 * - Card type detection (Visa, MasterCard, etc.)
 * - Format validation
 * - Zero dependencies
 *
 * Package has ~200K+ downloads/week on npm!
 */

const creditcard = {
  validate(cardNumber: string): boolean {
    const sanitized = cardNumber.replace(/[\s-]/g, '');

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

  determineCardType(cardNumber: string): string {
    const sanitized = cardNumber.replace(/[\s-]/g, '');

    if (/^4/.test(sanitized)) return 'Visa';
    if (/^5[1-5]/.test(sanitized)) return 'MasterCard';
    if (/^3[47]/.test(sanitized)) return 'American Express';
    if (/^6(?:011|5)/.test(sanitized)) return 'Discover';

    return 'Unknown';
  }
};

export default creditcard;

if (import.meta.url.includes("elide-creditcard.ts")) {
  console.log("✅ Credit Card Validator (POLYGLOT!)\n");
  console.log("Valid Visa:", creditcard.validate("4532015112830366"));
  console.log("Type:", creditcard.determineCardType("4532015112830366"));
  console.log("Invalid:", creditcard.validate("1234567890"));
  console.log("\n~200K+ downloads/week on npm!");
}
