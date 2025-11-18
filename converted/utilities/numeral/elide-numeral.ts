/**
 * numeral - Number Formatting Library
 *
 * Format and manipulate numbers with ease.
 * **POLYGLOT SHOWCASE**: One number formatter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/numeral (~500K+ downloads/week)
 *
 * Features:
 * - Number formatting
 * - Currency formatting
 * - Percentage formatting
 * - Time formatting
 * - Bytes formatting
 * - Custom formats
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need number formatting
 * - ONE library works everywhere on Elide
 * - Consistent formatting across languages
 * - Share format strings across your stack
 *
 * Use cases:
 * - Dashboard displays
 * - Financial reports
 * - Data visualization
 * - User interfaces
 *
 * Package has ~500K+ downloads/week on npm!
 */

class Numeral {
  private value: number;

  constructor(value: number | string) {
    this.value = typeof value === 'string' ? parseFloat(value) : value;
  }

  format(formatString: string = '0,0'): string {
    if (isNaN(this.value)) return 'NaN';

    let output = '';
    const value = this.value;

    // Handle currency
    if (formatString.includes('$')) {
      output = '$';
      formatString = formatString.replace('$', '');
    }

    // Handle percentage
    if (formatString.includes('%')) {
      const percentage = value * 100;
      formatString = formatString.replace('%', '');
      return output + this.formatNumber(percentage, formatString) + '%';
    }

    // Handle bytes
    if (formatString.includes('b')) {
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      let bytes = Math.abs(value);
      let i = 0;
      while (bytes >= 1024 && i < sizes.length - 1) {
        bytes /= 1024;
        i++;
      }
      return (value < 0 ? '-' : '') + bytes.toFixed(2) + ' ' + sizes[i];
    }

    // Handle time (seconds)
    if (formatString.includes(':')) {
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      const seconds = Math.floor(value % 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return output + this.formatNumber(value, formatString);
  }

  private formatNumber(num: number, format: string): string {
    const hasComma = format.includes(',');
    const decimalMatch = format.match(/\.(0+)/);
    const decimals = decimalMatch ? decimalMatch[1].length : 0;

    let result = Math.abs(num).toFixed(decimals);

    if (hasComma) {
      const parts = result.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      result = parts.join('.');
    }

    if (num < 0) {
      result = '-' + result;
    }

    return result;
  }

  value(): number {
    return this.value;
  }

  add(value: number): Numeral {
    this.value += value;
    return this;
  }

  subtract(value: number): Numeral {
    this.value -= value;
    return this;
  }

  multiply(value: number): Numeral {
    this.value *= value;
    return this;
  }

  divide(value: number): Numeral {
    this.value /= value;
    return this;
  }
}

export default function numeral(value: number | string): Numeral {
  return new Numeral(value);
}

export { Numeral };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔢 numeral - Number Formatting for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Formatting ===");
  console.log(numeral(1000).format('0,0'));
  console.log(numeral(1234567).format('0,0'));
  console.log();

  console.log("=== Example 2: Decimal Places ===");
  console.log(numeral(123.456).format('0.00'));
  console.log(numeral(123.456).format('0.0000'));
  console.log();

  console.log("=== Example 3: Currency ===");
  console.log(numeral(1000).format('$0,0'));
  console.log(numeral(1234.56).format('$0,0.00'));
  console.log();

  console.log("=== Example 4: Percentages ===");
  console.log(numeral(0.5).format('0%'));
  console.log(numeral(0.75).format('0.00%'));
  console.log(numeral(0.123).format('0.0%'));
  console.log();

  console.log("=== Example 5: Bytes ===");
  console.log(numeral(1024).format('0b'));
  console.log(numeral(1048576).format('0b'));
  console.log(numeral(1073741824).format('0b'));
  console.log();

  console.log("=== Example 6: Time (Seconds) ===");
  console.log(numeral(3661).format('00:00:00'));
  console.log(numeral(7322).format('00:00:00'));
  console.log();

  console.log("=== Example 7: Math Operations ===");
  const n = numeral(100);
  console.log('Start:', n.value());
  n.add(50);
  console.log('After add(50):', n.value());
  n.multiply(2);
  console.log('After multiply(2):', n.value());
  console.log('Formatted:', n.format('$0,0.00'));
  console.log();

  console.log("=== Example 8: POLYGLOT Use Case ===");
  console.log("🌐 Same numeral library works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One number formatter, all languages");
  console.log("  ✓ Share format strings everywhere");
  console.log("  ✓ Consistent number display across stack");
  console.log("  ✓ No need for language-specific formatters");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Dashboard displays");
  console.log("- Financial reports");
  console.log("- Data visualization");
  console.log("- User interfaces");
  console.log("- Analytics dashboards");
  console.log("- Admin panels");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- ~500K+ downloads/week on npm!");
}
