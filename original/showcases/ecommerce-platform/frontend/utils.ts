/**
 * Frontend Utility Functions
 */

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function calculateTax(subtotal: number, rate: number = 0.085): number {
  return subtotal * rate;
}

export function calculateShipping(subtotal: number): number {
  // Free shipping over $50
  if (subtotal >= 50) {
    return 0;
  }
  return 5.99;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone: string): boolean {
  const re = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return re.test(phone);
}

export function validateZip(zip: string): boolean {
  const re = /^[0-9]{5}$/;
  return re.test(zip);
}

export function validateCardNumber(cardNumber: string): boolean {
  // Basic Luhn algorithm check
  const digits = cardNumber.replace(/\s/g, '');
  if (!/^\d+$/.test(digits)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

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

export function validateCVV(cvv: string): boolean {
  const re = /^[0-9]{3,4}$/;
  return re.test(cvv);
}

export function validateExpiry(expiry: string): boolean {
  const re = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!re.test(expiry)) return false;

  const [month, year] = expiry.split('/');
  const expiryDate = new Date(2000 + parseInt(year, 10), parseInt(month, 10));
  return expiryDate > new Date();
}
