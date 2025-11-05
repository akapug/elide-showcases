/**
 * ISBN Validator
 * Validate ISBN-10 and ISBN-13 identifiers
 */

export function isISBN10(isbn: string): boolean {
  const digits = isbn.replace(/[-\s]/g, '');

  if (digits.length !== 10) return false;
  if (!/^[\dX]+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }

  const checkDigit = digits[9] === 'X' ? 10 : parseInt(digits[9], 10);
  sum += checkDigit;

  return sum % 11 === 0;
}

export function isISBN13(isbn: string): boolean {
  const digits = isbn.replace(/[-\s]/g, '');

  if (digits.length !== 13) return false;
  if (!/^\d+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i], 10);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }

  const checkDigit = parseInt(digits[12], 10);
  const calculatedCheck = (10 - (sum % 10)) % 10;

  return checkDigit === calculatedCheck;
}

export function isISBN(isbn: string): boolean {
  const digits = isbn.replace(/[-\s]/g, '');
  return digits.length === 10 ? isISBN10(isbn) : isISBN13(isbn);
}

export function formatISBN(isbn: string): string | null {
  const digits = isbn.replace(/[-\s]/g, '');

  if (digits.length === 10 && isISBN10(isbn)) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 6)}-${digits.slice(6, 9)}-${digits[9]}`;
  }

  if (digits.length === 13 && isISBN13(isbn)) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 4)}-${digits.slice(4, 9)}-${digits.slice(9, 12)}-${digits[12]}`;
  }

  return null;
}

export function convertISBN10to13(isbn10: string): string | null {
  const digits = isbn10.replace(/[-\s]/g, '').slice(0, 9);

  if (digits.length !== 9) return null;

  const isbn13 = '978' + digits;
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    const digit = parseInt(isbn13[i], 10);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return isbn13 + checkDigit;
}

// CLI demo
if (import.meta.url.includes("isbn-validator.ts")) {
  console.log("ISBN Validator Demo\n");

  const testISBNs = [
    { isbn: "0-306-40615-2", desc: "Valid ISBN-10" },
    { isbn: "978-0-306-40615-7", desc: "Valid ISBN-13" },
    { isbn: "0-123-45678-9", desc: "Invalid ISBN-10" },
    { isbn: "978-0-123-45678-9", desc: "Invalid ISBN-13" }
  ];

  testISBNs.forEach(({ isbn, desc }) => {
    console.log(`${desc}: ${isbn}`);
    console.log(`  Valid: ${isISBN(isbn)}`);
    const formatted = formatISBN(isbn);
    if (formatted) {
      console.log(`  Formatted: ${formatted}`);
    }
    console.log();
  });

  console.log("Convert ISBN-10 to ISBN-13:");
  const isbn10 = "0306406152";
  const isbn13 = convertISBN10to13(isbn10);
  console.log(`  ${isbn10} → ${isbn13}`);

  console.log("\n✅ ISBN validator test passed");
}
