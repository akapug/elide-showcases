/**
 * Number Formatter
 * Format numbers with various styles
 */

export function formatNumber(num: number, decimals: number = 0): string {
  return num.toFixed(decimals);
}

export function formatThousands(num: number, separator: string = ','): string {
  const [int, dec] = num.toString().split('.');
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return dec ? formatted + '.' + dec : formatted;
}

export function formatCurrency(num: number, currency: string = 'USD', locale: string = 'en-US'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
  };

  const symbol = symbols[currency] || currency;
  const formatted = formatThousands(Math.abs(num), ',');

  if (num < 0) {
    return '-' + symbol + formatted;
  }

  return symbol + formatted;
}

export function formatPercentage(num: number, decimals: number = 0): string {
  return (num * 100).toFixed(decimals) + '%';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + units[i];
}

export function formatOrdinal(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export function formatScientific(num: number, decimals: number = 2): string {
  return num.toExponential(decimals);
}

export function formatRoman(num: number): string {
  if (num <= 0 || num >= 4000) {
    throw new RangeError('Roman numerals only support 1-3999');
  }

  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];

  let result = '';
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += numerals[i];
      num -= values[i];
    }
  }

  return result;
}

export function parseFormattedNumber(str: string): number {
  return parseFloat(str.replace(/[^0-9.-]/g, ''));
}

// CLI demo
if (import.meta.url.includes("number-formatter.ts")) {
  console.log("Number Formatter Demo\n");

  const num = 1234567.89;

  console.log("Basic formatting:");
  console.log("  Number:", num);
  console.log("  Thousands:", formatThousands(num));
  console.log("  Currency:", formatCurrency(num));
  console.log("  2 decimals:", formatNumber(num, 2));

  console.log("\nFile sizes:");
  console.log("  1024 bytes:", formatFileSize(1024));
  console.log("  1048576 bytes:", formatFileSize(1048576));
  console.log("  1073741824 bytes:", formatFileSize(1073741824));

  console.log("\nPercentages:");
  console.log("  0.75:", formatPercentage(0.75));
  console.log("  0.123:", formatPercentage(0.123, 2));

  console.log("\nOrdinals:");
  [1, 2, 3, 21, 42, 100].forEach(n => {
    console.log("  " + n + " →", formatOrdinal(n));
  });

  console.log("\nRoman numerals:");
  [1, 4, 9, 42, 100, 500, 1984, 2024].forEach(n => {
    console.log("  " + n + " →", formatRoman(n));
  });

  console.log("\nScientific:");
  console.log("  1234567:", formatScientific(1234567));
  console.log("  0.000123:", formatScientific(0.000123));

  console.log("✅ Number formatter test passed");
}
