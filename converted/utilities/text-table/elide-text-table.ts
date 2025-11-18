/**
 * Text Table - Generate Text Tables
 *
 * Create simple text tables.
 * **POLYGLOT SHOWCASE**: Text tables for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/text-table (~5M+ downloads/week)
 *
 * Features:
 * - Simple table generation
 * - Column alignment
 * - Custom separators
 * - Minimal API
 * - Zero dependencies
 *
 * Package has ~5M+ downloads/week on npm!
 */

export interface TextTableOptions {
  hsep?: string;
  align?: ('l' | 'r' | 'c' | '.')[];
  stringLength?: (str: string) => number;
}

export function textTable(rows: string[][], options: TextTableOptions = {}): string {
  const hsep = options.hsep || '  ';
  const align = options.align || [];
  const stringLength = options.stringLength || ((s) => s.length);

  // Calculate column widths
  const colWidths: number[] = [];
  rows.forEach(row => {
    row.forEach((cell, i) => {
      const len = stringLength(String(cell));
      colWidths[i] = Math.max(colWidths[i] || 0, len);
    });
  });

  // Format rows
  return rows.map(row => {
    return row.map((cell, i) => {
      const str = String(cell);
      const len = stringLength(str);
      const width = colWidths[i];
      const alignment = align[i] || 'l';

      if (alignment === 'l') {
        return str + ' '.repeat(width - len);
      } else if (alignment === 'r' || alignment === '.') {
        return ' '.repeat(width - len) + str;
      } else if (alignment === 'c') {
        const left = Math.floor((width - len) / 2);
        const right = width - len - left;
        return ' '.repeat(left) + str + ' '.repeat(right);
      }

      return str;
    }).join(hsep);
  }).join('\n');
}

export default textTable;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📋 Text Table - Simple Tables (POLYGLOT!)\n");

  const rows = [
    ['Name', 'Age', 'City'],
    ['Alice', '30', 'New York'],
    ['Bob', '25', 'Los Angeles'],
    ['Charlie', '35', 'San Francisco'],
  ];

  console.log(textTable(rows));
  console.log();

  console.log("With alignment:");
  console.log(textTable(rows, { align: ['l', 'r', 'l'] }));

  console.log("\n🚀 ~5M+ downloads/week on npm!");
}
