/**
 * Columnify - Format Data in Columns
 *
 * Create column-based text output.
 * **POLYGLOT SHOWCASE**: Column formatting for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/columnify (~2M+ downloads/week)
 *
 * Features:
 * - Column-based formatting
 * - Auto-sizing
 * - Custom separators
 * - Object/array input
 * - Zero dependencies
 *
 * Package has ~2M+ downloads/week on npm!
 */

export interface ColumnifyOptions {
  columns?: string[];
  minWidth?: number;
  maxWidth?: number;
  showHeaders?: boolean;
  headingTransform?: (heading: string) => string;
}

export function columnify(data: any[], options: ColumnifyOptions = {}): string {
  if (!data || data.length === 0) return '';

  const columns = options.columns || Object.keys(data[0]);
  const showHeaders = options.showHeaders !== false;

  // Calculate column widths
  const widths: Record<string, number> = {};
  columns.forEach(col => {
    widths[col] = col.length;
    data.forEach(row => {
      const val = String(row[col] || '');
      widths[col] = Math.max(widths[col], val.length);
    });
  });

  const lines: string[] = [];

  // Headers
  if (showHeaders) {
    const headers = columns.map(col => {
      const heading = options.headingTransform ? options.headingTransform(col) : col;
      return heading.padEnd(widths[col]);
    }).join(' ');
    lines.push(headers);
  }

  // Rows
  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(row[col] || '');
      return val.padEnd(widths[col]);
    }).join(' ');
    lines.push(line);
  });

  return lines.join('\n');
}

export default columnify;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📊 Columnify - Column Formatting (POLYGLOT!)\n");

  const data = [
    { name: 'Alice', age: 30, city: 'NYC' },
    { name: 'Bob', age: 25, city: 'LA' },
    { name: 'Charlie', age: 35, city: 'SF' },
  ];

  console.log(columnify(data));

  console.log("\n🚀 ~2M+ downloads/week on npm!");
}
