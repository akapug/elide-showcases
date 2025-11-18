/**
 * CSV Parser for Elide
 * NPM: 10M+ downloads/week
 */

export function parse(csv: string, options: { columns?: boolean; delimiter?: string } = {}): any[] {
  const delimiter = options.delimiter || ',';
  const lines = csv.trim().split('\n');
  const result: any[] = [];

  if (lines.length === 0) return result;

  const headers = parseLine(lines[0], delimiter);
  const startIndex = options.columns ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const values = parseLine(lines[i], delimiter);

    if (options.columns) {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      result.push(obj);
    } else {
      result.push(values);
    }
  }

  return result;
}

function parseLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

export function stringify(data: any[], options: { header?: boolean; delimiter?: string } = {}): string {
  const delimiter = options.delimiter || ',';
  const lines: string[] = [];

  if (data.length === 0) return '';

  // If first item is an object, extract headers
  if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
    const headers = Object.keys(data[0]);
    if (options.header !== false) {
      lines.push(headers.join(delimiter));
    }

    data.forEach(row => {
      const values = headers.map(header => escapeValue(row[header], delimiter));
      lines.push(values.join(delimiter));
    });
  } else {
    // Array of arrays
    data.forEach(row => {
      const values = row.map((val: any) => escapeValue(val, delimiter));
      lines.push(values.join(delimiter));
    });
  }

  return lines.join('\n');
}

function escapeValue(value: any, delimiter: string): string {
  const str = String(value ?? '');
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

if (import.meta.url.includes("csv-parse")) {
  console.log("🎯 CSV Parser for Elide\n");
  const csv = `name,age,city
Alice,25,NYC
Bob,30,LA`;
  const parsed = parse(csv, { columns: true });
  console.log("Parsed:", parsed);
  console.log("\nStringified:\n", stringify(parsed));
}

export default { parse, stringify };
