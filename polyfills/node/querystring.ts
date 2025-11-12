/**
 * Querystring - Query String Parsing for Elide
 *
 * Complete implementation of Node.js querystring module.
 * **POLYGLOT SHOWCASE**: Query string handling for ALL languages on Elide!
 *
 * Features:
 * - Parse query strings
 * - Stringify objects to query strings
 * - Custom delimiters and separators
 * - URL encoding/decoding
 * - Array support
 *
 * Use cases:
 * - HTTP request parsing
 * - URL building
 * - Form data handling
 * - API clients
 */

export interface ParseOptions {
  decodeURIComponent?: (str: string) => string;
  maxKeys?: number;
}

export interface StringifyOptions {
  encodeURIComponent?: (str: string) => string;
}

/**
 * Parse a query string into an object
 */
export function parse(
  str: string,
  sep: string = '&',
  eq: string = '=',
  options: ParseOptions = {}
): Record<string, string | string[]> {
  const obj: Record<string, string | string[]> = {};
  const decode = options.decodeURIComponent || defaultDecode;
  const maxKeys = options.maxKeys || 1000;

  if (typeof str !== 'string' || str.length === 0) {
    return obj;
  }

  // Remove leading ?
  if (str[0] === '?') {
    str = str.slice(1);
  }

  const pairs = str.split(sep);
  let keyCount = 0;

  for (const pair of pairs) {
    if (keyCount >= maxKeys) break;

    const [key, ...valueParts] = pair.split(eq);
    if (!key) continue;

    const decodedKey = decode(key);
    const decodedValue = valueParts.length > 0 ? decode(valueParts.join(eq)) : '';

    // Handle multiple values for same key
    if (obj[decodedKey]) {
      if (Array.isArray(obj[decodedKey])) {
        (obj[decodedKey] as string[]).push(decodedValue);
      } else {
        obj[decodedKey] = [obj[decodedKey] as string, decodedValue];
      }
    } else {
      obj[decodedKey] = decodedValue;
    }

    keyCount++;
  }

  return obj;
}

/**
 * Stringify an object into a query string
 */
export function stringify(
  obj: Record<string, any>,
  sep: string = '&',
  eq: string = '=',
  options: StringifyOptions = {}
): string {
  const encode = options.encodeURIComponent || defaultEncode;
  const parts: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) {
      continue;
    }

    const encodedKey = encode(String(key));

    if (Array.isArray(value)) {
      for (const item of value) {
        parts.push(`${encodedKey}${eq}${encode(String(item))}`);
      }
    } else {
      parts.push(`${encodedKey}${eq}${encode(String(value))}`);
    }
  }

  return parts.join(sep);
}

/**
 * URL encode a string
 */
export function escape(str: string): string {
  return defaultEncode(str);
}

/**
 * URL decode a string
 */
export function unescape(str: string): string {
  return defaultDecode(str);
}

/**
 * Default URL encoding
 */
function defaultEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

/**
 * Default URL decoding
 */
function defaultDecode(str: string): string {
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch {
    return str;
  }
}

/**
 * Decode query string component
 */
export function decode(str: string): Record<string, string | string[]> {
  return parse(str);
}

/**
 * Encode object to query string
 */
export function encode(obj: Record<string, any>): string {
  return stringify(obj);
}

// Default export
export default {
  parse,
  stringify,
  escape,
  unescape,
  decode,
  encode
};

// CLI Demo
if (import.meta.url.includes("querystring.ts")) {
  console.log("🔍 QueryString - Query String Parser for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Parse Query String ===");
  const parsed1 = parse('foo=bar&baz=qux&foo=baz');
  console.log('Input: foo=bar&baz=qux&foo=baz');
  console.log('Parsed:', parsed1);
  console.log();

  console.log("=== Example 2: Stringify Object ===");
  const obj1 = { name: 'John', age: '30', city: 'New York' };
  console.log('Object:', obj1);
  console.log('Query string:', stringify(obj1));
  console.log();

  console.log("=== Example 3: Array Values ===");
  const obj2 = { tags: ['javascript', 'typescript', 'elide'], limit: '10' };
  console.log('Object:', obj2);
  console.log('Query string:', stringify(obj2));
  console.log();

  console.log("=== Example 4: Parse Arrays ===");
  const parsed2 = parse('tags=javascript&tags=typescript&tags=elide&limit=10');
  console.log('Input: tags=javascript&tags=typescript&tags=elide&limit=10');
  console.log('Parsed:', parsed2);
  console.log();

  console.log("=== Example 5: Custom Delimiters ===");
  const parsed3 = parse('foo:bar;baz:qux', ';', ':');
  console.log('Input: foo:bar;baz:qux (sep=";", eq=":")');
  console.log('Parsed:', parsed3);
  console.log();

  console.log("=== Example 6: URL Encoding ===");
  const obj3 = { message: 'Hello World!', emoji: '🚀' };
  console.log('Object:', obj3);
  console.log('Encoded:', stringify(obj3));
  console.log();

  console.log("=== Example 7: URL Decoding ===");
  const parsed4 = parse('message=Hello%20World%21&emoji=%F0%9F%9A%80');
  console.log('Input: message=Hello%20World%21&emoji=%F0%9F%9A%80');
  console.log('Decoded:', parsed4);
  console.log();

  console.log("=== Example 8: API Filters ===");
  const filters = {
    status: 'active',
    category: ['books', 'electronics'],
    minPrice: '10',
    maxPrice: '100'
  };
  console.log('Filters:', filters);
  console.log('Query:', stringify(filters));
  console.log();

  console.log("=== Example 9: Empty and Special Values ===");
  const obj4 = { empty: '', null: null, undefined: undefined, zero: 0 };
  console.log('Object:', obj4);
  console.log('Stringified:', stringify(obj4));
  console.log();

  console.log("=== Example 10: Real-World API Query ===");
  const apiQuery = {
    q: 'elide runtime',
    page: '1',
    limit: '20',
    sort: 'relevance',
    filter: ['recent', 'verified']
  };
  const queryString = stringify(apiQuery);
  console.log('API query:', queryString);
  console.log('Full URL: https://api.example.com/search?' + queryString);
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Query string parsing works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One query string API for all languages");
  console.log("  ✓ Consistent URL parsing");
  console.log("  ✓ Share HTTP utilities");
  console.log("  ✓ Cross-language API clients");
}
