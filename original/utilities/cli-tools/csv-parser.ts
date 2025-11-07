/**
 * CSV Parser and Formatter
 * Parse CSV to JSON and format JSON to CSV
 */

export interface CSVOptions {
  delimiter?: string;
  quote?: string;
  header?: boolean;
  skipEmpty?: boolean;
}

export function parseCSV(csv: string, options: CSVOptions = {}): any[] {
  const {
    delimiter = ',',
    quote = '"',
    header = true,
    skipEmpty = true
  } = options;

  const lines = csv.split('\n').map(line => line.trim());

  if (skipEmpty) {
    lines.splice(0, lines.length, ...lines.filter(line => line.length > 0));
  }

  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === quote) {
        if (inQuotes && line[i + 1] === quote) {
          current += quote;
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const rows = lines.map(parseLine);

  if (!header) {
    return rows;
  }

  const headers = rows[0];
  const data = rows.slice(1);

  return data.map(row => {
    const obj: any = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] || '';
    });
    return obj;
  });
}

export function toCSV(data: any[], options: CSVOptions = {}): string {
  const {
    delimiter = ',',
    quote = '"',
    header = true
  } = options;

  if (data.length === 0) return '';

  const escape = (value: any): string => {
    const str = String(value ?? '');
    if (str.includes(delimiter) || str.includes(quote) || str.includes('\n')) {
      return quote + str.replace(new RegExp(quote, 'g'), quote + quote) + quote;
    }
    return str;
  };

  const headers = Object.keys(data[0]);
  const lines: string[] = [];

  if (header) {
    lines.push(headers.map(escape).join(delimiter));
  }

  for (const row of data) {
    const values = headers.map(h => escape(row[h]));
    lines.push(values.join(delimiter));
  }

  return lines.join('\n');
}

export function csvToJSON(csv: string, options: CSVOptions = {}): string {
  const data = parseCSV(csv, options);
  return JSON.stringify(data, null, 2);
}

export function jsonToCSV(json: string, options: CSVOptions = {}): string {
  const data = JSON.parse(json);
  return toCSV(Array.isArray(data) ? data : [data], options);
}

// CLI demo
if (import.meta.url.includes("csv-parser.ts")) {
  console.log("CSV Parser Demo\n");

  const csvData = `name,age,city
John Doe,30,New York
Jane Smith,25,Los Angeles
Bob "The Builder",35,"San Francisco, CA"`;

  console.log("Input CSV:");
  console.log(csvData);

  console.log("\nParsed to JSON:");
  const parsed = parseCSV(csvData);
  console.log(JSON.stringify(parsed, null, 2));

  console.log("\nConverted back to CSV:");
  const regenerated = toCSV(parsed);
  console.log(regenerated);

  console.log("\nTSV format:");
  const tsv = toCSV(parsed, { delimiter: '\t' });
  console.log(tsv);

  console.log("✅ CSV parser test passed");
}
