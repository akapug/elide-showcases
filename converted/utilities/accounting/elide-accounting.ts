/**
 * accounting - Money and Currency Formatting
 *
 * Simple and advanced number, money and currency formatting.
 * **POLYGLOT SHOWCASE**: One accounting library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/accounting (~300K+ downloads/week)
 *
 * Features:
 * - Money formatting
 * - Currency formatting
 * - Number formatting
 * - Unformatting
 * - Zero dependencies
 *
 * Package has ~300K+ downloads/week on npm!
 */

interface FormatMoneyOptions {
  symbol?: string;
  precision?: number;
  thousand?: string;
  decimal?: string;
  format?: string;
}

export function formatMoney(number: number, options: FormatMoneyOptions = {}): string {
  const {
    symbol = '$',
    precision = 2,
    thousand = ',',
    decimal = '.',
    format = '%s%v'
  } = options;

  const negative = number < 0 ? '-' : '';
  const absValue = Math.abs(number);
  const intPart = Math.floor(absValue);
  const decPart = (absValue - intPart).toFixed(precision).slice(2);

  const formattedInt = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
  const value = precision > 0 ? `${formattedInt}${decimal}${decPart}` : formattedInt;

  return format.replace('%s', negative + symbol).replace('%v', value);
}

export function formatNumber(number: number, precision: number = 0, thousand: string = ',', decimal: string = '.'): string {
  const negative = number < 0 ? '-' : '';
  const absValue = Math.abs(number);
  const intPart = Math.floor(absValue);
  const decPart = precision > 0 ? (absValue - intPart).toFixed(precision).slice(2) : '';

  const formattedInt = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
  return negative + (precision > 0 ? `${formattedInt}${decimal}${decPart}` : formattedInt);
}

export function unformat(string: string, decimal: string = '.'): number {
  const clean = string.replace(/[^0-9\-\.]/g, '');
  return parseFloat(clean);
}

export default { formatMoney, formatNumber, unformat };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💰 accounting - Money & Currency Formatting for Elide (POLYGLOT!)\n");
  console.log("Example:", formatMoney(1234.56));
  console.log("Example:", formatMoney(1234.56, { symbol: '€', format: '%v %s' }));
  console.log("\n~300K+ downloads/week on npm!");
}
