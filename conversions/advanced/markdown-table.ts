/**
 * Markdown Table Generator
 * Generate markdown tables from data
 */

export interface TableOptions {
  align?: Array<'left' | 'center' | 'right'>;
  headers?: boolean;
}

export function generateTable(data: any[][], options: TableOptions = {}): string {
  const { align = [], headers = true } = options;

  if (data.length === 0) return '';

  const columnCount = Math.max(...data.map(row => row.length));
  const alignments = align.length ? align : Array(columnCount).fill('left');

  // Calculate column widths
  const widths = Array(columnCount).fill(0);
  data.forEach(row => {
    row.forEach((cell, i) => {
      widths[i] = Math.max(widths[i], String(cell).length);
    });
  });

  const lines: string[] = [];

  // Format row
  const formatRow = (row: any[]) => {
    return '| ' + row.map((cell, i) => {
      return String(cell).padEnd(widths[i]);
    }).join(' | ') + ' |';
  };

  // Header row
  if (headers && data.length > 0) {
    lines.push(formatRow(data[0]));

    // Separator
    const separator = '|' + alignments.map((alignment, i) => {
      const width = widths[i] + 2;
      if (alignment === 'center') return ':' + '-'.repeat(width - 2) + ':';
      if (alignment === 'right') return ' ' + '-'.repeat(width - 2) + ':';
      return ' ' + '-'.repeat(width - 1);
    }).join('|') + '|';
    lines.push(separator);

    // Data rows
    for (let i = 1; i < data.length; i++) {
      lines.push(formatRow(data[i]));
    }
  } else {
    // All rows are data
    data.forEach(row => lines.push(formatRow(row)));
  }

  return lines.join('\n');
}

export function fromObjects<T extends Record<string, any>>(objects: T[], columns?: Array<keyof T>): string {
  if (objects.length === 0) return '';

  const keys = columns || Object.keys(objects[0]) as Array<keyof T>;

  const data: any[][] = [
    keys.map(k => String(k)), // Headers
    ...objects.map(obj => keys.map(k => obj[k]))
  ];

  return generateTable(data);
}

// CLI demo
if (import.meta.url.includes("markdown-table.ts")) {
  console.log("Markdown Table Generator Demo\n");

  const data = [
    ['Name', 'Age', 'City'],
    ['Alice', '30', 'New York'],
    ['Bob', '25', 'Los Angeles'],
    ['Charlie', '35', 'Chicago']
  ];

  console.log("Basic table:");
  console.log(generateTable(data));

  console.log("\nWith alignment:");
  console.log(generateTable(data, { align: ['left', 'right', 'center'] }));

  console.log("\nFrom objects:");
  const users = [
    { name: 'Alice', score: 95, status: 'active' },
    { name: 'Bob', score: 87, status: 'inactive' }
  ];
  console.log(fromObjects(users));

  console.log("\n✅ Markdown table test passed");
}
