/**
 * Elide CSV Parse - Universal CSV Parser
 */

export interface ParseOptions {
  delimiter?: string;
  columns?: boolean | string[];
  skip_empty_lines?: boolean;
  trim?: boolean;
  quote?: string;
  escape?: string;
}

export function parse(input: string, options: ParseOptions = {}): any[] {
  const {
    delimiter = ',',
    columns = false,
    skip_empty_lines = false,
    trim = false,
    quote = '"',
    escape = '"'
  } = options;

  const lines = input.split('\n').filter(line => {
    return !skip_empty_lines || line.trim() !== '';
  });

  const results: any[] = [];
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const values = parseLine(line, delimiter, quote, escape, trim);

    if (i === 0 && columns === true) {
      headers = values;
      continue;
    }

    if (columns === true) {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      results.push(obj);
    } else if (Array.isArray(columns)) {
      const obj: any = {};
      columns.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      results.push(obj);
    } else {
      results.push(values);
    }
  }

  return results;
}

function parseLine(line: string, delimiter: string, quote: string, escape: string, trim: boolean): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === quote) {
      if (inQuotes && line[i + 1] === quote) {
        current += quote;
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(trim ? current.trim() : current);
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  values.push(trim ? current.trim() : current);
  return values;
}

export default { parse };

if (import.meta.main) {
  console.log('=== Elide CSV Parse Demo ===\n');

  // Example 1: Simple CSV
  console.log('1. Simple CSV:');
  const csv1 = 'name,age,email\nJohn,30,john@example.com\nJane,25,jane@example.com';
  const result1 = parse(csv1, { columns: true });
  console.log(result1);
  console.log('');

  // Example 2: Quoted values
  console.log('2. Quoted values:');
  const csv2 = '"name","description"\n"Product 1","A great, amazing product"\n"Product 2","Another product"';
  const result2 = parse(csv2, { columns: true });
  console.log(result2);
  console.log('');

  // Example 3: Custom delimiter
  console.log('3. Custom delimiter (tab):');
  const csv3 = 'name\tage\tcity\nJohn\t30\tNYC\nJane\t25\tLA';
  const result3 = parse(csv3, { columns: true, delimiter: '\t' });
  console.log(result3);
  console.log('');

  console.log('✓ Demo completed');
}
