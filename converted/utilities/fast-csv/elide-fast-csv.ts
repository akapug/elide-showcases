/**
 * Fast CSV Parser for Elide
 * NPM: 3M+ downloads/week
 */

export function parse(csv: string, options: { headers?: boolean | string[]; delimiter?: string } = {}): any[] {
  const delimiter = options.delimiter || ',';
  const lines = csv.trim().split('\n');
  const result: any[] = [];

  if (lines.length === 0) return result;

  let headers: string[] = [];

  if (options.headers === true) {
    headers = lines[0].split(delimiter).map(h => h.trim());
    lines.shift();
  } else if (Array.isArray(options.headers)) {
    headers = options.headers;
  }

  for (const line of lines) {
    const values = line.split(delimiter).map(v => v.trim());

    if (headers.length > 0) {
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

export function write(data: any[], options: { headers?: boolean; delimiter?: string } = {}): string {
  const delimiter = options.delimiter || ',';
  const lines: string[] = [];

  if (data.length === 0) return '';

  if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
    const headers = Object.keys(data[0]);
    if (options.headers !== false) {
      lines.push(headers.join(delimiter));
    }
    data.forEach(row => {
      const values = headers.map(h => row[h] ?? '');
      lines.push(values.join(delimiter));
    });
  } else {
    data.forEach(row => {
      lines.push(row.join(delimiter));
    });
  }

  return lines.join('\n');
}

if (import.meta.url.includes("fast-csv")) {
  console.log("🎯 Fast CSV for Elide\n");
  const csv = `name,age,city\nAlice,25,NYC\nBob,30,LA`;
  const parsed = parse(csv, { headers: true });
  console.log("Parsed:", parsed);
  console.log("\nWritten:\n", write(parsed));
}

export default { parse, write };
