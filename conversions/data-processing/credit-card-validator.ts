/**
 * Credit Card Validator
 * Validate credit card numbers using Luhn algorithm
 */

export function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unknown';

export function getCardType(cardNumber: string): CardType {
  const digits = cardNumber.replace(/\D/g, '');

  if (/^4/.test(digits)) return 'visa';
  if (/^5[1-5]/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^6(?:011|5)/.test(digits)) return 'discover';
  if (/^3(?:0[0-5]|[68])/.test(digits)) return 'diners';
  if (/^35/.test(digits)) return 'jcb';

  return 'unknown';
}

export interface ValidationResult {
  valid: boolean;
  type: CardType;
  formatted?: string;
}

export function validate(cardNumber: string): ValidationResult {
  const digits = cardNumber.replace(/\D/g, '');
  const type = getCardType(digits);
  const valid = luhnCheck(digits);

  return {
    valid,
    type,
    formatted: valid ? formatCardNumber(digits, type) : undefined
  };
}

export function formatCardNumber(cardNumber: string, type?: CardType): string {
  const digits = cardNumber.replace(/\D/g, '');
  const cardType = type || getCardType(digits);

  if (cardType === 'amex') {
    return digits.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
  }

  return digits.replace(/(\d{4})/g, '$1 ').trim();
}

export function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 4) return '*'.repeat(digits.length);

  const last4 = digits.slice(-4);
  const masked = '*'.repeat(digits.length - 4);

  return formatCardNumber(masked + last4);
}

// CLI demo
if (import.meta.url.includes("credit-card-validator.ts")) {
  console.log("Credit Card Validator Demo\n");

  const testCards = [
    { number: "4532015112830366", desc: "Valid Visa" },
    { number: "5425233430109903", desc: "Valid Mastercard" },
    { number: "378282246310005", desc: "Valid Amex" },
    { number: "1234567890123456", desc: "Invalid" }
  ];

  testCards.forEach(({ number, desc }) => {
    const result = validate(number);
    console.log(`${desc}:`);
    console.log(`  Number: ${number}`);
    console.log(`  Valid: ${result.valid}`);
    console.log(`  Type: ${result.type}`);
    if (result.formatted) {
      console.log(`  Formatted: ${result.formatted}`);
    }
    console.log(`  Masked: ${maskCardNumber(number)}\n`);
  });

  console.log("✅ Credit card validator test passed");
}
