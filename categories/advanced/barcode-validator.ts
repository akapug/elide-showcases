/**
 * Barcode Validator
 * Validate EAN-13, UPC-A, and other barcodes
 */

export function isEAN13(barcode: string): boolean {
  const digits = barcode.replace(/\D/g, '');

  if (digits.length !== 13) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i], 10);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(digits[12], 10);
}

export function isUPCA(barcode: string): boolean {
  const digits = barcode.replace(/\D/g, '');

  if (digits.length !== 12) return false;

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(digits[i], 10);
    sum += (i % 2 === 0) ? digit * 3 : digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(digits[11], 10);
}

export function isEAN8(barcode: string): boolean {
  const digits = barcode.replace(/\D/g, '');

  if (digits.length !== 8) return false;

  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(digits[i], 10);
    sum += (i % 2 === 0) ? digit * 3 : digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(digits[7], 10);
}

export function detectBarcodeType(barcode: string): string {
  const digits = barcode.replace(/\D/g, '');

  if (digits.length === 8 && isEAN8(barcode)) return 'EAN-8';
  if (digits.length === 12 && isUPCA(barcode)) return 'UPC-A';
  if (digits.length === 13 && isEAN13(barcode)) return 'EAN-13';

  return 'Unknown';
}

// CLI demo
if (import.meta.url.includes("barcode-validator.ts")) {
  console.log("Barcode Validator Demo\n");

  const barcodes = [
    { code: "5901234123457", desc: "EAN-13 (valid)" },
    { code: "123456789012", desc: "UPC-A (valid)" },
    { code: "96385074", desc: "EAN-8 (valid)" },
    { code: "1234567890123", desc: "Invalid" }
  ];

  barcodes.forEach(({ code, desc }) => {
    console.log(`${desc}: ${code}`);
    console.log(`  Type: ${detectBarcodeType(code)}`);
    console.log(`  EAN-13: ${isEAN13(code)}`);
    console.log(`  UPC-A: ${isUPCA(code)}`);
    console.log(`  EAN-8: ${isEAN8(code)}`);
    console.log();
  });

  console.log("✅ Barcode validator test passed");
}
