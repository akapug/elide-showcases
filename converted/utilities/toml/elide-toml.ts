/**
 * TOML Parser for Elide
 * NPM: 2M+ downloads/week
 */

export function parse(toml: string): any {
  const result: any = {};
  const lines = toml.split('\n');
  let currentSection: any = result;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Section headers [section]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const sectionName = trimmed.slice(1, -1).trim();
      currentSection = result[sectionName] = {};
      continue;
    }

    // Key-value pairs
    if (trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      currentSection[key.trim()] = parseValue(value);
    }
  }

  return result;
}

function parseValue(value: string): any {
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Number
  const num = Number(value);
  if (!isNaN(num)) return num;

  return value;
}

export function stringify(obj: any): string {
  let result = '';

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      result += `\n[${key}]\n`;
      for (const [k, v] of Object.entries(value)) {
        result += `${k} = ${stringifyValue(v)}\n`;
      }
    } else {
      result += `${key} = ${stringifyValue(value)}\n`;
    }
  }

  return result.trim();
}

function stringifyValue(value: any): string {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);
  return String(value);
}

if (import.meta.url.includes("toml")) {
  console.log("🎯 TOML Parser for Elide\n");
  const toml = `
title = "TOML Example"

[owner]
name = "Alice"
age = 30

[database]
server = "localhost"
port = 5432
`;
  const parsed = parse(toml);
  console.log("Parsed:", JSON.stringify(parsed, null, 2));
  console.log("\nStringified:\n", stringify(parsed));
}

export default { parse, stringify };
